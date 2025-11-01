import { Hono } from "hono";
import axios from "axios";

export const instagramRouter = new Hono();

instagramRouter.get("/api/instagram/callback", async (c) => {
  try {
    const code = c.req.query("code");
    const error = c.req.query("error");
    if (error) return c.json({ error: `Instagram authorization error: ${error}` }, 400);
    if (!code) return c.json({ error: "No authorization code received" }, 400);
    const tokenResponse = await axios.post("https://api.instagram.com/oauth/access_token", {
      client_id: process.env.INSTAGRAM_APP_ID,
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      grant_type: "authorization_code",
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      code: code,
    });
    const { access_token, user_id } = tokenResponse.data;
    return c.json({
      message: "Instagram authorization successful",
      access_token: access_token,
      user_id: user_id,
      note: "Store this access token securely for future API calls",
    });
  } catch (error) {
    console.error("Instagram OAuth error:", error.response?.data || error.message);
    return c.json({ error: "Failed to complete Instagram authorization" }, 500);
  }
});

instagramRouter.get("/api/instagram-feed", async (c) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      return c.json({
        posts: [],
        message: "Instagram access token not configured. Please add INSTAGRAM_ACCESS_TOKEN to your .env file",
        setup_required: true,
        error: "Instagram access token missing",
      }, 503);
    }
    try {
      const profileResponse = await axios.get(
        `https://graph.instagram.com/me?fields=id,username,media_count&access_token=${accessToken}`
      );
      const { id: userId, username } = profileResponse.data;
      const mediaResponse = await axios.get(
        `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}&limit=25`
      );
      const posts = mediaResponse.data.data.map((post) => ({
        id: post.id,
        username: username,
        caption: post.caption || "No caption available",
        media_url: post.media_url,
        media_type: post.media_type,
        timestamp: post.timestamp,
        permalink: post.permalink,
        likes_count: post.like_count || 0,
        comments_count: post.comments_count || 0,
      }));
      posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return c.json({
        posts: posts,
        message: `Successfully fetched ${posts.length} posts from @${username}`,
        setup_required: false,
        user_info: { username: username, total_posts: profileResponse.data.media_count },
      });
    } catch (apiError) {
      if (apiError.response?.data?.error?.code === 190) {
        return c.json({
          posts: [],
          message: "Instagram access token is invalid or expired. Please generate a new access token.",
          setup_required: true,
          error: "Invalid or expired access token",
        }, 401);
      }
      return c.json({
        posts: [],
        message: "Failed to fetch Instagram posts. Please check your Instagram API configuration.",
        setup_required: true,
        error: apiError.response?.data || apiError.message,
      }, 503);
    }
  } catch (error) {
    console.error("Error fetching Instagram feed:", error);
    return c.json({ error: "Failed to fetch Instagram feed" }, 500);
  }
});

instagramRouter.get("/api/instagram-config", (c) => {
  const instagramUserId = process.env.INSTAGRAM_USER_ID;
  const instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!instagramUserId || !instagramAccessToken) {
    return c.json({
      error: "Instagram credentials not configured",
      message: "Please add INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN to your .env file",
      setup_required: true,
    }, 503);
  }
  return c.json({
    userId: instagramUserId,
    accessToken: instagramAccessToken,
    message: "Instagram configuration loaded successfully",
    timestamp: new Date().toISOString(),
  });
});

instagramRouter.get("/api/instagram-account/:account", (c) => {
  const account = c.req.param("account");
  let instagramUserId, instagramAccessToken;
  if (account === "southwestrapidresponse") {
    instagramUserId = process.env.SWRR_INSTAGRAM_USER_ID;
    instagramAccessToken = process.env.SWRR_INSTAGRAM_ACCESS_TOKEN;
  } else {
    instagramUserId = process.env.INSTAGRAM_USER_ID;
    instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  }
  if (!instagramUserId || !instagramAccessToken) {
    return c.json({
      error: `Instagram credentials not configured for ${account}`,
      message: `Please add ${account === "southwestrapidresponse" ? "SWRR_INSTAGRAM_USER_ID and SWRR_INSTAGRAM_ACCESS_TOKEN" : "INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN"} to your .env file`,
      setup_required: true,
    }, 503);
  }
  return c.json({
    userId: instagramUserId,
    accessToken: instagramAccessToken,
    account: account,
    message: `Instagram configuration loaded successfully for ${account}`,
    timestamp: new Date().toISOString(),
  });
});


