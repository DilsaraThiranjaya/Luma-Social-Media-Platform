package lk.ijse.backend.service.impl;

import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    private final UserRepository userRepository;;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Delegate to the default implementation to load the user from the provider
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        // Retrieve the registrationId to know which provider is being used (google, facebook, github)
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // Extract the email from provider-specific attributes
        String email = extractEmail(registrationId, attributes);
        if (email == null || email.isEmpty()) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        String firstName = extractFirstName(registrationId, attributes);
        String lastName = extractLastName(registrationId, attributes);

        // Try to load the user from your internal database by email.
        User user = userRepository.findByEmail(email);
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setRole(User.Role.USER);
            userRepository.save(user);
        }

        // Map internal roles to GrantedAuthority (this example assumes a single ROLE_USER)
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));



        // Return a new DefaultOAuth2User with the authorities and attributes.
        // The third argument ("email") is the key used to access the username.
        return new DefaultOAuth2User(authorities, attributes, "email");
    }

    // Helper method to extract email based on provider
    private String extractEmail(String registrationId, Map<String, Object> attributes) {
        if ("google".equalsIgnoreCase(registrationId)) {
            return (String) attributes.get("email");
        } else if ("facebook".equalsIgnoreCase(registrationId)) {
            return (String) attributes.get("email");
        } else if ("github".equalsIgnoreCase(registrationId)) {
            // GitHub may return email as null if the user has set their email private.
            // You might need an additional API call or use a different attribute.
            return (String) attributes.get("email");
        }
        return null;
    }

    // Helper method to extract first name based on provider
    private String extractFirstName(String registrationId, Map<String, Object> attributes) {
        if ("google".equalsIgnoreCase(registrationId)) {
            return (String) attributes.get("given_name");
        } else if ("facebook".equalsIgnoreCase(registrationId)) {
            return (String) attributes.get("first_name");
        } else if ("github".equalsIgnoreCase(registrationId)) {
            // GitHub may return a full name. If so, we can split it.
            String fullName = (String) attributes.get("name");
            if (fullName != null && !fullName.isEmpty()) {
                String[] parts = fullName.split(" ");
                return parts.length > 0 ? parts[0] : "";
            }
        }
        return "";
    }

    // Helper method to extract last name based on provider
    private String extractLastName(String registrationId, Map<String, Object> attributes) {
        if ("google".equalsIgnoreCase(registrationId)) {
            return (String) attributes.get("family_name");
        } else if ("facebook".equalsIgnoreCase(registrationId)) {
            return (String) attributes.get("last_name");
        } else if ("github".equalsIgnoreCase(registrationId)) {
            String fullName = (String) attributes.get("name");
            if (fullName != null && !fullName.isEmpty()) {
                String[] parts = fullName.split(" ");
                return parts.length > 1 ? parts[parts.length - 1] : "";
            }
        }
        return "";
    }
}
