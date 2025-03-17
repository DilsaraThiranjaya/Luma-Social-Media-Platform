package lk.ijse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name = "user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int userId;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String firstName;
    private String lastName;
    private LocalDate birthday;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private String location;
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE;

    private String profilePictureUrl;
    private String coverPhotoUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @CreationTimestamp
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime lastLogin;

    @Builder.Default
    private Boolean isOnline = false;
    @Builder.Default
    private Boolean isProfilePublic = true;
    @Builder.Default
    private Boolean isDisplayEmail = true;
    @Builder.Default
    private Boolean isDisplayPhone = true;
    @Builder.Default
    private Boolean isDisplayBirthdate = true;
    @Builder.Default
    private Boolean isShowActivity = true;
    @Builder.Default
    private Boolean isPostPublic = true;
    @Builder.Default
    private Boolean isShareAllowed = true;
    @Builder.Default
    private Boolean isPushNewFollowers = true;
    @Builder.Default
    private Boolean isPushMessages = true;
    @Builder.Default
    private Boolean isPushPostLikes = true;
    @Builder.Default
    private Boolean isPushPostComments = true;
    @Builder.Default
    private Boolean isPushPostShares = true;
    @Builder.Default
    private Boolean isPushReports = true;
    @Builder.Default
    private Boolean enable2fa = false;


    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<WorkExperience> workExperiences = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Education> educations = new ArrayList<>();

    @OneToMany(mappedBy = "user1", cascade = CascadeType.ALL)
    private List<Friendship> friendshipsSent = new ArrayList<>();

    @OneToMany(mappedBy = "user2", cascade = CascadeType.ALL)
    private List<Friendship> friendshipsReceived = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Post> posts = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Reaction> reactions = new ArrayList<>();

    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL)
    private List<Chat> chats = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<ChatParticipant> chatParticipants = new ArrayList<>();

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL)
    private List<Message> messages = new ArrayList<>();

    @OneToMany(mappedBy = "seller", cascade = CascadeType.ALL)
    private List<MarketplaceItem> marketplaceItems = new ArrayList<>();

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL)
    private List<MarketplaceMessage> marketplaceMessages = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Notification> notifications = new ArrayList<>();

    @OneToMany(mappedBy = "sourceUser", cascade = CascadeType.ALL)
    private List<Notification> causedNotifications = new ArrayList<>();

    @OneToMany(mappedBy = "reporter", cascade = CascadeType.ALL)
    private List<Report> reports = new ArrayList<>();

    @OneToMany(mappedBy = "reportedUser", cascade = CascadeType.ALL)
    private List<Report> reported = new ArrayList<>();

    @OneToMany(mappedBy = "resolvedBy", cascade = CascadeType.ALL)
    private List<Report> resolved = new ArrayList<>();

    @OneToMany(mappedBy = "admin", cascade = CascadeType.ALL)
    private List<AdminAction> adminActions = new ArrayList<>();

    @OneToMany(mappedBy = "targetUser", cascade = CascadeType.ALL)
    private List<AdminAction> causedAdminActions = new ArrayList<>();


    public enum Gender { MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY }
    public enum Role { USER, ADMIN }
    public enum Status { ACTIVE, SUSPENDED }
}
