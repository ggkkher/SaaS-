# Deployment Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Git
- Accounts for: Vercel, Stripe, OpenAI, Resend, PDFShift

## Database Migration (Local Dev → PostgreSQL)

### 1. Set up PostgreSQL

```bash
# Install PostgreSQL
brew install postgresql  # macOS
# or apt-get install postgresql-14  # Linux

# Create database
createdb landscaping_quotes
```

### 2. Update Prisma Schema

The schema is already PostgreSQL-compatible. No changes needed.

### 3. Run Migrations

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/landscaping_quotes" npm run db:push
```

## Deployment to Vercel

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Create Vercel Project

```bash
npm i -g vercel
vercel
```

### 3. Set Environment Variables in Vercel Dashboard

Go to **Settings → Environment Variables** and add:

```
DATABASE_URL = postgresql://...
NEXTAUTH_SECRET = (generate with: openssl rand -base64 32)
STRIPE_SECRET_KEY = sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
OPENAI_API_KEY = sk-...
PDFSHIFT_API_KEY = sk_live_...
RESEND_API_KEY = re_...
NEXT_PUBLIC_APP_URL = https://your-domain.com
```

### 4. Deploy

```bash
vercel --prod
```

## Deployment to Railway

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Create Railway Project

1. Go to railway.app
2. Click "Create New Project"
3. Select "GitHub Repo"
4. Connect your repository

### 3. Add PostgreSQL Plugin

1. In Railway dashboard, click "Add"
2. Select "PostgreSQL"
3. Railway automatically creates DATABASE_URL

### 4. Set Environment Variables

Add in Railway dashboard:

```
NEXTAUTH_SECRET=...
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
OPENAI_API_KEY=...
PDFSHIFT_API_KEY=...
RESEND_API_KEY=...
NEXT_PUBLIC_APP_URL=https://your-railway-domain.up.railway.app
```

### 5. Deploy

Railway auto-deploys on GitHub push.

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables set
- [ ] Stripe webhooks configured (point to `/api/stripe/webhook`)
- [ ] Email service tested (send test offer email)
- [ ] PDF generation tested
- [ ] Authentication working (test register/login)
- [ ] SSL certificate active (HTTPS)
- [ ] Domain configured
- [ ] Backups enabled for database
- [ ] Monitoring/error tracking enabled (optional: Sentry)

## Running Database Migrations

### Create a Migration

```bash
DATABASE_URL="postgresql://..." npx prisma migrate dev --name migration_name
```

### Apply Migrations in Production

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

## Health Check Endpoint

Add a health check endpoint for monitoring:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' });
}
```

Use with monitoring service like:
- Pingdom
- UptimeRobot
- Datadog

## Backup Strategy

### PostgreSQL Backups

For Vercel: Use Vercel's built-in postgres backups or third-party like:
- Supabase (offers PostgreSQL with built-in backups)
- Render.com (PostgreSQL with backups)

For Railway: Enable automatic backups in dashboard

### Recommended: Use Managed PostgreSQL

Instead of self-hosting, use:
- **Supabase** (free tier: 500MB, great for startups)
- **Render** (free tier with generous limits)
- **Railway** (pay-as-you-go, generous free tier)

All provide automatic backups and high availability.

## Scaling Considerations

### Current Setup Handles:

- 10k+ offers/month (Free tier)
- 100+ concurrent users
- 1GB+ database

### When to Scale:

1. **Database**: Increase PostgreSQL instance size
2. **App**: Vercel automatically scales, no config needed
3. **API Rate Limits**: Consider caching (Redis)
4. **Email**: Resend handles 10k+/day by default

## Cost Estimate (Monthly)

- **Database**: $10-30 (PostgreSQL managed)
- **App Hosting**: $0 (Vercel free) - $10 (hobby)
- **Stripe**: 2.9% + $0.30 per transaction
- **Resend Email**: $0 (free tier: 100/day)
- **OpenAI**: ~$0-5 (low usage)
- **PDFShift**: ~$5-20 (250+ PDFs/month)
- **Domain**: $10-15/year

**Total**: ~$15-50/month for small business

## Monitoring & Logging

### Enable Vercel Analytics

```bash
# In next.config.js
const withAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withAnalyzer({
  // config
})
```

### Optional: Sentry Integration

```bash
npm install @sentry/nextjs
```

Add to `next.config.js`:

```javascript
const withSentry = require('@sentry/nextjs').withSentry;

module.exports = withSentry({
  // your config
}, {
  org: 'your-org',
  project: 'landscaping-quotes',
});
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Build Failures

```bash
# Rebuild local, check logs
npm run build

# Check environment variables
vercel env ls
```

### Email Not Sending

- Check RESEND_API_KEY is set
- Verify domain in Resend settings
- Check spam folder

### PDF Generation Fails

- Verify PDFSHIFT_API_KEY is set
- Check API quota at pdfshift.io
- Test with `/api/transcribe` endpoint

## Rollback Procedure

### Vercel

1. Go to Deployments tab
2. Click previous deployment
3. Click "Redeploy"

### Railway

```bash
# See deployment history
railway deployments list

# Redeploy specific version
railway deployments redeploy <deployment-id>
```

## Support & Monitoring

- **Status Page**: Use Statuspage.io or Incident.io
- **Uptime Monitoring**: UptimeRobot or Pingdom
- **Error Tracking**: Sentry or Rollbar
- **Logs**: Vercel Logs or Railway Logs

## Next Steps

1. Set up domain and SSL
2. Configure email domain
3. Set up monitoring/alerting
4. Create backup strategy
5. Document API for future integrations
6. Set up CI/CD for automated testing
