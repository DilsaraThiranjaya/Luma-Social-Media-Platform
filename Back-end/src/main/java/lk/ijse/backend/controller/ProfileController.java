package lk.ijse.backend.controller;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.*;
import lk.ijse.backend.service.AccountService;
import lk.ijse.backend.service.CloudinaryService;
import lk.ijse.backend.service.PostService;
import lk.ijse.backend.service.UserService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("api/v1/profile")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {
    private final UserService userService;
    private final AccountService accountService;
    private final PostService postService;
    private final CloudinaryService cloudinaryService;
    private final ModelMapper modelMapper;


    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/profileInfo")
    public ResponseEntity<ResponseDTO> getProfileInfo(Authentication authentication) {
        log.info("Received profile info fetch request for user: {}", authentication.getName());
        try {
            String email = authentication.getName();

            ProfileInfoDTO profileInfoDTO = accountService.getProfileInfo(email);

            if (profileInfoDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            log.info("Successfully retrieved profile info for user: {}", email);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Profile info retrieved", profileInfoDTO));
        } catch (Exception e) {
            log.error("Error retrieving profile info: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping(value = "/upload-profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO> uploadProfilePicture(@RequestParam("file") MultipartFile file, @RequestParam("userEmail") String email) {
        log.info("Received request to upload profile picture for user email: {}", email);
        try {
            UserDTO userDTO = userService.loadUserDetailsByEmail(email);
            if (userDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            String imageUrl = cloudinaryService.uploadProfilePicture(file, userDTO.getUserId().toString());

            if (imageUrl != null) {
                userDTO.setProfilePictureUrl(imageUrl);
                int res = userService.updateUser(userDTO);

                if (res == VarList.Created) {
                    log.info("Successfully uploaded profile picture for user email: {}", email);
                    return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Profile picture uploaded successfully", imageUrl));
                }
            }
            log.error("Failed to upload profile picture for user email: {}", email);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Fail to upload profile picture", null));
        } catch (IOException e) {
            log.error("Error uploading profile picture for user email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Fail to upload profile picture", null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping(value = "/upload-cover-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO> uploadCoverPhoto(@RequestParam("file") MultipartFile file, @RequestParam("userEmail") String email) {
        log.info("Received request to upload cover picture for user email: {}", email);
        try {
            UserDTO userDTO = userService.loadUserDetailsByEmail(email);
            if (userDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            String imageUrl = cloudinaryService.uploadCoverPicture(file, userDTO.getUserId().toString());

            if (imageUrl != null) {
                userDTO.setCoverPhotoUrl(imageUrl);
                int res = userService.updateUser(userDTO);

                if (res == VarList.Created) {
                    log.info("Successfully uploaded cover picture for user email: {}", email);
                    return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Cover picture uploaded successfully", imageUrl));
                }
            }
            log.error("Failed to upload cover picture for user email: {}", email);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Fail to upload cover picture", null));
        } catch (IOException e) {
            log.error("Error uploading cover picture for user email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Fail to upload cover picture", null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping(value = "/posts/upload-media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO> uploadPostMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String mediaType,
            Authentication authentication) {

        String email = authentication.getName();
        log.info("Received request to upload media for email: {}", email);

        try {
            UserDTO user = userService.loadUserDetailsByEmail(email);
            if (user == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ResponseDTO(VarList.Not_Found, "User not found", null));
            }

            String mediaUrl = cloudinaryService.uploadMedia(file, mediaType, user.getUserId());
            Map<String, String> responseData = new HashMap<>();
            responseData.put("mediaUrl", mediaUrl);
            responseData.put("mediaType", mediaType);

            log.info("Successfully uploaded media for email: {}", email);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Media uploaded", responseData));
        } catch (IOException e) {
            log.error("Error uploading media for email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Media upload failed", null));
        } catch (IllegalArgumentException e) {
            log.error("Invalid media type for email: {}", email, e);
            return ResponseEntity.badRequest()
                    .body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping(value = "/posts/create", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> createPost(@Valid @RequestBody PostDTO postDTO, Authentication authentication) {
        String email = authentication.getName();
        log.info("Received request to create post for email: {}", email);

        try {
            UserDTO userDTO = userService.loadUserDetailsByEmail(email);
            if (userDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            postDTO.setUser(userDTO);
            int res = postService.createPost(postDTO);

            if (res != VarList.Created) {
                log.error("Failed to create post for email: {}", email);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseDTO(VarList.Bad_Request, "Error creating post", null));
            }
            log.info("Successfully created post for email: {}", email);
            return ResponseEntity.status(HttpStatus.CREATED).body(new ResponseDTO(VarList.Created, "Post created successfully", null));
        } catch (Exception e) {
            log.error("Error creating post for email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error creating post", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping(value = "/posts")
    public ResponseEntity<ResponseDTO> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        String email = authentication.getName();
        log.info("Received request to get posts for email: {}", email);

        try {
            // Add sorting by createdAt DESC
            PageRequest pageable = PageRequest.of(
                    page,
                    size,
                    Sort.by(Sort.Direction.DESC, "createdAt") // Add this line
            );

            Page<PostDTO> posts = postService.getProfilePosts(email, pageable);

            List<PostResponseDTO> postDTOs = posts.getContent().stream()
                    .map(this::convertToPostResponseDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("posts", postDTOs);
            response.put("currentPage", posts.getNumber());
            response.put("totalItems", posts.getTotalElements());
            response.put("totalPages", posts.getTotalPages());

            log.info("Successfully retrieved posts for email: {}", email);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Posts retrieved", response));
        } catch (Exception e) {
            log.error("Error retrieving posts for email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error retrieving posts", null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping(value = "/posts/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO> updatePost(
            @PathVariable int postId,
            @RequestPart("content") MultipartFile contentFile,
            @RequestPart("privacy") MultipartFile privacyFile,
            @RequestPart(value = "mediaToDelete", required = false) List<MultipartFile> mediaToDeleteFiles,
            @RequestPart(value = "newMedia", required = false) List<MultipartFile> newMedia,
            Authentication authentication) {

        String email = authentication.getName();
        log.info("Received request to update post with ID: {} for email: {}", postId, email);

        try {
            // Extract text content from MultipartFile
            String content = new String(contentFile.getBytes(), StandardCharsets.UTF_8);
            String privacy = new String(privacyFile.getBytes(), StandardCharsets.UTF_8);

            // Extract media URLs from mediaToDeleteFiles
            List<String> mediaToDelete = mediaToDeleteFiles != null ?
                    mediaToDeleteFiles.stream()
                            .map(file -> {
                                try {
                                    return new String(file.getBytes(), StandardCharsets.UTF_8);
                                } catch (IOException e) {
                                    throw new RuntimeException("Failed to read media URL", e);
                                }
                            })
                            .collect(Collectors.toList()) : new ArrayList<>();

            PostUpdateDTO updateDTO = new PostUpdateDTO();
            updateDTO.setContent(content);
            updateDTO.setPrivacy(privacy);
            updateDTO.setMediaToDelete(mediaToDelete);
            updateDTO.setNewMedia(newMedia != null ? newMedia : new ArrayList<>());

            PostDTO updatedPost = postService.updatePost(postId, email, updateDTO);
            log.info("Successfully updated post with ID: {}", postId);
            return ResponseEntity.status(HttpStatus.OK).body(new ResponseDTO(VarList.OK, "Post updated", convertToPostResponseDTO(updatedPost)));
        } catch (Exception e) {
            log.error("Error updating post with ID: {}", postId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating post: " + e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<ResponseDTO> deletePost(@PathVariable int postId,
                                                  Authentication authentication) {
        log.info("Received request to delete post with ID: {}", postId);
        try {
            postService.deletePost(postId);

            log.info("Successfully deleted post with ID: {}", postId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Post deleted", null));
        } catch (Exception e) {
            log.error("Error deleting post with ID: {}", postId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error deleting post", null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("posts/{postId}")
    public ResponseEntity<ResponseDTO> getPost(@PathVariable int postId, Authentication authentication) {
        String email = authentication.getName();
        log.info("Received request to get post with ID: {}", postId);
        try {
            PostDTO post = postService.getPost(postId, email);

            PostResponseDTO postDTO = convertToPostResponseDTO(post);
            log.info("Successfully retrieved post with ID: {}", postId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Post retrieved", postDTO));
        } catch (Exception e) {
            log.error("Error retrieving post with ID: {}", postId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error retrieving post", null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/posts/{postId}/reactions")
    public ResponseEntity<ResponseDTO> addReaction(@PathVariable Integer postId, @Valid @RequestBody ReactionDTO reactionDTO, Authentication authentication) {
        log.info("Received request to add reaction for post ID: {}", postId);

        try {
            String email = authentication.getName();
            ResponseDTO res = postService.addReaction(postId, reactionDTO, email);
            res.setData(convertToPostResponseDTO((PostDTO) res.getData()));

            log.info("Successfully added reaction for post ID: {}", postId);
            return ResponseEntity.status(HttpStatus.OK).body(res);
        } catch (Exception e) {
            log.error("Error adding reaction for post ID: {}", postId, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<ResponseDTO> addComment(@PathVariable int postId, @Valid @RequestBody CommentDTO commentDTO, Authentication authentication) {
        log.info("Received request to add comment for post ID: {}", postId);
        try {
            String email = authentication.getName();
            CommentDTO createdComment = postService.addComment(postId, commentDTO, email);

            log.info("Successfully added comment for post ID: {}", postId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Comment added", createdComment));

        } catch (Exception e) {
            log.error("Error adding comment for post ID: {}", postId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ResponseDTO> deleteComment(
            @PathVariable int commentId,
            Authentication authentication
    ) {
        log.info("Received request to delete comment ID: {}", commentId);
        try {
            String email = authentication.getName();
            postService.deleteComment(commentId, email);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Comment deleted", null));
        } catch (Exception e) {
            log.error("Error deleting comment ID: {}", commentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/comments/{parentCommentId}/reply")
    public ResponseEntity<ResponseDTO> addReply(
            @PathVariable int parentCommentId,
            @Valid @RequestBody CommentDTO commentDTO,
            Authentication authentication
    ) {
        log.info("Received request to add reply to comment ID: {}", parentCommentId);
        try {
            String email = authentication.getName();
            commentDTO.setParentCommentId(parentCommentId);
            CommentDTO createdReply = postService.addReply(parentCommentId, commentDTO, email);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Reply added", createdReply));
        } catch (Exception e) {
            log.error("Error adding reply to comment ID: {}", parentCommentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

//    @PreAuthorize("hasAuthority('USER')")
//    @PostMapping(value = "/share", consumes = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> sharePost(@Valid @RequestBody PostShareDTO shareDTO) {
//        log.info("Received request to share post for user ID: {}", shareDTO.getUser().getUserId());
//        try {
//            PostDTO sharedPost = profileService.sharePost(shareDTO);
//            log.info("Successfully shared post for user ID: {}", shareDTO.getUser().getUserId());
//            return ResponseEntity.status(HttpStatus.CREATED)
//                    .body(new ResponseDTO(VarList.Created, "Post shared successfully", sharedPost));
//        } catch (Exception e) {
//            log.error("Error sharing post for user ID: {}", shareDTO.getUser().getUserId(), e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error sharing post", e.getMessage()));
//        }
//    }
//
//    @PreAuthorize("hasAuthority('USER')")
//    @GetMapping(value = "/friends/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> getFriends(@PathVariable Integer userId) {
//        log.info("Received request to get friends for user ID: {}", userId);
//        try {
//            List<UserDTO> friends = profileService.getFriends(userId);
//            log.info("Successfully retrieved friends for user ID: {}", userId);
//            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friends retrieved successfully", friends));
//        } catch (Exception e) {
//            log.error("Error retrieving friends for user ID: {}", userId, e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error retrieving friends", e.getMessage()));
//        }
//    }


//    @PreAuthorize("hasAuthority('USER')")
//    @PostMapping(value = "/event", consumes = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> createEvent(@Valid @RequestBody EventDTO eventDTO) {
//        log.info("Received request to create event for post ID: {}", eventDTO.getPost().getPostId());
//        try {
//            EventDTO savedEvent = profileService.createEvent(eventDTO);
//            log.info("Successfully created event for post ID: {}", eventDTO.getPost().getPostId());
//            return ResponseEntity.status(HttpStatus.CREATED)
//                    .body(new ResponseDTO(VarList.Created, "Event created successfully", savedEvent));
//        } catch (Exception e) {
//            log.error("Error creating event for post ID: {}", eventDTO.getPost().getPostId(), e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error creating event", e.getMessage()));
//        }
//    }

    private PostResponseDTO convertToPostResponseDTO(PostDTO post) {
        PostResponseDTO dto = new PostResponseDTO();
        dto.setPostId(post.getPostId());
        dto.setContent(post.getContent());
        dto.setPrivacy(String.valueOf(post.getPrivacy()));
        dto.setCreatedAt(post.getCreatedAt());

        dto.setReactions(post.getReactions().stream()
                .map(reaction -> {
                    ReactionDTO reactionDTO = new ReactionDTO();
                    reactionDTO.setReactionId(reaction.getReactionId());
                    reactionDTO.setType(reaction.getType());
                    reactionDTO.setCreatedAt(reaction.getCreatedAt());

                    // Convert and set user
                    UserDTO reactionUserDTO = new UserDTO();
                    reactionUserDTO.setUserId(reaction.getUser().getUserId());
                    reactionUserDTO.setFirstName(reaction.getUser().getFirstName());
                    reactionUserDTO.setLastName(reaction.getUser().getLastName());
                    reactionUserDTO.setProfilePictureUrl(reaction.getUser().getProfilePictureUrl());
                    reactionDTO.setUser(reactionUserDTO);

                    return reactionDTO;
                })
                .collect(Collectors.toList()));

        dto.setComments(post.getComments().stream()
                .map(comment -> {
                    CommentDTO commentDTO = new CommentDTO();
                    commentDTO.setCommentId(comment.getCommentId());
                    commentDTO.setContent(comment.getContent());
                    commentDTO.setCreatedAt(comment.getCreatedAt());
                    commentDTO.setReplies(comment.getReplies());
                    commentDTO.setParentCommentId(comment.getParentCommentId());
                    System.out.println(commentDTO.getParentCommentId());


                    // Convert and set user
                    UserDTO commentUserDTO = new UserDTO();
                    commentUserDTO.setUserId(comment.getUser().getUserId());
                    commentUserDTO.setEmail(comment.getUser().getEmail());
                    commentUserDTO.setFirstName(comment.getUser().getFirstName());
                    commentUserDTO.setLastName(comment.getUser().getLastName());
                    commentUserDTO.setProfilePictureUrl(comment.getUser().getProfilePictureUrl());
                    commentDTO.setUser(commentUserDTO);

                    return commentDTO;
                })
                .collect(Collectors.toList()));

        dto.setLiked(post.getReactions().stream()
                .anyMatch(reaction -> reaction.getUser().getUserId().equals(post.getUser().getUserId())));
        dto.setReactionType(post.getReactions().stream()
                .filter(reaction -> reaction.getUser().getUserId().equals(post.getUser().getUserId()))
                .findFirst()
                .map(ReactionDTO::getType)
                .orElse(null));

        // Convert user
        UserDTO userDTO = new UserDTO();
        userDTO.setUserId(post.getUser().getUserId());
        userDTO.setFirstName(post.getUser().getFirstName());
        userDTO.setLastName(post.getUser().getLastName());
        userDTO.setProfilePictureUrl(post.getUser().getProfilePictureUrl());
        dto.setUser(userDTO);

        // Convert media
        dto.setMedia(post.getMedia().stream()
                .map(media -> {
                    PostMediaDTO mediaDTO = new PostMediaDTO();
                    mediaDTO.setMediaUrl(media.getMediaUrl());
                    mediaDTO.setMediaType(PostMedia.MediaType.valueOf(media.getMediaType().toString()));
                    return mediaDTO;
                })
                .collect(Collectors.toList()));

        return dto;
    }
}