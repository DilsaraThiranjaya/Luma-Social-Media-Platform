package lk.ijse.backend.controller;

import jakarta.validation.Valid;
import lk.ijse.backend.dto.PostDTO;
import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.service.TimelineService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/timeline")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class TimelineController {
    private final TimelineService timelineService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> createPost(@Valid @RequestBody PostDTO postDTO) {
        log.info("Creating new post for user: {}", postDTO.getUser().getEmail());

        try {
            int res = timelineService.savePost(postDTO);
            if (res == VarList.Created) {
                log.info("Post created successfully");
                return ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ResponseDTO(VarList.Created, "Post Created Successfully!", postDTO));
            } else {
                log.error("Failed to create post");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Failed to Create Post!", null));
            }
        } catch (Exception e) {
            log.error("Error creating post: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @GetMapping(value = "/getPost", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> getTimelinePosts(@RequestParam String userEmail) {
        log.info("Fetching timeline posts for user: {}", userEmail);

        try {
            List<PostDTO> posts = timelineService.getTimelinePosts(userEmail);
            log.info("Successfully fetched {} timeline posts", posts.size());
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Posts Retrieved Successfully!", posts));
        } catch (Exception e) {
            log.error("Error fetching timeline posts: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping(value = "/{postId}/react", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> reactToPost(
            @PathVariable Integer postId,
            @RequestParam String userEmail,
            @RequestParam String reactionType) {
        log.info("Adding reaction to post {}: {} by {}", postId, reactionType, userEmail);

        try {
            boolean success = timelineService.addReaction(postId, userEmail, reactionType);
            if (success) {
                log.info("Reaction added successfully");
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "Reaction Added Successfully!", null));
            } else {
                log.error("Failed to add reaction");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Failed to Add Reaction!", null));
            }
        } catch (Exception e) {
            log.error("Error adding reaction: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping(value = "/{postId}/comment", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> addComment(
            @PathVariable Integer postId,
            @RequestParam String userEmail,
            @RequestBody String content) {
        log.info("Adding comment to post {}: by {}", postId, userEmail);

        try {
            boolean success = timelineService.addComment(postId, userEmail, content);
            if (success) {
                log.info("Comment added successfully");
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "Comment Added Successfully!", null));
            } else {
                log.error("Failed to add comment");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Failed to Add Comment!", null));
            }
        } catch (Exception e) {
            log.error("Error adding comment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PostMapping(value = "/{postId}/share", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> sharePost(
            @PathVariable Integer postId,
            @RequestParam String userEmail,
            @RequestBody String shareMessage) {
        log.info("Sharing post {}: by {}", postId, userEmail);

        try {
            PostDTO sharedPost = timelineService.sharePost(postId, userEmail, shareMessage);
            if (sharedPost != null) {
                log.info("Post shared successfully");
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "Post Shared Successfully!", sharedPost));
            } else {
                log.error("Failed to share post");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Failed to Share Post!", null));
            }
        } catch (Exception e) {
            log.error("Error sharing post: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
}