package lk.ijse.backend.controller;

import lk.ijse.backend.dto.*;
import lk.ijse.backend.service.AccountService;
import lk.ijse.backend.service.CloudinaryService;
import lk.ijse.backend.service.UserService;
import lk.ijse.backend.util.VarList;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("api/v1/profile")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {
    private final UserService userService;
    private final AccountService accountService;
    private final CloudinaryService cloudinaryService;


    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/profileInfo")
    public ResponseEntity<ResponseDTO> getProfileInfo(Authentication authentication) {
        log.info("Received profile info fetch request for user: {}", authentication.getName());
        try {
            String email = authentication.getName();

            ProfileInfoDTO profileInfoDTO = accountService.getProfileInfo(email);

            if (profileInfoDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            log.info("Successfully retrieved profile info for user: {}", email);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Profile info retrieved", profileInfoDTO));
        } catch (Exception e) {
            log.error("Error retrieving profile info: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ResponseDTO(VarList.Bad_Request, e.getMessage(), null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping(value = "/upload-profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO> uploadProfilePicture(@RequestParam("file") MultipartFile file, @RequestParam("userEmail") String email) {
        log.info("Received request to upload profile picture for user email: {}", email);
        try {
            UserDTO userDTO = userService.loadUserDetailsByEmail(email);
            if (userDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            String imageUrl = cloudinaryService.uploadProfilePicture(file, userDTO.getUserId().toString());

            if (imageUrl != null) {
                userDTO.setProfilePictureUrl(imageUrl);
                int res = userService.updateUser(userDTO);

                if (res == VarList.Created) {
                    log.info("Successfully uploaded profile picture for user email: {}", email);
                    return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Profile picture uploaded successfully", imageUrl));
                }
            }
            log.error("Failed to upload profile picture for user email: {}", email);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Fail to upload profile picture", null));
        } catch (IOException e) {
            log.error("Error uploading profile picture for user email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Fail to upload profile picture", null));
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping(value = "/upload-cover-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO> uploadCoverPhoto(@RequestParam("file") MultipartFile file, @RequestParam("userEmail") String email) {
        log.info("Received request to upload cover picture for user email: {}", email);
        try {
            UserDTO userDTO = userService.loadUserDetailsByEmail(email);
            if (userDTO == null) {
                log.error("User not found for email: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ResponseDTO(VarList.Not_Found, "User Not Found!", null));
            }

            String imageUrl = cloudinaryService.uploadCoverPicture(file, userDTO.getUserId().toString());

            if (imageUrl != null) {
                userDTO.setCoverPhotoUrl(imageUrl);
                int res = userService.updateUser(userDTO);

                if (res == VarList.Created) {
                    log.info("Successfully uploaded cover picture for user email: {}", email);
                    return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Cover picture uploaded successfully", imageUrl));
                }
            }
            log.error("Failed to upload cover picture for user email: {}", email);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Fail to upload cover picture", null));
        } catch (IOException e) {
            log.error("Error uploading cover picture for user email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Fail to upload cover picture", null));
        }
    }

    //    @PreAuthorize("hasAuthority('USER')")
//    @GetMapping(value = "/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> getProfile(@PathVariable Integer userId) {
//        log.info("Received request to get profile for user ID: {}", userId);
//        try {
//            UserDTO userDTO = profileService.getProfile(userId);
//            log.info("Successfully retrieved profile for user ID: {}", userId);
//            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Profile retrieved successfully", userDTO));
//        } catch (Exception e) {
//            log.error("Error retrieving profile for user ID: {}", userId, e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error retrieving profile", e.getMessage()));
//        }
//    }
//
//    @PreAuthorize("hasAuthority('USER')")
//    @PutMapping(value = "/update", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> updateProfile(@Valid @RequestBody UserDTO userDTO) {
//        log.info("Received request to update profile for user ID: {}", userDTO.getUserId());
//        try {
//            UserDTO updatedUser = profileService.updateProfile(userDTO);
//            log.info("Successfully updated profile for user ID: {}", userDTO.getUserId());
//            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Profile updated successfully", updatedUser));
//        } catch (Exception e) {
//            log.error("Error updating profile for user ID: {}", userDTO.getUserId(), e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error updating profile", e.getMessage()));
//        }
//    }

//    @PreAuthorize("hasAuthority('USER')")
//    @PostMapping(value = "/post", consumes = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> createPost(@Valid @RequestBody PostDTO postDTO) {
//        log.info("Received request to create post for user ID: {}", postDTO.getUser().getUserId());
//        try {
//            PostDTO savedPost = profileService.createPost(postDTO);
//            log.info("Successfully created post for user ID: {}", postDTO.getUser().getUserId());
//            return ResponseEntity.status(HttpStatus.CREATED)
//                    .body(new ResponseDTO(VarList.Created, "Post created successfully", savedPost));
//        } catch (Exception e) {
//            log.error("Error creating post for user ID: {}", postDTO.getUser().getUserId(), e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error creating post", e.getMessage()));
//        }
//    }
//
//    @PreAuthorize("hasAuthority('USER')")
//    @PostMapping(value = "/comment", consumes = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> addComment(@Valid @RequestBody CommentDTO commentDTO) {
//        log.info("Received request to add comment for post ID: {}", commentDTO.getPost().getPostId());
//        try {
//            CommentDTO savedComment = profileService.addComment(commentDTO);
//            log.info("Successfully added comment for post ID: {}", commentDTO.getPost().getPostId());
//            return ResponseEntity.status(HttpStatus.CREATED)
//                    .body(new ResponseDTO(VarList.Created, "Comment added successfully", savedComment));
//        } catch (Exception e) {
//            log.error("Error adding comment for post ID: {}", commentDTO.getPost().getPostId(), e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error adding comment", e.getMessage()));
//        }
//    }
//
//    @PreAuthorize("hasAuthority('USER')")
//    @PostMapping(value = "/share", consumes = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> sharePost(@Valid @RequestBody PostShareDTO shareDTO) {
//        log.info("Received request to share post for user ID: {}", shareDTO.getUser().getUserId());
//        try {
//            PostDTO sharedPost = profileService.sharePost(shareDTO);
//            log.info("Successfully shared post for user ID: {}", shareDTO.getUser().getUserId());
//            return ResponseEntity.status(HttpStatus.CREATED)
//                    .body(new ResponseDTO(VarList.Created, "Post shared successfully", sharedPost));
//        } catch (Exception e) {
//            log.error("Error sharing post for user ID: {}", shareDTO.getUser().getUserId(), e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error sharing post", e.getMessage()));
//        }
//    }
//
//    @PreAuthorize("hasAuthority('USER')")
//    @GetMapping(value = "/friends/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> getFriends(@PathVariable Integer userId) {
//        log.info("Received request to get friends for user ID: {}", userId);
//        try {
//            List<UserDTO> friends = profileService.getFriends(userId);
//            log.info("Successfully retrieved friends for user ID: {}", userId);
//            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Friends retrieved successfully", friends));
//        } catch (Exception e) {
//            log.error("Error retrieving friends for user ID: {}", userId, e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error retrieving friends", e.getMessage()));
//        }
//    }
//
//    @PreAuthorize("hasAuthority('USER')")
//    @GetMapping(value = "/photos/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> getPhotos(@PathVariable Integer userId) {
//        log.info("Received request to get photos for user ID: {}", userId);
//        try {
//            List<PostMediaDTO> photos = profileService.getPhotos(userId);
//            log.info("Successfully retrieved photos for user ID: {}", userId);
//            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Photos retrieved successfully", photos));
//        } catch (Exception e) {
//            log.error("Error retrieving photos for user ID: {}", userId, e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error retrieving photos", e.getMessage()));
//        }
//    }
//
//    @PreAuthorize("hasAuthority('USER')")
//    @PostMapping(value = "/work-experience", consumes = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> addWorkExperience(@Valid @RequestBody WorkExperienceDTO workExperienceDTO) {
//        log.info("Received request to add work experience for user ID: {}", workExperienceDTO.getUser().getUserId());
//        try {
//            WorkExperienceDTO savedExperience = profileService.addWorkExperience(workExperienceDTO);
//            log.info("Successfully added work experience for user ID: {}", workExperienceDTO.getUser().getUserId());
//            return ResponseEntity.status(HttpStatus.CREATED)
//                    .body(new ResponseDTO(VarList.Created, "Work experience added successfully", savedExperience));
//        } catch (Exception e) {
//            log.error("Error adding work experience for user ID: {}", workExperienceDTO.getUser().getUserId(), e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error adding work experience", e.getMessage()));
//        }
//    }
//
//    @PreAuthorize("hasAuthority('USER')")
//    @PostMapping(value = "/education", consumes = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> addEducation(@Valid @RequestBody EducationDTO educationDTO) {
//        log.info("Received request to add education for user ID: {}", educationDTO.getUser().getUserId());
//        try {
//            EducationDTO savedEducation = profileService.addEducation(educationDTO);
//            log.info("Successfully added education for user ID: {}", educationDTO.getUser().getUserId());
//            return ResponseEntity.status(HttpStatus.CREATED)
//                    .body(new ResponseDTO(VarList.Created, "Education added successfully", savedEducation));
//        } catch (Exception e) {
//            log.error("Error adding education for user ID: {}", educationDTO.getUser().getUserId(), e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error adding education", e.getMessage()));
//        }
//    }
//
//    @PreAuthorize("hasAuthority('USER')")
//    @PostMapping(value = "/event", consumes = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<ResponseDTO> createEvent(@Valid @RequestBody EventDTO eventDTO) {
//        log.info("Received request to create event for post ID: {}", eventDTO.getPost().getPostId());
//        try {
//            EventDTO savedEvent = profileService.createEvent(eventDTO);
//            log.info("Successfully created event for post ID: {}", eventDTO.getPost().getPostId());
//            return ResponseEntity.status(HttpStatus.CREATED)
//                    .body(new ResponseDTO(VarList.Created, "Event created successfully", savedEvent));
//        } catch (Exception e) {
//            log.error("Error creating event for post ID: {}", eventDTO.getPost().getPostId(), e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body(new ResponseDTO(VarList.Internal_Server_Error, "Error creating event", e.getMessage()));
//        }
//    }
}