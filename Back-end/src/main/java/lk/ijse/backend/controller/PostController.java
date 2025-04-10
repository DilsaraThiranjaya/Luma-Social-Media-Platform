package lk.ijse.backend.controller;

import lk.ijse.backend.dto.PostDTO;
import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.service.PostService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/v1/posts")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin("*")
public class PostController {
    private final PostService postService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> getAllPosts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search
    ) {
        log.info("Fetching posts with status: {}, type: {}, search: {}", status, type, search);
        try {
            List<PostDTO> posts = postService.getAllPosts(status, type, search);

            log.info("Fetched {} posts", posts.size());
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Posts Retrieved Successfully!", posts));
        } catch (Exception e) {
            log.error("Error fetching posts: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{postId}/status")
    public ResponseEntity<ResponseDTO> updatePostStatus(
            @PathVariable int postId,
            @RequestParam String status
    ) {
        log.info("Updating post status for post ID: {}", postId);
        try {
            postService.updatePostStatus(postId, status);

            log.info("Post status updated for post ID: {}", postId);
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Post Status Updated Successfully!", null));
        } catch (Exception e) {
            log.error("Error updating post status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stats")
    public ResponseEntity<ResponseDTO> getPostStats() {
        log.info("Fetching post stats");
        try {
            Map<String, Object> stats = postService.getPostStats();

            log.info("Fetched post stats: {}", stats);
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Post Stats Retrieved Successfully!", stats));
        } catch (Exception e) {
            log.error("Error fetching post stats: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{postId}")
    public ResponseEntity<ResponseDTO> deletePost(@PathVariable int postId) {
        log.info("Deleting post with ID: {}", postId);
        try {
            postService.deletePost(postId);

            log.info("Post deleted with ID: {}", postId);
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Post Deleted Successfully!", null));
        } catch (Exception e) {
            log.error("Error deleting post: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, e.getMessage(), null));
        }
    }
}