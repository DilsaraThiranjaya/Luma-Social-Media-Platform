CREATE DATABASE luma_social;
USE luma_social;

CREATE TABLE users (
                       user_id INT PRIMARY KEY AUTO_INCREMENT,
                       email VARCHAR(100) UNIQUE NOT NULL,
                       password VARCHAR(255) NOT NULL,
                       first_name VARCHAR(50),
                       last_name VARCHAR(50),
                       birthday DATE,
                       gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
                       location VARCHAR(100),
                       phone_number VARCHAR(20),
                       role ENUM('user', 'admin') DEFAULT 'user',
                       status ENUM('active', 'suspended') DEFAULT 'active',
                       profile_picture_url VARCHAR(255),
                       cover_photo_url VARCHAR(255),
                       bio TEXT,
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                       last_login DATETIME,
                       is_online BOOLEAN DEFAULT TRUE,
                       is_profile_public BOOLEAN DEFAULT TRUE,
                       is_display_email BOOLEAN DEFAULT TRUE,
                       is_display_phone BOOLEAN DEFAULT TRUE,
                       is_display_birthdate BOOLEAN DEFAULT TRUE,
                       is_show_activity BOOLEAN DEFAULT TRUE,
                       is_post_public BOOLEAN DEFAULT TRUE,
                       is_share_allowed BOOLEAN DEFAULT TRUE,
                       is_push_new_followers BOOLEAN DEFAULT TRUE,
                       is_push_messages BOOLEAN DEFAULT TRUE,
                       is_push_post_likes BOOLEAN DEFAULT TRUE,
                       is_push_post_comments BOOLEAN DEFAULT TRUE,
                       is_push_post_shares BOOLEAN DEFAULT TRUE,
                       is_push_reports BOOLEAN DEFAULT TRUE,
                       enable_2fa BOOLEAN DEFAULT FALSE
);

CREATE TABLE work_experience (
                                 work_id INT PRIMARY KEY AUTO_INCREMENT,
                                 user_id INT NOT NULL,
                                 company VARCHAR(100) NOT NULL,
                                 job_title VARCHAR(100) NOT NULL,
                                 start_date DATE NOT NULL,
                                 end_date DATE,
                                 description TEXT,
                                 FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE education (
                           education_id INT PRIMARY KEY AUTO_INCREMENT,
                           user_id INT NOT NULL,
                           institution VARCHAR(100) NOT NULL,
                           field_of_study VARCHAR(100) NOT NULL,
                           start_date DATE NOT NULL,
                           end_date DATE,
                           FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE friendships (
                             friendship_id INT PRIMARY KEY AUTO_INCREMENT,
                             user1_id INT NOT NULL,
                             user2_id INT NOT NULL,
                             status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
                             created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                             updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                             FOREIGN KEY (user1_id) REFERENCES users(user_id),
                             FOREIGN KEY (user2_id) REFERENCES users(user_id),
                             CHECK (user1_id < user2_id)
);

CREATE TABLE posts (
                       post_id INT PRIMARY KEY AUTO_INCREMENT,
                       user_id INT NOT NULL,
                       content TEXT NOT NULL,
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                       privacy ENUM('public', 'friends', 'private') DEFAULT 'public',
                       FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE post_media (
                            media_id INT PRIMARY KEY AUTO_INCREMENT,
                            post_id INT NOT NULL,
                            media_url VARCHAR(255) NOT NULL,
                            media_type ENUM('image', 'video') NOT NULL,
                            FOREIGN KEY (post_id) REFERENCES posts(post_id)
);

CREATE TABLE events (
                            event_id INT PRIMARY KEY AUTO_INCREMENT,
                            post_id INT NOT NULL,
                            name VARCHAR(50) NOT NULL,
                            start_date DATE NOT NULL,
                            end_date DATE NOT NULL,
                            location VARCHAR(100),
                            FOREIGN KEY (post_id) REFERENCES posts(post_id)
);

CREATE TABLE reactions (
                           reaction_id INT PRIMARY KEY AUTO_INCREMENT,
                           user_id INT NOT NULL,
                           post_id INT,
                           comment_id INT,
                           type ENUM('like', 'love', 'haha', 'wow', 'sad', 'angry') DEFAULT 'like',
                           created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                           FOREIGN KEY (user_id) REFERENCES users(user_id),
                           FOREIGN KEY (post_id) REFERENCES posts(post_id),
                           FOREIGN KEY (comment_id) REFERENCES comments(comment_id),
                           UNIQUE KEY unique_reaction (user_id, post_id, comment_id)
);

CREATE TABLE comments (
                          comment_id INT PRIMARY KEY AUTO_INCREMENT,
                          user_id INT NOT NULL,
                          post_id INT NOT NULL,
                          content TEXT NOT NULL,
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          parent_comment_id INT,
                          FOREIGN KEY (user_id) REFERENCES users(user_id),
                          FOREIGN KEY (post_id) REFERENCES posts(post_id),
                          FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id)
);

CREATE TABLE chats (
                       chat_id INT PRIMARY KEY AUTO_INCREMENT,
                       type ENUM('private', 'group') DEFAULT 'private',
                       group_name VARCHAR(100),
                       group_image_url VARCHAR(255),
                       created_by INT,
                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                       FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE chat_participants (
                                   chat_id INT NOT NULL,
                                   user_id INT NOT NULL,
                                   joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                   PRIMARY KEY (chat_id, user_id),
                                   FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
                                   FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE messages (
                          message_id INT PRIMARY KEY AUTO_INCREMENT,
                          chat_id INT NOT NULL,
                          sender_id INT NOT NULL,
                          content TEXT,
                          media_type ENUM('image', 'video'),
                          media_url VARCHAR(255),
                          sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          read_at DATETIME,
                          FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
                          FOREIGN KEY (sender_id) REFERENCES users(user_id)
);

CREATE TABLE marketplace_items (
                                   item_id INT PRIMARY KEY AUTO_INCREMENT,
                                   seller_id INT NOT NULL,
                                   title VARCHAR(255) NOT NULL,
                                   description TEXT,
                                   price DECIMAL(10,2) NOT NULL,
                                   category ENUM('electronics', 'clothing', 'furniture', 'books', 'other') DEFAULT 'other',
                                   condition ENUM('new', 'like_new', 'used_good', 'used_fair') DEFAULT 'new',
                                   status ENUM('available', 'pending', 'sold') DEFAULT 'available',
                                   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                   FOREIGN KEY (seller_id) REFERENCES users(user_id)
);

CREATE TABLE marketplace_messages (
                                   mk_msg_id INT PRIMARY KEY AUTO_INCREMENT,
                                   item_id INT NOT NULL,
                                   sender_id INT NOT NULL,
                                   parent_message_id INT,
                                   content TEXT,
                                   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                   FOREIGN KEY (item_id) REFERENCES marketplace_items(item_id),
                                   FOREIGN KEY (sender_id) REFERENCES users(user_id),
                                   FOREIGN KEY (parent_message_id) REFERENCES marketplace_messages(mk_msg_id)
);

CREATE TABLE notifications (
                               notification_id INT PRIMARY KEY AUTO_INCREMENT,
                               user_id INT NOT NULL,
                               type ENUM('friend_request', 'post_reaction', 'comment', 'message', 'share', 'report') NOT NULL,
                               source_user_id INT,
                               post_id INT,
                               comment_id INT,
                               message_id INT,
                               report_id INT,
                               is_read BOOLEAN DEFAULT FALSE,
                               created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                               FOREIGN KEY (user_id) REFERENCES users(user_id),
                               FOREIGN KEY (source_user_id) REFERENCES users(user_id),
                               FOREIGN KEY (post_id) REFERENCES posts(post_id),
                               FOREIGN KEY (comment_id) REFERENCES comments(comment_id),
                               FOREIGN KEY (message_id) REFERENCES messages(message_id),
                               FOREIGN KEY (report_id) REFERENCES reports(report_id)
);

CREATE TABLE reports (
                         report_id INT PRIMARY KEY AUTO_INCREMENT,
                         reporter_id INT NOT NULL,
                         reported_user_id INT,
                         reported_post_id INT,
                         reported_item_id INT,
                         type ENUM('spam', 'harassment', 'inappropriate', 'other') NOT NULL,
                         description TEXT NOT NULL,
                         priority ENUM('high', 'medium', 'low') DEFAULT 'low',
                         status ENUM('pending', 'resolved', 'escalated') DEFAULT 'pending',
                         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                         resolved_at DATETIME,
                         resolved_by INT,
                         resolution_notes TEXT,
                         FOREIGN KEY (reporter_id) REFERENCES users(user_id),
                         FOREIGN KEY (reported_user_id) REFERENCES users(user_id),
                         FOREIGN KEY (reported_post_id) REFERENCES posts(post_id),
                         FOREIGN KEY (reported_item_id) REFERENCES marketplace_items(item_id),
                         FOREIGN KEY (resolved_by) REFERENCES users(user_id)
);

CREATE TABLE admin_actions (
                               action_id INT PRIMARY KEY AUTO_INCREMENT,
                               admin_id INT NOT NULL,
                               action_type ENUM('user_ban', 'post_remove', 'item_remove', 'report_escalation', 'report_resolution') NOT NULL,
                               target_user_id INT,
                               target_post_id INT,
                               target_item_id INT,
                               description TEXT NOT NULL,
                               performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                               FOREIGN KEY (admin_id) REFERENCES users(user_id),
                               FOREIGN KEY (target_user_id) REFERENCES users(user_id),
                               FOREIGN KEY (target_post_id) REFERENCES posts(post_id),
                               FOREIGN KEY (target_item_id) REFERENCES marketplace_items(item_id)
);