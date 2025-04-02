package lk.ijse.backend.service.impl;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lk.ijse.backend.dto.FriendshipDTO;
import lk.ijse.backend.entity.Friendship;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.FriendshipRepository;
import lk.ijse.backend.repository.UserRepository;
import lk.ijse.backend.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;


@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class FriendshipServiceImpl implements FriendshipService {
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final ModelMapper modelMapper;


    @Override
    public FriendshipDTO sendFriendRequest(String senderEmail, int receiverId) throws Exception {
        User sender = userRepository.findByEmail(senderEmail);
        User receiver = userRepository.findById(String.valueOf(receiverId))
                .orElseThrow(() -> new EntityNotFoundException("Receiver not found"));

        if (sender.getUserId() == receiverId) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }

        // Check if friendship already exists
        Friendship existingFriendship = friendshipRepository.findByUsers(sender.getUserId(), receiverId);
        if (existingFriendship != null) {
            throw new IllegalStateException("Friendship already exists");
        }

        Friendship friendship = new Friendship();
        friendship.setId(new Friendship.FriendshipId(sender.getUserId(), receiverId));
        friendship.setUser1(sender);
        friendship.setUser2(receiver);
        friendship.setStatus(Friendship.FriendshipStatus.PENDING);

        Friendship savedFriendship = friendshipRepository.save(friendship);
        return modelMapper.map(savedFriendship, FriendshipDTO.class);
    }

    @Override
    public FriendshipDTO acceptFriendRequest(String receiverEmail, int senderId) throws Exception {
        User receiver = userRepository.findByEmail(receiverEmail);

        Friendship friendship = friendshipRepository.findByUsers(senderId, receiver.getUserId());
        if (friendship == null || friendship.getStatus() != Friendship.FriendshipStatus.PENDING) {
            throw new IllegalStateException("No pending friend request found");
        }

        friendship.setStatus(Friendship.FriendshipStatus.ACCEPTED);
        Friendship savedFriendship = friendshipRepository.save(friendship);
        return modelMapper.map(savedFriendship, FriendshipDTO.class);
    }

    @Override
    public void removeFriendship(String userEmail, int friendId) throws Exception {
        User user = userRepository.findByEmail(userEmail);
        Friendship friendship = friendshipRepository.findByUsers(user.getUserId(), friendId);

        if (friendship == null) {
            throw new EntityNotFoundException("Friendship not found");
        }

        friendshipRepository.delete(friendship);
    }

    @Override
    public FriendshipDTO blockUser(String userEmail, int blockedUserId) throws Exception {
        User user = userRepository.findByEmail(userEmail);

        Friendship friendship = friendshipRepository.findByUsers(user.getUserId(), blockedUserId);
        if (friendship == null) {
            // Create new blocked relationship
            User blockedUser = userRepository.findById(String.valueOf(blockedUserId))
                    .orElseThrow(() -> new EntityNotFoundException("User to block not found"));

            friendship = new Friendship();
            friendship.setId(new Friendship.FriendshipId(user.getUserId(), blockedUserId));
            friendship.setUser1(user);
            friendship.setUser2(blockedUser);
        }

        friendship.setStatus(Friendship.FriendshipStatus.BLOCKED);
        Friendship savedFriendship = friendshipRepository.save(friendship);
        return modelMapper.map(savedFriendship, FriendshipDTO.class);
    }

    @Override
    public void unblockUser(String userEmail, int blockedUserId) throws Exception {
        User user = userRepository.findByEmail(userEmail);
        Friendship friendship = friendshipRepository.findByUsers(user.getUserId(), blockedUserId);

        if (friendship == null || friendship.getStatus() != Friendship.FriendshipStatus.BLOCKED) {
            throw new IllegalStateException("No blocked relationship found");
        }

        friendshipRepository.delete(friendship);
    }

//    @Override
//    public Friendship.FriendshipStatus getFriendshipStatus(String email, int targetUserId) {
//        User currentUser = userRepository.findByEmail(email);
//        User targetUser = userRepository.findById(String.valueOf(targetUserId))
//                .orElseThrow(() -> new EntityNotFoundException("Target user not found"));
//
//        if (currentUser.getUserId() == targetUserId) {
//            throw new IllegalArgumentException("Cannot check friendship status with self");
//        }
//
//        Optional<Friendship> friendship = friendshipRepository.findByUsers(currentUser.getUserId(), targetUserId);
//
//        if (friendship.isEmpty()) {
//            return FriendshipStatus.NONE;
//        }
//
//        Friendship.FriendshipStatus status = friendship.get().getStatus();
//        User user1 = friendship.get().getUser1();
//
//        switch (status) {
//            case PENDING:
//                return user1.getUserId() == currentUser.getUserId() ?
//                        FriendshipStatus.PENDING_SENT : FriendshipStatus.PENDING_RECEIVED;
//            case ACCEPTED:
//                return FriendshipStatus.FRIENDS;
//            case BLOCKED:
//                return FriendshipStatus.BLOCKED;
//            default:
//                return FriendshipStatus.NONE;
//        }
//    }

    @Override
    public void declineFriendRequest(String email, int requesterId) {
        User currentUser = userRepository.findByEmail(email);

        Friendship friendship = friendshipRepository.findByUsers(requesterId, currentUser.getUserId());

        if (friendship == null) {
            throw new EntityNotFoundException("Friendship not found");
        }

        if (friendship.getStatus() != Friendship.FriendshipStatus.PENDING) {
            throw new IllegalStateException("Invalid friendship status");
        }

        if (friendship.getUser2().getUserId() != currentUser.getUserId()) {
            throw new IllegalStateException("Not authorized to decline this request");
        }

        friendshipRepository.delete(friendship);
    }
}