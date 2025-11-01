import { Hono } from "hono";
import pool from "../config/database.js";
import jwt from "jsonwebtoken";
import { isSuperAdminEmail } from "../utils/authHelpers.js";

export const adminRouter = new Hono();

// Get all users (super admins only)
adminRouter.get("/api/admin/users", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "No token provided" }, 401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const adminCheck = await pool.query("SELECT email, user_type FROM users WHERE id = $1", [decoded.id]);
    if (adminCheck.rows.length === 0 || !isSuperAdminEmail(adminCheck.rows[0].email)) {
      return c.json({ error: "Unauthorized. Admin access only." }, 403);
    }
    const users = await pool.query(
      `SELECT id, email, username, display_name, auth_provider, user_type, 
              is_active, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    return c.json({ users: users.rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Update user type (super admins only)
adminRouter.patch("/api/admin/users/:userId", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "No token provided" }, 401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const adminCheck = await pool.query("SELECT email, user_type FROM users WHERE id = $1", [decoded.id]);
    if (adminCheck.rows.length === 0 || !isSuperAdminEmail(adminCheck.rows[0].email)) {
      return c.json({ error: "Unauthorized. Admin access only." }, 403);
    }
    const userId = c.req.param("userId");
    const { user_type } = await c.req.json();
    if (!["admin", "basic", "rapid_response"].includes(user_type)) {
      return c.json({ error: "Invalid user_type. Must be 'admin', 'basic' or 'rapid_response'" }, 400);
    }
    const result = await pool.query(
      `UPDATE users 
       SET user_type = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, email, username, display_name, user_type`,
      [user_type, userId]
    );
    if (result.rows.length === 0) return c.json({ error: "User not found" }, 404);
    return c.json({ message: "User type updated successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Error updating user type:", error);
    return c.json({ error: "Failed to update user type" }, 500);
  }
});


