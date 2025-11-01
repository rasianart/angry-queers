import { BskyAgent } from "@atproto/api";

class BlueskyService {
  constructor() {
    this.agent = new BskyAgent({ service: "https://bsky.social" });
    this.isAuthenticated = false;
  }

  async authenticate() {
    try {
      const handle = process.env.BLUESKY_HANDLE;
      const password = process.env.BLUESKY_PASSWORD;

      if (!handle || !password) {
        throw new Error("Bluesky credentials not configured");
      }

      await this.agent.login({ identifier: handle, password: password });
      this.isAuthenticated = true;
      console.log("✅ Bluesky authentication successful");
      return true;
    } catch (error) {
      console.error("❌ Bluesky authentication failed:", error.message);
      this.isAuthenticated = false;
      return false;
    }
  }

  async searchPosts(
    keywords = ["ICE sighting", "Chicago", "ICE", "immigration"],
    limit = 50
  ) {
    try {
      if (!this.isAuthenticated) {
        const authResult = await this.authenticate();
        if (!authResult) {
          throw new Error("Authentication failed");
        }
      }

      console.log(
        "🔍 Fetching posts from Block Club Chicago (@blockclubchi.bsky.social)..."
      );

      // Get posts from Block Club Chicago's profile
      const blockClubHandle = "blockclubchi.bsky.social";

      try {
        // First, get the user's profile to get their DID
        const profileResponse = await this.agent.api.app.bsky.actor.getProfile({
          actor: blockClubHandle,
        });

        if (!profileResponse.data) {
          throw new Error(`Could not find profile for @${blockClubHandle}`);
        }

        const userDid = profileResponse.data.did;
        console.log(`📰 Found Block Club Chicago profile: ${userDid}`);

        // Get the user's posts
        const postsResponse = await this.agent.api.app.bsky.feed.getAuthorFeed({
          actor: blockClubHandle,
          limit: Math.min(limit, 100),
        });

        if (!postsResponse.data || !postsResponse.data.feed) {
          console.log("No posts found from Block Club Chicago");
          return [];
        }

        console.log(
          `📰 Found ${postsResponse.data.feed.length} posts from Block Club Chicago`
        );

        // Transform posts to our format
        const formattedPosts = postsResponse.data.feed.map((feedItem) => {
          const post = feedItem.post;
          return {
            id: post.uri,
            username: post.author.handle,
            displayName: post.author.displayName || post.author.handle,
            text: post.record.text,
            createdAt: post.record.createdAt,
            replyCount: post.replyCount || 0,
            repostCount: post.repostCount || 0,
            likeCount: post.likeCount || 0,
            uri: post.uri,
            cid: post.cid,
            author: {
              handle: post.author.handle,
              displayName: post.author.displayName,
              avatar: post.author.avatar,
              did: post.author.did,
            },
            images: post.record.embed?.images || [],
            links: post.record.embed?.external || null,
            isFallback: false,
          };
        });

        // Sort by creation date (most recent first)
        formattedPosts.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        console.log(
          `✅ Successfully fetched ${formattedPosts.length} posts from Block Club Chicago`
        );
        return formattedPosts;
      } catch (error) {
        console.error(
          `Error fetching posts from @${blockClubHandle}:`,
          error.message
        );

        // Fallback: try to get posts from timeline if Block Club Chicago fails
        console.log("🔄 Falling back to general timeline...");

        const timelineResponse = await this.agent.getTimeline({
          limit: Math.min(limit, 100),
        });

        if (timelineResponse.data && timelineResponse.data.feed) {
          const fallbackPosts = timelineResponse.data.feed
            .slice(0, Math.min(limit, 10))
            .map((feedItem) => {
              const post = feedItem.post;
              return {
                id: post.uri,
                username: post.author.handle,
                displayName: post.author.displayName || post.author.handle,
                text: post.record.text,
                createdAt: post.record.createdAt,
                replyCount: post.replyCount || 0,
                repostCount: post.repostCount || 0,
                likeCount: post.likeCount || 0,
                uri: post.uri,
                cid: post.cid,
                author: {
                  handle: post.author.handle,
                  displayName: post.author.displayName,
                  avatar: post.author.avatar,
                  did: post.author.did,
                },
                images: post.record.embed?.images || [],
                links: post.record.embed?.external || null,
                isFallback: true,
              };
            });

          console.log(
            `🔄 Using ${fallbackPosts.length} fallback posts from timeline`
          );
          return fallbackPosts;
        }

        return [];
      }
    } catch (error) {
      console.error("Error searching Bluesky posts:", error);
      throw error;
    }
  }

  buildSearchQuery(keywords) {
    // Build a comprehensive search query for ICE sightings in Chicago
    // Use simpler, more effective search terms
    const searchTerms = [
      "ICE",
      "immigration",
      "deportation",
      "Chicago",
      "ICE sighting",
      "ICE raid",
      "ICE check",
      "border patrol",
      "detention",
      "ICE agent",
      "ICE enforcement",
    ];

    // Create a simpler search query - Bluesky search works better with individual terms
    return searchTerms.join(" ");
  }

  async getPublicTimeline(limit = 50) {
    try {
      if (!this.isAuthenticated) {
        const authResult = await this.authenticate();
        if (!authResult) {
          throw new Error("Authentication failed");
        }
      }

      // Get posts from the algorithm feed (public posts from various users)
      console.log("📱 Getting public timeline posts...");

      const response = await this.agent.getTimeline({
        algorithm: "reverse-chronological",
        limit: Math.min(limit, 100), // Bluesky API limit is 100
      });

      if (!response.data || !response.data.feed) {
        console.log("No posts found in public timeline");
        return [];
      }

      console.log(
        `Found ${response.data.feed.length} posts in public timeline`
      );

      // Transform all posts to our format
      const formattedPosts = response.data.feed.map((post) => ({
        id: post.post.uri,
        username: post.post.author.handle,
        displayName: post.post.author.displayName || post.post.author.handle,
        text: post.post.record.text,
        createdAt: post.post.record.createdAt,
        replyCount: post.post.replyCount || 0,
        repostCount: post.post.repostCount || 0,
        likeCount: post.post.likeCount || 0,
        uri: post.post.uri,
        cid: post.post.cid,
        author: {
          handle: post.post.author.handle,
          displayName: post.post.author.displayName,
          avatar: post.post.author.avatar,
          did: post.post.author.did,
        },
        images: post.post.record.embed?.images || [],
        links: post.post.record.embed?.external || null,
      }));

      // Sort by creation date (most recent first)
      formattedPosts.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      return formattedPosts;
    } catch (error) {
      console.error("Error getting Bluesky timeline:", error);
      throw error;
    }
  }

  async getUserPosts(username, limit = 50) {
    try {
      if (!this.isAuthenticated) {
        const authResult = await this.authenticate();
        if (!authResult) {
          throw new Error("Authentication failed");
        }
      }

      console.log(`🔍 Fetching posts from @${username}...`);

      try {
        // First, get the user's profile to get their DID
        const profileResponse = await this.agent.api.app.bsky.actor.getProfile({
          actor: username,
        });

        if (!profileResponse.data) {
          throw new Error(`Could not find profile for @${username}`);
        }

        const userDid = profileResponse.data.did;
        console.log(`📰 Found ${username} profile: ${userDid}`);

        // Get the user's posts
        const postsResponse = await this.agent.api.app.bsky.feed.getAuthorFeed({
          actor: username,
          limit: Math.min(limit, 100),
        });

        if (!postsResponse.data || !postsResponse.data.feed) {
          console.log(`No posts found from @${username}`);
          return [];
        }

        console.log(
          `📰 Found ${postsResponse.data.feed.length} posts from @${username}`
        );

        // Transform posts to our format
        const formattedPosts = postsResponse.data.feed.map((feedItem) => {
          const post = feedItem.post;
          return {
            id: post.uri,
            username: post.author.handle,
            displayName: post.author.displayName || post.author.handle,
            text: post.record.text,
            createdAt: post.record.createdAt,
            replyCount: post.replyCount || 0,
            repostCount: post.repostCount || 0,
            likeCount: post.likeCount || 0,
            uri: post.uri,
            cid: post.cid,
            author: {
              handle: post.author.handle,
              displayName: post.author.displayName,
              avatar: post.author.avatar,
              did: post.author.did,
            },
            images: post.record.embed?.images || [],
            links: post.record.embed?.external || null,
            isFallback: false,
          };
        });

        // Sort by creation date (most recent first)
        formattedPosts.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        console.log(
          `✅ Successfully fetched ${formattedPosts.length} posts from @${username}`
        );
        return formattedPosts;
      } catch (error) {
        console.error(`Error fetching posts from @${username}:`, error.message);

        // Fallback: try to get posts from timeline if user fails
        console.log("🔄 Falling back to general timeline...");

        const timelineResponse = await this.agent.getTimeline({
          limit: Math.min(limit, 100),
        });

        if (timelineResponse.data && timelineResponse.data.feed) {
          const fallbackPosts = timelineResponse.data.feed
            .slice(0, Math.min(limit, 10))
            .map((feedItem) => {
              const post = feedItem.post;
              return {
                id: post.uri,
                username: post.author.handle,
                displayName: post.author.displayName || post.author.handle,
                text: post.record.text,
                createdAt: post.record.createdAt,
                replyCount: post.replyCount || 0,
                repostCount: post.repostCount || 0,
                likeCount: post.likeCount || 0,
                uri: post.uri,
                cid: post.cid,
                author: {
                  handle: post.author.handle,
                  displayName: post.author.displayName,
                  avatar: post.author.avatar,
                  did: post.author.did,
                },
                images: post.record.embed?.images || [],
                links: post.record.embed?.external || null,
                isFallback: true,
              };
            });

          console.log(
            `🔄 Using ${fallbackPosts.length} fallback posts from timeline`
          );
          return fallbackPosts;
        }

        return [];
      }
    } catch (error) {
      console.error("Error getting user posts:", error);
      throw error;
    }
  }
}

export default new BlueskyService();
