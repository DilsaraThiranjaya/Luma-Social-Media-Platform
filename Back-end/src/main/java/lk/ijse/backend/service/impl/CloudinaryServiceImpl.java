package lk.ijse.backend.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lk.ijse.backend.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {
    private final Cloudinary cloudinary;

    @Override
    public String uploadFile(MultipartFile file, String userId) throws IOException {
        log.info("Uploading file: {}", file.getOriginalFilename());

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

        log.info("Upload result: {}", uploadResult);
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
        log.info("Uploading profile picture for user {}", userId);

        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (!Arrays.asList("image/jpeg", "image/png", "image/webp").contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, or WebP images are allowed");
        }

        // Generate folder structure and public ID
        String folder = String.format("users/%s/profile", userId);
        String publicId = String.format("%s/%d", folder, System.currentTimeMillis());

        // Upload with optimization settings
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "public_id", publicId,
                        "folder", folder,
                        "resource_type", "image",
                        "quality", "auto:good",
                        "width", 200,
                        "height", 200,
                        "crop", "thumb",
                        "gravity", "face",
                        "effect", "improve",
                        "overwrite", false,  // Prevent overwriting existing files
                        "unique_filename", true  // Ensure unique filenames
                )
        );

        log.info("Upload result: {}", uploadResult);
        return (String) uploadResult.get("secure_url");
    }

    @Override
    public String uploadCoverPicture(MultipartFile file, String userId) throws IOException {
        log.info("Uploading cover picture for user {}", userId);

        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (!Arrays.asList("image/jpeg", "image/png", "image/webp").contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, or WebP images are allowed");
        }

        // Generate folder structure and public ID
        String folder = String.format("users/%s/cover", userId);
        String publicId = String.format("%s/%d", folder, System.currentTimeMillis());

        // Upload with optimization settings
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "public_id", publicId,
                        "folder", folder,
                        "resource_type", "image",
                        "quality", "auto:best",
                        "width", 1200,  // Cover photo dimensions
                        "height", 400,
                        "crop", "fill",
                        "gravity", "auto",
                        "effect", "improve",
                        "overwrite", false,
                        "unique_filename", true
                )
        );

        log.info("Upload result: {}", uploadResult);
        return (String) uploadResult.get("secure_url");
    }

    @Override
    public String uploadMedia(MultipartFile file, String mediaType, Integer userId) throws IOException {
        log.info("Uploading {} for user {}", mediaType, userId);

        // Validation
        if (file.isEmpty()) throw new IllegalArgumentException("File cannot be empty");

        String contentType = file.getContentType();
        Map<String, List<String>> allowedTypes = Map.of(
                "IMAGE", List.of("image/jpeg", "image/png", "image/webp"),
                "VIDEO", List.of("video/mp4", "video/quicktime")
        );

        if (!allowedTypes.get(mediaType).contains(contentType)) {
            throw new IllegalArgumentException("Invalid file type for " + mediaType);
        }

        // Size validation
        if (mediaType.equals("IMAGE") && file.getSize() > 20_971_520) { // 20MB
            throw new IllegalArgumentException("Image size exceeds 20MB limit");
        }
        if (mediaType.equals("VIDEO") && file.getSize() > 104_857_600) { // 100MB
            throw new IllegalArgumentException("Video size exceeds 100MB limit");
        }


        // Cloudinary configuration
        String folder = String.format("posts/%s/%s", userId, mediaType.toLowerCase());
        String publicId = String.format("%s/%d", folder, System.currentTimeMillis());

        Map<String, Object> uploadOptions = new HashMap<>();
        uploadOptions.put("public_id", publicId);
        uploadOptions.put("resource_type", mediaType.equals("IMAGE") ? "image" : "video");
        uploadOptions.put("folder", folder);

        if (mediaType.equals("IMAGE")) {
            uploadOptions.put("quality", "auto:best");
            uploadOptions.put("width", 1200);
            uploadOptions.put("height", 800);
            uploadOptions.put("crop", "limit");
        } else {
            uploadOptions.put("format", "mp4");
            uploadOptions.put("quality", "auto:good");
            uploadOptions.put("resource_type", "video");
            uploadOptions.put("chunk_size", 50_000_000);
        }

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadOptions);

        log.info("Upload result: {}", uploadResult);
        return (String) uploadResult.get("secure_url");
    }

    @Override
    public void deleteMedia(String publicUrl) {
        log.info("Deleting media from Cloudinary: {}", publicUrl);

        try {
            // Extract resource type and public ID from URL
            String[] parts = publicUrl.split("/upload/");
            if (parts.length < 2) {
                throw new IllegalArgumentException("Invalid Cloudinary URL");
            }

            // Get the base part containing resource type
            String basePart = parts[0];
            String resourceType = basePart.contains("/video/") ? "video" : "image";

            // Extract public ID from URL
            String publicId = extractPublicId(publicUrl);

            // Delete with resource type and cache invalidation
            Map<String, Object> options = ObjectUtils.asMap(
                    "resource_type", resourceType,
                    "invalidate", true
            );

            cloudinary.uploader().destroy(publicId, options);
            log.info("Deleting media with public ID: {}", publicId);
        } catch (Exception e) {
            log.error("Failed to delete media from Cloudinary", e);
            throw new RuntimeException("Failed to delete media from Cloudinary", e);
        }
    }

    private String extractPublicId(String url) {
        log.info("Extracting public ID from URL: {}", url);

        // Split URL into components
        String[] parts = url.split("/upload/");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid Cloudinary URL format");
        }

        // Get the path after /upload/
        String path = parts[1];

        // Remove potential version prefix (v1234567/)
        if (path.startsWith("v")) {
            path = path.substring(path.indexOf('/') + 1);
        }

        // Remove file extension
        int lastDotIndex = path.lastIndexOf('.');
        if (lastDotIndex != -1) {
            path = path.substring(0, lastDotIndex);
        }

        log.info("Extracted public ID: {}", path);
        return path;
    }
}
