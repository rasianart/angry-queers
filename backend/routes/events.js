import { Hono } from "hono";
import pool from "../config/database.js";

export const eventsRouter = new Hono();

eventsRouter.get("/api/events", async (c) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        title,
        description,
        event_date as date,
        event_time as time,
        location,
        category,
        organizer,
        contact_email as contact,
        max_attendees as "maxAttendees",
        current_attendees as "currentAttendees",
        is_virtual as "isVirtual",
        virtual_link as "virtualLink",
        created_at as "createdAt"
      FROM events 
      ORDER BY event_date ASC, event_time ASC
    `);
    return c.json({ events: result.rows });
  } catch (error) {
    console.error("Error fetching events:", error);
    return c.json({ error: "Failed to fetch events" }, 500);
  }
});

eventsRouter.post("/api/events", async (c) => {
  try {
    const eventData = await c.req.json();
    const requiredFields = [
      "title",
      "description",
      "event_date",
      "event_time",
      "location",
      "category",
      "organizer",
      "contact_email",
    ];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    const result = await pool.query(
      `
      INSERT INTO events (title, description, event_date, event_time, location, category, organizer, contact_email, max_attendees, current_attendees, is_virtual, virtual_link)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `,
      [
        eventData.title,
        eventData.description,
        eventData.event_date,
        eventData.event_time,
        eventData.location,
        eventData.category,
        eventData.organizer,
        eventData.contact_email,
        eventData.max_attendees || null,
        eventData.current_attendees || 0,
        eventData.is_virtual || false,
        eventData.virtual_link || null,
      ]
    );
    return c.json({ message: "Event created successfully", eventId: result.rows[0].id });
  } catch (error) {
    console.error("Error creating event:", error);
    return c.json({ error: "Failed to create event" }, 500);
  }
});


