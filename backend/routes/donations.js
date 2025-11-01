import { Hono } from "hono";
import pkg from "pg";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
const { Pool } = pkg;

const donationRouter = new Hono();

const pool = new Pool({
  user: process.env.DB_USER || "angry_queers_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "angry_queers",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432,
});

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    })
  : null;

// Create payment intent
donationRouter.post("/api/donations/create-payment-intent", async (c) => {
  try {
    if (!stripe) {
      return c.json(
        { error: "Payment processing not configured. Please contact support." },
        503
      );
    }

    const data = await c.req.json();

    // Validate amount
    if (typeof data.amount !== "number" || data.amount < 1) {
      return c.json({ error: "Invalid donation amount" }, 400);
    }

    // Validate email format
    if (!data.email || !data.email.includes("@")) {
      return c.json({ error: "Invalid email address" }, 400);
    }

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount * 100, // Stripe expects amount in cents
      currency: "usd",
      receipt_email: data.email,
      metadata: {
        donor_name: data.name || "Anonymous",
        donor_email: data.email,
      },
      description: "Donation to Angry Queers - Direct Aid",
    });

    return c.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return c.json(
      { error: error.message || "Failed to create payment intent" },
      500
    );
  }
});

// Confirm donation and save to database
donationRouter.post("/api/donations/confirm", async (c) => {
  try {
    const data = await c.req.json();

    if (!data.paymentIntentId) {
      return c.json({ error: "Missing payment intent ID" }, 400);
    }

    // Verify the payment with Stripe
    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        data.paymentIntentId
      );

      if (paymentIntent.status !== "succeeded") {
        return c.json({ error: "Payment not completed" }, 400);
      }

      // Store donation in database
      const result = await pool.query(
        `INSERT INTO donations 
          (amount, email, donor_name, payment_method, payment_status, stripe_payment_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          paymentIntent.amount / 100, // Convert cents back to dollars
          paymentIntent.receipt_email || data.email,
          paymentIntent.metadata.donor_name || "Anonymous",
          "card",
          "completed",
          paymentIntent.id,
        ]
      );

      console.log(
        `Donation confirmed: $${paymentIntent.amount / 100} from ${
          paymentIntent.receipt_email
        } (Stripe ID: ${paymentIntent.id})`
      );

      return c.json({
        success: true,
        message: "Donation processed successfully",
        donation_id: result.rows[0].id,
      });
    } else {
      return c.json({ error: "Payment processing not configured" }, 503);
    }
  } catch (error) {
    console.error("Error confirming donation:", error);
    return c.json(
      { error: error.message || "Failed to confirm donation" },
      500
    );
  }
});

// Get Stripe publishable key
donationRouter.get("/api/donations/config", async (c) => {
  return c.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  });
});

// Admin route - List all donations
donationRouter.get("/api/donations", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "No token provided" }, 401);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    const userResult = await pool.query(
      "SELECT user_type FROM users WHERE id = $1",
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    if (userResult.rows[0].user_type !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    const result = await pool.query(
      `SELECT id, amount, email, donor_name, payment_method, payment_status, created_at 
       FROM donations 
       ORDER BY created_at DESC`
    );

    // Calculate total
    const totalResult = await pool.query(
      `SELECT SUM(amount) as total FROM donations WHERE payment_status = 'completed'`
    );

    return c.json({
      donations: result.rows,
      total: parseInt(totalResult.rows[0].total) || 0,
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return c.json({ error: "Failed to fetch donations" }, 500);
  }
});

export default donationRouter;
