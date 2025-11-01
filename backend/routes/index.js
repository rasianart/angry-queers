import { Hono } from "hono";
import { eventsRouter } from "./events.js";
import { iceAlertsRouter } from "./iceAlerts.js";
import { authRouter } from "./auth.js";
import { adminRouter } from "./admin.js";
import { invitesRouter } from "./invites.js";
import { placesRouter } from "./places.js";
import { instagramRouter } from "./instagram.js";
import { blueskyRouter } from "./bluesky.js";
import { healthRouter } from "./health.js";
import { canvasRouter } from "./canvas.js";

export function buildApi() {
  const api = new Hono();
  api.route("/", healthRouter);
  api.route("/", authRouter);
  api.route("/", adminRouter);
  api.route("/", invitesRouter);
  api.route("/", placesRouter);
  api.route("/", eventsRouter);
  api.route("/", iceAlertsRouter);
  api.route("/", canvasRouter);
  api.route("/", blueskyRouter);
  api.route("/", instagramRouter);
  return api;
}
