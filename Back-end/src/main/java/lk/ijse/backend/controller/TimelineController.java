package lk.ijse.backend.controller;

import jakarta.validation.Valid;
import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.PostMedia;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("api/v1/timeline")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class TimelineController {
    private final PostService postService;
    private final ModelMapper modelMapper;

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

            Page<PostDTO> posts = postService.getTimelinePosts(email, pageable);

            List<PostResponseDTO> postDTOs = posts.getContent().stream()
                    .map(post -> convertToPostResponseDTO(post, email))
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
    @PostMapping(value = "/posts/report", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> createReport(@RequestBody ReportRequestDTO reportRequest, Authentication authentication) {
        String reporterEmail = authentication.getName();
        log.info("Received report creation request for email: {}", reporterEmail);

        try {
            ReportDTO createdReport = postService.createReport(reportRequest, reporterEmail);

            log.info("Report submitted for email: {}", reporterEmail);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Report submitted", createdReport));
        } catch (Exception e) {
            log.error("Error submitting report for email: {}", reporterEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    private PostResponseDTO convertToPostResponseDTO(PostDTO post, String email) {
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

                    commentDTO.setReplies(comment.getReplies());

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
        dto.setLiked(post.getReactions().stream()
                .anyMatch(reaction -> reaction.getUser().getEmail().equals(email)));
        dto.setReactionType(post.getReactions().stream()
                .filter(reaction -> reaction.getUser().getEmail().equals(email))
                .findFirst()
                .map(ReactionDTO::getType)
                .orElse(null));

        // Convert user
        UserDTO userDTO = new UserDTO();
        userDTO.setUserId(post.getUser().getUserId());
        userDTO.setEmail(post.getUser().getEmail());
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