package lk.ijse.backend.service;

import lk.ijse.backend.dto.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface ProfileService {
    UserDTO getProfile(Integer userId);
    UserDTO updateProfile(UserDTO userDTO);
    String uploadProfilePicture(MultipartFile file, Integer userId);
    String uploadCoverPhoto(MultipartFile file, Integer userId);
    PostDTO createPost(PostDTO postDTO);
    CommentDTO addComment(CommentDTO commentDTO);
    PostDTO sharePost(PostShareDTO shareDTO);
    List<UserDTO> getFriends(Integer userId);
    List<PostMediaDTO> getPhotos(Integer userId);
    WorkExperienceDTO addWorkExperience(WorkExperienceDTO workExperienceDTO);
    EducationDTO addEducation(EducationDTO educationDTO);
    EventDTO createEvent(EventDTO eventDTO);
}