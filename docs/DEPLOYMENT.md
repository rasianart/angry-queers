# Deployment Guide for Angry Queers

This guide covers deploying your Angry Queers application to Cloudflare with proper database migration handling.

## 🏗️ Architecture Overview

```
┌─────────────────────────────┐
│   Cloudflare Pages (CDN)    │  ← Frontend (Static)
│   Port 80/443 (HTTPS)      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Cloudflare Workers/       │  ← Backend API
│   Hono Serverless           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Cloudflare D1 Database    │  ← Or Supabase/Neon
│   (Lightweight SQLite)     │
└─────────────────────────────┘
```

## 📦 Option 1: Cloudflare Pages + D1 Database (Recommended)

### Pros:

- ✅ Free tier is generous
- ✅ Global edge network (fast worldwide)
- ✅ Built-in DDoS protection
- ✅ Free SSL certificates
- ✅ Serverless backend (no infrastructure to manage)

### Cons:

- ⚠️ D1 is SQLite-based (not PostgreSQL)
- ⚠️ Some PostgreSQL features won't work
- ⚠️ Limited to Cloudflare ecosystem

### Setup Steps:

1. **Install Cloudflare CLI (Wrangler)**

```bash
npm install -g wrangler
wrangler login
```

2. **Convert to Hono (already compatible!)**

   - Your backend already uses Hono ✅
   - Just needs slight modifications for Cloudflare Workers

3. **Create D1 Database**

```bash
wrangler d1 create no-ice-db
```

4. **Run Migrations on D1**

```bash
# Apply your schema to D1
wrangler d1 execute no-ice-db --file=./migrations/initial-schema.sql
```

5. **Deploy Frontend (Pages)**

```bash
# Your frontend is already built
wrangler pages deploy ./frontend/dist --project-name=angryqueers
```

6. **Deploy Backend (Workers)**

```bash
cd backend
wrangler publish
```

### Migration Strategy for Cloudflare D1:

**Manual Migrations (Recommended for D1)**

```bash
# Create a migration file
echo "ALTER TABLE events ADD COLUMN new_field VARCHAR(255);" > migration.sql

# Apply it
wrangler d1 execute no-ice-db --file=migration.sql
```

**Or Use node-pg-migrate with D1**

```bash
npm run migrate -- --db-url=$DATABASE_URL
```

---

## 📦 Option 2: Vercel + Supabase (More Flexible)

### Pros:

- ✅ Keep PostgreSQL
- ✅ Better database features
- ✅ Easier deployment
- ✅ Automatic migrations with Supabase

### Cons:

- ⚠️ Separate services to manage
- ⚠️ Slightly more expensive

### Setup Steps:

1. **Deploy to Vercel**

```bash
npm install -g vercel
vercel login
cd frontend && vercel deploy
cd backend && vercel deploy
```

2. **Setup Supabase Database**

```bash
# Create project on supabase.com
# Get connection string

# Run migrations via Supabase dashboard or CLI
supabase db push
```

3. **Migrate Existing Data**

```bash
# Export from local PostgreSQL
pg_dump -h localhost -U noice -d noice > backup.sql

# Import to Supabase
psql -h your-db.supabase.co -U postgres -d postgres < backup.sql
```

### Migration Strategy for Supabase:

**Automatic Migrations with Supabase CLI**

```bash
# Create migration
supabase migration new add_support_category

# Edit migration file
# Then apply:
supabase db push
```

---

## 📦 Option 3: Docker on Cloud (Railway, Render, Fly.io)

### Pros:

- ✅ Full control
- ✅ Keep current Docker setup
- ✅ PostgreSQL support
- ✅ Easy to scale

### Cons:

- ⚠️ More expensive
- ⚠️ You manage infrastructure

### Setup Steps:

#### Railway:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link
railway login
railway link

# Deploy
railway up
```

#### Render:

1. Connect your GitHub repo
2. Select `docker-compose.yml`
3. Render auto-deploys on push

#### Fly.io:

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly deploy
```

### Migration Strategy for Docker:

**Using node-pg-migrate**

```bash
# In Dockerfile or cloud setup
npm run migrate

# Or manually
docker-compose exec backend npm run migrate
```

---

## 🔄 Migration Best Practices

### 1. Always Backup First

```bash
# Local backup
pg_dump -U noice -d noice > backup-$(date +%Y%m%d).sql
```

### 2. Create Migration Scripts

```bash
# Create a new migration
cd backend
npm run migrate:create add-new-column

# Edit the file
# Then apply
npm run migrate
```

### 3. Test Migrations Locally

```bash
# Test with your Docker setup
docker-compose up -d
docker-compose exec backend npm run migrate
```

### 4. Use Database Transactions

Always wrap migrations in transactions for rollback safety.

---

## 🚀 Recommended Setup for Cloudflare

### For Your Use Case:

**If staying with PostgreSQL**: Use **Supabase** with Cloudflare Pages

- Free tier is generous
- Automatic backups
- Built-in migration management
- Easy to sync your Docker setup

**If okay with SQLite**: Use **Cloudflare D1**

- Fully managed on Cloudflare
- Free forever on hobby plan
- No separate database to manage
- Fastest edge performance

### Migration Commands:

```bash
# Development
docker-compose exec backend npm run migrate

# Production (Cloudflare + D1)
wrangler d1 execute no-ice-db --file=migrations/001.sql

# Production (Vercel + Supabase)
supabase db push

# Production (Docker)
docker-compose exec backend npm run migrate
```

---

## 🔐 Environment Variables

Create these in your cloud provider's dashboard:

```
DB_HOST=your-db-host
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=your-database
DB_PORT=5432

GOOGLE_MAPS_API_KEY=your-key
INSTAGRAM_ACCESS_TOKEN=your-token
```

---

## 📝 Migration Checklist

- [ ] Backup production database
- [ ] Test migration locally
- [ ] Create migration file
- [ ] Apply migration to staging
- [ ] Test staging thoroughly
- [ ] Apply migration to production
- [ ] Verify data integrity
- [ ] Monitor for issues

---

## 🐛 Troubleshooting

### Migration Fails

```bash
# Rollback last migration
npm run migrate down

# Or manually
psql -U noice -d noice -c "DROP TABLE IF EXISTS new_table;"
```

### Database Connection Issues

Check that your cloud database allows connections from your deployment IP.

### Port Conflicts

Cloud services typically handle this automatically.
