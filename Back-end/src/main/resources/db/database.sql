CREATE DATABASE luma_social;
USE luma_social;

-- Users Table (Authentication & Core User Data)
CREATE TABLE users (
                       id INT PRIMARY KEY AUTO_INCREMENT,
                       username VARCHAR(50) UNIQUE NOT NULL,
                       email VARCHAR(100) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
                       status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                       last_login DATETIME,
                       is_email_verified BOOLEAN DEFAULT FALSE,
                       verification_token VARCHAR(255),
                       token_expires DATETIME
);

-- User Profiles
CREATE TABLE profiles (
                          user_id INT PRIMARY KEY,
                          first_name VARCHAR(50),
                          last_name VARCHAR(50),
                          bio TEXT,
                          profile_pic VARCHAR(255),
                          cover_pic VARCHAR(255),
                          location VARCHAR(100),
                          website VARCHAR(255),
                          birthday DATE,
                          gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
                          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Social Connections
CREATE TABLE friends (
                         id INT PRIMARY KEY AUTO_INCREMENT,
                         user1_id INT NOT NULL,
                         user2_id INT NOT NULL,
                         status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
                         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                         FOREIGN KEY (user1_id) REFERENCES users(id),
                         FOREIGN KEY (user2_id) REFERENCES users(id),
                         CHECK (user1_id < user2_id),
                         UNIQUE KEY unique_friendship (user1_id, user2_id)
);

-- Posts
CREATE TABLE posts (
                       id INT PRIMARY KEY AUTO_INCREMENT,
                       user_id INT NOT NULL,
                       content TEXT NOT NULL,
                       privacy ENUM('public', 'friends', 'private') DEFAULT 'public',
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Post Media
CREATE TABLE media (
                       id INT PRIMARY KEY AUTO_INCREMENT,
                       post_id INT NOT NULL,
                       media_type ENUM('image', 'video', 'file') NOT NULL,
                       file_path VARCHAR(255) NOT NULL,
                       thumbnail_path VARCHAR(255),
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                       FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Interactions
CREATE TABLE reactions (
                           id INT PRIMARY KEY AUTO_INCREMENT,
                           user_id INT NOT NULL,
                           post_id INT NOT NULL,
                           type ENUM('like', 'love', 'haha', 'wow', 'sad', 'angry') DEFAULT 'like',
                           created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                           FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                           UNIQUE KEY unique_reaction (user_id, post_id)
);

CREATE TABLE comments (
                          id INT PRIMARY KEY AUTO_INCREMENT,
                          user_id INT NOT NULL,
                          post_id INT NOT NULL,
                          content TEXT NOT NULL,
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          parent_comment_id INT,
                          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                          FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Messaging System
CREATE TABLE chats (
                       id INT PRIMARY KEY AUTO_INCREMENT,
                       chat_type ENUM('private', 'group') DEFAULT 'private',
                       group_name VARCHAR(100),
                       group_image VARCHAR(255),
                       created_by INT,
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                       FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE chat_participants (
                                   chat_id INT NOT NULL,
                                   user_id INT NOT NULL,
                                   joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                   PRIMARY KEY (chat_id, user_id),
                                   FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
                                   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
                          id INT PRIMARY KEY AUTO_INCREMENT,
                          chat_id INT NOT NULL,
                          sender_id INT NOT NULL,
                          content TEXT,
                          media_path VARCHAR(255),
                          sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          read_at DATETIME,
                          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
                          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Marketplace
CREATE TABLE marketplace_items (
                                   id INT PRIMARY KEY AUTO_INCREMENT,
                                   seller_id INT NOT NULL,
                                   title VARCHAR(255) NOT NULL,
                                   description TEXT,
                                   price DECIMAL(10,2) NOT NULL,
                                   category ENUM('electronics', 'clothing', 'furniture', 'books', 'other') DEFAULT 'other',
                                   condition ENUM('new', 'like_new', 'used_good', 'used_fair') DEFAULT 'new',
                                   status ENUM('available', 'pending', 'sold') DEFAULT 'available',
                                   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                   FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE notifications (
                               id INT PRIMARY KEY AUTO_INCREMENT,
                               user_id INT NOT NULL,
                               type ENUM('friend_request', 'post_reaction', 'comment', 'message', 'marketplace', 'system') NOT NULL,
                               message TEXT NOT NULL,
                               related_id INT,
                               is_read BOOLEAN DEFAULT FALSE,
                               created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                               FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reports System
CREATE TABLE reports (
                         id INT PRIMARY KEY AUTO_INCREMENT,
                         reporter_id INT NOT NULL,
                         reported_user_id INT,
                         reported_post_id INT,
                         reported_comment_id INT,
                         reported_item_id INT,
                         reason TEXT NOT NULL,
                         status ENUM('pending', 'under_review', 'resolved', 'dismissed') DEFAULT 'pending',
                         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                         resolved_at DATETIME,
                         resolved_by INT,
                         resolution_notes TEXT,
                         FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
                         FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
                         FOREIGN KEY (reported_post_id) REFERENCES posts(id) ON DELETE SET NULL,
                         FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Security & Maintenance
CREATE TABLE password_resets (
                                 id INT PRIMARY KEY AUTO_INCREMENT,
                                 user_id INT NOT NULL,
                                 token VARCHAR(255) NOT NULL,
                                 expires_at DATETIME NOT NULL,
                                 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE admin_actions (
                               id INT PRIMARY KEY AUTO_INCREMENT,
                               admin_id INT NOT NULL,
                               action_type ENUM('user_ban', 'post_remove', 'comment_remove', 'warning_issued', 'report_resolution') NOT NULL,
                               target_user_id INT,
                               target_post_id INT,
                               target_comment_id INT,
                               description TEXT NOT NULL,
                               performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                               FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_reactions_post ON reactions(post_id);
CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_marketplace_seller ON marketplace_items(seller_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);