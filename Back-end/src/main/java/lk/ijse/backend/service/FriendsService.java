package lk.ijse.backend.service;

import lk.ijse.backend.dto.FriendshipDTO;
import java.util.List;

public interface FriendsService {
    List<FriendshipDTO> getFriendRequests(String email);
    List<FriendshipDTO> getAllFriends(String email);
    List<FriendshipDTO> getFriendSuggestions(String email);
    int sendFriendRequest(FriendshipDTO friendshipDTO);
    int acceptFriendRequest(int requestId, String email);
    int rejectFriendRequest(int requestId, String email);
    int unfriend(int friendId, String email);
    int blockUser(int userId, String email);
}