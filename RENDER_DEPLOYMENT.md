# Deploying Angry Queers to Render

This guide walks you through deploying your full-stack application to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Stripe API keys (test or live)
4. SendGrid API key (for emails)
5. Google OAuth credentials
6. Google Maps API key

## Step 1: Push Code to GitHub

If you haven't already:

```bash
cd /Users/patricksegura/Documents/coding/angry-queers
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/angry-queers.git
git push -u origin main
```

## Step 2: Create PostgreSQL Database on Render

1. Log in to Render Dashboard: https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `angry-queers-db`
   - **Database:** `angry_queers`
   - **User:** `angry_queers_user`
   - **Region:** Choose closest to your users (e.g., Oregon (US West))
   - **Plan:** Free tier or Starter ($7/month for production)
4. Click **"Create Database"**
5. **Save these credentials** (you'll need them):
   - Internal Database URL
   - External Database URL
   - Host
   - Port
   - Database name
   - Username
   - Password

## Step 3: Deploy Backend Service

1. Click **"New +"** → **"Web Service"**
2. Connect your Git repository
3. Configure:

   - **Name:** `angry-queers-backend`
   - **Region:** Same as your database
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node run-migrations.js && node server.js`
   - **Plan:** Free tier or Starter ($7/month)

4. **Environment Variables** (click "Advanced" → "Add Environment Variable"):

```env
# Database (use Internal Database URL from Step 2)
DATABASE_URL=<your-internal-database-url>
DB_HOST=<from-render-database>
DB_PORT=5432
DB_NAME=angry_queers
DB_USER=angry_queers_user
DB_PASSWORD=<from-render-database>

# Server
PORT=5002
NODE_ENV=production

# Frontend URL (you'll update this after frontend is deployed)
FRONTEND_URL=https://angry-queers.onrender.com
APP_URL=https://angry-queers.onrender.com

# JWT Secret (generate a random string)
JWT_SECRET=<generate-a-long-random-string>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://angry-queers-backend.onrender.com/api/auth/google/callback

# Google Maps
GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>

# Stripe
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>

# SendGrid (for emails)
SENDGRID_API_KEY=<your-sendgrid-api-key>
SENDGRID_FROM_EMAIL=noreply@angryqueers.com
SMTP_USER=<optional-if-not-using-sendgrid>
SMTP_PASS=<optional-if-not-using-sendgrid>

# Admin Email (your email for admin access)
SUPER_ADMIN_EMAIL=patricksegura@gmail.com

# App Name
APP_NAME=Angry Queers
```

5. Click **"Create Web Service"**

## Step 4: Deploy Frontend Service

1. Click **"New +"** → **"Static Site"**
2. Connect your Git repository
3. Configure:

   - **Name:** `angry-queers`
   - **Region:** Same as backend
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Environment Variables:**

```env
# Backend API URL (use your backend service URL)
VITE_API_URL=https://angry-queers-backend.onrender.com
```

5. Click **"Create Static Site"**

## Step 5: Update Backend with Frontend URL

1. Go to your backend service on Render
2. Go to **"Environment"** tab
3. Update these variables:
   - `FRONTEND_URL=https://angry-queers.onrender.com`
   - `APP_URL=https://angry-queers.onrender.com`
4. Click **"Save Changes"**
5. Backend will automatically redeploy

## Step 6: Configure Frontend API Proxy

Since your frontend uses `/api` proxy, you need to add redirect rules.

Create `frontend/public/_redirects` file:

```
/api/*  https://angry-queers-backend.onrender.com/api/:splat  200
/*      /index.html  200
```

Then commit and push:

```bash
git add frontend/public/_redirects
git commit -m "Add API redirect rules for Render"
git push
```

Render will automatically redeploy.

## Step 7: Update Google OAuth Redirect URLs

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs:**
   - `https://angry-queers-backend.onrender.com/api/auth/google/callback`
5. Add to **Authorized JavaScript origins:**
   - `https://angry-queers.onrender.com`
6. Click **"Save"**

## Step 8: Run Database Migrations

Your backend start command includes migrations, but if you need to run them manually:

1. Go to your backend service on Render
2. Click **"Shell"** tab
3. Run:

```bash
npm run migrate
```

## Step 9: Test Your Deployment

1. Visit your frontend URL: `https://angry-queers.onrender.com`
2. Test these features:
   - ✅ Homepage loads
   - ✅ Google authentication works
   - ✅ Canvas markers display
   - ✅ Volunteer signup form submits
   - ✅ Donation panel opens and processes payments (test mode)
   - ✅ Events page loads

## Step 10: Set Up Custom Domain (Optional)

### For Frontend:

1. Go to your frontend static site on Render
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain: `angryqueers.com`
4. Follow instructions to add DNS records:
   - **Type:** CNAME
   - **Name:** www (or @)
   - **Value:** `angry-queers.onrender.com`

### For Backend API:

1. Go to your backend service on Render
2. Click **"Settings"** → **"Custom Domain"**
3. Add subdomain: `api.angryqueers.com`
4. Add DNS record:
   - **Type:** CNAME
   - **Name:** api
   - **Value:** `angry-queers-backend.onrender.com`

### Update Environment Variables:

Once custom domain is set up, update:

- Backend: `FRONTEND_URL=https://angryqueers.com`
- Frontend: `VITE_API_URL=https://api.angryqueers.com`
- Frontend `_redirects`: `/api/*  https://api.angryqueers.com/api/:splat  200`

## Step 11: Switch Stripe to Live Mode

When ready for production:

1. Get your **live** Stripe keys from https://dashboard.stripe.com/apikeys
2. Update backend environment variables:
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `STRIPE_PUBLISHABLE_KEY=pk_live_...`
3. Redeploy backend

## Monitoring and Logs

### View Logs:

- Backend: Dashboard → Select service → **"Logs"** tab
- Database: Dashboard → Select database → **"Logs"** tab

### View Metrics:

- Dashboard → Select service → **"Metrics"** tab

### Set Up Alerts:

- Dashboard → Select service → **"Settings"** → **"Notifications"**

## Troubleshooting

### Backend won't start:

1. Check logs for errors
2. Verify all environment variables are set
3. Check database connection
4. Ensure migrations ran successfully

### Frontend shows "API Error":

1. Verify `_redirects` file exists
2. Check backend URL in environment variables
3. Check CORS settings in backend

### Database connection fails:

1. Use Internal Database URL (not External) for backend
2. Verify database credentials
3. Check if database is running

### Google OAuth not working:

1. Verify redirect URLs in Google Console
2. Check `GOOGLE_CALLBACK_URL` environment variable
3. Ensure HTTPS is used (not HTTP)

## Cost Estimate

### Free Tier:

- PostgreSQL: Free (with limitations)
- Backend: Free (750 hours/month)
- Frontend: Free (100 GB bandwidth/month)
- **Total: $0/month**

### Production (Recommended):

- PostgreSQL Starter: $7/month
- Backend Starter: $7/month
- Frontend: Free
- **Total: $14/month**

### With Custom Domain:

- Domain registration: ~$12/year
- SSL/TLS: Free (included with Render)

## Backup Strategy

1. **Database Backups:**

   - Render automatically backs up databases daily (Starter plan and above)
   - Manual backups: Use `pg_dump` via Shell tab

2. **Code Backups:**
   - Always in Git repository
   - Create tags for releases: `git tag v1.0.0 && git push --tags`

## Security Checklist

- ✅ Use strong `JWT_SECRET` (at least 32 random characters)
- ✅ Keep Stripe keys in environment variables (never in code)
- ✅ Use HTTPS only (Render provides free SSL)
- ✅ Rotate database password periodically
- ✅ Enable Render's DDoS protection
- ✅ Review database access logs regularly
- ✅ Keep dependencies updated: `npm audit fix`

## Support

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Your Logs:** Dashboard → Service → Logs tab

## Next Steps After Deployment

1. Set up monitoring/alerting
2. Configure automated backups
3. Set up staging environment (optional)
4. Enable Render's auto-deploy from main branch
5. Set up health checks
6. Configure rate limiting (if needed)

---

**Deployed! 🎉** Your Angry Queers app is now live and accessible worldwide!
