package lk.ijse.backend.service.impl;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lk.ijse.backend.dto.FriendshipDTO;
import lk.ijse.backend.dto.NotificationDTO;
import lk.ijse.backend.dto.PostDTO;
import lk.ijse.backend.dto.UserDTO;
import lk.ijse.backend.entity.Embeded.FriendshipId;
import lk.ijse.backend.entity.Friendship;
import lk.ijse.backend.entity.Notification;
import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.FriendshipRepository;
import lk.ijse.backend.repository.UserRepository;
import lk.ijse.backend.service.FriendshipService;
import lk.ijse.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class FriendshipServiceImpl implements FriendshipService {
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final NotificationService notificationService;
    private final ModelMapper modelMapper;

    @Override
    public List<FriendshipDTO> getAllFriends(String email) throws Exception {
        User currentUser = userRepository.findByEmail(email);
        return friendshipRepository.findAllFriendships(currentUser.getUserId())
                .stream()
                .map(friendship -> {
                    FriendshipDTO dto = modelMapper.map(friendship, FriendshipDTO.class);
                    // Ensure we always show the other user as user2
                    if (friendship.getUser1().getUserId() == currentUser.getUserId()) {
                        dto.setUser2(modelMapper.map(friendship.getUser2(), UserDTO.class));
                    } else {
                        dto.setUser2(modelMapper.map(friendship.getUser1(), UserDTO.class));
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<FriendshipDTO> getPendingRequests(String email) throws Exception {
        User user = userRepository.findByEmail(email);
        return friendshipRepository.findPendingRequests(user.getUserId())
                .stream()
                .map(friendship -> modelMapper.map(friendship, FriendshipDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<UserDTO> getFriendSuggestions(String email) throws Exception {
        User currentUser = userRepository.findByEmail(email);
        return friendshipRepository.findSuggestions(currentUser.getUserId())
                .stream()
                .filter(user -> !user.getEmail().equals(email)) // Exclude current user
                .map(user -> modelMapper.map(user, UserDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public FriendshipDTO getFriendshipStatus(String email, int targetUserId) throws Exception {
        User currentUser = userRepository.findByEmail(email);
        Optional<Friendship> friendship = friendshipRepository.findByUsers(currentUser.getUserId(), targetUserId);
        return friendship.map(f -> modelMapper.map(f, FriendshipDTO.class)).orElse(null);
    }

    @Override
    public List<FriendshipDTO> getOtherUsersAllFriends(int userId) {
        User currentUser = userRepository.findByUserId(userId);
        return friendshipRepository.findAllFriendships(currentUser.getUserId())
                .stream()
                .map(friendship -> {
                    FriendshipDTO dto = modelMapper.map(friendship, FriendshipDTO.class);
                    // Ensure we always show the other user as user2
                    if (friendship.getUser1().getUserId() == currentUser.getUserId()) {
                        dto.setUser2(modelMapper.map(friendship.getUser2(), UserDTO.class));
                    } else {
                        dto.setUser2(modelMapper.map(friendship.getUser1(), UserDTO.class));
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public FriendshipDTO sendFriendRequest(String senderEmail, int receiverId) throws Exception {
        User sender = userRepository.findByEmail(senderEmail);
        User receiver = userRepository.findByUserId(receiverId);

        if (receiver == null) {
            throw new EntityNotFoundException("User not found");
        }

        if (sender.getUserId() == receiverId) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }

        Optional<Friendship> existingFriendship = friendshipRepository.findByUsers(sender.getUserId(), receiverId);
        if (existingFriendship.isPresent()) {
            throw new IllegalStateException("Friendship already exists");
        }

        Friendship friendship = new Friendship();
        friendship.setId(new FriendshipId(sender.getUserId(), receiverId));
        friendship.setUser1(sender);
        friendship.setUser2(receiver);
        friendship.setStatus(Friendship.FriendshipStatus.PENDING);

        Friendship savedFriendship = friendshipRepository.save(friendship);

        // Send notification
        NotificationDTO notificationDTO = new NotificationDTO();
        notificationDTO.setTitle("New Friend Request!");
        notificationDTO.setContent(sender.getFirstName() + " " + sender.getLastName() + " sent you a friend request.");
        notificationDTO.setType(Notification.NotificationType.FRIEND_REQUEST);
        notificationDTO.setActionUrl("/friend-request");
        notificationDTO.setIsRead(false);
        notificationDTO.setUser(modelMapper.map(receiver, UserDTO.class));
        notificationDTO.setSourceUser(modelMapper.map(sender, UserDTO.class));

        notificationService.createNotification(notificationDTO);

        return modelMapper.map(savedFriendship, FriendshipDTO.class);
    }

    @Override
    public FriendshipDTO acceptFriendRequest(String receiverEmail, int senderId) throws Exception {
        User receiver = userRepository.findByEmail(receiverEmail);
        Optional<Friendship> friendshipOpt = friendshipRepository.findByUsers(senderId, receiver.getUserId());

        Friendship friendship = friendshipOpt.orElseThrow(() ->
                new IllegalStateException("No pending friend request found"));

        if (friendship.getStatus() != Friendship.FriendshipStatus.PENDING) {
            throw new IllegalStateException("Friend request is not pending");
        }

        friendship.setStatus(Friendship.FriendshipStatus.ACCEPTED);
        Friendship savedFriendship = friendshipRepository.save(friendship);
        return modelMapper.map(savedFriendship, FriendshipDTO.class);
    }

    @Override
    public void removeFriendship(String userEmail, int friendId) throws Exception {
        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new EntityNotFoundException("User not found");
        }

        Optional<Friendship> friendship = friendshipRepository.findByUsers(user.getUserId(), friendId);

        if (friendship.isEmpty()) {
            throw new EntityNotFoundException("Friendship not found");
        }

        friendshipRepository.delete(friendship.get());
    }

    @Override
    public FriendshipDTO blockUser(String userEmail, int blockedUserId) throws Exception {
        User user = userRepository.findByEmail(userEmail);
        User blockedUser = userRepository.findByUserId(blockedUserId);

        // Delete existing friendship if it exists
        friendshipRepository.findByUsers(user.getUserId(), blockedUserId)
                .ifPresent(friendship -> friendshipRepository.delete(friendship));

        // Always create a new instance
        Friendship friendship = new Friendship();
        friendship.setId(new FriendshipId(user.getUserId(), blockedUserId));
        friendship.setUser1(user);
        friendship.setUser2(blockedUser);
        friendship.setStatus(Friendship.FriendshipStatus.BLOCKED);

        Friendship savedFriendship = friendshipRepository.save(friendship);
        return modelMapper.map(savedFriendship, FriendshipDTO.class);
    }

    @Override
    public void unblockUser(String userEmail, int blockedUserId) throws Exception {
        User user = userRepository.findByEmail(userEmail);
        Optional<Friendship> friendship = friendshipRepository.findByUsers(user.getUserId(), blockedUserId);

        if (friendship.isEmpty() || friendship.get().getStatus() != Friendship.FriendshipStatus.BLOCKED) {
            throw new IllegalStateException("No blocked relationship found");
        }

        friendshipRepository.delete(friendship.get());
    }

    @Override
    public void declineFriendRequest(String email, int requesterId) throws Exception {
        User currentUser = userRepository.findByEmail(email);
        Optional<Friendship> friendship = friendshipRepository.findByUsers(requesterId, currentUser.getUserId());

        if (friendship.isEmpty()) {
            throw new EntityNotFoundException("Friend request not found");
        }

        Friendship request = friendship.get();
        if (request.getStatus() != Friendship.FriendshipStatus.PENDING) {
            throw new IllegalStateException("Invalid friendship status");
        }

        if (request.getUser2().getUserId() != currentUser.getUserId()) {
            throw new IllegalStateException("Not authorized to decline this request");
        }

        friendshipRepository.delete(request);
    }

    @Override
    public List<UserDTO> getBlockedUsers(String email) {
        User currentUser = userRepository.findByEmail(email);
        if (currentUser == null) {
            throw new EntityNotFoundException("User not found");
        }

        List<Friendship> blockedFriendships = friendshipRepository.findBlockedUsers(currentUser.getUserId());

        return blockedFriendships.stream()
                .map(friendship -> {
                    User blockedUser = friendship.getUser2();
                    return modelMapper.map(blockedUser, UserDTO.class);
                })
                .collect(Collectors.toList());
    }
}