package lk.ijse.backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface CloudinaryService {
    String uploadFile(MultipartFile file, String userId) throws IOException;

    String uploadProfilePicture(MultipartFile file, String userId) throws IOException;

    String uploadCoverPicture(MultipartFile file, String userId) throws IOException;

    String uploadMedia(MultipartFile file, String mediaType, Integer userId) throws IOException;
}
