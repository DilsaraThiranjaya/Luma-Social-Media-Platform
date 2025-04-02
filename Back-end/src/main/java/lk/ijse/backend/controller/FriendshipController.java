package lk.ijse.backend.controller;

import lk.ijse.backend.dto.FriendshipDTO;
import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.entity.Friendship;
import lk.ijse.backend.service.FriendshipService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/friends")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class FriendshipController {
    private final FriendshipService friendshipService;

//    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
//    @GetMapping("/{userId}/status")
//    public ResponseEntity<ResponseDTO> getFriendshipStatus(
//            @PathVariable int userId,
//            Authentication authentication) {
//        try {
//            String email = authentication.getName();
//            Friendship.FriendshipStatus status = friendshipService.getFriendshipStatus(email, userId);
//            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Status retrieved", status));
//        } catch (Exception e) {
//            log.error("Error getting friendship status", e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Failed to get status", null));
//        }
//    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{userId}/request")
    public ResponseEntity<ResponseDTO> sendFriendRequest(
            @PathVariable Integer userId,
            Authentication authentication) {
        log.info("Received friend request for user ID: {}", userId);
        try {
            String email = authentication.getName();
            FriendshipDTO friendship = friendshipService.sendFriendRequest(email, userId);

            log.info("Successfully sent friend request to user ID: {}", userId);
            return ResponseEntity.ok(new ResponseDTO(
                    VarList.OK,
                    "Friend request sent successfully",
                    friendship
            ));
        } catch (Exception e) {
            log.error("Error sending friend request to user ID: {}", userId, e);
            return ResponseEntity.badRequest().body(new ResponseDTO(
                    VarList.Bad_Request,
                    e.getMessage(),
                    null
            ));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{userId}/accept")
    public ResponseEntity<ResponseDTO> acceptFriendRequest(
            @PathVariable Integer userId,
            Authentication authentication) {
        log.info("Accepting friend request from user ID: {}", userId);
        try {
            String email = authentication.getName();
            FriendshipDTO friendship = friendshipService.acceptFriendRequest(email, userId);

            log.info("Successfully accepted friend request from user ID: {}", userId);
            return ResponseEntity.ok(new ResponseDTO(
                    VarList.OK,
                    "Friend request accepted",
                    friendship
            ));
        } catch (Exception e) {
            log.error("Error accepting friend request from user ID: {}", userId, e);
            return ResponseEntity.badRequest().body(new ResponseDTO(
                    VarList.Bad_Request,
                    e.getMessage(),
                    null
            ));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/{userId}")
    public ResponseEntity<ResponseDTO> removeFriendship(
            @PathVariable Integer userId,
            Authentication authentication) {
        log.info("Removing friendship with user ID: {}", userId);
        try {
            String email = authentication.getName();
            friendshipService.removeFriendship(email, userId);

            log.info("Successfully removed friendship with user ID: {}", userId);
            return ResponseEntity.ok(new ResponseDTO(
                    VarList.OK,
                    "Friendship removed successfully",
                    null
            ));
        } catch (Exception e) {
            log.error("Error removing friendship with user ID: {}", userId, e);
            return ResponseEntity.badRequest().body(new ResponseDTO(
                    VarList.Bad_Request,
                    e.getMessage(),
                    null
            ));
        }
    }

//    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
//    @DeleteMapping("/{userId}/decline")
//    public ResponseEntity<ResponseDTO> declineFriendRequest(
//            @PathVariable int userId,
//            Authentication authentication) {
//        try {
//            String email = authentication.getName();
//            friendshipService.declineFriendRequest(email, userId);
//            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friend request declined", null));
//        } catch (Exception e) {
//            log.error("Error declining friend request", e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Failed to decline request", null));
//        }
//    }

//    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
//    @DeleteMapping("/{userId}/unfriend")
//    public ResponseEntity<ResponseDTO> unfriend(
//            @PathVariable int userId,
//            Authentication authentication) {
//        try {
//            String email = authentication.getName();
//            friendshipService.unfriend(email, userId);
//            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Unfriended successfully", null));
//        } catch (Exception e) {
//            log.error("Error unfriending", e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Failed to unfriend", null));
//        }
//    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{userId}/block")
    public ResponseEntity<ResponseDTO> blockUser(
            @PathVariable Integer userId,
            Authentication authentication) {
        log.info("Blocking user ID: {}", userId);
        try {
            String email = authentication.getName();
            FriendshipDTO friendship = friendshipService.blockUser(email, userId);

            log.info("Successfully blocked user ID: {}", userId);
            return ResponseEntity.ok(new ResponseDTO(
                    VarList.OK,
                    "User blocked successfully",
                    friendship
            ));
        } catch (Exception e) {
            log.error("Error blocking user ID: {}", userId, e);
            return ResponseEntity.badRequest().body(new ResponseDTO(
                    VarList.Bad_Request,
                    e.getMessage(),
                    null
            ));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{userId}/unblock")
    public ResponseEntity<ResponseDTO> unblockUser(
            @PathVariable Integer userId,
            Authentication authentication) {
        log.info("Unblocking user ID: {}", userId);
        try {
            String email = authentication.getName();
            friendshipService.unblockUser(email, userId);

            log.info("Successfully unblocked user ID: {}", userId);
            return ResponseEntity.ok(new ResponseDTO(
                    VarList.OK,
                    "User unblocked successfully",
                    null
            ));
        } catch (Exception e) {
            log.error("Error unblocking user ID: {}", userId, e);
            return ResponseEntity.badRequest().body(new ResponseDTO(
                    VarList.Bad_Request,
                    e.getMessage(),
                    null
            ));
        }
    }
}