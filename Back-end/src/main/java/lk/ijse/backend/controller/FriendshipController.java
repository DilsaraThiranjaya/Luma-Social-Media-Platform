package lk.ijse.backend.controller;

import lk.ijse.backend.dto.FriendshipDTO;
import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.service.FriendshipService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/v1/friendship")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class FriendshipController {
    private final FriendshipService friendshipService;

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/friends")
    public ResponseEntity<ResponseDTO> getAllFriends(Authentication authentication) {
        log.info("Retrieving friends for user: {}", authentication.getName());
        try {
            List<FriendshipDTO> friends = friendshipService.getAllFriends(authentication.getName());

            log.info("Retrieved {} friends for user: {}", friends.size(), authentication.getName());
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friends retrieved successfully", friends));
        } catch (Exception e) {
            log.error("Error retrieving friends", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/requests")
    public ResponseEntity<ResponseDTO> getPendingRequests(Authentication authentication) {
        log.info("Retrieving friend requests for user: {}", authentication.getName());
        try {
            List<FriendshipDTO> requests = friendshipService.getPendingRequests(authentication.getName());

            log.info("Retrieved {} friend requests for user: {}", requests.size(), authentication.getName());
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friend requests retrieved successfully", requests));
        } catch (Exception e) {
            log.error("Error retrieving friend requests", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/suggestions")
    public ResponseEntity<ResponseDTO> getFriendSuggestions(Authentication authentication) {
        log.info("Retrieving friend suggestions for user: {}", authentication.getName());
        try {
            List<UserDTO> suggestions = friendshipService.getFriendSuggestions(authentication.getName());

            log.info("Retrieved {} friend suggestions for user: {}", suggestions.size(), authentication.getName());
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friend suggestions retrieved successfully", suggestions));
        } catch (Exception e) {
            log.error("Error retrieving friend suggestions", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/counts")
    public ResponseEntity<ResponseDTO> getFriendshipCounts(Authentication authentication) {
        log.info("Retrieving friendship counts for user: {}", authentication.getName());
        try {
            String email = authentication.getName();
            List<FriendshipDTO> friends = friendshipService.getAllFriends(email);
            List<FriendshipDTO> requests = friendshipService.getPendingRequests(email);
            List<UserDTO> suggestions = friendshipService.getFriendSuggestions(email);

            Map<String, Integer> counts = Map.of(
                    "friendsCount", friends.size(),
                    "requestsCount", requests.size(),
                    "suggestionsCount", suggestions.size()
            );

            log.info("Retrieved friendship counts for user: {}", email);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Counts retrieved successfully", counts));
        } catch (Exception e) {
            log.error("Error retrieving counts", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{userId}/request")
    public ResponseEntity<ResponseDTO> sendFriendRequest(
            @PathVariable Integer userId,
            Authentication authentication) {
        log.info("Sending friend request from user: {} to user: {}", authentication.getName(), userId);
        try {
            FriendshipDTO friendship = friendshipService.sendFriendRequest(authentication.getName(), userId);

            log.info("Friend request sent successfully from user: {} to user: {}", authentication.getName(), userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friend request sent successfully", friendship));
        } catch (Exception e) {
            log.error("Error sending friend request", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{userId}/accept")
    public ResponseEntity<ResponseDTO> acceptFriendRequest(
            @PathVariable Integer userId,
            Authentication authentication) {
        log.info("Accepting friend request from user: {} to user: {}", authentication.getName(), userId);
        try {
            FriendshipDTO friendship = friendshipService.acceptFriendRequest(authentication.getName(), userId);

            log.info("Friend request accepted from user: {} to user: {}", authentication.getName(), userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friend request accepted", friendship));
        } catch (Exception e) {
            log.error("Error accepting friend request", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/{userId}")
    public ResponseEntity<ResponseDTO> removeFriendship(
            @PathVariable Integer userId,
            Authentication authentication) {
        log.info("Removing friendship between users: {} and {}", authentication.getName(), userId);
        try {
            friendshipService.removeFriendship(authentication.getName(), userId);

            log.info("Friendship removed successfully between users: {} and {}", authentication.getName(), userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friendship removed successfully", null));
        } catch (Exception e) {
            log.error("Error removing friendship", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/{userId}/decline")
    public ResponseEntity<ResponseDTO> declineFriendRequest(
            @PathVariable Integer userId,
            Authentication authentication) {
        log.info("Declining friend request from user: {} to user: {}", authentication.getName(), userId);
        try {
            friendshipService.declineFriendRequest(authentication.getName(), userId);

            log.info("Friend request declined from user: {} to user: {}", authentication.getName(), userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friend request declined", null));
        } catch (Exception e) {
            log.error("Error declining friend request", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{userId}/block")
    public ResponseEntity<ResponseDTO> blockUser(
            @PathVariable Integer userId,
            Authentication authentication) {
        log.info("Blocking user: {}", userId);
        try {
            FriendshipDTO friendship = friendshipService.blockUser(authentication.getName(), userId);

            log.info("User blocked successfully: {}", userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "User blocked successfully", friendship));
        } catch (Exception e) {
            log.error("Error blocking user", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{userId}/unblock")
    public ResponseEntity<ResponseDTO> unblockUser(
            @PathVariable Integer userId,
            Authentication authentication) {
        log.info("Unblocking user: {}", userId);
        try {
            friendshipService.unblockUser(authentication.getName(), userId);

            log.info("User unblocked successfully: {}", userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "User unblocked successfully", null));
        } catch (Exception e) {
            log.error("Error unblocking user", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }
}