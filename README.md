# Angry Queers: Resource Organization & Outreach Toolkit

## About Angry Queers

Angry Queers is a comprehensive community resource and mutual aid network platform designed to help Chicago communities build strong networks of care and protection. It provides tools for resource mapping, route safety planning, community organizing, event coordination, and social connection.

## Features

- **Resource Mapping**: Discover and map community organizations, mutual aid groups, and support services
- **Community Networks**: Rate and view community care practices at locations
- **Route Safety Planning**: Plan safe routes that avoid areas with known enforcement activity
- **Canvas Planning**: Coordinate neighborhood outreach and canvassing efforts
- **Event Management**: Find and organize mutual aid events and community gatherings
- **Social Feeds**: Stay connected with community updates from trusted sources

## Project Structure

```
angryqueers/
├── backend/
│   ├── package.json
│   ├── server.js              # Main backend server
│   ├── Dockerfile             # Production Docker image
│   ├── Dockerfile.dev         # Development Docker image
│   ├── migrations/            # Database migration files
│   ├── config/                # Database and service configuration
│   ├── services/              # Backend services (Bluesky, etc.)
│   └── .env                   # Environment variables (create from example)
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile             # Production Docker image
│   ├── Dockerfile.dev         # Development Docker image
│   ├── nginx.conf             # Nginx configuration for production
│   ├── index.html
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── features/          # Feature-specific components (Events, Canvas, etc.)
│   │   ├── contexts/          # React contexts (Auth, etc.)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── .env                   # Frontend environment variables
├── docker-compose.dev.yml     # Docker Compose for local development
├── docker-compose.yml         # Docker Compose for production
├── package.json
└── README.md
```

## Prerequisites

- **Docker** and **Docker Compose** (recommended for local development)
  - Install from [Docker Desktop](https://www.docker.com/products/docker-desktop/) or via package manager
- OR **Node.js** (v18 or higher) if running without Docker
- **npm** or **yarn**
- **Google Maps API Key** with the following APIs enabled:
  - Maps JavaScript API
  - Places API (for autocomplete)
  - Directions API (for route planning)
  - Geocoding API
- **PostgreSQL** (if not using Docker - included in Docker setup)
- **Google OAuth Credentials** (optional, for authentication)

## Getting Started

### Option 1: Docker Setup (Recommended)

This is the easiest way to get everything running locally with all dependencies.

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd angryqueers
```

#### 2. Set Up Environment Variables

Create a `backend/.env` file with the following:

```bash
# Database Configuration (for Docker, DB_HOST should be 'postgres')
DB_HOST=postgres
DB_PORT=5432
DB_NAME=angry_queers
DB_USER=angry_queers_user
DB_PASSWORD=your_secure_password_here

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Secret (generate a strong random string)
JWT_SECRET=your_jwt_secret_key_here

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Google OAuth (optional, for authentication)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Super Admin Emails (comma-separated)
SUPERADMIN=your-email@gmail.com,another-admin@example.com

# ClamAV Configuration (optional, for virus scanning)
CLAMAV_HOST=clamav
CLAMAV_PORT=3311
SKIP_CLAMAV_ON_FAIL=true
```

Create a `frontend/.env` file:

```bash
# Optional: Super admin emails for frontend checks
VITE_SUPERADMIN=your-email@gmail.com,another-admin@example.com
```

#### 3. Get API Keys

1. **Google Maps API Key**:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable these APIs:
     - Maps JavaScript API
     - Places API
     - Directions API
     - Geocoding API
   - Create credentials (API Key)
   - Copy the API key to `backend/.env`

2. **Google OAuth** (optional, for authentication):
   - In Google Cloud Console, go to "APIs & Services" > "Credentials"
   - Create OAuth 2.0 Client ID
   - Set authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
   - Copy Client ID and Client Secret to `backend/.env`

#### 4. Start Docker Containers

```bash
# Start all services (PostgreSQL, Backend, Frontend, ClamAV)
npm run docker:up

# OR to restart all services
npm run docker:restart
```

This will start:

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001
- **PostgreSQL**: localhost:5432
- **ClamAV**: localhost:3310 (optional, for virus scanning)

The backend will automatically run database migrations on first start.

#### 5. View Logs

```bash
# View backend logs
docker logs -f angryqueers-backend-dev

# View frontend logs
docker logs -f angryqueers-frontend-dev

# View database logs
docker logs -f angryqueers-db-dev
```

#### 6. Stop Services

```bash
# Stop all containers
npm run docker:down

# Remove volumes (clears database data)
docker-compose -f docker-compose.dev.yml down -v
```

### Option 2: Manual Setup (Without Docker)

#### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd angryqueers

# Install all dependencies
npm run install-all
```

#### 2. Set Up PostgreSQL Database

Install PostgreSQL locally and create a database:

```bash
# Create database and user
createdb angry_queers
# Or via psql:
# CREATE DATABASE angry_queers;
# CREATE USER angry_queers_user WITH PASSWORD 'your_password';
```

#### 3. Set Up Environment Variables

Create `backend/.env`:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=angry_queers
DB_USER=angry_queers_user
DB_PASSWORD=your_password

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Super Admin Emails
SUPERADMIN=your-email@gmail.com
```

Create `frontend/.env`:

```bash
# Optional: Super admin emails
VITE_SUPERADMIN=your-email@gmail.com
```

#### 4. Run Database Migrations

```bash
cd backend
npm run migrate
```

#### 5. Run the Application

```bash
# Run both frontend and backend concurrently
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

This will start:

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:5001

## Available Scripts

### Root Level

- `npm run dev` - Run both frontend and backend concurrently (without Docker)
- `npm run server` - Run backend server only
- `npm run client` - Run frontend development server only
- `npm run install-all` - Install dependencies for all projects
- `npm run build` - Build frontend for production
- `npm run docker:up` - Start all Docker containers
- `npm run docker:down` - Stop all Docker containers
- `npm run docker:restart` - Restart all Docker containers

### Backend

- `npm run start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoints

### Public Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/google-maps-key` - Get Google Maps API key (proxied to frontend)
- `GET /api/events` - Get all events
- `GET /api/resources` - Get all resources
- `GET /api/bluesky-feed` - Get Bluesky social feed
- `GET /api/ice-activity` - Get ICE activity data for route planning

### Authenticated Endpoints

- `POST /api/auth/register` - Register new user (requires invite code)
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/me` - Get current user info
- `POST /api/canvas-markers` - Create canvas marker (requires auth)
- `GET /api/canvas-markers` - Get canvas markers (requires auth)
- `DELETE /api/canvas-markers/:id` - Delete canvas marker (admin only)
- `POST /api/ice-alerts` - Submit ICE alert (requires auth)
- `POST /api/alert/upload` - Upload alert image (requires auth)
- `POST /api/events` - Create event (admin only)
- `POST /api/safety-ratings` - Submit safety rating (requires auth)

### Admin Endpoints

- `GET /api/admin/users` - Get all users (super admin only)
- `PATCH /api/admin/users/:userId` - Update user type (super admin only)

## Google Maps Component

The `GoogleMap` component is located in `frontend/src/components/GoogleMap.jsx` and includes:

- Interactive map display
- Customizable center and zoom
- Marker placement
- Error handling
- Loading states

### Usage Example

```jsx
import GoogleMap from './components/GoogleMap';

<GoogleMap
  apiKey="your-api-key"
  center={{ lat: 37.derive9, lng: -122.4194 }}
  zoom={12}
/>
```

## Development

### Adding New Features

1. **Backend**: Add new routes in `backend/server.js`
2. **Frontend**: Add new components in `frontend/src/components/`
3. **Styling**: Modify CSS files or add new stylesheets

### Environment Variables

- Backend uses `dotenv` for environment variables
- Frontend uses Vite's environment variable system (prefixed with `VITE_`)

## Production Deployment

1. Build the frontend:

   ```bash
   npm run build
   ```

2. Set `NODE_ENV=production` in your backend `.env` file

3. Start the production server:
   ```bash
   cd backend
   npm start
   ```

## Troubleshooting

### Docker Issues

- **Containers won't start**: Check that ports 3000, 5001, and 5432 are not already in use
- **Database connection errors**: Ensure the `DB_PASSWORD` in `backend/.env` matches what you expect, or recreate the database volume:
  ```bash
  docker-compose -f docker-compose.dev.yml down -v
  docker-compose -f docker-compose.dev.yml up -d
  ```
- **Backend not connecting to database**: Verify `DB_HOST=postgres` in `backend/.env` (for Docker) or `DB_HOST=localhost` (for manual setup)
- **View logs**: Use `docker logs -f angryqueers-backend-dev` to see backend errors

### Google Maps Not Loading

- Verify your API key is correct in `backend/.env` (backend serves it to frontend)
- Ensure these APIs are enabled:
  - Maps JavaScript API
  - Places API
  - Directions API
  - Geocoding API
- Check browser console for errors
- Verify API key restrictions (if any) allow your domain

### Authentication Issues

- **Google OAuth not working**: Verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` are set correctly
- **JWT errors**: Ensure `JWT_SECRET` is set and the same value is used consistently
- **Cannot access admin features**: Verify your email is in the `SUPERADMIN` environment variable

### Database Issues

- **Migration errors**: Run `cd backend && npm run migrate` manually
- **Connection refused**:
  - Docker: Check that the postgres container is running (`docker ps`)
  - Manual: Verify PostgreSQL is running and credentials are correct

### Image Upload Issues

- **413 Request Entity Too Large**: Nginx is configured for 10MB max upload size. If using a different proxy, increase its body size limit
- **Upload failed**: Check backend logs for ClamAV connection issues (scanning is optional in development)

### Server Connection Issues

- Ensure backend is running on port 5001 (Docker) or configured port
- Check if required ports (3000, 5001, 5432) are available
- Verify CORS settings if accessing from different domains

### Dependencies Issues

- Run `npm run install-all` to ensure all dependencies are installed
- Delete `node_modules` and run install again if needed
- For Docker: Containers will rebuild on start, but you may need to run `docker-compose -f docker-compose.dev.yml build --no-cache` if dependencies changed

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
