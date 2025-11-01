-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  amount INTEGER NOT NULL, -- Amount in dollars
  email VARCHAR(255) NOT NULL,
  donor_name VARCHAR(255) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'card',
  payment_status VARCHAR(50) DEFAULT 'completed',
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for searching by email
CREATE INDEX IF NOT EXISTS idx_donations_email ON donations(email);

-- Create index for created_at
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);

-- Create index for payment status
CREATE INDEX IF NOT EXISTS idx_donations_payment_status ON donations(payment_status);

