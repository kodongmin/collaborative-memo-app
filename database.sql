-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create memos table
CREATE TABLE memos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attachment_key VARCHAR(255)
);

-- Create shared_memos table for memo sharing
CREATE TABLE shared_memos (
    id SERIAL PRIMARY KEY,
    memo_id INTEGER REFERENCES memos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(memo_id, user_id)
);

-- Create user favorites table
CREATE TABLE user_favorites (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    memo_id INTEGER REFERENCES memos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, memo_id)
);

-- Create memo_history table for version control
CREATE TABLE memo_history (
    id SERIAL PRIMARY KEY,
    memo_id INTEGER REFERENCES memos(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add attachment columns to existing memos table if not creating from scratch
ALTER TABLE memos
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at
CREATE TRIGGER update_memos_updated_at
    BEFORE UPDATE ON memos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 