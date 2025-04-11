package lk.ijse.backend.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.*;
import lk.ijse.backend.repository.*;
import lk.ijse.backend.service.CloudinaryService;
import lk.ijse.backend.service.NotificationService;
import lk.ijse.backend.service.PostService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final ReportRepository reportRepository;
    private final ModelMapper modelMapper;
    private final CloudinaryService cloudinaryService;
    private final NotificationService notificationService;

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

        return posts.map(post -> convertToDTO(post, email));
    }

    @Override
    public Page<PostDTO> getOtherUsersProfilePosts(int userId, String email, PageRequest pageRequest) {
        User user = userRepository.findByUserId(userId);
        User currentUser = userRepository.findByEmail(email);
        if (user == null || currentUser == null) {
            throw new EntityNotFoundException("User not found");
        }

        Page<Post> posts = postRepository.findOtherUsersVisiblePostsByUserId(
                user.getUserId(),
                currentUser.getUserId(),
                pageRequest
        );

        return posts.map(post -> convertToDTO(post, user.getEmail()));
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

        return posts.map(post -> convertToDTO(post, email));
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
                    byUserAndPost.setType(reactionDTO.getType());
                    reactionRepository.save(byUserAndPost);
                    return new ResponseDTO(VarList.OK, "Updated", convertToDTO(post, email));
                } else {
                    // Delete reaction
                    // Delete using custom query
                    reactionRepository.deleteByUserAndPost(user, post); // Use the custom query
                    return new ResponseDTO(VarList.OK, "Removed", convertToDTO(post, email));
                }
            } else {
                // Add new reaction
                Reaction reaction = modelMapper.map(reactionDTO, Reaction.class);
                reaction.setUser(user);
                reaction.setPost(post);
                reactionRepository.save(reaction);

                // Send notification
                if (post.getUser().getUserId() != user.getUserId()) {
                    NotificationDTO notificationDTO = new NotificationDTO();
                    notificationDTO.setTitle("New Post Like!");
                    notificationDTO.setContent(user.getFirstName() + " " + user.getLastName() + " liked your post.");
                    notificationDTO.setType(Notification.NotificationType.POST_LIKE);
                    notificationDTO.setActionUrl("/post-like");
                    notificationDTO.setIsRead(false);
                    notificationDTO.setUser(modelMapper.map(post.getUser(), UserDTO.class));
                    notificationDTO.setSourceUser(modelMapper.map(user, UserDTO.class));
                    notificationDTO.setPost(modelMapper.map(post, PostDTO.class));

                    notificationService.createNotification(notificationDTO);
                }
                return new ResponseDTO(VarList.OK, "Added", convertToDTO(post, email));
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
        return convertToDTO(updatedPost, email);
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
        return convertToDTO(post, userEmail);
    }

    @Transactional
    @Override
    public ReportDTO createReport(ReportRequestDTO reportRequest, String reporterEmail) {
        User reporter = userRepository.findByEmail(reporterEmail);
        if (reporter == null) {
            throw new EntityNotFoundException("User not found");
        }

        Post reportedPost = postRepository.findById(reportRequest.getPostId())
                .orElseThrow(() -> new EntityNotFoundException("Post not found"));

        Report report = new Report();
        report.setType(Report.ReportType.valueOf(reportRequest.getType()));
        report.setPriority(Report.Priority.valueOf(reportRequest.getPriority()));
        report.setDescription(reportRequest.getDescription());
        report.setReporter(reporter);
        report.setReportedPost(reportedPost);
        report.setStatus(Report.ReportStatus.PENDING);

        Report savedReport = reportRepository.save(report);

        report.setReportId(savedReport.getReportId());

        // Send notification to admins
        userRepository.findByRole(User.Role.ADMIN).forEach(admin -> {
            if (admin.getUserId() != reporter.getUserId() && admin.getUserId() != reportedPost.getUser().getUserId()) {
                NotificationDTO notificationDTO = new NotificationDTO();
                notificationDTO.setTitle("New Post Report!");
                notificationDTO.setContent(reporter.getFirstName() + " " + reporter.getLastName() + " has reported a post.");
                notificationDTO.setType(Notification.NotificationType.REPORT_UPDATE);
                notificationDTO.setActionUrl("/report-post");
                notificationDTO.setIsRead(false);
                notificationDTO.setUser(modelMapper.map(admin, UserDTO.class));
                notificationDTO.setSourceUser(modelMapper.map(reporter, UserDTO.class));
                notificationDTO.setReport(modelMapper.map(report, ReportDTO.class));

                notificationService.createNotification(notificationDTO);
            }
        });


        return convertToDTO(savedReport, reporterEmail);
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

        Comment savedComment = commentRepository.save(comment);

        // Send notification
        if (post.getUser().getUserId() != user.getUserId()) {
            NotificationDTO notificationDTO = new NotificationDTO();
            notificationDTO.setTitle("New Post Comment!");
            notificationDTO.setContent(user.getFirstName() + " " + user.getLastName() + " commented on your post.");
            notificationDTO.setType(Notification.NotificationType.POST_COMMENT);
            notificationDTO.setActionUrl("/post-comment");
            notificationDTO.setIsRead(false);
            notificationDTO.setUser(modelMapper.map(post.getUser(), UserDTO.class));
            notificationDTO.setSourceUser(modelMapper.map(user, UserDTO.class));
            notificationDTO.setPost(modelMapper.map(post, PostDTO.class));
            notificationDTO.setComment(modelMapper.map(savedComment, CommentDTO.class));

            notificationService.createNotification(notificationDTO);
        }

        return convertCommentToDTO(savedComment, email);
    }

    @Override
    public void deleteComment(int commentId, String email) {
        User user = userRepository.findByEmail(email);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found"));

        if (comment.getUser().getUserId() != user.getUserId()) {
            throw new SecurityException("Unauthorized to delete this comment");
        }

        // Handle replies if needed
        if (!comment.getReplies().isEmpty()) {
            comment.getReplies().forEach(reply -> {
                reply.setParentComment(null);
                commentRepository.delete(reply);
            });
        }

        commentRepository.delete(comment);
    }

    @Override
    public CommentDTO addReply(int parentCommentId, CommentDTO commentDTO, String email) {
        User user = userRepository.findByEmail(email);
        Comment parentComment = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new EntityNotFoundException("Parent comment not found"));

        Comment reply = new Comment();
        reply.setContent(commentDTO.getContent());
        reply.setUser(user);
        reply.setPost(parentComment.getPost());
        reply.setParentComment(parentComment);

        Comment savedReply = commentRepository.save(reply);

        // Send notification
        if (parentComment.getUser().getUserId() != user.getUserId()) {
            NotificationDTO notificationDTO = new NotificationDTO();
            notificationDTO.setTitle("New Comment Reply!");
            notificationDTO.setContent(user.getFirstName() + " " + user.getLastName() + " replied to your comment on a post");
            notificationDTO.setType(Notification.NotificationType.POST_COMMENT);
            notificationDTO.setActionUrl("/post-comment");
            notificationDTO.setIsRead(false);
            notificationDTO.setUser(modelMapper.map(parentComment.getUser(), UserDTO.class));
            notificationDTO.setSourceUser(modelMapper.map(user, UserDTO.class));
            notificationDTO.setPost(modelMapper.map(parentComment.getPost(), PostDTO.class));
            notificationDTO.setComment(modelMapper.map(savedReply, CommentDTO.class));

            notificationService.createNotification(notificationDTO);
        }

        return convertCommentToDTO(savedReply, email);
    }

    @Override
    public List<PostDTO> searchPosts(String query, int limit, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail);
        if (currentUser == null) {
            throw new UsernameNotFoundException("User not found");
        }

        String searchTerm = "%" + query.toLowerCase() + "%";
        return postRepository.findByContentLikeAndPrivacyAndUserIsProfilePublicTrue(
                        searchTerm,
                        Post.PrivacyLevel.PUBLIC,
                        currentUser.getUserId(),
                        PageRequest.of(0, limit)
                ).stream()
                .map(post -> convertToDTO((Post) post, currentUserEmail))
                .collect(Collectors.toList());
    }

    @Override
    public List<PostDTO> getAllPosts(String status, String type, String search) {
        List<Post> posts;

        if (status != null) {
            posts = postRepository.findByStatus(Post.Status.valueOf(status.toUpperCase()));
        } else if (type != null) {
            posts = postRepository.findByMediaMediaType(PostMedia.MediaType.valueOf(type.toUpperCase()));
        } else if (search != null) {
            posts = postRepository.findByContentContaining(search);
        } else {
            posts = postRepository.findAll();
        }

        return posts.stream()
                .map(post -> convertToDTO(post, null))
                .collect(Collectors.toList());
    }

    @Override
    public void updatePostStatus(int postId, String status) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setStatus(Post.Status.valueOf(status.toUpperCase()));
        postRepository.save(post);
    }

    @Override
    public Map<String, Object> getPostStats() {
        Map<String, Object> stats = new HashMap<>();

        // Total posts
        long totalPosts = postRepository.count();
        stats.put("totalPosts", totalPosts);

        // Active posts
        long activePosts = postRepository.countByStatus(Post.Status.ACTIVE);
        stats.put("activePosts", activePosts);

        // Inactive posts
        long inactivePosts = postRepository.countByStatus(Post.Status.INACTIVE);
        stats.put("inactivePosts", inactivePosts);

        // Posts by media type
        long imagePosts = postRepository.countByMediaMediaType(PostMedia.MediaType.IMAGE);
        stats.put("imagePosts", imagePosts);

        long videoPosts = postRepository.countByMediaMediaType(PostMedia.MediaType.VIDEO);
        stats.put("videoPosts", videoPosts);

        // Recent posts (last 24 hours)
        long recentPosts = postRepository.countByCreatedAtAfter(
                LocalDateTime.now().minusHours(24)
        );
        stats.put("recentPosts", recentPosts);

        return stats;
    }

    private ReportDTO convertToDTO(Report savedReport, String reporterEmail) {
        ReportDTO reportDTO = modelMapper.map(savedReport, ReportDTO.class);
        reportDTO.setReporter(modelMapper.map(savedReport.getReporter(), UserDTO.class));
        reportDTO.setReportedPost(convertToDTO(savedReport.getReportedPost(), reporterEmail));
        return reportDTO;
    }

    private PostDTO convertToDTO(Post post, String email) {
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
                .map(comment -> convertCommentToDTO(comment, email))
                .collect(Collectors.toList()));

        return postDTO;
    }

    private CommentDTO convertCommentToDTO(Comment comment, String email) {
        CommentDTO dto = new CommentDTO();
        dto.setCommentId(comment.getCommentId());
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());

        // Set parent comment if exists
        if (comment.getParentComment() != null) {
            dto.setParentCommentId(comment.getParentComment().getCommentId());
        }

        // Convert user
        User commentUser = comment.getUser();
        UserDTO userDTO = new UserDTO();
        userDTO.setUserId(commentUser.getUserId());
        userDTO.setEmail(commentUser.getEmail());
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

        // Convert replies recursively
        if (!comment.getReplies().isEmpty()) {
            dto.setReplies(comment.getReplies().stream()
                    .sorted(Comparator.comparing(Comment::getCreatedAt))
                    .map(reply -> convertCommentToDTO(reply, email))
                    .collect(Collectors.toList()));
        }

        return dto;
    }
}
