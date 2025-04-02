package lk.ijse.backend.service;


import lk.ijse.backend.dto.FriendshipDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.entity.Friendship;

import java.util.List;

public interface FriendshipService {
    FriendshipDTO sendFriendRequest(String senderEmail, int receiverId) throws Exception;
    FriendshipDTO acceptFriendRequest(String receiverEmail, int senderId) throws Exception;
    void removeFriendship(String userEmail, int friendId) throws Exception;
    FriendshipDTO blockUser(String userEmail, int blockedUserId) throws Exception;
    void unblockUser(String userEmail, int blockedUserId) throws Exception;
    void declineFriendRequest(String email, int requesterId) throws Exception;
    List<FriendshipDTO> getAllFriends(String email) throws Exception;
    List<FriendshipDTO> getPendingRequests(String email) throws Exception;
    List<UserDTO> getFriendSuggestions(String email) throws Exception;
    FriendshipDTO getFriendshipStatus(String email, int targetUserId) throws Exception;
}