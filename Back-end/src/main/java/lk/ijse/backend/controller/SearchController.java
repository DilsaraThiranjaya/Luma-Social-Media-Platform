package lk.ijse.backend.controller;

import lk.ijse.backend.dto.PostDTO;
import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.service.PostService;
import lk.ijse.backend.service.UserService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/v1/search")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class SearchController {
    private final UserService userService;
    private final PostService postService;

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ResponseDTO> search(@RequestParam String q, @RequestParam(defaultValue = "5") int limit, Authentication authentication) {
        try {
            String email = authentication.getName();
            log.info("Received request to search for email: {}", email);
            Map<String, Object> results = new HashMap<>();

            // Get users matching query
            List<UserDTO> users = userService.searchUsers(q, limit, email);
            results.put("users", users);

            // Get posts matching query
            List<PostDTO> posts = postService.searchPosts(q, limit, email);
            results.put("posts", posts);

            log.info("Successfully searched for email: {}", email);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Search results", results));
        } catch (Exception e) {
            log.error("Search error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Search failed", null));
        }
    }
}