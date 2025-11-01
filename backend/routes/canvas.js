import { Hono } from "hono";
import pool from "../config/database.js";
import jwt from "jsonwebtoken";
import { sendCanvasPartnerInvite } from "../utils/emailService.js";

export const canvasRouter = new Hono();

// Ensure new schema for extras (materials, notes, participants)
async function ensureCanvasSchema() {
  try {
    await pool.query(
      "ALTER TABLE canvas_markers ADD COLUMN IF NOT EXISTS materials TEXT[]"
    );
    await pool.query(
      "ALTER TABLE canvas_markers ADD COLUMN IF NOT EXISTS notes TEXT"
    );
    await pool.query(
      "ALTER TABLE canvas_markers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    );
    await pool.query(`
      CREATE TABLE IF NOT EXISTS canvas_marker_participants (
        marker_id INTEGER REFERENCES canvas_markers(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (marker_id, user_id)
      )
    `);
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_cmp_user ON canvas_marker_participants(user_id)"
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_cmp_marker ON canvas_marker_participants(marker_id)"
    );
  } catch (e) {
    console.warn("Canvas schema ensure failed:", e?.message || e);
  }
}

// Call schema ensure once on first import
ensureCanvasSchema();

// List markers (admin sees all; users see their own)
canvasRouter.get("/api/canvas-markers", async (c) => {
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
    if (userResult.rows.length === 0)
      return c.json({ error: "User not found" }, 404);

    const isAdmin = userResult.rows[0].user_type === "admin";
    const includeExpired =
      (c.req.query("includeExpired") || "false").toLowerCase() === "true";

    let query, params;
    if (isAdmin) {
      query = `
        SELECT 
          cm.id,
          cm.latitude,
          cm.longitude,
          cm.canvas_date as "canvasDate",
          cm.canvas_time as "canvasTime",
          cm.duration_hours as "durationHours",
          cm.created_at as "createdAt",
          cm.expires_at as "expiresAt",
          cm.created_by as "createdBy",
          cm.materials as materials,
          cm.notes as notes,
          u.email as "createdByEmail",
          COALESCE(u.display_name, u.username, u.email) as "createdByUsername"
        FROM canvas_markers cm
        LEFT JOIN users u ON cm.created_by = u.id
        WHERE cm.is_active = TRUE ${
          includeExpired ? "" : "AND cm.expires_at > NOW()"
        }
        ORDER BY cm.canvas_date ASC, cm.canvas_time ASC
      `;
      params = [];
    } else {
      query = `
        SELECT 
          cm.id,
          cm.latitude,
          cm.longitude,
          cm.canvas_date as "canvasDate",
          cm.canvas_time as "canvasTime",
          cm.duration_hours as "durationHours",
          cm.created_at as "createdAt",
          cm.expires_at as "expiresAt",
          cm.created_by as "createdBy",
          u.email as "createdByEmail",
          COALESCE(u.display_name, u.username, u.email) as "createdByUsername",
          cm.materials as materials,
          cm.notes as notes
        FROM canvas_markers cm
        LEFT JOIN users u ON cm.created_by = u.id
        WHERE cm.is_active = TRUE 
          ${includeExpired ? "" : "AND cm.expires_at > NOW()"}
          AND (
            cm.created_by = $1 OR EXISTS (
              SELECT 1 FROM canvas_marker_participants p
              WHERE p.marker_id = cm.id AND p.user_id = $1
            )
          )
        ORDER BY cm.canvas_date ASC, cm.canvas_time ASC
      `;
      params = [decoded.id];
    }

    const result = await pool.query(query, params);

    // Attach participants list per marker
    const markerIds = result.rows.map((r) => r.id);
    let participantsByMarker = {};
    if (markerIds.length > 0) {
      const pres = await pool.query(
        `SELECT p.marker_id, u.id as user_id, COALESCE(u.display_name, u.username, u.email) as name, u.email
         FROM canvas_marker_participants p
         JOIN users u ON u.id = p.user_id
         WHERE p.marker_id = ANY($1::int[])`,
        [markerIds]
      );
      participantsByMarker = pres.rows.reduce((acc, row) => {
        acc[row.marker_id] = acc[row.marker_id] || [];
        acc[row.marker_id].push({
          id: row.user_id,
          name: row.name,
          email: row.email,
        });
        return acc;
      }, {});
    }

    const withParticipants = result.rows.map((r) => ({
      ...r,
      participants: participantsByMarker[r.id] || [],
    }));

    return c.json({ markers: withParticipants, isAdmin });
  } catch (error) {
    console.error("Error fetching canvas markers:", error);
    return c.json({ error: "Failed to fetch canvas markers" }, 500);
  }
});

// Create marker
canvasRouter.post("/api/canvas-markers", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "No token provided" }, 401);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    const markerData = await c.req.json();
    const requiredFields = [
      "latitude",
      "longitude",
      "canvas_date",
      "canvas_time",
      "duration_hours",
    ];
    for (const field of requiredFields) {
      if (markerData[field] === undefined || markerData[field] === null) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    // Calculate expiration: canvas date/time + duration
    const canvasDateTime = new Date(
      `${markerData.canvas_date}T${markerData.canvas_time}`
    );
    const expiresAt = new Date(
      canvasDateTime.getTime() + markerData.duration_hours * 60 * 60 * 1000
    );

    const result = await pool.query(
      `
      INSERT INTO canvas_markers (latitude, longitude, canvas_date, canvas_time, duration_hours, expires_at, created_by, materials, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
      [
        markerData.latitude,
        markerData.longitude,
        markerData.canvas_date,
        markerData.canvas_time,
        markerData.duration_hours,
        expiresAt,
        decoded.id,
        Array.isArray(markerData.materials) ? markerData.materials : null,
        markerData.notes || null,
      ]
    );

    // Optional participants
    const participantIds = [];
    if (
      Array.isArray(markerData.participant_user_ids) &&
      markerData.participant_user_ids.length > 0
    ) {
      const markerId = result.rows[0].id;
      const validIds = markerData.participant_user_ids.filter((v) =>
        Number.isInteger(v)
      );
      participantIds.push(...validIds);
      const values = validIds.map((uid) => `(${markerId}, ${uid})`).join(",");
      if (values.length > 0) {
        await pool.query(
          `INSERT INTO canvas_marker_participants(marker_id, user_id) VALUES ${values} ON CONFLICT DO NOTHING`
        );
      }
    }

    // Send email notifications to partners
    if (participantIds.length > 0) {
      try {
        // Get creator info
        const creatorRes = await pool.query(
          `SELECT COALESCE(display_name, username, email) as name FROM users WHERE id = $1`,
          [decoded.id]
        );
        const inviterName = creatorRes.rows[0]?.name || "A team member";

        // Get partner details and send emails
        const partnersRes = await pool.query(
          `SELECT id, email, COALESCE(display_name, username, email) as name FROM users WHERE id = ANY($1::int[])`,
          [participantIds]
        );

        for (const partner of partnersRes.rows) {
          sendCanvasPartnerInvite({
            partnerEmail: partner.email,
            partnerName: partner.name,
            inviterName,
            canvasDate: markerData.canvas_date,
            canvasTime: markerData.canvas_time,
            durationHours: markerData.duration_hours,
            materials: markerData.materials || [],
            notes: markerData.notes || "",
            markerId: result.rows[0].id,
          }).catch((err) =>
            console.error(`Failed to send email to ${partner.email}:`, err)
          );
        }
      } catch (emailError) {
        console.error("Error sending partner notification emails:", emailError);
        // Don't fail the request if emails fail
      }
    }

    return c.json({
      message: "Canvas marker created successfully",
      markerId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error creating canvas marker:", error);
    return c.json({ error: "Failed to create canvas marker" }, 500);
  }
});

// Update marker (edit fields). Only notes editable after expiry. Creator or admin can edit.
canvasRouter.patch("/api/canvas-markers/:id", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "No token provided" }, 401);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    const markerId = parseInt(c.req.param("id"), 10);
    const body = await c.req.json();

    const mres = await pool.query(
      "SELECT created_by, expires_at FROM canvas_markers WHERE id = $1",
      [markerId]
    );
    if (mres.rows.length === 0)
      return c.json({ error: "Marker not found" }, 404);
    const marker = mres.rows[0];

    const ures = await pool.query("SELECT user_type FROM users WHERE id = $1", [
      decoded.id,
    ]);
    if (ures.rows.length === 0) return c.json({ error: "User not found" }, 404);
    const isAdmin = ures.rows[0].user_type === "admin";
    const isCreator = marker.created_by === decoded.id;
    if (!isAdmin && !isCreator) return c.json({ error: "Not authorized" }, 403);

    const now = new Date();
    const expired = new Date(marker.expires_at) <= now;

    // Build updates
    const updates = [];
    const values = [];
    let idx = 1;

    if (expired) {
      // Only allow notes updates for expired markers (unless admin)
      if (body.notes !== undefined) {
        updates.push(`notes = $${idx++}`);
        values.push(body.notes);
      }
    } else {
      if (body.canvas_date) {
        updates.push(`canvas_date = $${idx++}`);
        values.push(body.canvas_date);
      }
      if (body.canvas_time) {
        updates.push(`canvas_time = $${idx++}`);
        values.push(body.canvas_time);
      }
      if (body.duration_hours) {
        updates.push(`duration_hours = $${idx++}`);
        values.push(body.duration_hours);
      }
      // Allow clearing materials with empty array as well
      if (body.materials !== undefined) {
        updates.push(`materials = $${idx++}`);
        values.push(Array.isArray(body.materials) ? body.materials : null);
      }
      if (body.notes !== undefined) {
        updates.push(`notes = $${idx++}`);
        values.push(body.notes);
      }
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      await pool.query(
        `UPDATE canvas_markers SET ${updates.join(", ")} WHERE id = $${idx}`,
        [...values, markerId]
      );
    }

    // Participants update (only before expiry, or if admin can update anytime)
    if ((!expired || isAdmin) && Array.isArray(body.participant_user_ids)) {
      // Get existing participants before update
      const existingRes = await pool.query(
        "SELECT user_id FROM canvas_marker_participants WHERE marker_id = $1",
        [markerId]
      );
      const existingIds = new Set(existingRes.rows.map((r) => r.user_id));

      // Replace participants set
      await pool.query(
        "DELETE FROM canvas_marker_participants WHERE marker_id = $1",
        [markerId]
      );

      const newParticipantIds = body.participant_user_ids.filter((v) =>
        Number.isInteger(v)
      );

      if (newParticipantIds.length > 0) {
        const inserts = newParticipantIds
          .map((uid) => `(${markerId}, ${uid})`)
          .join(",");
        await pool.query(
          `INSERT INTO canvas_marker_participants(marker_id, user_id) VALUES ${inserts} ON CONFLICT DO NOTHING`
        );
      }

      // Identify newly added partners (not in existing set)
      const newlyAddedIds = newParticipantIds.filter(
        (id) => !existingIds.has(id)
      );

      // Send email notifications to newly added partners
      if (newlyAddedIds.length > 0) {
        try {
          // Get creator/editor info
          const editorRes = await pool.query(
            `SELECT COALESCE(display_name, username, email) as name FROM users WHERE id = $1`,
            [decoded.id]
          );
          const inviterName = editorRes.rows[0]?.name || "A team member";

          // Get marker details for email
          const markerRes = await pool.query(
            `SELECT canvas_date, canvas_time, duration_hours, materials, notes FROM canvas_markers WHERE id = $1`,
            [markerId]
          );
          const markerDetails = markerRes.rows[0];

          // Get newly added partner details and send emails
          const partnersRes = await pool.query(
            `SELECT id, email, COALESCE(display_name, username, email) as name FROM users WHERE id = ANY($1::int[])`,
            [newlyAddedIds]
          );

          for (const partner of partnersRes.rows) {
            sendCanvasPartnerInvite({
              partnerEmail: partner.email,
              partnerName: partner.name,
              inviterName,
              canvasDate: markerDetails.canvas_date,
              canvasTime: markerDetails.canvas_time,
              durationHours: markerDetails.duration_hours,
              materials:
                body.materials !== undefined
                  ? body.materials
                  : markerDetails.materials || [],
              notes:
                body.notes !== undefined
                  ? body.notes
                  : markerDetails.notes || "",
              markerId: id,
            }).catch((err) =>
              console.error(`Failed to send email to ${partner.email}:`, err)
            );
          }
        } catch (emailError) {
          console.error(
            "Error sending partner notification emails:",
            emailError
          );
          // Don't fail the request if emails fail
        }
      }
    }

    return c.json({ message: "Canvas marker updated" });
  } catch (error) {
    console.error("Error updating canvas marker:", error);
    return c.json({ error: "Failed to update canvas marker" }, 500);
  }
});

// Lightweight user list for participants selection
canvasRouter.get("/api/canvas-users", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "No token provided" }, 401);
    jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

    const res = await pool.query(
      `SELECT id, email, COALESCE(display_name, username, email) as name FROM users WHERE is_active = TRUE ORDER BY name NULLS LAST, email`
    );
    return c.json({ users: res.rows });
  } catch (error) {
    console.error("Error fetching canvas users:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Delete marker (admin only)
canvasRouter.delete("/api/canvas-markers/:id", async (c) => {
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
    if (userResult.rows.length === 0)
      return c.json({ error: "User not found" }, 404);
    if (userResult.rows[0].user_type !== "admin")
      return c.json({ error: "Admin access required" }, 403);

    const markerId = c.req.param("id");
    const result = await pool.query(
      `DELETE FROM canvas_markers WHERE id = $1 RETURNING id`,
      [markerId]
    );
    if (result.rows.length === 0)
      return c.json({ error: "Marker not found" }, 404);

    return c.json({
      message: "Canvas marker deleted successfully",
      markerId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error deleting canvas marker:", error);
    return c.json({ error: "Failed to delete canvas marker" }, 500);
  }
});
