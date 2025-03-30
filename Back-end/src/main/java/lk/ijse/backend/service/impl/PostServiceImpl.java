package lk.ijse.backend.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.Post;
import lk.ijse.backend.entity.PostMedia;
import lk.ijse.backend.entity.Reaction;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.PostMediaRepository;
import lk.ijse.backend.repository.PostRepository;
import lk.ijse.backend.repository.ReactionRepository;
import lk.ijse.backend.repository.UserRepository;
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

    private void processMediaUpdates(Post post, PostUpdateDTO updateDTO) {
        // Delete removed media
        List<String> mediaToDelete = updateDTO.getMediaToDelete();
        if (mediaToDelete != null) {
            mediaToDelete.forEach(mediaUrl -> {
                System.out.println(mediaUrl);
                cloudinaryService.deleteMedia(mediaUrl);
                post.getMedia().removeIf(m -> m.getMediaUrl().equals(mediaUrl));
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
        return postDTO;
    }
}
