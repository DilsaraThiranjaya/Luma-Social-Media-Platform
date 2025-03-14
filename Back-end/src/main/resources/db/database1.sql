/*
  # Initial Schema for Social Media Platform

  1. User Management
    - `users` - Core user information
    - `user_profiles` - Extended user profile data
    - `user_settings` - User preferences and settings
    - `user_sessions` - Active user sessions

  2. Social Connections
    - `friendships` - User connections/friends
    - `friend_requests` - Pending friend requests
    - `blocked_users` - Users blocked by other users

  3. Content Management
    - `posts` - User posts/content
    - `post_media` - Media attachments for posts
    - `post_likes` - Post likes/reactions
    - `post_comments` - Comments on posts
    - `post_shares` - Post sharing records

  4. Messaging System
    - `conversations` - Chat conversations
    - `conversation_participants` - Users in conversations
    - `messages` - Chat messages
    - `message_attachments` - Message attachments

  5. Notifications
    - `notifications` - User notifications
    - `notification_types` - Types of notifications

  6. Market/Commerce
    - `market_listings` - Marketplace items
    - `market_categories` - Categories for marketplace
    - `market_favorites` - Saved/favorited listings

  7. Reporting System
    - `reports` - User reports
    - `report_types` - Types of reports
    - `report_status` - Status tracking for reports

  8. Admin Management
    - `admin_users` - Admin user accounts
    - `admin_roles` - Admin role definitions
    - `admin_permissions` - Permission settings
    - `admin_activity_logs` - Admin action logs

  Security:
    - Row Level Security (RLS) enabled on all tables
    - Appropriate policies for data access
    - Secure default values and constraints
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Management

CREATE TABLE users (
                       id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                       email text UNIQUE NOT NULL,
                       encrypted_password text NOT NULL,
                       first_name text NOT NULL,
                       last_name text NOT NULL,
                       username text UNIQUE NOT NULL,
                       created_at timestamptz DEFAULT now(),
                       updated_at timestamptz DEFAULT now(),
                       last_login timestamptz,
                       is_active boolean DEFAULT true,
                       is_verified boolean DEFAULT false
);

CREATE TABLE user_profiles (
                               id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                               user_id uuid REFERENCES users(id) ON DELETE CASCADE,
                               avatar_url text,
                               cover_url text,
                               bio text,
                               location text,
                               birthday date,
                               gender text,
                               phone text,
                               website text,
                               occupation text,
                               education jsonb[],
                               work_experience jsonb[],
                               created_at timestamptz DEFAULT now(),
                               updated_at timestamptz DEFAULT now()
);

CREATE TABLE user_settings (
                               id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                               user_id uuid REFERENCES users(id) ON DELETE CASCADE,
                               notification_preferences jsonb DEFAULT '{}',
                               privacy_settings jsonb DEFAULT '{}',
                               theme_preferences jsonb DEFAULT '{}',
                               language text DEFAULT 'en',
                               created_at timestamptz DEFAULT now(),
                               updated_at timestamptz DEFAULT now()
);

CREATE TABLE user_sessions (
                               id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                               user_id uuid REFERENCES users(id) ON DELETE CASCADE,
                               device_info jsonb,
                               ip_address text,
                               last_active timestamptz DEFAULT now(),
                               created_at timestamptz DEFAULT now(),
                               expires_at timestamptz NOT NULL
);

-- 2. Social Connections

CREATE TABLE friendships (
                             id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                             user_id_1 uuid REFERENCES users(id) ON DELETE CASCADE,
                             user_id_2 uuid REFERENCES users(id) ON DELETE CASCADE,
                             created_at timestamptz DEFAULT now(),
                             UNIQUE(user_id_1, user_id_2)
);

CREATE TABLE friend_requests (
                                 id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
                                 receiver_id uuid REFERENCES users(id) ON DELETE CASCADE,
                                 status text DEFAULT 'pending',
                                 created_at timestamptz DEFAULT now(),
                                 updated_at timestamptz DEFAULT now(),
                                 UNIQUE(sender_id, receiver_id)
);

CREATE TABLE blocked_users (
                               id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                               blocker_id uuid REFERENCES users(id) ON DELETE CASCADE,
                               blocked_id uuid REFERENCES users(id) ON DELETE CASCADE,
                               reason text,
                               created_at timestamptz DEFAULT now(),
                               UNIQUE(blocker_id, blocked_id)
);

-- 3. Content Management

CREATE TABLE posts (
                       id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                       user_id uuid REFERENCES users(id) ON DELETE CASCADE,
                       content text,
                       visibility text DEFAULT 'public',
                       location jsonb,
                       feeling text,
                       created_at timestamptz DEFAULT now(),
                       updated_at timestamptz DEFAULT now(),
                       is_edited boolean DEFAULT false,
                       is_active boolean DEFAULT true
);

CREATE TABLE post_media (
                            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                            post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
                            media_type text NOT NULL,
                            media_url text NOT NULL,
                            thumbnail_url text,
                            created_at timestamptz DEFAULT now()
);

CREATE TABLE post_likes (
                            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                            post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
                            user_id uuid REFERENCES users(id) ON DELETE CASCADE,
                            created_at timestamptz DEFAULT now(),
                            UNIQUE(post_id, user_id)
);

CREATE TABLE post_comments (
                               id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                               post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
                               user_id uuid REFERENCES users(id) ON DELETE CASCADE,
                               content text NOT NULL,
                               parent_comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
                               created_at timestamptz DEFAULT now(),
                               updated_at timestamptz DEFAULT now(),
                               is_edited boolean DEFAULT false
);

CREATE TABLE post_shares (
                             id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                             post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
                             user_id uuid REFERENCES users(id) ON DELETE CASCADE,
                             share_type text DEFAULT 'timeline',
                             created_at timestamptz DEFAULT now()
);

-- 4. Messaging System

CREATE TABLE conversations (
                               id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                               title text,
                               type text DEFAULT 'private',
                               created_at timestamptz DEFAULT now(),
                               updated_at timestamptz DEFAULT now(),
                               last_message_at timestamptz DEFAULT now()
);

CREATE TABLE conversation_participants (
                                           id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                                           conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
                                           user_id uuid REFERENCES users(id) ON DELETE CASCADE,
                                           role text DEFAULT 'member',
                                           joined_at timestamptz DEFAULT now(),
                                           last_read_at timestamptz DEFAULT now(),
                                           UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
                          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                          conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
                          sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
                          content text,
                          type text DEFAULT 'text',
                          created_at timestamptz DEFAULT now(),
                          updated_at timestamptz DEFAULT now(),
                          is_edited boolean DEFAULT false
);

CREATE TABLE message_attachments (
                                     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                                     message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
                                     file_type text NOT NULL,
                                     file_url text NOT NULL,
                                     thumbnail_url text,
                                     created_at timestamptz DEFAULT now()
);

-- 5. Notifications

CREATE TABLE notification_types (
                                    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                                    name text UNIQUE NOT NULL,
                                    description text,
                                    template text NOT NULL,
                                    created_at timestamptz DEFAULT now()
);

CREATE TABLE notifications (
                               id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                               user_id uuid REFERENCES users(id) ON DELETE CASCADE,
                               type_id uuid REFERENCES notification_types(id) ON DELETE CASCADE,
                               data jsonb DEFAULT '{}',
                               is_read boolean DEFAULT false,
                               created_at timestamptz DEFAULT now()
);

-- 6. Market/Commerce

CREATE TABLE market_categories (
                                   id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                                   name text NOT NULL,
                                   description text,
                                   parent_id uuid REFERENCES market_categories(id) ON DELETE SET NULL,
                                   created_at timestamptz DEFAULT now()
);

CREATE TABLE market_listings (
                                 id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                                 seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
                                 category_id uuid REFERENCES market_categories(id) ON DELETE SET NULL,
                                 title text NOT NULL,
                                 description text,
                                 price decimal(10,2) NOT NULL,
                                 currency text DEFAULT 'USD',
                                 condition text,
                                 location jsonb,
                                 status text DEFAULT 'active',
                                 created_at timestamptz DEFAULT now(),
                                 updated_at timestamptz DEFAULT now()
);

CREATE TABLE market_listing_media (
                                      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                                      listing_id uuid REFERENCES market_listings(id) ON DELETE CASCADE,
                                      media_type text NOT NULL,
                                      media_url text NOT NULL,
                                      thumbnail_url text,
                                      created_at timestamptz DEFAULT now()
);

CREATE TABLE market_favorites (
                                  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                                  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
                                  listing_id uuid REFERENCES market_listings(id) ON DELETE CASCADE,
                                  created_at timestamptz DEFAULT now(),
                                  UNIQUE(user_id, listing_id)
);

-- 7. Reporting System

CREATE TABLE report_types (
                              id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                              name text UNIQUE NOT NULL,
                              description text,
                              severity text DEFAULT 'medium',
                              created_at timestamptz DEFAULT now()
);

CREATE TABLE reports (
                         id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                         reporter_id uuid REFERENCES users(id) ON DELETE CASCADE,
                         reported_id uuid REFERENCES users(id) ON DELETE CASCADE,
                         type_id uuid REFERENCES report_types(id) ON DELETE CASCADE,
                         content_type text NOT NULL,
                         content_id uuid NOT NULL,
                         description text,
                         status text DEFAULT 'pending',
                         evidence jsonb DEFAULT '{}',
                         created_at timestamptz DEFAULT now(),
                         updated_at timestamptz DEFAULT now(),
                         resolved_at timestamptz,
                         resolved_by uuid REFERENCES admin_users(id) ON DELETE SET NULL
);

-- 8. Admin Management

CREATE TABLE admin_roles (
                             id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                             name text UNIQUE NOT NULL,
                             description text,
                             permissions jsonb DEFAULT '{}',
                             created_at timestamptz DEFAULT now()
);

CREATE TABLE admin_users (
                             id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                             email text UNIQUE NOT NULL,
                             encrypted_password text NOT NULL,
                             first_name text NOT NULL,
                             last_name text NOT NULL,
                             role_id uuid REFERENCES admin_roles(id) ON DELETE SET NULL,
                             is_active boolean DEFAULT true,
                             created_at timestamptz DEFAULT now(),
                             updated_at timestamptz DEFAULT now(),
                             last_login timestamptz
);

CREATE TABLE admin_activity_logs (
                                     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                                     admin_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
                                     action text NOT NULL,
                                     entity_type text NOT NULL,
                                     entity_id uuid,
                                     details jsonb DEFAULT '{}',
                                     ip_address text,
                                     created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_friendships_user_ids ON friendships(user_id_1, user_id_2);
CREATE INDEX idx_friend_requests_users ON friend_requests(sender_id, receiver_id);
CREATE INDEX idx_blocked_users_ids ON blocked_users(blocker_id, blocked_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_post_media_post_id ON post_media(post_id);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX idx_post_shares_user_id ON post_shares(user_id);
CREATE INDEX idx_conversation_participants_conv_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_market_listings_seller_id ON market_listings(seller_id);
CREATE INDEX idx_market_listings_category_id ON market_listings(category_id);
CREATE INDEX idx_market_favorites_user_id ON market_favorites(user_id);
CREATE INDEX idx_market_favorites_listing_id ON market_favorites(listing_id);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_id ON reports(reported_id);
CREATE INDEX idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);

-- Create RLS Policies
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
                 USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings"
  ON user_settings
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public posts"
  ON posts
  FOR SELECT
                               USING (
                                         visibility = 'public' OR
                                         auth.uid() = user_id OR
                                         EXISTS (
                                         SELECT 1 FROM friendships
                                         WHERE (user_id_1 = auth.uid() AND user_id_2 = posts.user_id)
                                         OR (user_id_2 = auth.uid() AND user_id_1 = posts.user_id)
                                         )
                                     );

-- Add more policies as needed for other tables