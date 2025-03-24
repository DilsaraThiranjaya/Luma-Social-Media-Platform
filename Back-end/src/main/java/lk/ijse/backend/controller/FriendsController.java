package lk.ijse.backend.controller;

import jakarta.validation.Valid;
import lk.ijse.backend.dto.FriendshipDTO;
import lk.ijse.backend.dto.ResponseDTO;
import lk.ijse.backend.service.impl.FriendsServiceImpl;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/friends")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class FriendsController {
    private final FriendsServiceImpl friendsService;

    @PreAuthorize("hasAuthority('USER')")
    @GetMapping("/requests")
    public ResponseEntity<ResponseDTO> getFriendRequests(Authentication authentication) {
        log.info("Received friend requests fetch request for user: {}", authentication.getName());
        try {
            List<FriendshipDTO> requests = friendsService.getFriendRequests(authentication.getName());
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Friend requests fetched successfully", requests));
        } catch (Exception e) {
            log.error("Error fetching friend requests: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error fetching friend requests", null));
        }
    }

    @PreAuthorize("hasAuthority('USER')")
    @GetMapping("/all")
    public ResponseEntity<ResponseDTO> getAllFriends(Authentication authentication) {
        log.info("Received all friends fetch request for user: {}", authentication.getName());
        try {
            List<FriendshipDTO> friends = friendsService.getAllFriends(authentication.getName());
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Friends fetched successfully", friends));
        } catch (Exception e) {
            log.error("Error fetching friends: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error fetching friends", null));
        }
    }

    @PreAuthorize("hasAuthority('USER')")
    @GetMapping("/suggestions")
    public ResponseEntity<ResponseDTO> getFriendSuggestions(Authentication authentication) {
        log.info("Received friend suggestions fetch request for user: {}", authentication.getName());
        try {
            List<FriendshipDTO> suggestions = friendsService.getFriendSuggestions(authentication.getName());
            return ResponseEntity.ok()
                    .body(new ResponseDTO(VarList.OK, "Friend suggestions fetched successfully", suggestions));
        } catch (Exception e) {
            log.error("Error fetching friend suggestions: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error fetching friend suggestions", null));
        }
    }

    @PreAuthorize("hasAuthority('USER')")
    @PostMapping("/request")
    public ResponseEntity<ResponseDTO> sendFriendRequest(@Valid @RequestBody FriendshipDTO friendshipDTO, Authentication authentication) {
        log.info("Received friend request from {} to {}", authentication.getName(), friendshipDTO.getUser2Email());
        try {
            friendshipDTO.setUser1Email(authentication.getName());
            int result = friendsService.sendFriendRequest(friendshipDTO);

            if (result == VarList.Created) {
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "Friend request sent successfully", null));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Failed to send friend request", null));
            }
        } catch (Exception e) {
            log.error("Error sending friend request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error sending friend request", null));
        }
    }

    @PreAuthorize("hasAuthority('USER')")
    @PutMapping("/accept/{requestId}")
    public ResponseEntity<ResponseDTO> acceptFriendRequest(@PathVariable int requestId, Authentication authentication) {
        log.info("Received friend request acceptance for request ID: {}", requestId);
        try {
            int result = friendsService.acceptFriendRequest(requestId, authentication.getName());

            if (result == VarList.Created) {
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "Friend request accepted successfully", null));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Failed to accept friend request", null));
            }
        } catch (Exception e) {
            log.error("Error accepting friend request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error accepting friend request", null));
        }
    }

    @PreAuthorize("hasAuthority('USER')")
    @DeleteMapping("/reject/{requestId}")
    public ResponseEntity<ResponseDTO> rejectFriendRequest(@PathVariable int requestId, Authentication authentication) {
        log.info("Received friend request rejection for request ID: {}", requestId);
        try {
            int result = friendsService.rejectFriendRequest(requestId, authentication.getName());

            if (result == VarList.Created) {
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "Friend request rejected successfully", null));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Failed to reject friend request", null));
            }
        } catch (Exception e) {
            log.error("Error rejecting friend request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error rejecting friend request", null));
        }
    }

    @PreAuthorize("hasAuthority('USER')")
    @DeleteMapping("/unfriend/{friendId}")
    public ResponseEntity<ResponseDTO> unfriend(@PathVariable int friendId, Authentication authentication) {
        log.info("Received unfriend request for friend ID: {}", friendId);
        try {
            int result = friendsService.unfriend(friendId, authentication.getName());

            if (result == VarList.Created) {
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "Unfriended successfully", null));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Failed to unfriend", null));
            }
        } catch (Exception e) {
            log.error("Error unfriending: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error unfriending", null));
        }
    }

    @PreAuthorize("hasAuthority('USER')")
    @PutMapping("/block/{userId}")
    public ResponseEntity<ResponseDTO> blockUser(@PathVariable int userId, Authentication authentication) {
        log.info("Received block request for user ID: {}", userId);
        try {
            int result = friendsService.blockUser(userId, authentication.getName());

            if (result == VarList.Created) {
                return ResponseEntity.ok()
                        .body(new ResponseDTO(VarList.OK, "User blocked successfully", null));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ResponseDTO(VarList.Bad_Request, "Failed to block user", null));
            }
        } catch (Exception e) {
            log.error("Error blocking user: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error blocking user", null));
        }
    }
}