import React, { useEffect, useMemo, useState, useRef } from 'react';
import communityService, { PostSummary, CommentResponse } from '../../services/communityService';
import adminUserService from '../../services/adminUserService';
import { AdminUserResponse } from '../../types/adminUser';
import { Edit, Trash2, MessageSquare, TrendingUp, Zap, Users, Activity, Search, X, Save, Image, Eye, EyeOff, AlertTriangle, Hash, RefreshCw, Download, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadImage as uploadImageFile, validateImage } from '../../services/fileUploadService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { decodeHtml } from '../../utils/htmlDecoder';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import './CommunityManagementTab.css';

const COLORS = ['#06b6d4', '#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];

const CommunityManagementTab: React.FC = () => {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'edit' | 'comments' | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostSummary | null>(null);
  
  // Edit State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editThumbnail, setEditThumbnail] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Comment State
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentActionId, setCommentActionId] = useState<number | null>(null); // ID of comment being acted on
  const [actionReason, setActionReason] = useState('');
  const [actionType, setActionType] = useState<'hide' | 'delete' | null>(null);

  // Dashboard Stats
  const [communityStats, setCommunityStats] = useState<{ label: string; value: number; icon: any; type: string }[]>([
    { label: 'Thành viên', value: 0, icon: Users, type: 'members' },
    { label: 'Bài viết', value: 0, icon: MessageSquare, type: 'posts' },
    { label: 'Tín hiệu', value: 0, icon: Activity, type: 'signal' }
  ]);
  const [trendingTopics, setTrendingTopics] = useState<{ name: string; posts: number; trend: 'up' | 'down' }[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('month');
  const [topUserDetails, setTopUserDetails] = useState<Record<number, AdminUserResponse>>({});
  const navigate = useNavigate();

  const chartData = useMemo(() => {
    const data: Record<string, { name: string; views: number; likes: number }> = {};

    posts.forEach(p => {
      const date = new Date(p.createdAt || Date.now());
      let key = '';
      let name = '';

      if (chartPeriod === 'month') {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        name = `T${date.getMonth() + 1}/${date.getFullYear()}`;
      } else {
        // Week logic
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${weekNum}`;
        name = `Tuần ${weekNum}`;
      }

      if (!data[key]) {
        data[key] = { name, views: 0, likes: 0 };
      }
      data[key].views += (p.viewCount || 0);
      data[key].likes += (p.likeCount || 0);
    });

    // Sort by date/key
    return Object.keys(data).sort().map(k => data[k]);
  }, [posts, chartPeriod]);

  const topUsers = useMemo(() => {
    const userCounts: Record<number, number> = {};
    posts.forEach(p => {
      if (p.userId) {
        userCounts[p.userId] = (userCounts[p.userId] || 0) + 1;
      }
    });

    return Object.entries(userCounts)
      .map(([userId, count]) => ({ userId: Number(userId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [posts]);

  // Fetch top user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      const userIdsToFetch = topUsers
        .map(u => u.userId)
        .filter(id => !topUserDetails[id]);

      if (userIdsToFetch.length === 0) return;

      const newDetails: Record<number, AdminUserResponse> = {};
      await Promise.all(userIdsToFetch.map(async (id) => {
        try {
          const user = await adminUserService.getUserById(id);
          newDetails[id] = user;
        } catch (e) {
          console.error(`Failed to fetch user ${id}`, e);
        }
      }));

      if (Object.keys(newDetails).length > 0) {
        setTopUserDetails(prev => ({ ...prev, ...newDetails }));
      }
    };

    if (topUsers.length > 0) {
      fetchUserDetails();
    }
  }, [topUsers]);

  const tagDistribution = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    posts.forEach(p => {
      if (p.tags) {
        p.tags.forEach(t => {
          const tag = t.toLowerCase();
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return sorted.map(([name, value]) => ({ name, value }));
  }, [posts]);

  const topLikedPosts = useMemo(() => {
    return posts
      .slice()
      .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      .slice(0, 5)
      .map(p => {
        const decoded = decodeHtml(p.title || '');
        return {
          name: decoded.length > 20 ? decoded.substring(0, 20) + '...' : decoded,
          likes: p.likeCount || 0
        };
      });
  }, [posts]);

  const postMatchesTag = (p: PostSummary, tag: string) => {
    if (!tag) return false;
    const lowerTag = tag.toLowerCase();
    // Check explicit tags
    if (p.tags && p.tags.some(t => t.toLowerCase() === lowerTag)) return true;
    // Check content for hashtag (legacy/fallback)
    if (p.content) {
      const pattern = new RegExp(`#${tag}(?![A-Za-z0-9_])`, 'i');
      if (pattern.test(p.content)) return true;
    }
    return false;
  };

  const filteredPosts = useMemo<PostSummary[]>(() => {
    let res = posts;
    if (activeTag) {
      res = res.filter((p: PostSummary) => postMatchesTag(p, activeTag));
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      res = res.filter(p => (p.title && p.title.toLowerCase().includes(lower)) || (p.content && p.content.toLowerCase().includes(lower)));
    }
    return res;
  }, [posts, activeTag, searchTerm]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Admin sees ALL posts, so no authorId filter here
      const { items } = await communityService.listPosts({ page: 0, size: 100 });
      setPosts(items);
      try {
        const stats = await communityService.getStats();
        setCommunityStats([
          { label: 'Thành viên', value: Number(stats.totalUsers) || 0, icon: Users, type: 'members' },
          { label: 'Bài viết', value: Number(stats.totalPosts) || items.length, icon: MessageSquare, type: 'posts' },
          { label: 'Tín hiệu', value: Number(stats.signal) || 0, icon: Activity, type: 'signal' }
        ]);
      } catch (e) { console.debug('stats failed', e); }
      try {
        const res = await communityService.getTrends();
        setTrendingTopics(
          res.trends.slice(0, 5).map(t => ({ name: t.topic, posts: t.count, trend: 'up' }))
        );
      } catch (e) { console.debug('trends failed', e); }
    } catch (e) {
      console.error(e);
      setError('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  // --- Edit Handlers ---
  const openEdit = (p: PostSummary) => {
    setSelectedPost(p);
    setEditTitle(decodeHtml(p.title));
    setEditContent(decodeHtml(p.content));
    setEditThumbnail(p.thumbnailUrl || '');
    setEditTags(p.tags || []);
    setActiveModal('edit');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!editTags.includes(tagInput.trim())) {
        setEditTags([...editTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Get user ID from localStorage
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id;

    if (!userId) {
      alert('Vui lòng đăng nhập để thực hiện chức năng này');
      return;
    }

    try {
      const validation = validateImage(file);
      if (!validation.valid) {
        alert(validation.error || 'Ảnh không hợp lệ');
        return;
      }
      setUploadError(null);
      setIsUploading(true);
      setUploadProgress(0);
      const res = await uploadImageFile(
        file,
        userId,
        (progress) => setUploadProgress(progress.percentage)
      );
      setEditThumbnail(res.url);
    } catch (err) {
      const msg = (err as any)?.response?.data?.message || 'Upload ảnh thất bại';
      setUploadError(msg);
      alert(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const saveEdit = async () => {
    if (!selectedPost) return;
    try {
      setIsSaving(true);
      await communityService.updatePost(selectedPost.id, { 
        title: editTitle, 
        content: editContent,
        thumbnailUrl: editThumbnail,
        tags: editTags
      });
      await loadPosts();
      setActiveModal(null);
      setSelectedPost(null);
    } catch (e) {
      alert('Cập nhật bài viết thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete Post ---
  const deletePost = async (p: PostSummary) => {
    if (!window.confirm('Xóa bài viết này? Hành động không thể hoàn tác.')) return;
    try {
      await communityService.deletePost(p.id);
      await loadPosts();
    } catch (e) {
      console.error(e);
      alert('Xóa bài viết thất bại. Vui lòng thử lại.');
    }
  };

  // --- Comment Handlers ---
  const openComments = async (p: PostSummary) => {
    setSelectedPost(p);
    setActiveModal('comments');
    try {
      const { items } = await communityService.listComments(p.id, 0, 50, true);
      setComments(items);
    } catch (e) {
      alert('Không thể tải bình luận');
    }
  };

  const initiateCommentAction = (c: CommentResponse, type: 'hide' | 'delete') => {
    setCommentActionId(c.id);
    setActionType(type);
    setActionReason('');
  };

  const confirmCommentAction = async () => {
    if (!selectedPost || !commentActionId || !actionType) return;
    
    try {
      if (actionType === 'delete') {
        await communityService.deleteComment(selectedPost.id, commentActionId);
      } else if (actionType === 'hide') {
        await communityService.hideComment(selectedPost.id, commentActionId, actionReason || undefined);
      }
      
      // Refresh comments
      const { items } = await communityService.listComments(selectedPost.id, 0, 50, true);
      setComments(items);
      
      // Reset action state
      setCommentActionId(null);
      setActionType(null);
      setActionReason('');
    } catch (e) {
      alert(`${actionType === 'delete' ? 'Xóa' : 'Ẩn'} bình luận thất bại`);
    }
  };

  const unhideComment = async (c: CommentResponse) => {
    if (!selectedPost) return;
    try {
      await communityService.unhideComment(selectedPost.id, c.id);
      const { items } = await communityService.listComments(selectedPost.id, 0, 50, true);
      setComments(items);
    } catch (e) {
      alert('Bỏ ẩn thất bại');
    }
  };



  return (
    <div className="admin-community-management">
      {/* Header */}
      <div className="admin-community-header">
        <div>
          <h2>Quản Lý Cộng Đồng</h2>
          <p>Giám sát và quản lý toàn bộ hoạt động cộng đồng</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-refresh-btn" onClick={loadPosts} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="admin-community-stats">
        {communityStats.map((stat, idx) => (
          <div key={idx} className={`admin-stat-card ${stat.type}`}>
            <stat.icon size={32} />
            <div>
              <div className="admin-stat-number">{stat.value.toLocaleString()}</div>
              <div className="admin-stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="admin-analytics-grid">
        {/* Interaction Chart */}
        <div className="admin-chart-container" style={{ marginBottom: 0 }}>
          <div className="admin-chart-header">
            <Zap size={20} />
            <h3>Phân Tích Tương Tác</h3>
            <div className="admin-chart-controls">
              <button 
                className={`admin-chart-toggle ${chartPeriod === 'week' ? 'active' : ''}`}
                onClick={() => setChartPeriod('week')}
              >
                Tuần
              </button>
              <button 
                className={`admin-chart-toggle ${chartPeriod === 'month' ? 'active' : ''}`}
                onClick={() => setChartPeriod('month')}
              >
                Tháng
              </button>
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: 'var(--sv-neutral-900)', border: '1px solid var(--border-default)', borderRadius: 8 }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend />
                <Area type="monotone" dataKey="views" name="Lượt xem" stroke="#06b6d4" fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="likes" name="Lượt thích" stroke="#10b981" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users Section */}
        <div className="admin-top-users">
          <div className="admin-chart-header">
            <Users size={20} />
            <h3>Người Dùng Nổi Bật</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {topUsers.map((user, index) => {
              const userDetail = topUserDetails[user.userId];
              return (
                <div key={user.userId} className="admin-top-user-item">
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div className="admin-top-user-rank">{index + 1}</div>
                    {userDetail?.avatarUrl ? (
                      <img 
                        src={userDetail.avatarUrl} 
                        alt="" 
                        style={{ width: 32, height: 32, borderRadius: '50%', marginRight: '0.75rem', objectFit: 'cover', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                      />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', marginRight: '0.75rem', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>
                        <Users size={16} />
                      </div>
                    )}
                    <div className="admin-top-user-info">
                      <div className="admin-top-user-name">
                        {userDetail ? userDetail.fullName : `User #${user.userId}`}
                      </div>
                      <div className="admin-top-user-stats">{user.count} bài viết</div>
                    </div>
                  </div>
                  <TrendingUp size={16} color="#10b981" />
                </div>
              );
            })}
            {topUsers.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="admin-analytics-grid" style={{ marginTop: '-1rem' }}>
        {/* Tag Distribution */}
        <div className="admin-chart-container" style={{ marginBottom: 0 }}>
          <div className="admin-chart-header">
            <PieChartIcon size={20} />
            <h3>Phân Bố Chủ Đề</h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={tagDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tagDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--sv-neutral-900)', border: '1px solid var(--border-default)', borderRadius: 8 }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Liked Posts */}
        <div className="admin-chart-container" style={{ marginBottom: 0 }}>
          <div className="admin-chart-header">
            <BarChartIcon size={20} />
            <h3>Bài Viết Được Yêu Thích</h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={topLikedPosts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
                <Tooltip 
                  contentStyle={{ background: 'var(--sv-neutral-900)', border: '1px solid var(--border-default)', borderRadius: 8 }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="likes" name="Lượt thích" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-community-filters">
        <div className="admin-search-box">
          <Search size={20} />
          <input 
            placeholder="Tìm kiếm bài viết..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="admin-tag-filters">
          <button
            className={`admin-filter-btn ${!activeTag ? 'active' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            Tất cả
          </button>
          {(trendingTopics.length ? trendingTopics : [])
            .slice(0, 8)
            .map(t => (
              <button
                key={t.name}
                className={`admin-filter-btn ${activeTag === t.name.toLowerCase() ? 'active' : ''}`}
                onClick={() => setActiveTag(t.name.toLowerCase())}
              >
                #{t.name}
              </button>
            ))}
        </div>
      </div>

      {/* Posts Table */}
      <div className="admin-community-table">
        <table>
          <thead>
            <tr>
              <th>Bài viết</th>
              <th style={{ textAlign: 'center' }}>Thống kê</th>
              <th style={{ textAlign: 'center' }}>Ngày tạo</th>
              <th style={{ textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</td></tr>
            ) : filteredPosts.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Không tìm thấy bài viết nào</td></tr>
            ) : (
              filteredPosts.map((p: PostSummary) => (
                <tr key={p.id}>
                  <td>
                    <div className="admin-post-info">
                      {p.thumbnailUrl && (
                        <img 
                          src={p.thumbnailUrl} 
                          alt="" 
                          className="admin-post-thumb"
                        />
                      )}
                      <div>
                        <div className="admin-post-title">{decodeHtml(p.title)}</div>
                        <div className="admin-post-meta">ID: {p.id} • User #{p.userId}</div>
                        {p.tags && p.tags.length > 0 && (
                          <div className="admin-post-tags">
                            {p.tags.map((t, idx) => (
                              <span key={idx} className="admin-post-tag">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-stats-cell">
                      <span className="admin-stat-item" title="Lượt xem"><Zap size={14} color="#3b82f6"/> {p.viewCount || 0}</span>
                      <span className="admin-stat-item" title="Lượt thích"><TrendingUp size={14} color="#10b981"/> {p.likeCount || 0}</span>
                      <span className="admin-stat-item" title="Bình luận"><MessageSquare size={14} color="#f59e0b"/> {p.commentCount || 0}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '0.85rem', color: '#a5b4fc' }}>
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td>
                    <div className="admin-action-buttons">
                      <button onClick={() => openEdit(p)} className="admin-action-btn edit" title="Sửa">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => openComments(p)} className="admin-action-btn view" title="Bình luận">
                        <MessageSquare size={16} />
                      </button>
                      <button onClick={() => deletePost(p)} className="admin-action-btn delete" title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- EDIT MODAL --- */}
      {activeModal === 'edit' && selectedPost && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px' }}>
            <div className="admin-modal-header">
              <h3><Edit size={20} /> Chỉnh sửa bài viết</h3>
              <button onClick={() => setActiveModal(null)} className="admin-close-btn">
                <X size={24} />
              </button>
            </div>
            
            <div className="admin-modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', overflow: 'hidden' }}>
              {/* Left: Editor */}
              <div style={{ overflowY: 'auto', paddingRight: '1rem' }}>
                <div className="admin-form-group">
                  <label>Tiêu đề</label>
                  <input 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Thumbnail</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        value={editThumbnail} 
                        onChange={(e) => setEditThumbnail(e.target.value)} 
                        placeholder="URL hình ảnh..."
                        className="admin-form-input"
                      />
                    </div>
                    <button 
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="admin-action-btn view"
                      style={{ width: 'auto', padding: '0.75rem' }}
                      title="Upload ảnh"
                    >
                      {isUploading ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Image size={20} />}
                    </button>
                    <input ref={thumbnailInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleThumbnailUpload} />
                    {isUploading && (
                      <span style={{ marginLeft: '0.5rem', color: '#e0e7ff' }}>Đang upload... {uploadProgress}%</span>
                    )}
                  </div>
                  {uploadError && (
                    <div style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.9rem' }}>{uploadError}</div>
                  )}
                  {editThumbnail && (
                    <div style={{ marginTop: '0.5rem', height: 150, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                      <img src={editThumbnail} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div className="admin-form-group">
                  <label>Thẻ (Tags)</label>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '2px solid rgba(6, 182, 212, 0.3)', borderRadius: 8, padding: '0.5rem' }}>
                    {editTags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {editTags.map((tag, index) => (
                          <span key={index} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                            <Hash size={12} />
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: 4 }}
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Thêm thẻ và nhấn Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#e0e7ff', outline: 'none' }}
                    />
                  </div>
                </div>
                
                <div className="admin-form-group">
                  <label>Nội dung (Markdown)</label>
                  <textarea 
                    value={editContent} 
                    onChange={(e) => setEditContent(e.target.value)} 
                    className="admin-form-textarea"
                  />
                </div>
              </div>

              {/* Right: Preview */}
              <div style={{ overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Xem trước</label>
                <div className="markdown-content">
                  <h1 style={{ fontSize: '2rem', marginBottom: '1rem', lineHeight: 1.3, color: '#e0e7ff' }}>{editTitle || 'Tiêu đề bài viết'}</h1>
                  {editThumbnail && <img src={editThumbnail} alt="Cover" style={{ width: '100%', borderRadius: 8, marginBottom: '1.5rem' }} />}
                  <ReactMarkdown
                    children={editContent || '*Nội dung sẽ hiển thị ở đây...*'}
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      img: ({ node, ...props }) => <img style={{ maxWidth: '100%', borderRadius: 8, margin: '1rem 0' }} {...props} />
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button onClick={() => setActiveModal(null)} className="admin-action-btn close">Hủy bỏ</button>
              <button onClick={saveEdit} disabled={isSaving} className="admin-action-btn save">
                <Save size={18} />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- COMMENTS MODAL --- */}
      {activeModal === 'comments' && selectedPost && (
        <div className="admin-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="admin-detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="admin-modal-header">
              <h3><MessageSquare size={20} /> Quản lý bình luận: {decodeHtml(selectedPost.title)}</h3>
              <button onClick={() => setActiveModal(null)} className="admin-close-btn">
                <X size={24} />
              </button>
            </div>

            <div className="admin-modal-body">
              {comments.length === 0 ? (
                <div className="admin-empty-state">
                  <MessageSquare size={48} />
                  <p>Chưa có bình luận nào trong bài viết này.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {comments.map((c) => (
                    <div key={c.id} className="admin-comment-item">
                      <div className="admin-comment-header">
                        <span className="admin-comment-user">User #{c.userId}</span>
                        <span>{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      
                      <div className="admin-comment-content">
                        {c.hidden && <span style={{ color: '#f59e0b', marginRight: '0.5rem', fontSize: 11, border: '1px solid #f59e0b', padding: '1px 4px', borderRadius: 4, textTransform: 'uppercase' }}>Đã ẩn</span>}
                        {c.content}
                      </div>
                      
                      {c.moderationNote && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 4, fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertTriangle size={12} />
                          <span>Ghi chú: {c.moderationNote}</span>
                        </div>
                      )}

                      <div className="admin-comment-actions">
                        {c.hidden ? (
                          <button onClick={() => unhideComment(c)} className="admin-action-btn view" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }} title="Hiện lại">
                            <Eye size={14} /> Hiện
                          </button>
                        ) : (
                          <button onClick={() => initiateCommentAction(c, 'hide')} className="admin-action-btn edit" style={{ width: 'auto', padding: '4px 8px', fontSize: 12, color: '#f59e0b', borderColor: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }} title="Ẩn bình luận">
                            <EyeOff size={14} /> Ẩn
                          </button>
                        )}
                        <button onClick={() => initiateCommentAction(c, 'delete')} className="admin-action-btn delete" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }} title="Xóa vĩnh viễn">
                          <Trash2 size={14} /> Xóa
                        </button>
                      </div>

                      {/* Action Confirmation Overlay (Inline) */}
                      {commentActionId === c.id && (
                        <div style={{ 
                          marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', 
                          borderRadius: 8, border: `1px solid ${actionType === 'delete' ? '#ef4444' : '#f59e0b'}`
                        }}>
                          <h4 style={{ margin: '0 0 0.5rem', color: actionType === 'delete' ? '#ef4444' : '#f59e0b' }}>
                            {actionType === 'delete' ? 'Xác nhận xóa bình luận?' : 'Ẩn bình luận này?'}
                          </h4>
                          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: '0.5rem', color: '#e0e7ff' }}>
                            {actionType === 'delete' 
                              ? 'Hành động này không thể hoàn tác. Vui lòng nhập lý do xóa (tùy chọn):' 
                              : 'Bình luận sẽ bị ẩn khỏi người dùng khác. Vui lòng nhập lý do:'}
                          </p>
                          <input 
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder="Nhập lý do..."
                            style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, color: 'white', marginBottom: '0.5rem' }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setCommentActionId(null); setActionType(null); }} className="admin-action-btn close" style={{ width: 'auto', padding: '4px 12px', fontSize: 13 }}>Hủy</button>
                            <button onClick={confirmCommentAction} className="admin-action-btn" style={{ 
                              width: 'auto', padding: '4px 12px', fontSize: 13, 
                              background: actionType === 'delete' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: actionType === 'delete' ? '#ef4444' : '#f59e0b',
                              borderColor: actionType === 'delete' ? '#ef4444' : '#f59e0b',
                              border: '1px solid'
                            }}>
                              Xác nhận
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityManagementTab;
