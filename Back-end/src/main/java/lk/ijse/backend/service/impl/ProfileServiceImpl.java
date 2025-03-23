package lk.ijse.backend.service.impl;

import lk.ijse.backend.dto.*;
import lk.ijse.backend.entity.*;
import lk.ijse.backend.repository.*;
import lk.ijse.backend.service.ProfileService;
import lk.ijse.backend.util.FileUploadUtil;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final WorkExperienceRepository workExperienceRepository;
    private final EducationRepository educationRepository;
    private final EventRepository eventRepository;
    private final FileUploadUtil fileUploadUtil;
    private final ModelMapper modelMapper;

    @Override
    public UserDTO getProfile(Integer userId) {
        User user = userRepository.findById(String.valueOf(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));
        return modelMapper.map(user, UserDTO.class);
    }

    @Override
    public UserDTO updateProfile(UserDTO userDTO) {
        User existingUser = userRepository.findById(String.valueOf(userDTO.getUserId()))
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update user fields
        modelMapper.map(userDTO, existingUser);
        User updatedUser = userRepository.save(existingUser);
        return modelMapper.map(updatedUser, UserDTO.class);
    }

    @Override
    public String uploadProfilePicture(MultipartFile file, Integer userId) {
        User user = userRepository.findById(String.valueOf(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        String imageUrl = fileUploadUtil.uploadFile(file, "profile-pictures");
        user.setProfilePictureUrl(imageUrl);
        userRepository.save(user);

        return imageUrl;
    }

    @Override
    public String uploadCoverPhoto(MultipartFile file, Integer userId) {
        User user = userRepository.findById(String.valueOf(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        String imageUrl = fileUploadUtil.uploadFile(file, "cover-photos");
        user.setCoverPhotoUrl(imageUrl);
        userRepository.save(user);

        return imageUrl;
    }

    @Override
    public PostDTO createPost(PostDTO postDTO) {
        Post post = modelMapper.map(postDTO, Post.class);
        Post savedPost = postRepository.save(post);
        return modelMapper.map(savedPost, PostDTO.class);
    }

    @Override
    public CommentDTO addComment(CommentDTO commentDTO) {
        Comment comment = modelMapper.map(commentDTO, Comment.class);
        Comment savedComment = commentRepository.save(comment);
        return modelMapper.map(savedComment, CommentDTO.class);
    }

    @Override
    public PostDTO sharePost(PostShareDTO shareDTO) {
        Post originalPost = postRepository.findById(shareDTO.getOriginalPostId())
                .orElseThrow(() -> new RuntimeException("Original post not found"));

        Post sharedPost = Post.builder()
                .content(shareDTO.getMessage())
                .privacy(shareDTO.getPrivacy())
                .user(modelMapper.map(shareDTO.getUser(), User.class))
                .build();

        Post savedPost = postRepository.save(sharedPost);
        return modelMapper.map(savedPost, PostDTO.class);
    }

    @Override
    public List<UserDTO> getFriends(Integer userId) {
        User user = userRepository.findById(String.valueOf(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<User> friends = user.getFriendshipsSent().stream()
                .filter(f -> f.getStatus() == Friendship.FriendshipStatus.ACCEPTED)
                .map(Friendship::getUser2)
                .collect(Collectors.toList());

        friends.addAll(user.getFriendshipsReceived().stream()
                .filter(f -> f.getStatus() == Friendship.FriendshipStatus.ACCEPTED)
                .map(Friendship::getUser1)
                .collect(Collectors.toList()));

        return friends.stream()
                .map(friend -> modelMapper.map(friend, UserDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<PostMediaDTO> getPhotos(Integer userId) {
        User user = userRepository.findById(String.valueOf(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getPosts().stream()
                .flatMap(post -> post.getMedia().stream())
                .filter(media -> media.getMediaType() == PostMedia.MediaType.IMAGE)
                .map(media -> modelMapper.map(media, PostMediaDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public WorkExperienceDTO addWorkExperience(WorkExperienceDTO workExperienceDTO) {
        WorkExperience workExperience = modelMapper.map(workExperienceDTO, WorkExperience.class);
        WorkExperience savedExperience = workExperienceRepository.save(workExperience);
        return modelMapper.map(savedExperience, WorkExperienceDTO.class);
    }

    @Override
    public EducationDTO addEducation(EducationDTO educationDTO) {
        Education education = modelMapper.map(educationDTO, Education.class);
        Education savedEducation = educationRepository.save(education);
        return modelMapper.map(savedEducation, EducationDTO.class);
    }

    @Override
    public EventDTO createEvent(EventDTO eventDTO) {
        Event event = modelMapper.map(eventDTO, Event.class);
        Event savedEvent = eventRepository.save(event);
        return modelMapper.map(savedEvent, EventDTO.class);
    }
}