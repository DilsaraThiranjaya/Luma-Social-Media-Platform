package lk.ijse.backend.config;

import com.fasterxml.jackson.core.StreamWriteConstraints;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lk.ijse.backend.dto.EducationDTO;
import lk.ijse.backend.dto.WorkExperienceDTO;
import lk.ijse.backend.entity.Education;
import lk.ijse.backend.entity.WorkExperience;
import lk.ijse.backend.util.EmailSender;
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

}
