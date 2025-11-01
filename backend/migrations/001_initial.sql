-- Create extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (must be created before tables that reference it)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255), -- NULL for Google OAuth users
    google_id VARCHAR(255) UNIQUE, -- Google OAuth ID
    display_name VARCHAR(100),
    avatar_url TEXT,
    auth_provider VARCHAR(20) DEFAULT 'email', -- 'email' or 'google'
    user_type VARCHAR(20) DEFAULT 'basic', -- 'admin' or 'basic'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    organizer VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    max_attendees INTEGER DEFAULT NULL,
    current_attendees INTEGER DEFAULT 0,
    is_virtual BOOLEAN DEFAULT FALSE,
    virtual_link VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Canvas markers table (references users)
CREATE TABLE IF NOT EXISTS canvas_markers (
    id SERIAL PRIMARY KEY,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    canvas_date DATE NOT NULL,
    canvas_time TIME NOT NULL,
    duration_hours INTEGER NOT NULL DEFAULT 2,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create index for canvas_markers created_by
CREATE INDEX IF NOT EXISTS idx_canvas_markers_created_by ON canvas_markers(created_by);


-- Invite links table
CREATE TABLE IF NOT EXISTS invite_links (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT FALSE
);

-- Create indexes for invite_links
CREATE INDEX IF NOT EXISTS idx_invite_links_code ON invite_links(code);
CREATE INDEX IF NOT EXISTS idx_invite_links_used ON invite_links(is_used);


