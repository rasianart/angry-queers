import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
// all auth/admin routes moved to routes/*
//

dotenv.config();

// Import database connection
import pool from "./config/database.js";

import { buildApi } from "./routes/index.js";

const app = new Hono();
//

const PORT = process.env.PORT || 3001;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use("*", cors());

// Routes
// Mount modular API routes
app.route("/", buildApi());

// Canvas routes moved to routes/canvas.js

// Google Places Autocomplete proxy endpoint
// Autocomplete proxy moved to routes/places.js

// Serve static files from React build (for production)
if (process.env.NODE_ENV === "production") {
  app.use(
    "/*",
    serveStatic({
      root: path.join(__dirname, "../frontend/dist"),
      rewriteRequestPath: (path) => {
        // Serve index.html for all non-API routes
        if (!path.startsWith("/api")) {
          return "/index.html";
        }
        return path;
      },
    })
  );
}

// Server will only start when explicitly called
// To start the server, run: npm start or npm run dev
const server = serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`🚀 Server is running on port ${PORT}`);

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("\nShutting down server gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\nShutting down server gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Serve static files from the frontend dist directory
const frontendDistPath = path.join(__dirname, "../frontend/dist");
app.use("/*", serveStatic({ root: frontendDistPath }));

// Server startup is handled above
