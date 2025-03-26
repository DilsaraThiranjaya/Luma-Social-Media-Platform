package lk.ijse.backend.service.impl;

import lk.ijse.backend.entity.User;
import lk.ijse.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("OAuth2 authentication request received");

        OAuth2User oAuth2User = super.loadUser(userRequest);
        log.info("OAuth2 user info received: {}", oAuth2User.getAttributes());

        String email = oAuth2User.getAttribute("email");
        String fullName = oAuth2User.getAttribute("name");

        if (email == null) {
            log.error("Email not found in OAuth2 attributes");
            throw new OAuth2AuthenticationException("Email not found in OAuth2 attributes");
        }

        log.info("Processing user with email: {}", email);

        User user = userRepository.findByEmail(email);

        if (user == null) {
            log.info("Creating new user for email: {}", email);

            user = new User();
            user.setEmail(email);
            user.setFirstName(fullName != null ? fullName.split(" ")[0] : "Google");
            user.setLastName(fullName != null && fullName.split(" ").length > 1
                    ? fullName.split(" ")[1] : "User");
            user.setPassword("OAUTH2_USER");
            user.setRole(User.Role.USER);
            user.setStatus(User.Status.ACTIVE);

            user = userRepository.save(user);
            log.info("New user created successfully: {}", user.getEmail());
        } else {
            log.info("Existing user found: {}", user.getEmail());
        }

        Set<GrantedAuthority> authorities = new HashSet<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        log.info("Returning OAuth2User with authorities: {}", authorities);

        return new DefaultOAuth2User(
                authorities,
                oAuth2User.getAttributes(),
                "email"
        );
    }
}
