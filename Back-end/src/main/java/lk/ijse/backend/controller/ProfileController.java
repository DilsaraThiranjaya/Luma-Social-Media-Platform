package lk.ijse.backend.controller;

import jakarta.validation.Valid;
import lk.ijse.backend.dto.*;
import lk.ijse.backend.service.ProfileService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("api/v1/profile")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {
    private final ProfileService profileService;

    @GetMapping(value = "/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> getProfile(@PathVariable Integer userId) {
        try {
            UserDTO userDTO = profileService.getProfile(userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Profile retrieved successfully", userDTO));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error retrieving profile", e.getMessage()));
        }
    }

    @PutMapping(value = "/update", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> updateProfile(@Valid @RequestBody UserDTO userDTO) {
        try {
            UserDTO updatedUser = profileService.updateProfile(userDTO);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Profile updated successfully", updatedUser));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating profile", e.getMessage()));
        }
    }

    @PostMapping(value = "/upload-profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO> uploadProfilePicture(@RequestParam("file") MultipartFile file, @RequestParam("userId") Integer userId) {
        try {
            String imageUrl = profileService.uploadProfilePicture(file, userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Profile picture uploaded successfully", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error uploading profile picture", e.getMessage()));
        }
    }

    @PostMapping(value = "/upload-cover-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO> uploadCoverPhoto(@RequestParam("file") MultipartFile file, @RequestParam("userId") Integer userId) {
        try {
            String imageUrl = profileService.uploadCoverPhoto(file, userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Cover photo uploaded successfully", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error uploading cover photo", e.getMessage()));
        }
    }

    @PostMapping(value = "/post", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> createPost(@Valid @RequestBody PostDTO postDTO) {
        try {
            PostDTO savedPost = profileService.createPost(postDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ResponseDTO(VarList.Created, "Post created successfully", savedPost));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error creating post", e.getMessage()));
        }
    }

    @PostMapping(value = "/comment", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> addComment(@Valid @RequestBody CommentDTO commentDTO) {
        try {
            CommentDTO savedComment = profileService.addComment(commentDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ResponseDTO(VarList.Created, "Comment added successfully", savedComment));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error adding comment", e.getMessage()));
        }
    }

    @PostMapping(value = "/share", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> sharePost(@Valid @RequestBody PostShareDTO shareDTO) {
        try {
            PostDTO sharedPost = profileService.sharePost(shareDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ResponseDTO(VarList.Created, "Post shared successfully", sharedPost));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error sharing post", e.getMessage()));
        }
    }

    @GetMapping(value = "/friends/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> getFriends(@PathVariable Integer userId) {
        try {
            List<UserDTO> friends = profileService.getFriends(userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friends retrieved successfully", friends));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error retrieving friends", e.getMessage()));
        }
    }

    @GetMapping(value = "/photos/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> getPhotos(@PathVariable Integer userId) {
        try {
            List<PostMediaDTO> photos = profileService.getPhotos(userId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Photos retrieved successfully", photos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error retrieving photos", e.getMessage()));
        }
    }

    @PostMapping(value = "/work-experience", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> addWorkExperience(@Valid @RequestBody WorkExperienceDTO workExperienceDTO) {
        try {
            WorkExperienceDTO savedExperience = profileService.addWorkExperience(workExperienceDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ResponseDTO(VarList.Created, "Work experience added successfully", savedExperience));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error adding work experience", e.getMessage()));
        }
    }

    @PostMapping(value = "/education", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> addEducation(@Valid @RequestBody EducationDTO educationDTO) {
        try {
            EducationDTO savedEducation = profileService.addEducation(educationDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ResponseDTO(VarList.Created, "Education added successfully", savedEducation));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error adding education", e.getMessage()));
        }
    }

    @PostMapping(value = "/event", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResponseDTO> createEvent(@Valid @RequestBody EventDTO eventDTO) {
        try {
            EventDTO savedEvent = profileService.createEvent(eventDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ResponseDTO(VarList.Created, "Event created successfully", savedEvent));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error creating event", e.getMessage()));
        }
    }
}