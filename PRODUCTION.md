# Production Deployment Guide

## ⚡ Quick Start

This document covers deploying the Landscaping Quote Software to production.

## 🚀 Fastest Deployment (5 minutes)

### Option A: Vercel (Recommended)

1. **Prepare environment file**
   ```bash
   cp .env.production.example .env.production.local
   # Edit with your keys
   ```

2. **Deploy**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

3. **Set environment variables** in Vercel dashboard

4. **Done!** Your app is live at `yourdomain.vercel.app`

### Option B: Railway (Self-contained)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Create project at railway.app**
   - Connect GitHub repo
   - Add PostgreSQL plugin
   - Set environment variables
   - Deploy (automatic)

## 📋 Pre-Deployment Checklist

### Services Required

- [ ] **PostgreSQL Database** (any managed PostgreSQL)
  - Recommended: Supabase ($0-10/mo), Railway ($5+), or Render
  - Get connection string: `postgresql://user:pass@host:5432/db`

- [ ] **Stripe Account** (for payments)
  - Get live keys: `pk_live_...` and `sk_live_...`
  - Add webhook endpoint: `/api/stripe/webhook`

- [ ] **OpenAI API** (for AI pricing)
  - Get API key from openai.com
  - Enable GPT-4o-mini model access

- [ ] **Resend** (for emails)
  - Sign up at resend.com
  - Get API key
  - Verify sending domain

- [ ] **PDFShift** (for PDF generation)
  - Sign up at pdfshift.io
  - Get API key (free tier: 250/month)

### Code Changes

- [ ] Update `NEXT_PUBLIC_APP_URL` in `.env.production`
- [ ] Generate new `NEXTAUTH_SECRET`:
  ```bash
  openssl rand -base64 32
  ```

## 🔧 Environment Variables

Copy `.env.production.example` to `.env.production` and fill in:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://..."

# Security
NEXTAUTH_SECRET="<generate-with-openssl>"

# App
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Payment (Stripe)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# AI
OPENAI_API_KEY="sk-..."

# PDF
PDFSHIFT_API_KEY="sk_live_..."

# Email
RESEND_API_KEY="re_..."
```

## 📦 Database Setup

### 1. Create PostgreSQL Database

**Option A: Supabase (Easiest)**
```bash
# Sign up at supabase.com
# Create new project
# Copy connection string from project settings
```

**Option B: Railway**
```bash
# Create Railway project
# Add PostgreSQL plugin
# Connection string auto-generated
```

**Option C: Local PostgreSQL**
```bash
createdb landscaping_quotes
# Connection: postgresql://user:password@localhost:5432/landscaping_quotes
```

### 2. Run Migrations

```bash
DATABASE_URL="your-connection-string" npm run db:push
```

Verify:
```bash
DATABASE_URL="your-connection-string" npx prisma studio
```

## 🔑 Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## 📧 Email Configuration

### Resend Setup

1. Sign up at resend.com
2. Verify your domain
3. Get API key
4. Test with:
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H 'Authorization: Bearer YOUR_API_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"from":"test@yourdomain.com","to":"user@example.com","html":"<h1>Test</h1>"}'
   ```

## 🏥 Health Checks

Monitor your deployment with:

```bash
# Check health
curl https://yourdomain.com/api/health

# Response (healthy):
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "database": "connected"
}
```

Use with uptime monitors:
- UptimeRobot (free)
- Pingdom
- Datadog

## 🔒 Security Checklist

- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] Database user has limited permissions
- [ ] API keys stored in environment variables (not in code)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection enabled (Next.js default)
- [ ] CSRF tokens for forms (Next.js default)

## 📊 Performance Optimization

### Database Indexes

Prisma automatically creates indexes for primary/foreign keys.

For additional performance:
```sql
-- Add if you have many offers
CREATE INDEX idx_offers_user_id ON "Offer"("userId");
CREATE INDEX idx_offers_created_at ON "Offer"("createdAt");

-- Add if you have many positions
CREATE INDEX idx_positions_offer_id ON "Position"("offerId");
```

### Caching

The app uses HTTP caching headers. Enable Redis caching:

```typescript
// Optional: For frequently accessed data
import redis from '@upstash/redis'

const cachedOffers = await redis.get(`offers:${userId}`)
```

## 🆘 Troubleshooting

### Database Connection Failed

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# If fails, check:
# 1. DATABASE_URL is correct
# 2. Database server is running
# 3. Network allows connections
```

### Emails Not Sending

```bash
# Test Resend API
curl https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY"

# Check logs
vercel logs
```

### PDF Generation Fails

- Verify PDFShift API key
- Check quota at pdfshift.io dashboard
- Test endpoint: `/api/offers/{id}/pdf`

### Stripe Payments Not Working

- Verify webhook is configured
- Check Stripe live keys (not test keys)
- View webhook logs in Stripe dashboard

## 📈 Monitoring & Alerts

### Recommended Tools

- **Sentry** (error tracking): Free tier available
- **LogRocket** (session recording): Free tier
- **Datadog** (APM): Free tier
- **Grafana** (metrics): Open source

### Key Metrics to Monitor

- Response time (target: <500ms)
- Error rate (target: <0.1%)
- Database query time (target: <100ms)
- Uptime (target: 99.9%)

## 💰 Cost Estimate

| Service | Cost |
|---------|------|
| Database (PostgreSQL) | $10-30/mo |
| App Hosting (Vercel) | Free-$20/mo |
| Stripe | 2.9% + $0.30/tx |
| Resend Email | Free-$50/mo |
| OpenAI | $0-5/mo (low usage) |
| PDFShift | Free-20/mo |
| Domain | $10-15/year |
| **Total** | **$20-65/mo** |

## 🔄 Backup & Disaster Recovery

### Database Backups

Managed PostgreSQL services auto-backup:
- Supabase: Daily backups (14 days retention)
- Railway: Automatic backups (7 days)
- Render: Automatic backups (7 days)

### Manual Backup

```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore from backup
psql $DATABASE_URL < backup.sql
```

## 🚨 Incident Response

### If app is down

1. Check health endpoint: `/api/health`
2. Review logs (Vercel/Railway dashboard)
3. Check service status:
   - Database: Connection working?
   - Stripe: API accessible?
   - Email: Resend status ok?
4. Redeploy previous version if needed

### If database is corrupted

```bash
# Restore from backup
psql $DATABASE_URL_NEW < backup.sql
```

## 📚 Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)

## ✅ Post-Launch

After going live:

1. **Monitor metrics** for 24h
2. **Test all flows** (register, quote, email, payment)
3. **Set up alerts** for errors/downtime
4. **Document API** for team members
5. **Create runbook** for incident response
6. **Plan for scaling** if traffic increases

---

**Questions?** Review DEPLOYMENT.md for detailed setup guides.

**Ready to deploy?** Choose Vercel or Railway and follow the quick start above! 🚀
