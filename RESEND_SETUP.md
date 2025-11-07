# Resend Email Setup Guide

Resend is a modern email API that makes it easy to send transactional emails. This guide will help you set up Resend for your Angry Queers application.

## Why Resend?

- ✅ **Simple API** - Clean, modern API design
- ✅ **Reliable** - Built for transactional emails
- ✅ **Free Tier** - 3,000 emails/month free
- ✅ **No Complex Configuration** - No SMTP settings needed
- ✅ **Great Developer Experience** - Easy debugging and logs

## Step 1: Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Click **"Start Building"** or **"Sign Up"**
3. Sign up with your email or GitHub account
4. Verify your email address

## Step 2: Get Your API Key

1. After signing in, go to the [API Keys page](https://resend.com/api-keys)
2. Click **"Create API Key"**
3. Give it a name (e.g., "Angry Queers Production")
4. Select permissions: **"Sending access"**
5. Click **"Create"**
6. **Copy the API key immediately** - you won't be able to see it again!

## Step 3: Add API Key to Your Environment

### For Local Development

Add to `backend/.env`:

```env
RESEND_API_KEY=re_123456789abcdefghijklmnop
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Note:** By default, Resend allows you to send from `onboarding@resend.dev` for testing. To use your own domain, see Step 4.

### For Render Production

1. Go to your **angry-queers-backend** service in Render
2. Click **"Environment"** tab
3. Add these environment variables:
   - **Key:** `RESEND_API_KEY`
   - **Value:** `re_123456789abcdefghijklmnop` (your actual key)
   
   - **Key:** `RESEND_FROM_EMAIL`
   - **Value:** `noreply@angryqueers.com` (or `onboarding@resend.dev` for testing)

4. Click **"Save Changes"**

## Step 4: Set Up Your Custom Domain (Optional but Recommended)

To send emails from your own domain (e.g., `noreply@angryqueers.com`):

### 4.1 Add Your Domain to Resend

1. Go to [Domains page](https://resend.com/domains) in Resend
2. Click **"Add Domain"**
3. Enter your domain: `angryqueers.com`
4. Click **"Add"**

### 4.2 Add DNS Records

Resend will show you DNS records to add. You'll need to add these to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

**Example DNS Records:**

| Type | Name | Value |
|------|------|-------|
| TXT | `@` or `angryqueers.com` | `resend-verification-code=abc123...` |
| MX | `@` or `angryqueers.com` | `feedback-smtp.resend.com` (Priority: 10) |
| TXT | `resend._domainkey` | `v=DKIM1; k=rsa; p=MIGfMA0...` |

### 4.3 Verify Domain

1. After adding DNS records, wait 5-15 minutes for DNS propagation
2. Click **"Verify"** in Resend dashboard
3. Once verified, you can send from any email address at your domain

### 4.4 Update Environment Variable

Once verified, update your `RESEND_FROM_EMAIL`:

```env
RESEND_FROM_EMAIL=noreply@angryqueers.com
```

## Step 5: Test Email Sending

### Test Volunteer Signup Email

1. Go to your app: `https://angry-queers.onrender.com/volunteer`
2. Fill out the volunteer signup form
3. Submit the form
4. Check `patricksegura@gmail.com` for the notification email

### Test Canvas Partner Invite

1. Go to Canvas page
2. Create a new canvas marker
3. Add a partner email address
4. Submit
5. Check the partner's email for the invite

### Check Resend Logs

1. Go to [Resend Logs](https://resend.com/emails)
2. You'll see all sent emails with their status
3. Click on any email to see details, preview, and delivery status

## Step 6: Monitor Email Delivery

### View Email Activity

- **Dashboard:** [https://resend.com/overview](https://resend.com/overview)
- **Emails:** [https://resend.com/emails](https://resend.com/emails)
- **API Keys:** [https://resend.com/api-keys](https://resend.com/api-keys)

### Common Status Codes

- ✅ **Delivered** - Email successfully delivered
- ⏳ **Sent** - Email sent to recipient's server, awaiting delivery
- ⚠️ **Bounced** - Email bounced (invalid address or mailbox full)
- ❌ **Failed** - Failed to send (check API key or domain)

## Troubleshooting

### Email Not Sending

1. **Check API Key:**
   - Verify `RESEND_API_KEY` is set correctly
   - Make sure there are no extra spaces
   - Check Render environment variables

2. **Check From Email:**
   - Use `onboarding@resend.dev` for testing
   - Or verify your custom domain is set up correctly

3. **Check Logs:**
   - Backend logs in Render will show if email was sent
   - Resend dashboard shows email status

### Emails Going to Spam

1. **Set up SPF, DKIM, and DMARC** (automatically done when you verify domain)
2. **Use a custom domain** instead of `onboarding@resend.dev`
3. **Warm up your domain** by sending to engaged recipients first

### Rate Limits

**Free Tier:**
- 3,000 emails/month
- 100 emails/day

**Paid Plans:**
- Start at $20/month
- 50,000 emails/month
- No daily limits

## Code Implementation

The email service is implemented in `backend/utils/emailService.js`:

```javascript
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Send email
const { data, error } = await resend.emails.send({
  from: 'Angry Queers <noreply@angryqueers.com>',
  to: ['user@example.com'],
  subject: 'Hello World',
  html: '<strong>It works!</strong>',
});
```

## API Reference

- **Official Docs:** [https://resend.com/docs](https://resend.com/docs)
- **Node.js SDK:** [https://github.com/resendlabs/resend-node](https://github.com/resendlabs/resend-node)
- **API Reference:** [https://resend.com/docs/api-reference](https://resend.com/docs/api-reference)

## Pricing

| Plan | Price | Emails/Month | Features |
|------|-------|--------------|----------|
| **Free** | $0 | 3,000 | 100 emails/day, 1 domain |
| **Pro** | $20 | 50,000 | No daily limit, unlimited domains |
| **Enterprise** | Custom | Custom | Dedicated IP, SLA, support |

Full pricing: [https://resend.com/pricing](https://resend.com/pricing)

## Security Best Practices

1. ✅ **Keep API key secret** - Never commit to Git
2. ✅ **Use environment variables** - Store in `.env` file
3. ✅ **Rotate keys periodically** - Create new keys every 3-6 months
4. ✅ **Use separate keys** - Different keys for dev/staging/production
5. ✅ **Monitor usage** - Check Resend dashboard regularly

## Support

- **Documentation:** [resend.com/docs](https://resend.com/docs)
- **Discord Community:** [resend.com/discord](https://resend.com/discord)
- **Email Support:** support@resend.com
- **Status Page:** [status.resend.com](https://status.resend.com)

---

**All set! 🎉** Your email notifications are now powered by Resend.

