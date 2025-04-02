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
        try {
            List<FriendshipDTO> friends = friendshipService.getAllFriends(authentication.getName());
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friends retrieved successfully", friends));
        } catch (Exception e) {
            log.error("Error retrieving friends", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/requests")
    public ResponseEntity<ResponseDTO> getPendingRequests(Authentication authentication) {
        try {
            List<FriendshipDTO> requests = friendshipService.getPendingRequests(authentication.getName());
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friend requests retrieved successfully", requests));
        } catch (Exception e) {
            log.error("Error retrieving friend requests", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/suggestions")
    public ResponseEntity<ResponseDTO> getFriendSuggestions(Authentication authentication) {
        try {
            List<UserDTO> suggestions = friendshipService.getFriendSuggestions(authentication.getName());
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friend suggestions retrieved successfully", suggestions));
        } catch (Exception e) {
            log.error("Error retrieving friend suggestions", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/counts")
    public ResponseEntity<ResponseDTO> getFriendshipCounts(Authentication authentication) {
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
        try {
            FriendshipDTO friendship = friendshipService.sendFriendRequest(authentication.getName(), userId);
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
        try {
            FriendshipDTO friendship = friendshipService.acceptFriendRequest(authentication.getName(), userId);
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
        try {
            friendshipService.removeFriendship(authentication.getName(), userId);
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
        try {
            friendshipService.declineFriendRequest(authentication.getName(), userId);
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
        try {
            FriendshipDTO friendship = friendshipService.blockUser(authentication.getName(), userId);
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
        try {
            friendshipService.unblockUser(authentication.getName(), userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "User unblocked successfully", null));
        } catch (Exception e) {
            log.error("Error unblocking user", e);
            return ResponseEntity.badRequest().body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }
}