import { Hono } from "hono";
import axios from "axios";

export const placesRouter = new Hono();

placesRouter.get("/api/google-maps-key", (c) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return c.json({ error: "Google Maps API key not configured" }, 500);
  return c.json({ apiKey });
});

placesRouter.get("/api/places/search", async (c) => {
  try {
    const query = c.req.query("query");
    const location = c.req.query("location");
    const radius = c.req.query("radius") || "5000";
    if (!query) return c.json({ error: "Query parameter is required" }, 400);
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return c.json({ error: "Google Maps API key not configured" }, 500);
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    if (location) url += `&location=${location}&radius=${radius}`;
    const response = await axios.get(url);
    const places = response.data.results.map((place) => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      geometry: place.geometry,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types,
      photos: place.photos ? place.photos.slice(0, 3) : [],
    }));
    return c.json({ places });
  } catch (error) {
    console.error("Places API error:", error.response?.data || error.message);
    return c.json({ error: "Failed to search places" }, 500);
  }
});

placesRouter.get("/api/places/nearby", async (c) => {
  try {
    const lat = c.req.query("lat");
    const lng = c.req.query("lng");
    const radius = c.req.query("radius") || "1000";
    const type = c.req.query("type") || "establishment";
    if (!lat || !lng) return c.json({ error: "Latitude and longitude parameters are required" }, 400);
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return c.json({ error: "Google Maps API key not configured" }, 500);
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;
    const response = await axios.get(url);
    const places = response.data.results.map((place) => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.vicinity || place.formatted_address,
      geometry: place.geometry,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types,
      photos: place.photos ? place.photos.slice(0, 3) : [],
      price_level: place.price_level,
      opening_hours: place.opening_hours,
    }));
    return c.json({ places });
  } catch (error) {
    console.error("Nearby places API error:", error.response?.data || error.message);
    return c.json({ error: "Failed to search nearby places" }, 500);
  }
});

placesRouter.get("/api/places/details/:placeId", async (c) => {
  try {
    const placeId = c.req.param("placeId");
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return c.json({ error: "Google Maps API key not configured" }, 500);
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,types,photos,website,formatted_phone_number&key=${apiKey}`;
    const response = await axios.get(url);
    const place = response.data.result;
    return c.json({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      geometry: place.geometry,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types,
      photos: place.photos || [],
      website: place.website,
      phone: place.formatted_phone_number,
    });
  } catch (error) {
    console.error("Place details error:", error.response?.data || error.message);
    return c.json({ error: "Failed to get place details" }, 500);
  }
});

placesRouter.get("/api/places/autocomplete", async (c) => {
  try {
    const input = c.req.query("input");
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!input || !apiKey) return c.json({ error: "Input parameter and API key are required" }, 400);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&types=establishment|geocode&components=country:us&location=41.8781,-87.6298&radius=50000`
    );
    if (!response.ok) throw new Error(`Google Places API error: ${response.status}`);
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("Error fetching place suggestions:", error);
    return c.json({ error: "Failed to fetch place suggestions" }, 500);
  }
});


