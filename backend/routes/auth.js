import { Hono } from "hono";
import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import { isSuperAdminEmail } from "../utils/authHelpers.js";

export const authRouter = new Hono();

// Register
authRouter.post("/api/auth/register", async (c) => {
  try {
    const { email, username, password, invite_code } = await c.req.json();
    if (!email || !password) return c.json({ error: "Email and password are required" }, 400);
    if (!invite_code) return c.json({ error: "Invite code is required" }, 400);

    const inviteCheck = await pool.query(
      "SELECT * FROM invite_links WHERE code = $1 AND is_used = FALSE",
      [invite_code]
    );
    if (inviteCheck.rows.length === 0) return c.json({ error: "Invalid or already used invite code" }, 400);

    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) return c.json({ error: "User already exists" }, 409);

    const password_hash = await bcrypt.hash(password, 10);
    const user_type = isSuperAdminEmail(email) ? "admin" : "basic";
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'basic'
    `);

    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash, auth_provider, display_name, user_type)
       VALUES ($1, $2, $3, 'email', $2, $4) RETURNING id, email, username, display_name, auth_provider, user_type`,
      [email, username, password_hash, user_type]
    );
    const user = result.rows[0];

    await pool.query(
      `UPDATE invite_links 
       SET is_used = TRUE, used_at = CURRENT_TIMESTAMP, used_by = $1 
       WHERE code = $2`,
      [user.id, invite_code]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    return c.json({ user, token, message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ error: "Failed to register user" }, 500);
  }
});

// Login
authRouter.post("/api/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: "Email and password are required" }, 400);
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return c.json({ error: "Invalid credentials" }, 401);
    const user = result.rows[0];
    if (user.password_hash) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return c.json({ error: "Invalid credentials" }, 401);
    } else {
      return c.json({ error: "Account uses Google authentication" }, 401);
    }
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        auth_provider: user.auth_provider,
        user_type: user.user_type || "basic",
        is_super_admin: isSuperAdminEmail(user.email),
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Failed to login" }, 500);
  }
});

// Me
authRouter.get("/api/auth/me", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "No token provided" }, 401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.id]);
    if (result.rows.length === 0) return c.json({ error: "User not found" }, 404);
    const user = result.rows[0];
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        auth_provider: user.auth_provider,
        user_type: user.user_type || "basic",
        is_super_admin: isSuperAdminEmail(user.email),
      },
    });
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Google OAuth start
authRouter.get("/api/auth/google", async (c) => {
  const inviteCode = c.req.query("invite");
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state: inviteCode || "",
  }).toString()}`;
  return c.redirect(googleAuthUrl);
});

// Google OAuth callback
authRouter.get("/api/auth/google/callback", async (c) => {
  try {
    const code = c.req.query("code");
    const inviteCode = c.req.query("state");
    if (!code) return c.redirect("/?error=google_auth_failed");
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
      grant_type: "authorization_code",
    });
    const { access_token } = tokenResponse.data;
    const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const googleUser = userResponse.data;

    let user = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleUser.id]);
    if (user.rows.length === 0) {
      if (!isSuperAdminEmail(googleUser.email)) {
        if (!inviteCode) return c.redirect("/?error=invite_required");
        const inviteCheck = await pool.query(
          "SELECT * FROM invite_links WHERE code = $1 AND is_used = FALSE",
          [inviteCode]
        );
        if (inviteCheck.rows.length === 0) return c.redirect("/?error=invalid_invite");
      }
      const user_type = isSuperAdminEmail(googleUser.email) ? "admin" : "basic";
      const result = await pool.query(
        `INSERT INTO users (email, google_id, display_name, avatar_url, auth_provider, username, user_type)
         VALUES ($1, $2, $3, $4, 'google', $5, $6) 
         RETURNING id, email, username, display_name, auth_provider, user_type`,
        [
          googleUser.email,
          googleUser.id,
          googleUser.name,
          googleUser.picture,
          googleUser.email.split("@")[0],
          user_type,
        ]
      );
      user = result;
      if (inviteCode && !isSuperAdminEmail(googleUser.email)) {
        await pool.query(
          `UPDATE invite_links 
           SET is_used = TRUE, used_at = CURRENT_TIMESTAMP, used_by = $1 
           WHERE code = $2`,
          [user.rows[0].id, inviteCode]
        );
      }
    } else {
      await pool.query(
        `UPDATE users SET display_name = $1, avatar_url = $2 WHERE google_id = $3`,
        [googleUser.name, googleUser.picture, googleUser.id]
      );
    }

    const dbUser = user.rows[0];
    const token = jwt.sign(
      { id: dbUser.id, email: dbUser.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return c.redirect(`${frontendUrl}/?token=${token}`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    return c.redirect("/?error=google_auth_failed");
  }
});


