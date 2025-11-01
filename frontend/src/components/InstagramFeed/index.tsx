import React, { useEffect, useState } from 'react';

interface InstagramPost {
  id: string;
  username: string;
  caption: string;
  media_url: string;
  media_type: string;
  timestamp: string;
  permalink: string;
  likes_count: number;
  comments_count: number;
}

interface InstagramFeedResponse {
  posts: InstagramPost[];
  message: string;
  setup_required?: boolean;
  error?: string;
}

interface InstagramFeedProps {
  limit?: number;
}

const InstagramFeed: React.FC<InstagramFeedProps> = ({ limit = 12 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<InstagramPost[]>([]);

  useEffect(() => {
    const fetchInstagramPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching Instagram posts...');
        const response = await fetch('/api/instagram-feed');
        const data: InstagramFeedResponse = await response.json();

        if (!response.ok || data.setup_required) {
          setError(data.message || 'Instagram configuration not available');
          setLoading(false);
          return;
        }

        console.log('Instagram posts loaded:', data.message);
        console.log('Posts count:', data.posts.length);

        setPosts(data.posts.slice(0, limit));
        setLoading(false);
      } catch (err) {
        console.error('Error loading Instagram posts:', err);
        setError('Failed to load Instagram posts');
        setLoading(false);
      }
    };

    fetchInstagramPosts();
  }, [limit]);

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className='bg-white rounded-lg shadow-md p-6'>
        <div className='flex justify-center items-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600'></div>
          <span className='ml-3 text-gray-600'>Loading Instagram posts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-red-700'>
        <p>⚠️ {error}</p>
        <p className='text-sm mt-2'>
          Please check your Instagram access token configuration.
        </p>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='mb-6'>
        <h2 className='text-xl font-semibold text-gray-800 mb-4'>
          Instagram Feed
        </h2>
        <p className='text-sm text-gray-600'>Recent posts from Instagram</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {posts.map(post => (
          <div
            key={post.id}
            className='instagram-post bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200'
          >
            <div className='relative'>
              <img
                src={post.media_url}
                alt={post.caption || 'Instagram post'}
                className='instagram-image w-full h-64 object-cover'
              />
              <div className='absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs'>
                {post.media_type === 'VIDEO' ? '📹' : '📷'}
              </div>
            </div>

            <div className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium text-gray-600'>
                  @{post.username}
                </span>
                <span className='text-xs text-gray-500'>
                  {formatTimestamp(post.timestamp)}
                </span>
              </div>

              {post.caption && (
                <p className='text-sm text-gray-800 mb-3 line-clamp-3'>
                  {post.caption}
                </p>
              )}

              <div className='flex items-center justify-between text-sm text-gray-500'>
                <div className='flex items-center space-x-4'>
                  <span className='flex items-center'>
                    ❤️ {post.likes_count}
                  </span>
                  <span className='flex items-center'>
                    💬 {post.comments_count}
                  </span>
                </div>
                <a
                  href={post.permalink}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-pink-600 hover:text-pink-800 font-medium'
                >
                  View Post →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className='mt-6 text-center text-sm text-gray-500'>
        <p>
          💡 This feed displays recent Instagram posts using the Instagram API
        </p>
      </div>
    </div>
  );
};

export default InstagramFeed;
