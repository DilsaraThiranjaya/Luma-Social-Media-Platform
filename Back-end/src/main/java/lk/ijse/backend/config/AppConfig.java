package lk.ijse.backend.config;

import lk.ijse.backend.util.EmailSender;
import lk.ijse.backend.util.FileUploadUtil;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {
    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }

    @Bean
    public EmailSender emailSender() {
        return new EmailSender();
    }

    @Bean
    public FileUploadUtil fileUploadUtil() {
        return new FileUploadUtil();
    }
}
