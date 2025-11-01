import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "path";
import fs from "fs";
import multer from "multer";
import NodeClam from "clamscan";
import { fileURLToPath } from "url";
import pool from "../config/database.js";
import jwt from "jsonwebtoken";

export const iceAlertsRouter = new Hono();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads");
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch {}

// Serve uploaded files at /uploads/filename
iceAlertsRouter.use(
  "/uploads/*",
  serveStatic({
    root: uploadsDir,
    rewriteRequestPath: (p) => p.replace(/^\/uploads/, ""),
  })
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9-_]/gi, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only JPG/PNG/WEBP images are allowed"));
  },
});

async function getClam() {
  const clamscan = await new NodeClam().init({
    removeInfected: false,
    quarantineInfected: false,
    scanLog: null,
    debugMode: false,
    preference: "clamdscan",
    clamdscan: {
      socket: false,
      host: process.env.CLAMAV_HOST || "clamav",
      port: parseInt(process.env.CLAMAV_PORT || "3310", 10),
      timeout: 60000,
      localFallback: false,
    },
  });
  return clamscan;
}

// Upload endpoint (Hono FormData path is used, multer kept for parity but unused in Hono fetch handler)
iceAlertsRouter.post("/api/alert/upload", async (c) => {
  try {
    const contentType = c.req.header("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return c.json({ error: "Invalid content type" }, 400);
    }
    const form = await c.req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return c.json({ error: "Only JPG/PNG/WEBP images are allowed" }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > 5 * 1024 * 1024) {
      return c.json({ error: "Image too large (max 5 MB)" }, 400);
    }

    const orig = file.name || "upload";
    const ext = path.extname(orig).toLowerCase() || ".jpg";
    const base = path.basename(orig, ext).replace(/[^a-z0-9-_]/gi, "_");
    const filename = `${Date.now()}_${base}${ext}`;
    const fullpath = path.join(uploadsDir, filename);

    fs.writeFileSync(fullpath, buffer);

    try {
      const cl = await getClam();
      const { isInfected, viruses } = await cl.isInfected(fullpath);
      if (isInfected) {
        fs.unlink(fullpath, () => {});
        return c.json(
          { error: `File failed virus scan${viruses ? `: ${viruses}` : ""}` },
          400
        );
      }
    } catch (scanErr) {
      const allowSkip =
        process.env.SKIP_CLAMAV_ON_FAIL === "true" ||
        process.env.NODE_ENV === "development";
      console.warn("ClamAV scan failed:", scanErr?.message || scanErr);
      if (!allowSkip) {
        fs.unlink(fullpath, () => {});
        return c.json({ error: "Virus scanner unavailable" }, 503);
      }
    }

    const forwardedProto = c.req.header("x-forwarded-proto");
    const forwardedHost = c.req.header("x-forwarded-host");
    const host = c.req.header("host");
    const inferredBase = `${forwardedProto || "http"}://${
      forwardedHost || host || "localhost:5001"
    }`;
    const baseUrl = process.env.BACKEND_PUBLIC_URL || inferredBase;
    const publicUrl = `/uploads/${filename}`;
    return c.json({ url: `${baseUrl}${publicUrl}` });
  } catch (e) {
    console.error("Upload processing error:", e);
    return c.json(
      { error: `Upload processing failed: ${e?.message || e}` },
      500
    );
  }
});

// Create alert
iceAlertsRouter.post("/api/ice-alerts", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "No token provided" }, 401);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    const alertData = await c.req.json();
    const requiredFields = [
      "latitude",
      "longitude",
      "alert_type",
      "reported_at",
    ];
    for (const field of requiredFields) {
      if (alertData[field] === undefined || alertData[field] === null) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    const validAlertTypes = ["raiding", "checkpoint", "surveillance", "other"];
    if (!validAlertTypes.includes(alertData.alert_type)) {
      return c.json(
        {
          error: `Invalid alert_type. Must be one of: ${validAlertTypes.join(
            ", "
          )}`,
        },
        400
      );
    }

    const reportedAt = new Date(alertData.reported_at);
    const expiresAt = new Date(
      reportedAt.getTime() + (alertData.duration_hours || 4) * 60 * 60 * 1000
    );

    await pool.query(
      "ALTER TABLE ice_alerts ADD COLUMN IF NOT EXISTS image_url TEXT"
    );

    const result = await pool.query(
      `
      INSERT INTO ice_alerts (
        latitude, 
        longitude, 
        location_description, 
        alert_type, 
        description, 
        image_url,
        reported_at, 
        expires_at, 
        reported_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
      [
        alertData.latitude,
        alertData.longitude,
        alertData.location_description || null,
        alertData.alert_type,
        alertData.description || null,
        alertData.image_url || null,
        reportedAt,
        expiresAt,
        decoded.id,
      ]
    );

    return c.json({
      message: "ICE alert created successfully",
      alertId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error creating ICE alert:", error);
    return c.json({ error: "Failed to create ICE alert" }, 500);
  }
});

// List active alerts (role-based visibility)
iceAlertsRouter.get("/api/ice-alerts", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1] || null;
    let viewerType = null;
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "your-secret-key"
        );
        const ures = await pool.query(
          "SELECT user_type FROM users WHERE id = $1",
          [decoded.id]
        );
        viewerType = ures.rows[0]?.user_type || null;
      } catch {}
    }
    const canSeeAll = viewerType === "admin" || viewerType === "rapid_response";

    const result = await pool.query(
      `
      SELECT 
        ia.id,
        ia.latitude,
        ia.longitude,
        ia.location_description as "locationDescription",
        ia.alert_type as "alertType",
        ia.description,
        ia.image_url as "imageUrl",
        ia.reported_at as "reportedAt",
        ia.expires_at as "expiresAt",
        ia.verified,
        ia.created_at as "createdAt",
        u2.user_type as "verifiedByType"
      FROM ice_alerts ia
      LEFT JOIN users u2 ON u2.id = ia.verified_by
      WHERE ia.expires_at > NOW()
        ${canSeeAll ? "" : "AND ia.verified = TRUE"}
      ORDER BY ia.reported_at DESC, ia.verified DESC
      LIMIT 100
    `
    );
    return c.json({ alerts: result.rows });
  } catch (error) {
    console.error("Error fetching ICE alerts:", error);
    return c.json({ error: "Failed to fetch ICE alerts" }, 500);
  }
});

// Legacy route-safety feed from alerts
iceAlertsRouter.get("/api/ice-activity", async (c) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        ia.id as id,
        latitude::float as lat,
        longitude::float as lng,
        reported_at as timestamp,
        description,
        CASE 
          WHEN alert_type = 'raiding' THEN 'high'
          WHEN alert_type = 'checkpoint' THEN 'high'
          WHEN alert_type = 'surveillance' THEN 'medium'
          ELSE 'low'
        END as severity,
        COALESCE(u.username, u.email, 'Community Member') as "reportedBy"
      FROM ice_alerts ia
      LEFT JOIN users u ON ia.reported_by = u.id
      WHERE (expires_at > NOW()) OR (reported_at > NOW() - INTERVAL '24 hours')
      ORDER BY reported_at DESC
      LIMIT 50
    `
    );

    const activities = result.rows.map((row) => ({
      id: row.id.toString(),
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      timestamp: row.timestamp,
      description: row.description || `ICE ${row.severity} activity reported`,
      severity: row.severity,
      reportedBy: row.reportedBy,
    }));

    return c.json({ activities });
  } catch (error) {
    console.error("Error fetching ICE activity:", error);
    return c.json({ error: "Failed to fetch ICE activity" }, 500);
  }
});

// Verify toggle
iceAlertsRouter.patch("/api/ice-alerts/:id/verify", async (c) => {
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
    const user = userResult.rows[0];
    if (user.user_type !== "admin" && user.user_type !== "rapid_response") {
      return c.json({ error: "Admin or rapid response access required" }, 403);
    }

    const alertId = c.req.param("id");
    const { verified } = await c.req.json();
    const result = await pool.query(
      `
      UPDATE ice_alerts 
      SET verified = $1, verified_by = $2, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, verified
    `,
      [verified === true, decoded.id, alertId]
    );
    if (result.rows.length === 0) {
      return c.json({ error: "Alert not found" }, 404);
    }
    return c.json({
      message: "Alert verification updated successfully",
      alertId: result.rows[0].id,
      verified: result.rows[0].verified,
    });
  } catch (error) {
    console.error("Error updating alert verification:", error);
    return c.json({ error: "Failed to update alert verification" }, 500);
  }
});
