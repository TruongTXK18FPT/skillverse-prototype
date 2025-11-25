import React, { useState, useEffect } from 'react';
import CommsHeader from './CommsHeader';
import FrequencyTuner, { FrequencyChannel } from './FrequencyTuner';
import TransmissionCard, { CommunityPost } from './TransmissionCard';
import TelemetryWidget from './TelemetryWidget';
import MeowlGuide from '../MeowlGuide';
import Pagination from '../Pagination';
import { TrendingUp, Users, FileText, Zap, Radio } from 'lucide-react';
import './community-styles.css';

const CommunityHUD: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const postsPerPage = 6;

  // Frequency Channels (Categories)
  const [channels, setChannels] = useState<FrequencyChannel[]>([
    { id: 'all', name: 'ALL FREQUENCIES', count: 0 },
    { id: 'tips', name: 'OPTIMIZATION', count: 0 },
    { id: 'discussion', name: 'DISCUSSION', count: 0 },
    { id: 'tutorial', name: 'TRAINING', count: 0 },
    { id: 'news', name: 'INTEL', count: 0 },
    { id: 'career', name: 'RECRUITMENT', count: 0 },
  ]);

  // Trending Topics
  const trendingTopics = [
    { name: 'React 18', posts: 145, trend: 'up' as const },
    { name: 'TypeScript', posts: 120, trend: 'up' as const },
    { name: 'Web3', posts: 98, trend: 'up' as const },
    { name: 'AI/ML', posts: 87, trend: 'up' as const },
    { name: 'Next.js', posts: 76, trend: 'up' as const },
  ];

  // Community Stats
  const [communityStats, setCommunityStats] = useState([
    { label: 'PILOTS', value: 15234 },
    { label: 'TRANSMISSIONS', value: 0 },
    { label: 'SIGNALS', value: 123456 },
  ]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        'https://68426af6e1347494c31cbc60.mockapi.io/api/skillverse/Community'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform API data
      const transformedPosts: CommunityPost[] = data.map((post: Record<string, unknown>) => ({
        id: parseInt(String(post.id)),
        title: String(post.title) || 'Untitled Transmission',
        content: String(post.content || post.description) || '',
        author: typeof post.author === 'string' ? post.author : 'Anonymous Pilot',
        category: String(post.category) || 'discussion',
        tags: Array.isArray(post.tags)
          ? post.tags
          : typeof post.tags === 'string'
          ? [post.tags]
          : ['General'],
        likes: parseInt(String(post.likes)) || Math.floor(Math.random() * 500),
        comments: parseInt(String(post.comments)) || Math.floor(Math.random() * 100),
        shares: parseInt(String(post.shares)) || Math.floor(Math.random() * 50),
        isBookmarked: Boolean(post.isBookmarked) || false,
        timeAgo: String(post.timeAgo) || '2 hours ago',
        readTime: String(post.readTime) || '5 min read',
        image:
          String(post.image) ||
          'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=400',
      }));

      setPosts(transformedPosts);

      // Update channel counts
      const updatedChannels = channels.map((channel) => {
        if (channel.id === 'all') {
          return { ...channel, count: transformedPosts.length };
        } else {
          return {
            ...channel,
            count: transformedPosts.filter((post) => post.category === channel.id).length,
          };
        }
      });
      setChannels(updatedChannels);

      // Update stats
      setCommunityStats([
        { label: 'PILOTS', value: 15234 },
        { label: 'TRANSMISSIONS', value: transformedPosts.length },
        { label: 'SIGNALS', value: 123456 },
      ]);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load transmissions. Signal lost.');
    } finally {
      setLoading(false);
    }
  };

  const handleChannelChange = (channelId: string) => {
    setActiveChannel(channelId);
    setCurrentPage(1);
  };

  const filteredPosts =
    activeChannel === 'all'
      ? posts
      : posts.filter((post) => post.category === activeChannel);

  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  return (
    <div className="transmission-layout">
      <div className="transmission-container">
        {/* Header */}
        <CommsHeader />

        {/* Frequency Tuner (Filter) */}
        <FrequencyTuner
          channels={channels}
          activeChannel={activeChannel}
          onChannelChange={handleChannelChange}
        />

        {/* Main Grid */}
        <div className="transmission-grid">
          {/* Left: Feed */}
          <div>
            {loading ? (
              <div className="transmission-loading">
                <div className="loading-spinner"></div>
                <p>Receiving transmissions...</p>
              </div>
            ) : error ? (
              <div className="transmission-error">
                <Radio className="transmission-error-icon" size={48} />
                <h3 className="transmission-error-title">Signal Lost</h3>
                <p className="transmission-error-text">{error}</p>
                <button className="retry-button" onClick={fetchPosts}>
                  RECONNECT
                </button>
              </div>
            ) : currentPosts.length === 0 ? (
              <div className="transmission-empty">
                <Radio className="transmission-empty-icon" size={48} />
                <h3 className="transmission-empty-title">No Transmissions</h3>
                <p className="transmission-empty-text">
                  This frequency is quiet. Try another channel.
                </p>
              </div>
            ) : (
              <>
                <div className="transmission-feed">
                  {currentPosts.map((post, index) => (
                    <TransmissionCard key={post.id} post={post} index={index} />
                  ))}
                </div>

                {/* Pagination */}
                {filteredPosts.length > postsPerPage && (
                  <div style={{ marginTop: '2rem' }}>
                    <Pagination
                      totalItems={filteredPosts.length}
                      itemsPerPage={postsPerPage}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Telemetry Sidebar */}
          <div className="telemetry-sidebar">
            <TelemetryWidget
              title="TRENDING SIGNALS"
              icon={TrendingUp}
              type="trending"
              data={trendingTopics}
            />
            <TelemetryWidget
              title="SYSTEM TELEMETRY"
              icon={Zap}
              type="stats"
              data={communityStats}
            />
          </div>
        </div>
      </div>

      {/* Meowl Guide */}
      <MeowlGuide currentPage="home" />
    </div>
  );
};

export default CommunityHUD;