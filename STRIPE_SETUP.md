# Stripe Payment Setup

This guide explains how to set up Stripe payments for the donation system.

## Prerequisites

1. A Stripe account connected to patricksegura@gmail.com
2. Access to your Stripe Dashboard at https://dashboard.stripe.com

## Setup Instructions

### 1. Get Your Stripe API Keys

1. Log in to your Stripe Dashboard at https://dashboard.stripe.com
2. Click on **Developers** in the left sidebar
3. Click on **API keys**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` for test mode or `pk_live_` for live mode)
   - **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for live mode)

### 2. Add Keys to Your Environment Variables

Add these variables to your `backend/.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_yourSecretKeyHere
STRIPE_PUBLISHABLE_KEY=pk_test_yourPublishableKeyHere
```

**Important Security Notes:**
- Never commit your `.env` file to version control
- Never share your secret key publicly
- The secret key should only be on your backend server

### 3. Test Mode vs Live Mode

#### Test Mode (Development)
- Use test API keys (starting with `pk_test_` and `sk_test_`)
- Use test card numbers (see below)
- No real money is processed

#### Live Mode (Production)
- Use live API keys (starting with `pk_live_` and `sk_live_`)
- Real credit cards are charged
- Real money goes to your connected Stripe account

### 4. Test Card Numbers

When using test mode, you can use these test card numbers:

| Card Number         | Result                    |
|---------------------|---------------------------|
| 4242 4242 4242 4242 | Successful payment        |
| 4000 0000 0000 9995 | Card declined             |
| 4000 0000 0000 3220 | 3D Secure authentication  |

- Use any future expiry date (e.g., 12/25)
- Use any 3-digit CVC (e.g., 123)
- Use any ZIP code (e.g., 10001)

### 5. Restart Your Application

After adding the Stripe keys to your `.env` file:

```bash
docker-compose -f docker-compose.dev.yml restart backend frontend
```

## How It Works

1. User fills out donation form with amount, email, and name
2. Click "Continue to Payment"
3. Frontend creates a Payment Intent via backend API
4. Stripe Payment Element appears with secure card input
5. User enters card details (handled securely by Stripe)
6. Payment is processed through Stripe
7. Donation is confirmed and saved to database

## Features

- ✅ Secure card processing (PCI compliant)
- ✅ Automatic email receipts from Stripe
- ✅ Support for all major credit cards
- ✅ 3D Secure authentication
- ✅ Apple Pay / Google Pay (if enabled)
- ✅ Mobile responsive
- ✅ Real-time validation

## Monitoring Payments

View all payments in your Stripe Dashboard:
- https://dashboard.stripe.com/payments

Each payment includes:
- Donor email
- Donor name
- Amount
- Card details (last 4 digits)
- Receipt (automatically emailed to donor)

## Support

If you encounter issues:
1. Check that your API keys are correct
2. Verify your Stripe account is fully set up
3. Check the backend logs: `docker logs angryqueers-backend-dev`
4. Contact Stripe support: https://support.stripe.com

## Going Live Checklist

Before accepting real payments:

- [ ] Activate your Stripe account (provide business details)
- [ ] Switch to live API keys (`sk_live_` and `pk_live_`)
- [ ] Test with a small real donation
- [ ] Set up webhook endpoints (for advanced features)
- [ ] Review Stripe's payout schedule for your account
- [ ] Ensure your business name displays correctly on statements

## Fees

Stripe's standard processing fees:
- 2.9% + $0.30 per successful card charge

Example: $100 donation = $97.10 deposited to your account

These fees are automatically deducted by Stripe.

