# 🌐 LUMA - Modern Social Media Platform

<div align="center">
  <img src="https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/6cc407e43a651eaba868539dbc5c745b16f854af/Front-end/assets/image/Luma-logo.jpeg" alt="LUMA Banner">
  <br>
  <strong>Connect • Share • Engage</strong>
</div>

## 🚀 Project Overview
**LUMA** is a full-stack social media platform built with **Spring Boot 3.2** and **Java 17**, designed to revolutionize digital interactions. Featuring real-time messaging, dynamic content sharing, and robust security, LUMA offers a modern solution for social networking with over 30+ integrated features.

## 🌟 Key Features

### 👤 User Management
- 🔒 JWT Authentication & OAuth2 Social Login (Google)
- 👥 Role-Based Access Control (User/Admin)
- 🔐 Comprehensive Privacy Settings
- 🛡️ Two-Factor Authentication (2FA)

### 📱 Core Functionality
- **Post Creation**: Rich text with images/videos (Cloudinary integration)
- **Social Interactions**: 6 Reaction types (❤️ 😲 😠) & nested comments
- **Real-Time Chat**: WebSocket-powered private/group messaging
- **Marketplace**: Buy/Sell items with negotiation system
- **Activity Feed**: Personalized content with advanced filtering

### 🛡️ Security & Moderation
- 🚨 Content Reporting System (4 report types)
- 📊 Admin Dashboard with user/content analytics
- 🤖 Automated Moderation Actions (ban, suspend, remove)
- 📈 Activity Logging & Audit Trails

### 🔔 Enhanced Features
- 📱 Responsive Progressive Web App (PWA)
- 🔔 Real-Time Notifications (WebSocket)
- 🔍 Advanced Search with fuzzy matching
- 📅 Event Creation & RSVP System

## 🛠️ Technical Stack
- **Backend**: Spring Boot 3.2, Hibernate 6, WebSockets (STOMP)
- **Database**: MySQL 8.0 (200+ indexed columns)
- **Security**: JWT, Spring Security, OAuth2 (Google)
- **Cloud**: Cloudinary Media Storage, RESTful API
- **Frontend**: Bootstrap 5, JavaScript (ES6+), Thymeleaf
- **Tools**: Maven, Lombok, ModelMapper, Swagger UI

## 🗃️ Database Schema Highlights
![Database Schema](https://via.placeholder.com/600x400?text=ER+Diagram+Preview)

**Core Tables**:
- `users` (25+ fields including privacy controls)
- `posts` (with privacy levels and media support)
- `comments` (supporting nested replies)
- `reactions` (6 distinct interaction types)
- `chats` (group/private with message history)
- `reports` (automated escalation system)

## ⚙️ Setup Instructions

### Prerequisites
- Java 17+ JDK
- MySQL 8.0+
- Maven 3.8+
- Cloudinary Account (for media storage)

### Installation
1. Clone repository:
   ```bash
   git clone https://github.com/yourusername/luma-social-media.git
   ```

2. Configure application.properties:

   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/luma_social
   spring.datasource.username=root
   spring.datasource.password=yourpassword
   cloudinary.cloud-name=your_cloud_name
   ```

3. Set up OAuth2 credentials for Google login

4. Build and run:

   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

## 📸 Application Preview
| Feature | Screenshot |
|---------|------------|
| News Feed | [Feed] |
| Post Creation | [Post] |
| Real-Time Chat | [Chat] |
| Admin Dashboard | [Admin] |

## 🎥 Demo Video
[Watch Demo]

## 🔐 Security Implementation
```java
// JWT Authentication Flow
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {
    // JWT Filter chain configuration
    // OAuth2 Integration
    // CORS Policies
}

// JWT Token Utility
@Component
public class JwtUtil {
    // Token generation/validation
    // Claims management
}
```

## 🖥️ Frontend Highlights
Key Components:

- Responsive UI: Bootstrap 5 with custom theme
- Real-Time Updates: WebSocket integration

Interactive Features:
- Emoji picker with 1500+ options
- Drag & Drop media uploads
- Reaction animations
- Nested comment system

Modular Components:

```html
<!-- Post Component -->
<div class="post-card">
  <div class="post-header">
    <img :src="user.profilePic" class="profile-img">
    <div class="post-meta">
      <h5>{{ user.name }}</h5>
      <span>{{ formattedDate }}</span>
    </div>
  </div>
  <div class="post-content">
    {{ content }}
    <div class="post-media">
      <img v-for="media in media" :src="media.url">
    </div>
  </div>
  <div class="post-actions">
    <ReactionButton @react="handleReaction"/>
    <CommentButton @click="toggleComments"/>
  </div>
</div>
```

## 📦 Project Structure
```
Luma-Social-Media-Platform/
├── .idea/
├── Back-end/
│   ├── mvn/
│   └── src/
│       ├── main/
│       │   ├── java/
│       │   │   └── lk.ijse.backend/
│       │   │       ├── advisor/
│       │   │       ├── config/
│       │   │       ├── controller/
│       │   │       ├── dto/
│       │   │       ├── entity/
│       │   │       ├── jwtmodels/
│       │   │       ├── repository/
│       │   │       ├── service/
│       │   │       ├── util/
│       │   │       └── BackEndApplication.java
│       │   └── resources/
│       │       ├── db/
│       │       ├── application.properties
│       │       ├── banner.txt
│       │       ├── import.sql
│       │       └── logback-spring.xml
│       └── test/
├── Front-end/
│   ├── assets/
│   │   ├── css/
│   │   ├── image/
│   │   └── js/
│   ├── games/
│   │   ├── assets/
│   │   └── speed-shifters-2d.html
│   ├── pages/
│   │   ├── admin/
│   │   ├── forgot-password.html
│   │   ├── friends.html
│   │   ├── login.html
│   │   ├── market.html
│   │   ├── messages.html
│   │   ├── notifications.html
│   │   ├── profile.html
│   │   ├── profile-view.html
│   │   ├── register.html
│   │   ├── settings.html
│   │   └── timeline.html
│   ├── Front-end.iml
│   └── index.html
└── README.md
```

## 🚨 Advanced Features
- Real-Time Notifications using WebSockets
- Activity Logging with Custom Logger
- Automated Email Service Integration
- Comprehensive Admin Analytics Dashboard
- Marketplace with Negotiation System
- Mini-Game Integration (Speed Shifters 2D)

## 👥 Contributors
- Your Name

## 📄 License
MIT License - See LICENSE for details
