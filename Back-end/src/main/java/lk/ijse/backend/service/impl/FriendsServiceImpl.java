//package lk.ijse.backend.service.impl;
//
//import lk.ijse.backend.dto.FriendshipDTO;
//import lk.ijse.backend.entity.Friendship;
//import lk.ijse.backend.entity.User;
//import lk.ijse.backend.repository.FriendsRepository;
//import lk.ijse.backend.repository.UserRepository;
//import lk.ijse.backend.service.FriendsService;
//import lk.ijse.backend.util.VarList;
//import lombok.RequiredArgsConstructor;
//import org.modelmapper.ModelMapper;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.util.List;
//import java.util.stream.Collectors;
//
//@Service
//@Transactional
//@RequiredArgsConstructor
//public class FriendsServiceImpl implements FriendsService {
//    private final FriendsRepository friendsRepository;
//    private final UserRepository userRepository;
//    private final ModelMapper modelMapper;
//
//    @Override
//    public List<FriendshipDTO> getFriendRequests(String email) {
//        User user = userRepository.findByEmail(email);
//        List<Friendship> requests = friendsRepository.findByUser2AndStatus(user, Friendship.FriendshipStatus.PENDING);
//        return requests.stream()
//                .map(friendship -> modelMapper.map(friendship, FriendshipDTO.class))
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public List<FriendshipDTO> getAllFriends(String email) {
//        User user = userRepository.findByEmail(email);
//        List<Friendship> friends = friendsRepository.findByUser1OrUser2AndStatus(
//                user, user, Friendship.FriendshipStatus.ACCEPTED);
//        return friends.stream()
//                .map(friendship -> modelMapper.map(friendship, FriendshipDTO.class))
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public List<FriendshipDTO> getFriendSuggestions(String email) {
//        User user = userRepository.findByEmail(email);
//        // Implementation would include logic to find users with mutual friends
//        // For now, return a simple list of non-friend users
//        List<User> allUsers = userRepository.findAll();
//        List<User> friends = friendsRepository.findFriendsByUser(user);
//
//        return allUsers.stream()
//                .filter(u -> !u.equals(user) && !friends.contains(u))
//                .map(u -> {
//                    FriendshipDTO dto = new FriendshipDTO();
//                    dto.setUser2Email(u.getEmail());
//                    return dto;
//                })
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public int sendFriendRequest(FriendshipDTO friendshipDTO) {
//        User user1 = userRepository.findByEmail(friendshipDTO.getUser1Email());
//        User user2 = userRepository.findByEmail(friendshipDTO.getUser2Email());
//
//        if (user1 == null || user2 == null) {
//            return VarList.Not_Found;
//        }
//
//        if (friendsRepository.existsByUser1AndUser2(user1, user2) ||
//                friendsRepository.existsByUser1AndUser2(user2, user1)) {
//            return VarList.Conflict;
//        }
//
//        Friendship friendship = new Friendship();
//        friendship.setUser1(user1);
//        friendship.setUser2(user2);
//        friendship.setStatus(Friendship.FriendshipStatus.PENDING);
//
//        friendsRepository.save(friendship);
//        return VarList.Created;
//    }
//
//    @Override
//    public int acceptFriendRequest(int requestId, String email) {
//        Friendship friendship = friendsRepository.findById(requestId).orElse(null);
//        if (friendship == null || !friendship.getUser2().getEmail().equals(email)) {
//            return VarList.Not_Found;
//        }
//
//        friendship.setStatus(Friendship.FriendshipStatus.ACCEPTED);
//        friendsRepository.save(friendship);
//        return VarList.Created;
//    }
//
//    @Override
//    public int rejectFriendRequest(int requestId, String email) {
//        Friendship friendship = friendsRepository.findById(requestId).orElse(null);
//        if (friendship == null || !friendship.getUser2().getEmail().equals(email)) {
//            return VarList.Not_Found;
//        }
//
//        friendsRepository.delete(friendship);
//        return VarList.Created;
//    }
//
//    @Override
//    public int unfriend(int friendId, String email) {
//        User user = userRepository.findByEmail(email);
//        User friend = userRepository.findById(String.valueOf(friendId)).orElse(null);
//
//        if (user == null || friend == null) {
//            return VarList.Not_Found;
//        }
//
//        Friendship friendship = friendsRepository.findByUsers(user, friend);
//        if (friendship == null) {
//            return VarList.Not_Found;
//        }
//
//        friendsRepository.delete(friendship);
//        return VarList.Created;
//    }
//
//    @Override
//    public int blockUser(int userId, String email) {
//        User user = userRepository.findByEmail(email);
//        User blockedUser = userRepository.findById(String.valueOf(userId)).orElse(null);
//
//        if (user == null || blockedUser == null) {
//            return VarList.Not_Found;
//        }
//
//        Friendship friendship = friendsRepository.findByUsers(user, blockedUser);
//        if (friendship != null) {
//            friendship.setStatus(Friendship.FriendshipStatus.BLOCKED);
//            friendsRepository.save(friendship);
//        } else {
//            friendship = new Friendship();
//            friendship.setUser1(user);
//            friendship.setUser2(blockedUser);
//            friendship.setStatus(Friendship.FriendshipStatus.BLOCKED);
//            friendsRepository.save(friendship);
//        }
//
//        return VarList.Created;
//    }
//}