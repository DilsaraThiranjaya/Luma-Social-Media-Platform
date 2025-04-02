package lk.ijse.backend.service;


import lk.ijse.backend.dto.FriendshipDTO;
import lk.ijse.backend.entity.Friendship;

public interface FriendshipService {
    void declineFriendRequest(String email, int requesterId);
    FriendshipDTO sendFriendRequest(String senderEmail, int receiverId) throws Exception;
    FriendshipDTO acceptFriendRequest(String receiverEmail, int senderId) throws Exception;
    void removeFriendship(String userEmail, int friendId) throws Exception;
    FriendshipDTO blockUser(String userEmail, int blockedUserId) throws Exception;
    void unblockUser(String userEmail, int blockedUserId) throws Exception;
}