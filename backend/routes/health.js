import { Hono } from "hono";

export const healthRouter = new Hono();

healthRouter.get("/api/health", (c) => {
  return c.json({
    message: "Server is running!",
    timestamp: new Date().toISOString(),
  });
});


