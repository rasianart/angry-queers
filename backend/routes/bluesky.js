import { Hono } from "hono";
import blueskyService from "../services/blueskyService.js";

export const blueskyRouter = new Hono();

blueskyRouter.get("/api/bluesky-feed", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit")) || 25;
    const searchType = c.req.query("type") || "ice-sightings";
    let posts = [];
    if (searchType === "ice-sightings") {
      posts = await blueskyService.searchPosts([
        "ICE sighting",
        "ICE",
        "immigration",
        "deportation",
        "Chicago",
        "Chi",
        "Illinois",
        "ICE raid",
        "ICE check",
        "ICE enforcement",
        "border patrol",
        "detention",
        "ICE agent",
      ], limit);
    } else if (searchType === "unraveled") {
      posts = await blueskyService.getUserPosts("did:plc:s4t4ce7wbksdau5aqb5aqa4u", limit);
    } else if (searchType === "nullifie") {
      posts = await blueskyService.getUserPosts("nullifie.bsky.social", limit);
    } else if (searchType === "50501chicago") {
      posts = await blueskyService.getUserPosts("50501chicago.bsky.social", limit);
    } else if (searchType === "libertyovergov") {
      posts = await blueskyService.getUserPosts("libertyovergov.bsky.social", limit);
    } else {
      posts = await blueskyService.searchPosts([
        "ICE sighting",
        "ICE",
        "immigration",
        "deportation",
        "Chicago",
        "Chi",
        "Illinois",
        "ICE raid",
        "ICE check",
        "ICE enforcement",
        "border patrol",
        "detention",
        "ICE agent",
      ], limit);
    }
    return c.json({
      posts: posts,
      message: `Successfully fetched ${posts.length} posts from Bluesky ${
        searchType === "ice-sightings" ? "from Block Club Chicago (@blockclubchi.bsky.social)"
        : searchType === "unraveled" ? "from Unraveled (@unraveledpress.bsky.social)"
        : searchType === "nullifie" ? "from nullifie (@nullifie.bsky.social)"
        : searchType === "50501chicago" ? "from 50501chicago (@50501chicago.bsky.social)"
        : searchType === "libertyovergov" ? "from libertyovergov (@libertyovergov.bsky.social)"
        : "from Block Club Chicago (@blockclubchi.bsky.social)"
      }`,
      searchType: searchType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (
      error.message.includes("Authentication failed") ||
      error.message.includes("credentials")
    ) {
      return c.json({
        posts: [],
        message: "Bluesky credentials not configured. Please add BLUESKY_HANDLE and BLUESKY_PASSWORD to your .env file",
        setup_required: true,
        error: "Bluesky credentials missing",
      }, 503);
    }
    return c.json({
      posts: [],
      message: "Failed to fetch Bluesky posts. Please check your Bluesky API configuration.",
      setup_required: true,
      error: error.message,
    }, 503);
  }
});

blueskyRouter.get("/api/bluesky-search", async (c) => {
  try {
    const keywords = c.req.query("keywords");
    const limit = parseInt(c.req.query("limit")) || 25;
    if (!keywords) return c.json({ error: "Keywords parameter is required" }, 400);
    const keywordArray = keywords.split(",").map((k) => k.trim());
    const posts = await blueskyService.searchPosts(keywordArray, limit);
    return c.json({
      posts: posts,
      keywords: keywordArray,
      message: `Found ${posts.length} posts matching keywords: ${keywordArray.join(", ")}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({
      posts: [],
      message: "Failed to search Bluesky posts",
      error: error.message,
    }, 500);
  }
});


