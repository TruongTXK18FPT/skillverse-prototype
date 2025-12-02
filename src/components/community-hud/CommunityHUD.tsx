import React, { useState, useEffect } from 'react';
import CommsHeader from './CommsHeader';
import FrequencyTuner, { FrequencyChannel } from './FrequencyTuner';
import TransmissionCard, { CommunityPost } from './TransmissionCard';
import TelemetryWidget from './TelemetryWidget';
import MeowlGuide from '../MeowlGuide';
import Pagination from '../Pagination';
import { TrendingUp, Zap, Radio, Users } from 'lucide-react';
import './community-styles.css';
import communityService from '../../services/communityService';
import userService from '../../services/userService';
import { useNavigate } from 'react-router-dom';

const CommunityHUD: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const postsPerPage = 9;

  // Frequency Channels (Categories)
  const [channels, setChannels] = useState<FrequencyChannel[]>([
    { id: 'all', name: 'Tất cả', count: 0 },
    { id: 'tips', name: 'Mẹo hay', count: 0 },
    { id: 'discussion', name: 'Thảo luận', count: 0 },
    { id: 'tutorial', name: 'Hướng dẫn', count: 0 },
    { id: 'news', name: 'Tin tức', count: 0 },
    { id: 'career', name: 'Tuyển dụng', count: 0 },
  ]);

  // Trending Topics by tags from backend
  const [trendingTopics, setTrendingTopics] = useState<{ name: string; posts: number; trend: 'up' | 'down' }[]>([]);
  const [topUsers, setTopUsers] = useState<{ userId: number; count: number; name?: string; avatar?: string }[]>([]);

  // Community Stats
  const [communityStats, setCommunityStats] = useState([
    { label: 'Thành viên', value: 0 },
    { label: 'Bài viết', value: 0 },
    { label: 'Tín hiệu', value: 0 },
  ]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { items } = await communityService.listPosts({ page: 0, size: 50, status: 'PUBLISHED' });

      const extractImage = (html: string | undefined) => {
        if (!html) return null;
        const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
        if (imgMatch && imgMatch[1]) return imgMatch[1];
        const mdMatch = html.match(/!\[[^\]]*\]\(([^)]+)\)/);
        if (mdMatch && mdMatch[1]) return mdMatch[1];
        return null;
      };

      const extractTags = (text: string | undefined) => {
        if (!text) return [] as string[];
        const matches = text.match(/#([A-Za-z0-9_]+)/g);
        if (!matches) return [];
        return Array.from(new Set(matches.map(m => m.slice(1).toLowerCase())));
      };

      const defaultAvatar = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100';
      let transformedPosts: CommunityPost[] = items.map((post) => {
        // Use backend thumbnailUrl if available, otherwise fallback to content extraction
        const img = post.thumbnailUrl || extractImage(post.content);
        
        // Use backend tags if available, otherwise fallback to content extraction
        const tags = (post.tags && post.tags.length > 0) ? post.tags : extractTags(post.content);

        return {
          id: Number(post.id),
          title: post.title || 'Bài viết chưa có tiêu đề',
          content: post.content || '',
          author: post.userId ? `User #${post.userId}` : 'Ẩn danh',
          authorAvatar: defaultAvatar,
          category: post.category || 'discussion',
          tags: tags,
          likes: typeof post.likeCount === 'number' ? post.likeCount : 0,
          comments: typeof post.commentCount === 'number' ? post.commentCount : 0,
          shares: 0,
          isBookmarked: false,
          timeAgo: post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : 'Ẩn thời gian',
          readTime: 'Đọc 5 phút',
          image: img || undefined,
        };
      });

      // Resolve author profile (fullname + avatar) for each unique userId
      const uniqueUserIds = Array.from(new Set(items.map(p => p.userId).filter((id): id is number => typeof id === 'number')));
      if (uniqueUserIds.length > 0) {
        try {
          const profiles = await Promise.all(uniqueUserIds.map(id => userService.getUserProfile(id).catch(() => null)));
          const profileMap = new Map<number, { fullName?: string; avatarUrl?: string }>();
          uniqueUserIds.forEach((id, idx) => {
            const prof = profiles[idx];
            if (prof) profileMap.set(id, { fullName: prof.fullName, avatarUrl: prof.avatarMediaUrl });
          });
          const idToUserId = new Map<number, number>();
          items.forEach(p => idToUserId.set(Number(p.id), Number(p.userId)));
          transformedPosts = transformedPosts.map(tp => {
            const uid = idToUserId.get(tp.id);
            const prof = uid ? profileMap.get(uid) : undefined;
            const authorName = prof?.fullName || tp.author;
            const avatar = prof?.avatarUrl || defaultAvatar;
            return { ...tp, author: authorName, authorAvatar: avatar };
          });

          // Calculate Top Users
          const userCounts: Record<number, number> = {};
          items.forEach(p => {
            if (p.userId) userCounts[p.userId] = (userCounts[p.userId] || 0) + 1;
          });
          const top = Object.entries(userCounts)
            .map(([uid, count]) => {
               const id = Number(uid);
               const prof = profileMap.get(id);
               return { 
                 userId: id, 
                 count, 
                 name: prof?.fullName || `User #${id}`,
                 avatar: prof?.avatarUrl || defaultAvatar
               };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          setTopUsers(top);
        } catch { console.debug('resolve profile failed'); }
      }

      setPosts(transformedPosts);

      const updatedChannels = channels.map((channel) => {
        if (channel.id === 'all') {
          return { ...channel, count: transformedPosts.length };
        } else {
          return {
            ...channel,
            count: transformedPosts.filter((p) => p.category === channel.id).length,
          };
        }
      });
      setChannels(updatedChannels);

      try {
        const stats = await communityService.getStats();
        setCommunityStats([
          { label: 'Thành viên', value: Number(stats.totalUsers) || 0 },
          { label: 'Bài viết', value: Number(stats.totalPosts) || transformedPosts.length },
          { label: 'Tín hiệu', value: Number(stats.signal) || 0 },
        ]);
      } catch { console.debug('stats failed'); }

      try {
        const res = await communityService.getTrends();
        const top = res.trends.slice(0, 5).map(t => ({ name: String(t.topic), posts: Number(t.count) || 0, trend: 'up' as const }));
        setTrendingTopics(top);
      } catch { console.debug('trends failed'); }
    } catch (error) {
      console.error('Lỗi tải bài viết:', error);
      setError('Không thể tải bài viết. Mất kết nối.');
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
                <p>Đang tải bài viết...</p>
              </div>
            ) : error ? (
              <div className="transmission-error">
                <Radio className="transmission-error-icon" size={48} />
                <h3 className="transmission-error-title">Mất kết nối</h3>
                <p className="transmission-error-text">{error}</p>
                <button className="retry-button" onClick={fetchPosts}>
                  Kết nối lại
                </button>
              </div>
            ) : currentPosts.length === 0 ? (
              <div className="transmission-empty">
                <Radio className="transmission-empty-icon" size={48} />
                <h3 className="transmission-empty-title">Chưa có bài viết</h3>
                <p className="transmission-empty-text">
                  Tần số này đang im ắng. Hãy thử chuyên mục khác.
                </p>
              </div>
            ) : (
              <>
                <div className="transmission-feed">
                  {currentPosts.map((post, index) => (
                    <div key={post.id} onClick={() => navigate(`/community/${post.id}`)}>
                      <TransmissionCard post={post} index={index} />
                    </div>
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
              title="Xu hướng"
              icon={TrendingUp}
              type="trending"
              data={trendingTopics}
            />
            
            {/* Top Users Widget */}
            <div className="telemetry-widget">
              <div className="telemetry-widget-header">
                <Users className="telemetry-icon" size={18} />
                <h3 className="telemetry-widget-title">Người dùng nổi bật</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {topUsers.length === 0 ? (
                  <div style={{ fontSize: 13, opacity: 0.7, fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                    Chưa có dữ liệu
                  </div>
                ) : (
                  topUsers.map((u, idx) => (
                    <div key={u.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: 24, height: 24, borderRadius: '50%', 
                          background: idx < 3 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.1)', 
                          color: idx < 3 ? '#f59e0b' : 'var(--text-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, overflow: 'hidden'
                        }}>
                          {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (idx + 1)}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{u.name}</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--signal-cyan)' }}>{u.count} bài</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <TelemetryWidget
              title="Thống kê hệ thống"
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
