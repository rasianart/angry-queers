import React, { useState, useEffect } from 'react';

interface BlueskyPost {
  id: string;
  username: string;
  displayName: string;
  text: string;
  createdAt: string;
  replyCount: number;
  repostCount: number;
  likeCount: number;
  uri: string;
  cid: string;
  author: {
    handle: string;
    displayName: string;
    avatar: string;
    did: string;
  };
  images: any[];
  links: any;
  isFallback?: boolean;
}

interface BlueskyFeedResponse {
  posts: BlueskyPost[];
  message: string;
  searchType?: string;
  timestamp: string;
}

const BlueskyFeed: React.FC = () => {
  const [posts, setPosts] = useState<BlueskyPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<string>('ice-sightings');

  useEffect(() => {
    fetchBlueskyFeed();
  }, [searchType]);

  const fetchBlueskyFeed = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/bluesky-feed?type=${searchType}&limit=25`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Bluesky feed');
      }

      const data: BlueskyFeedResponse = await response.json();
      console.log('Bluesky feed data:', data);
      setPosts(data.posts);
      setError(null);
    } catch (err) {
      console.error('Error fetching Bluesky feed:', err);
      setError('Failed to load Bluesky feed');
    } finally {
      setLoading(false);
    }
  };

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

  const formatPostText = (text: string): string => {
    // Simple URL detection and formatting
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>'
    );
  };

  const handleSearchTypeChange = (type: string) => {
    setSearchType(type);
  };

  // Remove the loading return - we'll show loading state within the component

  if (error) {
    return (
      <div className='bg-white rounded-lg shadow-md p-6'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-red-700'>
          <p>⚠️ {error}</p>
          <p className='text-sm mt-2'>Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-6'>
      {/* Header with search type toggle */}
      <div className='mb-6'>
        <div className='-mx-4 px-4 overflow-x-auto'>
          <div className='flex flex-nowrap gap-2 mb-4'>
            <button
              onClick={() => handleSearchTypeChange('ice-sightings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                searchType === 'ice-sightings'
                  ? 'button-pink text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Block Club Chicago
            </button>
            <button
              onClick={() => handleSearchTypeChange('nullifie')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                searchType === 'nullifie'
                  ? 'button-pink text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              nullifie
            </button>
            <button
              onClick={() => handleSearchTypeChange('unraveled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                searchType === 'unraveled'
                  ? 'button-pink text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unraveled
            </button>
            <button
              onClick={() => handleSearchTypeChange('50501chicago')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                searchType === '50501chicago'
                  ? 'button-pink text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              50501chicago
            </button>
            <button
              onClick={() => handleSearchTypeChange('libertyovergov')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                searchType === 'libertyovergov'
                  ? 'button-pink text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              libertyovergov
            </button>
          </div>
        </div>
        <p className='text-sm text-gray-600'>
          {searchType === 'ice-sightings'
            ? "Recent posts from Block Club Chicago (@blockclubchi.bsky.social) - Chicago's local news source"
            : searchType === 'unraveled'
              ? 'Recent posts from Unraveled (@unraveledpress.bsky.social) - Investigative journalism and news'
              : searchType === 'nullifie'
                ? 'Recent posts from nullifie (@nullifie.bsky.social)'
                : searchType === '50501chicago'
                  ? 'Recent posts from 50501chicago (@50501chicago.bsky.social)'
                  : 'Recent posts from libertyovergov (@libertyovergov.bsky.social)'}
        </p>
      </div>

      {/* Loading state - only show spinner in posts area */}
      {loading ? (
        <div className='flex justify-center items-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-3 text-gray-600'>Loading Bluesky posts...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-gray-500'>
            No Bluesky posts available.{' '}
            {searchType === 'ice-sightings'
              ? 'Try checking the general timeline or ensure Bluesky API is configured.'
              : 'Please check the Bluesky API configuration.'}
          </p>
        </div>
      ) : (
        <>
          {/* Show message if these are fallback posts */}
          {posts.length > 0 && posts[0].isFallback && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
              <div className='flex items-start'>
                <div className='flex-shrink-0'>
                  <span className='text-blue-600 text-lg'>ℹ️</span>
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-blue-800'>
                    No ICE sightings posts found
                  </h3>
                  <div className='mt-2 text-sm text-blue-700'>
                    <p>
                      We couldn't find any recent posts specifically about ICE
                      sightings in Chicago. Below are some recent public posts
                      from Bluesky. Check back later or try the general timeline
                      for more content.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className='space-y-4'>
            {posts.map(post => (
              <div
                key={post.id}
                className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200'
              >
                {/* Post Header */}
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center space-x-3'>
                    {post.author.avatar ? (
                      <img
                        src={post.author.avatar}
                        alt={post.author.displayName}
                        className='w-10 h-10 rounded-full'
                      />
                    ) : (
                      <div className='w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center'>
                        <span className='text-gray-600 font-medium'>
                          {post.author.displayName?.charAt(0) ||
                            post.username.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className='font-semibold text-gray-800'>
                        {post.author.displayName || post.username}
                      </div>
                      <div className='text-sm text-gray-500'>
                        @{post.username}
                      </div>
                    </div>
                  </div>
                  <span className='text-gray-500 text-sm'>
                    {formatTimestamp(post.createdAt)}
                  </span>
                </div>

                {/* Post Content */}
                <div className='mb-4'>
                  <p
                    className='text-gray-800 whitespace-pre-wrap'
                    dangerouslySetInnerHTML={{
                      __html: formatPostText(post.text),
                    }}
                  />
                </div>

                {/* Post Images */}
                {post.images && post.images.length > 0 && (
                  <div className='mb-4'>
                    <div
                      className={`grid gap-2 ${
                        post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                      }`}
                    >
                      {post.images.map((image, index) => (
                        <div key={index} className='relative group'>
                          <img
                            src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${post.author.did}/${image.image.ref.$link}@${image.image.mimeType.split('/')[1]}`}
                            alt={image.alt || `Post image ${index + 1}`}
                            className='w-full h-auto rounded-lg object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity'
                            onClick={() =>
                              window.open(
                                `https://cdn.bsky.app/img/feed_fullsize/plain/${post.author.did}/${image.image.ref.$link}@${image.image.mimeType.split('/')[1]}`,
                                '_blank'
                              )
                            }
                            onError={e => {
                              e.currentTarget.style.display = 'none';
                            }}
                            loading='lazy'
                          />
                          <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center'>
                            <span className='text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium'>
                              Click to view full size
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Links */}
                {post.links && (
                  <div className='mb-4'>
                    <a
                      href={post.links.uri}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors'
                    >
                      <div className='flex items-start space-x-3'>
                        {post.links.thumb && (
                          <img
                            src={post.links.thumb}
                            alt='Link preview'
                            className='w-16 h-16 object-cover rounded'
                          />
                        )}
                        <div className='flex-1'>
                          <div className='font-medium text-gray-800'>
                            {post.links.title}
                          </div>
                          <div className='text-sm text-gray-600 mt-1'>
                            {post.links.description}
                          </div>
                          <div className='text-xs text-gray-500 mt-1'>
                            {post.links.uri}
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                )}

                {/* Engagement Stats */}
                <div className='flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100'>
                  <div className='flex items-center space-x-4'>
                    <span className='flex items-center'>
                      <span className='mr-1'>💬</span>
                      {post.replyCount}
                    </span>
                    <span className='flex items-center'>
                      <span className='mr-1'>🔄</span>
                      {post.repostCount}
                    </span>
                    <span className='flex items-center'>
                      <span className='mr-1'>❤️</span>
                      {post.likeCount}
                    </span>
                  </div>
                  <a
                    href={`https://bsky.app/profile/${post.username}/post/${post.cid}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:text-blue-800 font-medium'
                  >
                    View on Bluesky →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer note */}
      <div className='mt-6 text-center text-sm text-gray-500'>
        <p>
          💡 This feed displays posts from Block Club Chicago
          (@blockclubchi.bsky.social) for local news, Unraveled
          (@unraveledpress.bsky.social) for investigative journalism, nullifie
          (@nullifie.bsky.social), 50501chicago (@50501chicago.bsky.social), and
          libertyovergov (@libertyovergov.bsky.social)
        </p>
      </div>
    </div>
  );
};

export default BlueskyFeed;
