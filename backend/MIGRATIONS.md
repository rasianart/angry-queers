# Database Migration Guide

This document explains how to manage database migrations for the Angry Queers application.

## 🎯 Quick Answer

**For Cloudflare deployment:**

- **Cloudflare Pages + D1**: Use `wrangler d1 execute` for migrations
- **Cloudflare + Supabase**: Use Supabase's built-in migration system
- **Railway/Render/Fly.io**: Keep Docker setup and run migrations on deploy

**Flyway?** Not needed. You're using `node-pg-migrate` or manual SQL files.

## 📋 Current Migration System

We use a **simple migration runner** that:

1. Reads SQL files from `migrations/` folder
2. Executes them in order
3. Ignores "already exists" errors (idempotent)
4. Can be run on every container start

## 🔧 How to Add a New Migration

### Step 1: Create Migration File

```bash
cd backend
touch migrations/002_add_new_field.sql
```

### Step 2: Write Migration SQL

```sql
-- migrations/002_add_new_field.sql
ALTER TABLE events ADD COLUMN external_link VARCHAR(500);
ALTER TABLE events ADD COLUMN tags TEXT[];

-- Optional: add data
UPDATE events SET tags = ARRAY['community'] WHERE tags IS NULL;
```

### Step 3: Test Locally

```bash
# Run Docker setup
docker-compose up -d

# Check logs
docker-compose logs backend
```

### Step 4: Deploy

```bash
# Rebuild with new migration
docker-compose up --build -d backend

# Or for cloud deployment
git push  # migrations will run on deploy
```

## 🚀 Cloud Deployment Migrations

### Cloudflare D1

```bash
wrangler d1 execute no-ice-db --file=migrations/002_add_new_field.sql
```

### Supabase

```bash
# Manual: Apply via Supabase dashboard
# Or automated: Use Supabase CLI
supabase db push
```

### Railway/Render (Docker)

```bash
# Deploy will automatically run migrations
git push
# Migrations run in Dockerfile CMD
```

### Fly.io

```bash
fly deploy
# Migrations run in Dockerfile CMD
```

## 📝 Migration Best Practices

1. **Keep migrations idempotent**

   ```sql
   CREATE TABLE IF NOT EXISTS ...
   ALTER TABLE ... IF EXISTS ...
   ```

2. **Test before deploying**

   ```bash
   docker-compose down -v  # Fresh start
   docker-compose up -d     # Test migrations
   ```

3. **Backup first**

   ```bash
   # Before major schema changes
   pg_dump -U noice -d noice > backup.sql
   ```

4. **Use transactions when possible**
   ```sql
   BEGIN;
   -- Your changes
   COMMIT;
   ```

## 🛠️ Migration Commands

```bash
# Run migrations locally
npm run migrate

# Run in Docker
docker-compose exec backend npm run migrate

# Create new migration file
touch migrations/003_your_feature.sql
```

## 🐛 Troubleshooting

### "Table already exists" errors

This is normal and ignored by the migration runner. Safe to ignore.

### "Column already exists" errors

Add `IF NOT EXISTS` to your SQL:

```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);
```

### Need to rollback?

```sql
-- Add a new migration to undo changes
-- migrations/004_rollback.sql
ALTER TABLE events DROP COLUMN IF EXISTS bad_field;
```

## 📦 File Structure

```
backend/
├── migrations/
│   ├── 001_initial.sql          # Initial schema
│   ├── 002_add_new_field.sql    # New migration
│   └── ...
├── run-migrations.js             # Migration runner
├── Dockerfile                     # Runs migrations on start
└── server.js
```

## ✅ Migration Checklist

- [ ] Test locally with Docker
- [ ] Backup production database
- [ ] Create migration file
- [ ] Test migration locally
- [ ] Deploy to staging
- [ ] Test staging
- [ ] Deploy to production
- [ ] Verify changes in production
