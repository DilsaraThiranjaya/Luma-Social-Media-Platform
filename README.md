# 🌐 LUMA - Modern Social Media Platform

<div align="center">
  <img src="https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/6cc407e43a651eaba868539dbc5c745b16f854af/Front-end/assets/image/Luma-logo.jpeg" 
       alt="LUMA Banner" 
       style="max-width: 100%; height: auto; width: 100px;">
  <br>
  <strong>Connect • Share • Engage</strong>
</div>

## 🚀 Project Overview
**LUMA** is a full-stack social media platform built with **Spring Boot 3.4** and **Java 21**, designed to revolutionize digital interactions. Featuring real-time messaging, dynamic content sharing, and robust security, LUMA offers a modern solution for social networking with over 30+ integrated features.

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
- **Activity Feed**: Personalized content with advanced filtering

### 🛡️ Security & Moderation
- 🚨 Content Reporting System (2 report types)
- 📊 Admin Dashboard with user/content analytics
- 🤖 Automated Moderation Actions (ban, suspend, remove)
- 📈 Activity Logging & Audit Trails

## 🛠️ Technical Stack
- **Backend**: Spring Boot 3.4, Hibernate 6, WebSockets (STOMP)
- **Database**: MySQL 8.0
- **Security**: JWT, Spring Security, OAuth2 (Google)
- **Cloud**: Cloudinary Media Storage, RESTful API
- **Frontend**: Bootstrap 5, JavaScript (ES6+)
- **Tools**: Maven, Lombok, ModelMapper, Swagger UI

## 🗃️ Database Schema Highlights
![Database Schema](https://www.mermaidchart.com/raw/fb8ed486-0f71-4783-96fa-92499ef5b607?theme=dark&version=v0.1&format=svg)

**Core Tables**:
- `users` (25+ fields including privacy controls)
- `posts` (with privacy levels and media support)
- `comments` (supporting nested replies)
- `reactions` (6 distinct interaction types)
- `chats` (group/private with message history)
- `reports` (content flagging with severity tracking)

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
| Page | Screenshot |
|---------|------------|
| Login | ![Login](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/1.png?raw=true) |
| Register | ![Register](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/2.png?raw=true) |
| Forgot Password | ![Forgot Password](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/3.png?raw=true) |
| Admin Access | ![Admin Access](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/4.png?raw=true) |
| Timeline | ![Timeline](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/5.png?raw=true) |
| Friends | ![Friends](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/6.png?raw=true) |
| Messages | ![Messages](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/7.png?raw=true) |
| Notifications | ![Notifications](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/8.png?raw=true) |
| Profile | ![Profile](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/9.png?raw=true) |
| Profile View | ![Profile View](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/10.png?raw=true) |
| Search | ![Search](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/11.png?raw=true) |
| Settings & Privacy | ![Settings & Privacy](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/12.png?raw=true) |
| Dashboard | ![Dashboard](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/13.png?raw=true) |
| Users | ![Users](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/14.png?raw=true) |
| Posts | ![Posts](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/15.png?raw=true) |
| Reports | ![Reports](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/16.png?raw=true) |
| Admin History | ![Admin History](https://github.com/DilsaraThiranjaya/Luma-Social-Media-Platform/blob/fe0dd830b56ec362349521650f6d378e07d8e21f/readme-images/17.png?raw=true) |

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
- Custom UI theme with Bootstrap 5

Interactive Features:
- Emoji picker with 100+ options
- Reaction animations
- Nested comment system

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
- Activity Logging with Custom Logger
- Automated Email Service Integration
- Comprehensive Admin Analytics Dashboard
- Mini-Game Integration (Speed Shifters 2D)

## 🎥 Demo Video
[[YouTube Demo Link]](https://youtu.be/M6UtgESC8C4?si=ok21Omd3DdX86tZ9)

## 👥 Contributors
- Dilsara Thiranjaya
