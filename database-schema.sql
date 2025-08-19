-- Engagement Farm Database Schema
-- Create these tables in your Neon database

-- Users table to store wallet and Twitter connections
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    twitter_username VARCHAR(50) UNIQUE,
    twitter_id VARCHAR(50) UNIQUE,
    twitter_access_token TEXT,
    twitter_refresh_token TEXT,
    bones INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    referral_code VARCHAR(4) UNIQUE,
    referred_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily tasks table
CREATE TABLE daily_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    short_description TEXT,
    image_url VARCHAR(500),
    task_type VARCHAR(50) NOT NULL, -- 'repost', 'like', 'follow', 'publish_tag', 'comment'
    task_data JSONB, -- Store task-specific data (tweet_id, user_to_follow, hashtag, etc.)
    bones_reward INTEGER DEFAULT 10,
    is_recurrent BOOLEAN DEFAULT false,
    recurrence_type VARCHAR(20) DEFAULT 'single_day', -- 'single_day' | 'daily_repeat' | 'once_until_done'
    scheduled_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(42) NOT NULL, -- admin wallet address
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User task completions
CREATE TABLE user_task_completions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    task_id INTEGER NOT NULL REFERENCES daily_tasks(id),
    completed_at TIMESTAMP DEFAULT NOW(),
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'failed'
    verification_data JSONB, -- Store verification proof
    bones_earned INTEGER DEFAULT 0
);

-- Create unique constraint to prevent duplicate completions per day
CREATE UNIQUE INDEX idx_user_task_daily_completion 
ON user_task_completions (user_id, task_id, DATE(completed_at));

-- Referral rewards audit table
CREATE TABLE referral_rewards (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL REFERENCES users(id),
    referred_user_id INTEGER NOT NULL REFERENCES users(id),
    bones_awarded INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(referrer_id, referred_user_id)
);

-- Leaderboard view (can be materialized for performance)
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    u.id,
    u.wallet_address,
    u.twitter_username,
    u.bones,
    ROW_NUMBER() OVER (ORDER BY u.bones DESC, u.created_at ASC) as rank
FROM users u
WHERE u.twitter_username IS NOT NULL
ORDER BY u.bones DESC, u.created_at ASC;

-- Indexes for better performance
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_twitter ON users(twitter_username);
CREATE INDEX idx_tasks_date ON daily_tasks(scheduled_date);
CREATE INDEX idx_tasks_active ON daily_tasks(is_active);
CREATE INDEX idx_completions_user_task ON user_task_completions(user_id, task_id);
CREATE INDEX idx_completions_date ON user_task_completions(completed_at);

-- Function to update user rank
CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET rank = lb.rank
    FROM leaderboard lb
    WHERE users.id = lb.id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update bones and recalculate ranks
CREATE OR REPLACE FUNCTION update_user_bones()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's total bones
    UPDATE users 
    SET bones = bones + NEW.bones_earned,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Recalculate ranks
    PERFORM update_user_ranks();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bones
    AFTER INSERT OR UPDATE ON user_task_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_bones();

-- Invites table to bulk import referral/invite data
CREATE TABLE IF NOT EXISTS invites (
    id SERIAL PRIMARY KEY,
    external_user_id VARCHAR(100) UNIQUE NOT NULL,
    signup_wallet_address VARCHAR(80),
    user_name VARCHAR(120),
    invited_by_username VARCHAR(120),
    invited_by_signup_address VARCHAR(80),
    created_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invites_ext_user_id ON invites(external_user_id);
