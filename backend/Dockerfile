FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for database migrations)
RUN npm install --no-audit --no-fund

# Copy application code (including migrations)
COPY . .

# Expose port
EXPOSE 5002

# Start the application with migrations
CMD ["sh", "-c", "npm run migrate && node server.js"]

