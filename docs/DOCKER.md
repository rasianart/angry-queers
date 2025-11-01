# Docker Setup for Angry Queers

This document explains how to run the Angry Queers application using Docker.

## Prerequisites

- Docker Desktop installed (or Docker Engine + Docker Compose)
- Minimum 4GB RAM allocated to Docker
- Ports 3001, 5002, and 5433 available

## Quick Start

### 1. Build and Start All Services

```bash
docker-compose up --build
```

This will:

- Start PostgreSQL database on port 5433
- Build and start the backend on port 5002
- Build and start the frontend on port 3001

### 2. Access the Application

- Frontend: http://localhost:3001
- Backend API: http://localhost:5002
- Database: localhost:5433

### 3. Stop All Services

```bash
docker-compose down
```

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following:

```env
# Database Configuration
DB_HOST=postgres
DB_USER=noice
DB_PASSWORD=noice
DB_NAME=noice
DB_PORT=5432

# Server Configuration
PORT=5002

# Google Maps API
GOOGLE_MAPS_API_KEY=your_key_here

# Instagram API (Optional)
INSTAGRAM_ACCESS_TOKEN=your_token
INSTAGRAM_USER_ID=your_user_id

# Bluesky API (Optional)
BLUESKY_USERNAME=your_username
BLUESKY_PASSWORD=your_password
```

### Using Environment Variables in Docker Compose

You can either:

1. Set environment variables in the `docker-compose.yml` file
2. Use a `.env` file (recommended for sensitive data)
3. Pass them via command line when running docker-compose

## Database Setup

The database will be automatically created when the postgres container starts. The database schema will be created by the backend application on first connection.

### Running Database Migrations

If you need to run additional database setup:

```bash
# Connect to the database container
docker-compose exec postgres psql -U noice -d noice

# Or run a specific migration
docker-compose exec backend npm run migrate
```

## Development Mode

For development with hot-reload, use the development compose file:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This will:

- Mount local code directories for live updates
- Enable nodemon for automatic restarts
- Use development-friendly logging

## Building Individual Services

### Backend Only

```bash
cd backend
docker build -t angryqueers-backend .
docker run -p 5002:5002 --env-file .env angryqueers-backend
```

### Frontend Only

```bash
cd frontend
docker build -t angryqueers-frontend .
docker run -p 3001:80 angryqueers-frontend
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

1. Find and stop the conflicting process:

   ```bash
   lsof -i :5002  # For backend
   lsof -i :3001  # For frontend
   lsof -i :5433  # For database
   ```

2. Or change the ports in `docker-compose.yml`

### Database Connection Issues

If the backend can't connect to the database:

1. Check that the postgres service is healthy:

   ```bash
   docker-compose ps
   ```

2. Check database logs:

   ```bash
   docker-compose logs postgres
   ```

3. Verify environment variables in `docker-compose.yml`

### Frontend Not Loading

1. Check that the backend is running:

   ```bash
   docker-compose ps backend
   ```

2. Check backend logs:

   ```bash
   docker-compose logs backend
   ```

3. Verify the nginx configuration in `frontend/nginx.conf`

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Cleaning Up

Remove all containers, volumes, and networks:

```bash
docker-compose down -v
```

This will delete the database data. Use with caution!

## Production Deployment

For production, you'll want to:

1. Use environment-specific configurations
2. Set up SSL/TLS certificates
3. Use a reverse proxy (nginx or traefik)
4. Configure backups for the database
5. Set up monitoring and logging

Example production docker-compose:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Database Backups

### Create a Backup

```bash
docker-compose exec postgres pg_dump -U noice noice > backup.sql
```

### Restore from Backup

```bash
cat backup.sql | docker-compose exec -T postgres psql -U noice noice
```

## Useful Commands

```bash
# Rebuild specific service
docker-compose build backend

# Restart specific service
docker-compose restart backend

# Execute command in container
docker-compose exec backend npm install

# Shell into container
docker-compose exec backend sh

# Check container status
docker-compose ps

# View resource usage
docker stats
```

## Security Notes

- Never commit `.env` files or include sensitive data in docker-compose.yml
- Use Docker secrets for production deployments
- Regularly update base images
- Use specific versions instead of `latest` tag
- Enable Docker security scanning
