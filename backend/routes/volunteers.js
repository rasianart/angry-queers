import { Hono } from "hono";
import pkg from "pg";
import jwt from "jsonwebtoken";
import { sendVolunteerSignupNotification } from "../utils/emailService.js";
const { Pool } = pkg;

const volunteerRouter = new Hono();

const pool = new Pool({
  user: process.env.DB_USER || "angry_queers_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "angry_queers",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432,
});

// Public route - Submit volunteer signup form
volunteerRouter.post("/api/volunteers/signup", async (c) => {
  try {
    const data = await c.req.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "neighborhood",
      "roles",
      "availability",
      "trainings_completed",
      "consent_signal",
    ];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    // Validate roles is array and has at least 1, max 4
    if (
      !Array.isArray(data.roles) ||
      data.roles.length === 0 ||
      data.roles.length > 4
    ) {
      return c.json(
        { error: "Roles must be an array with 1-4 selections" },
        400
      );
    }

    const result = await pool.query(
      `INSERT INTO volunteer_signups 
        (name, pronouns, mobile_number, has_signal, signal_username, neighborhood, 
         roles, availability, trainings_completed, consent_signal, accessibility_needs)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        data.name,
        data.pronouns || null,
        data.mobile_number || null,
        data.has_signal || false,
        data.signal_username || null,
        data.neighborhood,
        data.roles,
        JSON.stringify(data.availability),
        data.trainings_completed,
        data.consent_signal,
        data.accessibility_needs || null,
      ]
    );

    // Send email notification
    try {
      await sendVolunteerSignupNotification(data);
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't fail the request if email fails
    }

    return c.json({
      success: true,
      message: "Volunteer signup submitted successfully!",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error submitting volunteer signup:", error);
    return c.json({ error: "Failed to submit volunteer signup" }, 500);
  }
});

// Admin route - List all volunteer signups
volunteerRouter.get("/api/volunteers/signups", async (c) => {
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
      `SELECT * FROM volunteer_signups ORDER BY created_at DESC`
    );

    return c.json({ signups: result.rows });
  } catch (error) {
    console.error("Error fetching volunteer signups:", error);
    return c.json({ error: "Failed to fetch volunteer signups" }, 500);
  }
});

export default volunteerRouter;
