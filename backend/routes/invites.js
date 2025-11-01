import { Hono } from "hono";
import pool from "../config/database.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const invitesRouter = new Hono();

invitesRouter.post("/api/invites/create", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "No token provided" }, 401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const inviteCode = crypto.randomBytes(16).toString("hex");
    const result = await pool.query(
      `INSERT INTO invite_links (code, created_by) 
       VALUES ($1, $2) 
       RETURNING id, code, created_at`,
      [inviteCode, decoded.id]
    );
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
    const inviteLink = `${frontendUrl}/?invite=${inviteCode}`;
    return c.json({ invite: result.rows[0], invite_link: inviteLink, message: "Invite link created successfully" });
  } catch (error) {
    console.error("Error creating invite:", error);
    return c.json({ error: "Failed to create invite link" }, 500);
  }
});

invitesRouter.get("/api/invites/my-invites", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "No token provided" }, 401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const invites = await pool.query(
      `SELECT 
        il.id, il.code, il.created_at, il.used_at, il.is_used,
        u.email as used_by_email, u.display_name as used_by_name
       FROM invite_links il
       LEFT JOIN users u ON il.used_by = u.id
       WHERE il.created_by = $1
       ORDER BY il.created_at DESC`,
      [decoded.id]
    );
    return c.json({ invites: invites.rows });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return c.json({ error: "Failed to fetch invites" }, 500);
  }
});

invitesRouter.get("/api/invites/validate/:code", async (c) => {
  try {
    const code = c.req.param("code");
    const result = await pool.query(
      "SELECT id, code, is_used FROM invite_links WHERE code = $1",
      [code]
    );
    if (result.rows.length === 0) return c.json({ valid: false, message: "Invite code not found" }, 404);
    const invite = result.rows[0];
    if (invite.is_used) {
      return c.json({ valid: false, message: "This invite code has already been used" });
    }
    return c.json({ valid: true, message: "Invite code is valid" });
  } catch (error) {
    console.error("Error validating invite:", error);
    return c.json({ error: "Failed to validate invite code" }, 500);
  }
});


