package lk.ijse.backend.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.*;
import lk.ijse.backend.repository.*;
import lk.ijse.backend.service.CloudinaryService;
import lk.ijse.backend.service.PostService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final ModelMapper modelMapper;
    private final CloudinaryService cloudinaryService;

    @Transactional
    @Override
    public int createPost(PostDTO postDTO) {
        try {
            Post post = new Post();
            post.setContent(postDTO.getContent());
            post.setPrivacy(postDTO.getPrivacy());
            post.setUser(userRepository.findById(String.valueOf(postDTO.getUser().getUserId()))
                    .orElseThrow(() -> new EntityNotFoundException("User not found")));

            Post savedPost = postRepository.save(post);

            // Save media items
            if (postDTO.getMedia() != null && !postDTO.getMedia().isEmpty()) {
                List<PostMedia> mediaList = postDTO.getMedia().stream()
                        .map(mediaDTO -> {
                            PostMedia media = new PostMedia();
                            media.setMediaUrl(mediaDTO.getMediaUrl());
                            media.setMediaType(PostMedia.MediaType.valueOf(String.valueOf(mediaDTO.getMediaType())));
                            media.setPost(savedPost);
                            return media;
                        })
                        .collect(Collectors.toList());

                postMediaRepository.saveAll(mediaList);
            }

            return VarList.Created;
        } catch (Exception e) {
            return VarList.Bad_Request;
        }
    }

    @Override
    public Page<PostDTO> getProfilePosts(String email, PageRequest pageRequest) {
        User currentUser = userRepository.findByEmail(email);
        if (currentUser == null) {
            throw new EntityNotFoundException("User not found");
        }

        Page<Post> posts = postRepository.findUsersVisiblePostsByUserId(
                currentUser.getUserId(),
                pageRequest
        );

        return posts.map(this::convertToDTO);
    }

    @Override
    public Page<PostDTO> getTimelinePosts(String email, PageRequest pageRequest) {
        User currentUser = userRepository.findByEmail(email);
        if (currentUser == null) {
            throw new EntityNotFoundException("User not found");
        }

        Page<Post> posts = postRepository.findAllVisiblePostsByUserId(
                currentUser.getUserId(),
                pageRequest
        );

        return posts.map(this::convertToDTO);
    }

    @Override
    @Transactional  // Explicit annotation to ensure transactional context
    public ResponseDTO addReaction(int postId, ReactionDTO reactionDTO, String email) {
        try {
            User user = userRepository.findByEmail(email);
            if (user == null) throw new EntityNotFoundException("User not found");

            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found"));

            Reaction byUserAndPost = reactionRepository.findByUserAndPost(user, post);

            if (byUserAndPost != null) {
                if (byUserAndPost.getType() != reactionDTO.getType()) {
                    // Update existing reaction
                    System.out.println("Update" + byUserAndPost.getReactionId());
                    byUserAndPost.setType(reactionDTO.getType());
                    reactionRepository.save(byUserAndPost);
                    return new ResponseDTO(VarList.OK, "Updated", convertToDTO(post));
                } else {
                    // Delete reaction
                    System.out.println("Remove" + byUserAndPost.getReactionId());
                    // Delete using custom query
                    reactionRepository.deleteByUserAndPost(user, post); // Use the custom query
                    return new ResponseDTO(VarList.OK, "Removed", convertToDTO(post));
                }
            } else {
                // Add new reaction
                System.out.println("Add");
                Reaction reaction = modelMapper.map(reactionDTO, Reaction.class);
                reaction.setUser(user);
                reaction.setPost(post);
                reactionRepository.save(reaction);
                return new ResponseDTO(VarList.OK, "Added", convertToDTO(post));
            }
        } catch (Exception e) {
            // Log the exception to identify issues
            e.printStackTrace();
            throw new RuntimeException("Transaction failed", e);
        }
    }

    @Transactional
    @Override
    public PostDTO updatePost(int postId, String email, PostUpdateDTO postUpdateDTO) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new EntityNotFoundException("User not found");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found"));

        if (post.getUser().getUserId() != user.getUserId()) {
            throw new SecurityException("Unauthorized to update this post");
        }

        // Update basic fields
        post.setContent(postUpdateDTO.getContent());
        post.setPrivacy(Post.PrivacyLevel.valueOf(postUpdateDTO.getPrivacy().toUpperCase()));

        // Handle media updates
        processMediaUpdates(post, postUpdateDTO);

        Post updatedPost = postRepository.save(post);
        return convertToDTO(updatedPost);
    }

    @Override
    public CommentDTO addComment(int postId, CommentDTO commentDTO, String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new EntityNotFoundException("User not found");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = new Comment();
        comment.setContent(commentDTO.getContent());
        comment.setUser(user);
        comment.setPost(post);

        // Handle parent comment ID
        if (commentDTO.getParentCommentId() != 0 && commentDTO.getParentCommentId() > 0) {
            Comment parent = commentRepository.findById(commentDTO.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            comment.setParentComment(parent);
        }

        Comment savedComment = commentRepository.save(comment);
        return convertCommentToDTO(savedComment, user.getUserId());
    }

    @Override
    public ResponseDTO addCommentReaction(int commentId, ReactionDTO reactionDTO, String email) {
        User user = userRepository.findByEmail(email);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found"));

        Reaction existing = reactionRepository.findByUserAndComment(user, comment);

        if (existing != null) {
            if (existing.getType() != reactionDTO.getType()) {
                existing.setType(reactionDTO.getType());
                reactionRepository.save(existing);
                return new ResponseDTO(VarList.OK, "Reaction updated", null);
            }
            reactionRepository.delete(existing);
            return new ResponseDTO(VarList.OK, "Reaction removed", null);
        }

        Reaction reaction = new Reaction();
        reaction.setType(reactionDTO.getType());
        reaction.setUser(user);
        reaction.setComment(comment);
        reactionRepository.save(reaction);
        return new ResponseDTO(VarList.OK, "Reaction added", null);
    }

    @Override
    public CommentDTO getComment(int parentCommentId) {
        Comment comment = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found"));
        return convertCommentToDTO(comment, comment.getUser().getUserId());
    }

    private void processMediaUpdates(Post post, PostUpdateDTO updateDTO) {
        // Delete removed media
        List<String> mediaToDelete = updateDTO.getMediaToDelete();
        if (mediaToDelete != null && !mediaToDelete.isEmpty()) {
            // Create a copy to avoid concurrent modification
            List<PostMedia> toRemove = post.getMedia().stream()
                    .filter(m -> mediaToDelete.contains(m.getMediaUrl()))
                    .collect(Collectors.toList());

            toRemove.forEach(media -> {
                post.removeMedia(media);  // Use helper method
                cloudinaryService.deleteMedia(media.getMediaUrl());
            });
        }

        // Add new media
        List<MultipartFile> newMedia = updateDTO.getNewMedia();
        if (newMedia != null) {
            newMedia.forEach(mediaFile -> {
                try {
                    String mediaType = mediaFile.getContentType().startsWith("image") ? "IMAGE" : "VIDEO";
                    String mediaUrl = cloudinaryService.uploadMedia(
                            mediaFile,
                            mediaType,
                            post.getUser().getUserId()
                    );

                    PostMedia newMediaEntity = new PostMedia();
                    newMediaEntity.setMediaUrl(mediaUrl);
                    newMediaEntity.setMediaType(PostMedia.MediaType.valueOf(mediaType));
                    newMediaEntity.setPost(post);
                    post.getMedia().add(newMediaEntity);
                } catch (IOException e) {
                    throw new RuntimeException("Failed to upload media", e);
                }
            });
        }
    }

    // Delete post implementation
    @Override
    @Transactional
    public void deletePost(int postId) throws Exception {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new Exception("Post not found or unauthorized"));
        if (post != null) {
            post.getMedia().stream().map(PostMedia::getMediaUrl).forEach(mediaUrl -> {
                cloudinaryService.deleteMedia(mediaUrl);
            });
        }
        postRepository.delete(post);
    }

    // Get single post for editing
    @Override
    public PostDTO getPost(int postId, String userEmail) throws Exception {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new Exception("Post not found"));
        return convertToDTO(post);
    }

    // Ensure media is eagerly fetched in Post entity
    private PostDTO convertToDTO(Post post) {
        // Initialize lazy-loaded collections before leaving transactional context
        Hibernate.initialize(post.getMedia());
        PostDTO postDTO = modelMapper.map(post, PostDTO.class);
        postDTO.setUser(modelMapper.map(post.getUser(), UserDTO.class));
        postDTO.setMedia(post.getMedia().stream()
                .map(media -> modelMapper.map(media, PostMediaDTO.class))
                .collect(Collectors.toList()));

        postDTO.setReactions(post.getReactions().stream()
                .map(reaction -> {
                    ReactionDTO reactionDTO = new ReactionDTO();
                    reactionDTO.setReactionId(reaction.getReactionId());
                    reactionDTO.setType(reaction.getType());
                    reactionDTO.setCreatedAt(reaction.getCreatedAt());

                    // Convert and set user
                    UserDTO reactionUserDTO = new UserDTO();
                    reactionUserDTO.setUserId(reaction.getUser().getUserId());
                    reactionUserDTO.setEmail(reaction.getUser().getEmail());
                    reactionUserDTO.setFirstName(reaction.getUser().getFirstName());
                    reactionUserDTO.setLastName(reaction.getUser().getLastName());
                    reactionUserDTO.setProfilePictureUrl(reaction.getUser().getProfilePictureUrl());
                    reactionDTO.setUser(reactionUserDTO);

                    return reactionDTO;
                })
                .collect(Collectors.toList()));

        postDTO.setComments(post.getComments().stream()
                .map(comment -> {
                    CommentDTO commentDTO = new CommentDTO();
                    commentDTO.setCommentId(comment.getCommentId());
                    commentDTO.setContent(comment.getContent());

                    // Convert and set user
                    UserDTO commentUserDTO = new UserDTO();
                    commentUserDTO.setUserId(comment.getUser().getUserId());
                    commentUserDTO.setFirstName(comment.getUser().getFirstName());
                    commentUserDTO.setLastName(comment.getUser().getLastName());
                    commentUserDTO.setProfilePictureUrl(comment.getUser().getProfilePictureUrl());
                    commentDTO.setUser(commentUserDTO);

                    return commentDTO;
                })
                .collect(Collectors.toList()));

        return postDTO;
    }

    private CommentDTO convertCommentToDTO(Comment comment, int currentUserId) {
        CommentDTO dto = new CommentDTO();
        dto.setCommentId(comment.getCommentId());
        dto.setContent(comment.getContent());

        // Set parent comment ID if exists
        if (comment.getParentComment() != null) {
            dto.setParentCommentId(comment.getParentComment().getCommentId());
        }

        // Convert user
        User commentUser = comment.getUser();
        UserDTO userDTO = new UserDTO();
        userDTO.setUserId(commentUser.getUserId());
        userDTO.setFirstName(commentUser.getFirstName());
        userDTO.setLastName(commentUser.getLastName());
        userDTO.setProfilePictureUrl(commentUser.getProfilePictureUrl());
        dto.setUser(userDTO);

        // Convert post
        Post post = comment.getPost();
        PostDTO postDTO = new PostDTO();
        postDTO.setPostId(post.getPostId());
        postDTO.setContent(post.getContent());
        postDTO.setPrivacy(post.getPrivacy());
        postDTO.setCreatedAt(post.getCreatedAt());

        // Convert reactions
        dto.setReactions(comment.getReactions().stream()
                .map(reaction -> {
                    ReactionDTO reactionDTO = new ReactionDTO();
                    reactionDTO.setReactionId(reaction.getReactionId());
                    reactionDTO.setType(reaction.getType());
                    reactionDTO.setCreatedAt(reaction.getCreatedAt());
                    return reactionDTO;
                })
                .collect(Collectors.toList()));

        // Check if current user reacted
        dto.setLiked(comment.getReactions().stream()
                .anyMatch(r -> r.getUser().getUserId()== currentUserId));

        // Get current user's reaction type
        comment.getReactions().stream()
                .filter(r -> r.getUser().getUserId()== currentUserId)
                .findFirst()
                .ifPresent(r -> dto.setReactionType(String.valueOf(r.getType())));

        // Convert replies recursively
        if (!comment.getReplies().isEmpty()) {
            dto.setReplies(comment.getReplies().stream()
                    .sorted(Comparator.comparing(Comment::getCreatedAt))
                    .map(reply -> convertCommentToDTO(reply, currentUserId))
                    .collect(Collectors.toList()));
        }

        return dto;
    }
}
