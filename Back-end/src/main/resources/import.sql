INSERT INTO luma_social.user (user_id, bio, birthday, cover_photo_url, email, enable2fa, first_name, gender, is_display_birthdate, is_display_email, is_display_phone, is_online, is_post_public, is_profile_public, is_push_messages, is_push_new_followers, is_push_post_comments, is_push_post_likes, is_push_post_shares, is_push_reports, is_share_allowed, is_show_activity, last_login, last_name, location, password, phone_number, profile_picture_url, role, status) VALUES (1, 'I Am The King Of My Life...!!!', '2001-09-14', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743225119/users/1/cover/users/1/cover/1743225117024.jpg', 'dilsarathiranjaya3@gmail.com', false, 'Dilsara', 'MALE', true, true, true, false, true, true, true, true, true, true, true, true, true, true, '2025-03-29 10:42:01.718631', 'Thiranjaya', 'Baddegama, Sri Lanka', '$2a$10$hvucOIROnmsGvATr4TydyOsvmxNBzs/Dp7SifCmeTYWVP4Rn2pojK', '0766677409', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743225059/users/1/profile/users/1/profile/1743225054014.png', 'ADMIN', 'ACTIVE');
INSERT INTO luma_social.user (user_id, bio, birthday, cover_photo_url, email, enable2fa, first_name, gender, is_display_birthdate, is_display_email, is_display_phone, is_online, is_post_public, is_profile_public, is_push_messages, is_push_new_followers, is_push_post_comments, is_push_post_likes, is_push_post_shares, is_push_reports, is_share_allowed, is_show_activity, last_login, last_name, location, password, phone_number, profile_picture_url, role, status) VALUES (2, null, null, 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743430378/users/2/cover/users/2/cover/1743430374950.jpg', 'dilsarathiranjaya4@gmail.com', false, 'Dilsara', null, true, true, true, false, false, true, false, true, true, true, true, true, true, true, '2025-04-01 18:06:45.965448', 'Thiranjaya', null, '$2a$10$hvucOIROnmsGvATr4TydyOsvmxNBzs/Dp7SifCmeTYWVP4Rn2pojK', null, 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743511004/users/2/profile/users/2/profile/1743511003510.jpg', 'USER', 'ACTIVE');
INSERT INTO luma_social.user (user_id, bio, birthday, cover_photo_url, email, enable2fa, first_name, gender, is_display_birthdate, is_display_email, is_display_phone, is_online, is_post_public, is_profile_public, is_push_messages, is_push_new_followers, is_push_post_comments, is_push_post_likes, is_push_post_shares, is_push_reports, is_share_allowed, is_show_activity, last_login, last_name, location, password, phone_number, profile_picture_url, role, status) VALUES (3, null, null, 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743558682/users/3/cover/users/3/cover/1743558672382.jpg','dilsarathiranjaya2@gmail.com', false, 'Supun', null, true, true, true, false, true, true, true, true, true, true, true, true, true, true, '2025-04-03 09:40:55.913693', 'Maduranga', null, '$2a$10$vcDuE.X51DBaMDm43IOhJuHoWQ8Y3W39w34jWLSAJoAhtqLwKrVcO', null, 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743558719/users/3/profile/users/3/profile/1743558716787.png', 'USER', 'ACTIVE');

INSERT INTO luma_social.work_experience (work_id, company, created_at, description, end_date, job_title, start_date, user_id) VALUES (1, 'SLDK Enterprises', '2025-03-28 20:42:34.273632', '', null, 'Software Engineer', '2025-01-05', 1);

INSERT INTO luma_social.education (education_id, end_date, field_of_study, institution, start_date, user_id) VALUES (3, '2024-03-26', 'A/L Physical Science', 'G/ Richmond College', '2020-03-18', 2);
INSERT INTO luma_social.education (education_id, end_date, field_of_study, institution, start_date, user_id) VALUES (4, '2024-03-26', 'A/L Physical Science', 'G/ Richmond College', '2020-03-18', 1);
INSERT INTO luma_social.education (education_id, end_date, field_of_study, institution, start_date, user_id) VALUES (5, '2020-02-18', 'O/L', 'G/ Christ Church Boy\'s College', '2013-03-07', 1);

INSERT INTO luma_social.post (post_id, content, privacy, status, user_id) VALUES (3, 'Updated my profile picture!',  'PUBLIC', 'ACTIVE', 1);
INSERT INTO luma_social.post (post_id, content, privacy, status, user_id) VALUES (4, 'Updated my cover photo!',  'PUBLIC', 'ACTIVE', 1);
INSERT INTO luma_social.post (post_id, content, privacy, status, user_id) VALUES (7, 'Hii🫡😍',  'PRIVATE', 'ACTIVE', 1);
INSERT INTO luma_social.post (post_id, content, privacy, status, user_id) VALUES (8, 'Boo.. 🤔',  'FRIENDS', 'ACTIVE', 1);
INSERT INTO luma_social.post (post_id, content, privacy, status, user_id) VALUES (9, 'How Are You 😋❤️',  'PUBLIC', 'ACTIVE', 1);
INSERT INTO luma_social.post (post_id, content, privacy, status, user_id) VALUES (11, 'Updated my cover photo!',  'PUBLIC', 'ACTIVE',1);
INSERT INTO luma_social.post (post_id, content, privacy, status, user_id) VALUES (12, 'Updated my profile picture!',  'PUBLIC', 'ACTIVE', 1);
INSERT INTO luma_social.post (post_id, content, privacy, status, user_id) VALUES (13, 'Updated my cover photo!',  'PUBLIC', 'ACTIVE', 1);
INSERT INTO luma_social.post (post_id, content, privacy, status, user_id) VALUES (14, 'Updated my profile picture!',  'PUBLIC', 'ACTIVE', 2);
INSERT INTO luma_social.post (post_id, content, privacy, status, user_id) VALUES (15, 'Updated my cover photo!',  'PUBLIC', 'ACTIVE', 2);
INSERT INTO luma_social.post (post_id, content, privacy, status, user_id) VALUES (16, 'Updated my profile picture!',  'PUBLIC', 'ACTIVE',  2);
INSERT INTO luma_social.post (post_id, content, privacy, status, user_id) VALUES (17, 'Updated my cover photo!',  'PUBLIC', 'ACTIVE', 2);

INSERT INTO luma_social.post_media (media_id, media_type, media_url, post_id) VALUES (3, 'IMAGE', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743225059/users/1/profile/users/1/profile/1743225054014.png', 3);
INSERT INTO luma_social.post_media (media_id, media_type, media_url, post_id) VALUES (4, 'IMAGE', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743225119/users/1/cover/users/1/cover/1743225117024.jpg', 4);
INSERT INTO luma_social.post_media (media_id, media_type, media_url, post_id) VALUES (10, 'IMAGE', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743232645/posts/1/image/posts/1/image/1743232639674.jpg', 9);
INSERT INTO luma_social.post_media (media_id, media_type, media_url, post_id) VALUES (12, 'IMAGE', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743232793/users/1/cover/users/1/cover/1743232785667.jpg', 11);
INSERT INTO luma_social.post_media (media_id, media_type, media_url, post_id) VALUES (13, 'IMAGE', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743232862/users/1/profile/users/1/profile/1743232859524.png', 12);
INSERT INTO luma_social.post_media (media_id, media_type, media_url, post_id) VALUES (14, 'IMAGE', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743232943/users/1/cover/users/1/cover/1743232935031.jpg', 13);
INSERT INTO luma_social.post_media (media_id, media_type, media_url, post_id) VALUES (15, 'IMAGE', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743233037/users/2/profile/users/2/profile/1743233036722.jpg', 14);
INSERT INTO luma_social.post_media (media_id, media_type, media_url, post_id) VALUES (16, 'IMAGE', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743233045/users/2/cover/users/2/cover/1743233045002.jpg', 15);
INSERT INTO luma_social.post_media (media_id, media_type, media_url, post_id) VALUES (17, 'IMAGE', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743234376/users/2/profile/users/2/profile/1743234375832.jpg', 16);
INSERT INTO luma_social.post_media (media_id, media_type, media_url, post_id) VALUES (18, 'IMAGE', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743234391/users/2/cover/users/2/cover/1743234391376.jpg', 17);
INSERT INTO luma_social.post_media (media_id, media_type, media_url, post_id) VALUES (26, 'IMAGE', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743380639/posts/1/image/posts/1/image/1743380634265.jpg', 7);
INSERT INTO luma_social.post_media (media_id, media_type, media_url, post_id) VALUES (27, 'IMAGE', 'https://res.cloudinary.com/dmbxwetlk/image/upload/v1743380642/posts/1/image/posts/1/image/1743380640244.jpg', 7);

INSERT INTO luma_social.reaction (reaction_id, type, post_id, user_id) VALUES (50, 'LIKE', 12, 1);
INSERT INTO luma_social.reaction (reaction_id, type, post_id, user_id) VALUES (52, 'LOVE', 11, 1);
INSERT INTO luma_social.reaction (reaction_id, type, post_id, user_id) VALUES (53, 'WOW', 8, 1);

INSERT INTO luma_social.friendship (user1_id, user2_id, status) VALUES (1, 3, 'ACCEPTED');
INSERT INTO luma_social.friendship (user1_id, user2_id, status) VALUES (2, 1, 'ACCEPTED');
INSERT INTO luma_social.friendship (user1_id, user2_id, status) VALUES (2, 3, 'ACCEPTED');


