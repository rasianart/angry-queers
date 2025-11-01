#!/bin/bash

# Database setup script for Angry Queers application
# This script helps set up PostgreSQL database and tables

echo "🗄️  Setting up PostgreSQL database for Angry Queers application..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS: brew services start postgresql"
    echo "   On Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is installed and running"

# Create database if it doesn't exist
echo "📊 Creating database 'noice_map'..."
createdb noice_map 2>/dev/null || echo "Database 'noice_map' already exists"

# Run schema.sql to create tables and insert sample data
echo "📋 Setting up tables and sample data..."
psql -d noice_map -f schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "📝 Database Configuration:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: noice_map"
    echo "   User: postgres"
    echo "   Password: password"
    echo ""
    echo "🔧 Update your backend/.env file with these settings:"
    echo "   DB_HOST=localhost"
    echo "   DB_PORT=5432"
    echo "   DB_NAME=noice_map"
    echo "   DB_USER=postgres"
    echo "   DB_PASSWORD=password"
    echo ""
    echo "🚀 You can now start your backend server!"
else
    echo "❌ Database setup failed. Please check the error messages above."
    exit 1
fi
