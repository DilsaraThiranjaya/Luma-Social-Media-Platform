package lk.ijse.backend.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Component
public class FileUploadUtil {

    @Value("${file.upload.base-path:uploads}")
    private String basePath;

    @Value("${file.upload.base-url:http://localhost:8080/uploads}")
    private String baseUrl;

    /**
     * Uploads a file to the specified directory and returns the URL for accessing it
     *
     * @param file The file to upload
     * @param directory The subdirectory to place the file in (e.g., "profile-pictures", "cover-photos")
     * @return The URL to access the uploaded file
     */
    public String uploadFile(MultipartFile file, String directory) {
        if (file.isEmpty()) {
            throw new RuntimeException("Failed to upload empty file");
        }

        try {
            // Create a unique file name
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";

            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String uniqueFilename = UUID.randomUUID().toString() + "-" + timestamp + fileExtension;

            // Ensure directory exists
            Path targetDirectory = Paths.get(basePath, directory);
            if (!Files.exists(targetDirectory)) {
                Files.createDirectories(targetDirectory);
            }

            // Save the file
            Path targetPath = targetDirectory.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Return the URL
            return baseUrl + "/" + directory + "/" + uniqueFilename;

        } catch (IOException ex) {
            throw new RuntimeException("Failed to upload file: " + ex.getMessage(), ex);
        }
    }

    /**
     * Deletes a file from the server given its URL
     *
     * @param fileUrl The URL of the file to delete
     * @return true if deletion was successful, false otherwise
     */
    public boolean deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty() || !fileUrl.startsWith(baseUrl)) {
            return false;
        }

        try {
            // Extract the file path from the URL
            String relativePath = fileUrl.substring(baseUrl.length());
            Path filePath = Paths.get(basePath, relativePath);

            // Delete the file
            return Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new RuntimeException("Failed to delete file: " + ex.getMessage(), ex);
        }
    }

    /**
     * Updates an existing file with a new one, and deletes the old file
     *
     * @param oldFileUrl The URL of the existing file
     * @param newFile The new file to upload
     * @param directory The directory to place the new file in
     * @return The URL of the newly uploaded file
     */
    public String updateFile(String oldFileUrl, MultipartFile newFile, String directory) {
        // Upload the new file
        String newFileUrl = uploadFile(newFile, directory);

        // Delete the old file if it exists
        if (oldFileUrl != null && !oldFileUrl.isEmpty()) {
            deleteFile(oldFileUrl);
        }

        return newFileUrl;
    }
}