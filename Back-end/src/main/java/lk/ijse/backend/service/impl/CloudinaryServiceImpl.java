package lk.ijse.backend.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lk.ijse.backend.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements CloudinaryService {
    private final Cloudinary cloudinary;

    @Override
    public String uploadFile(MultipartFile file, String userId) throws IOException {
        // Sanitize and validate user ID
        String sanitizedUserId = userId.replaceAll("[^a-zA-Z0-9-]", "_");

        // Extract file extension (preserve original format)
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));

        // Generate clean filename without path characters
        String cleanFilename = originalFilename
                .replaceAll("[^\\w.-]", "")
                .replaceAll("^[.]+", "");

        // Cloudinary public ID with /user/id/filename structure
        String publicId = String.format("user/%s/%s",
                sanitizedUserId,
                cleanFilename.replace(extension, ""));

        // Upload with folder structure and original extension
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "public_id", publicId,
                        "resource_type", "auto",
                        "filename_override", cleanFilename,
                        "use_filename", true,
                        "unique_filename", false,
                        "overwrite", false
                )
        );

        // Return URL in /user/id/file format
        return String.format("https://res.cloudinary.com/%s/%s/%s/%s%s",
                cloudinary.config.cloudName,
                "user",
                sanitizedUserId,
                cleanFilename.replace(extension, ""),
                extension);
    }

    @Override
    public String uploadProfilePicture(MultipartFile file, String userId) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (!Arrays.asList("image/jpeg", "image/png", "image/webp").contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, or WebP images are allowed");
        }

        // Generate public ID with email hash for security
        String publicId = "user/" + userId + "/profile-picture" +
                "/" + System.currentTimeMillis();

        // Upload with face detection optimization
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "public_id", publicId,
                        "resource_type", "image",
                        "quality", "auto:good",
                        "width", 200,
                        "height", 200,
                        "crop", "thumb",
                        "gravity", "face",
                        "effect", "improve"
                )
        );

        return (String) uploadResult.get("secure_url");
    }

    @Override
    public String uploadCoverPicture(MultipartFile file, String userId) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (!Arrays.asList("image/jpeg", "image/png", "image/webp").contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, or WebP images are allowed");
        }

        // Generate public ID with email hash for security
        String publicId = "user/" + userId + "/cover-picture" +
                "/" + System.currentTimeMillis();

        // Upload with face detection optimization
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "public_id", publicId,
                        "resource_type", "image",
                        "quality", "auto:good",
                        "crop", "thumb",
                        "gravity", "face",
                        "effect", "improve"
                )
        );

        return (String) uploadResult.get("secure_url");
    }
}
