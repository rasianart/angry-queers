-- Volunteer signups table
CREATE TABLE IF NOT EXISTS volunteer_signups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  pronouns VARCHAR(100),
  mobile_number VARCHAR(50),
  has_signal BOOLEAN DEFAULT FALSE,
  signal_username VARCHAR(255),
  neighborhood VARCHAR(255) NOT NULL,
  roles TEXT[] NOT NULL,
  availability JSONB NOT NULL, -- Store as JSON object with day -> timeslot arrays
  trainings_completed TEXT,
  consent_signal BOOLEAN NOT NULL DEFAULT FALSE,
  accessibility_needs TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for searching by neighborhood
CREATE INDEX IF NOT EXISTS idx_volunteer_signups_neighborhood ON volunteer_signups(neighborhood);

-- Create index for created_at
CREATE INDEX IF NOT EXISTS idx_volunteer_signups_created_at ON volunteer_signups(created_at DESC);

