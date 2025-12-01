import React, { useEffect, useMemo, useState, useRef } from 'react';
import communityService, { PostSummary, CommentResponse } from '../../services/communityService';
import { Edit, Trash2, MessageSquare, TrendingUp, Zap, Users, Activity, Search, X, Save, Image, Eye, EyeOff, AlertTriangle, Hash, Bookmark, Loader, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CommsHeader from '../../components/community-hud/CommsHeader';
import TelemetryWidget from '../../components/community-hud/TelemetryWidget';
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
  Legend
} from 'recharts';
import '../../components/community-hud/community-styles.css';

const CommunityDashboardPage: React.FC = () => {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my-posts' | 'saved-posts'>('my-posts');
  const [postFilter, setPostFilter] = useState<'all' | 'published' | 'draft'>('all');
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'edit' | 'comments' | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostSummary | null>(null);
  
  // Edit State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editThumbnail, setEditThumbnail] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const channels = [
    { id: 'discussion', name: 'Thảo luận' },
    { id: 'tutorial', name: 'Hướng dẫn' },
    { id: 'tips', name: 'Mẹo hay' },
    { id: 'news', name: 'Tin tức' },
    { id: 'career', name: 'Tuyển dụng' },
    { id: 'showcase', name: 'Trưng bày' },
  ];

  // Comment State
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentActionId, setCommentActionId] = useState<number | null>(null); // ID of comment being acted on
  const [actionReason, setActionReason] = useState('');
  const [actionType, setActionType] = useState<'hide' | 'delete' | null>(null);

  // Dashboard Stats
  const [communityStats, setCommunityStats] = useState<{ label: string; value: number; icon?: any }[]>([
    { label: 'Lượt thích', value: 0, icon: TrendingUp },
    { label: 'Bài viết', value: 0, icon: MessageSquare },
    { label: 'Lượt xem', value: 0, icon: Eye }
  ]);
  const [trendingTopics, setTrendingTopics] = useState<{ name: string; posts: number; trend: 'up' | 'down' }[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [topUsers, setTopUsers] = useState<{ userId: number; count: number; name?: string; avatar?: string }[]>([]);
  const navigate = useNavigate();

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

  const recentActivity = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [posts]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user ID from localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id;

      if (!userId) {
        setError('Vui lòng đăng nhập để xem bài viết của bạn');
        setLoading(false);
        return;
      }

      let items: PostSummary[] = [];
      if (activeTab === 'my-posts') {
        const status = postFilter === 'all' ? undefined : (postFilter === 'published' ? 'PUBLISHED' : 'DRAFT');
        const res = await communityService.listPosts({ page: 0, size: 100, authorId: userId, status });
        items = res.items;
      } else {
        const res = await communityService.listSavedPosts({ page: 0, size: 100 });
        items = res.items;
      }
      
      setPosts(items);
      
      // Calculate Personal Stats (only for My Posts)
      if (activeTab === 'my-posts') {
        const totalPosts = items.length;
        const totalLikes = items.reduce((acc, p) => acc + (p.likeCount || 0), 0);
        const totalViews = items.reduce((acc, p) => acc + (p.viewCount || 0), 0);
        
        setCommunityStats([
          { label: 'Lượt thích', value: totalLikes, icon: TrendingUp },
          { label: 'Bài viết', value: totalPosts, icon: MessageSquare },
          { label: 'Lượt xem', value: totalViews, icon: Eye }
        ]);
      }

      // Calculate Personal Trends (Tags)
      const tagCounts: Record<string, number> = {};
      items.forEach(p => {
        if (p.tags) {
          p.tags.forEach(t => {
            const lower = t.toLowerCase();
            tagCounts[lower] = (tagCounts[lower] || 0) + 1;
          });
        }
      });
      
      const sortedTags = Object.entries(tagCounts)
        .map(([name, count]) => ({ name, posts: count, trend: 'up' as const }))
        .sort((a, b) => b.posts - a.posts)
        .slice(0, 5);
        
      setTrendingTopics(sortedTags);
      
      try {
        const { items: globalPosts } = await communityService.listPosts({ page: 0, size: 50, status: 'PUBLISHED' });
        const userMap: Record<number, { count: number; name?: string; avatar?: string }> = {};
        
        globalPosts.forEach(p => {
          if (p.userId) {
            if (!userMap[p.userId]) {
              userMap[p.userId] = { count: 0, name: p.userFullName, avatar: p.userAvatar };
            }
            userMap[p.userId].count += 1;
            // Update info if missing
            if (!userMap[p.userId].name && p.userFullName) userMap[p.userId].name = p.userFullName;
            if (!userMap[p.userId].avatar && p.userAvatar) userMap[p.userId].avatar = p.userAvatar;
          }
        });
        
        const top = Object.entries(userMap)
          .map(([uid, data]) => ({ userId: Number(uid), ...data }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopUsers(top);
      } catch (e) {
        console.warn('Failed to fetch global stats for leaderboard', e);
      }

    } catch (e) {
      console.error(e);
      setError('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, [activeTab, postFilter]);

  // --- Edit Handlers ---
  const openEdit = (p: PostSummary) => {
    setSelectedPost(p);
    setEditTitle(decodeHtml(p.title));
    setEditContent(decodeHtml(p.content));
    setEditThumbnail(p.thumbnailUrl || '');
    setEditCategory(p.category || '');
    setEditTags(p.tags || []);
    setEditStatus((p.status as 'DRAFT' | 'PUBLISHED') || 'PUBLISHED');
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
      console.error('Upload ảnh thất bại', err);
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
        category: editCategory,
        tags: editTags,
        status: editStatus
      });
      await loadPosts();
      setActiveModal(null);
      setSelectedPost(null);
    } catch (e) {
      console.error('Cập nhật bài viết thất bại', e);
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

  const publishPost = async (p: PostSummary) => {
    if (!window.confirm('Bạn có chắc chắn muốn đăng bài viết này?')) return;
    try {
      await communityService.updatePost(p.id, { status: 'PUBLISHED' });
      await loadPosts();
    } catch (e) {
      console.error('Đăng bài thất bại', e);
      alert('Đăng bài thất bại');
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
      console.error('Không thể tải bình luận', e);
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
      console.error(`${actionType === 'delete' ? 'Xóa' : 'Ẩn'} bình luận thất bại`, e);
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
      console.error('Bỏ ẩn thất bại', e);
      alert('Bỏ ẩn thất bại');
    }
  };

  const topByViews = useMemo(() => {
    return filteredPosts
      .slice()
      .sort((a: PostSummary, b: PostSummary) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10)
      .map((p) => {
        const decoded = decodeHtml(p.title || '');
        return {
          name: decoded.length > 15 ? decoded.slice(0, 15) + '…' : decoded,
          views: p.viewCount || 0,
          likes: p.likeCount || 0,
          comments: p.commentCount || 0
        };
      });
  }, [filteredPosts]);

  return (
    <div className="transmission-layout">
      <div className="transmission-container">
        <CommsHeader title="Trung Tâm Chỉ Huy" subtitle="Quản lý & Giám sát Cộng đồng" />

        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {communityStats.map((stat, idx) => (
            <div key={idx} className="telemetry-widget" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 12, 
                background: 'rgba(6, 182, 212, 0.1)', color: 'var(--signal-cyan)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {stat.icon ? <stat.icon size={24} /> : <Activity size={24} />}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.25rem' }}>{stat.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="transmission-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && (
              <div className="transmission-error">
                <p className="transmission-error-text">{error}</p>
              </div>
            )}
            
            {/* Charts Section */}
            <div className="telemetry-widget">
              <div className="telemetry-widget-header">
                <Zap className="telemetry-icon" size={18} />
                <h3 className="telemetry-widget-title">Phân Tích Tương Tác</h3>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={topByViews}>
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

            {/* Posts Management */}
            <div className="telemetry-widget">
              <div className="telemetry-widget-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare className="telemetry-icon" size={18} />
                  <h3 className="telemetry-widget-title">Quản Lý Bài Viết</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input 
                      placeholder="Tìm kiếm bài viết..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ 
                        width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem', 
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-default)',
                        borderRadius: 6, color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Tag Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', padding: '0 0.5rem', alignItems: 'center' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem', borderRight: '1px solid var(--border-default)', paddingRight: '1rem' }}>
                  <button
                    onClick={() => setActiveTab('my-posts')}
                    style={{
                      background: activeTab === 'my-posts' ? 'var(--signal-cyan)' : 'transparent',
                      color: activeTab === 'my-posts' ? '#000' : 'var(--text-secondary)',
                      border: '1px solid var(--signal-cyan)',
                      padding: '0.25rem 0.75rem', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Bài viết của tôi
                  </button>
                  <button
                    onClick={() => setActiveTab('saved-posts')}
                    style={{
                      background: activeTab === 'saved-posts' ? 'var(--signal-cyan)' : 'transparent',
                      color: activeTab === 'saved-posts' ? '#000' : 'var(--text-secondary)',
                      border: '1px solid var(--signal-cyan)',
                      padding: '0.25rem 0.75rem', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Bookmark size={14} /> Đã lưu
                  </button>
                </div>

                {activeTab === 'my-posts' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
                    <button onClick={() => setPostFilter('all')} style={{ opacity: postFilter === 'all' ? 1 : 0.5, color: postFilter === 'all' ? 'var(--signal-cyan)' : 'inherit', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Tất cả</button>
                    <button onClick={() => setPostFilter('published')} style={{ opacity: postFilter === 'published' ? 1 : 0.5, color: postFilter === 'published' ? '#10b981' : 'inherit', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Đã đăng</button>
                    <button onClick={() => setPostFilter('draft')} style={{ opacity: postFilter === 'draft' ? 1 : 0.5, color: postFilter === 'draft' ? '#f59e0b' : 'inherit', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Bản nháp</button>
                  </div>
                )}

                <div style={{ width: 1, height: 20, background: 'var(--border-default)', margin: '0 0.5rem' }}></div>

                <button
                  className="broadcast-button"
                  onClick={() => setActiveTag(null)}
                  style={{ 
                    opacity: activeTag ? 0.6 : 1,
                    background: !activeTag ? 'rgba(6, 182, 212, 0.2)' : 'transparent'
                  }}
                >
                  Tất cả Tags
                </button>
                {(trendingTopics.length ? trendingTopics : [])
                  .slice(0, 8)
                  .map(t => (
                    <button
                      key={t.name}
                      className="broadcast-button"
                      onClick={() => setActiveTag(t.name.toLowerCase())}
                      style={{
                        borderColor: activeTag === t.name.toLowerCase() ? 'var(--signal-cyan)' : 'var(--border-default)',
                        color: activeTag === t.name.toLowerCase() ? 'var(--signal-cyan)' : 'inherit',
                        background: activeTag === t.name.toLowerCase() ? 'rgba(6, 182, 212, 0.1)' : 'transparent'
                      }}
                    >
                      #{t.name}
                    </button>
                  ))}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="community-dashboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <th style={{ textAlign: 'left', padding: '1rem' }}>Tiêu đề</th>
                      <th style={{ textAlign: 'center', padding: '1rem' }}>Thống kê</th>
                      <th style={{ textAlign: 'center', padding: '1rem' }}>Ngày tạo</th>
                      <th style={{ textAlign: 'right', padding: '1rem' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</td></tr>
                    ) : filteredPosts.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Không tìm thấy bài viết nào</td></tr>
                    ) : (
                      filteredPosts.map((p: PostSummary) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                              {p.thumbnailUrl && (
                                <img 
                                  src={p.thumbnailUrl} 
                                  alt="" 
                                  style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-default)' }} 
                                />
                              )}
                              <div>
                                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                                  {decodeHtml(p.title)}
                                  {p.status === 'DRAFT' && <span style={{ marginLeft: '0.5rem', fontSize: 10, background: '#f59e0b', color: '#000', padding: '1px 4px', borderRadius: 2, fontWeight: 700 }}>DRAFT</span>}
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.6, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {p.userAvatar ? (
                                    <img src={p.userAvatar} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                                  )}
                                  <span>{p.userFullName || `User #${p.userId}`}</span>
                                  <span>•</span>
                                  <span>ID: {p.id}</span>
                                </div>
                                {p.tags && p.tags.length > 0 && (
                                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    {p.tags.map((t, idx) => (
                                      <span key={idx} style={{ fontSize: 11, color: 'var(--signal-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: 13 }}>
                              <span title="Lượt xem" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={14} color="#3b82f6"/> {p.viewCount || 0}</span>
                              <span title="Lượt thích" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={14} color="#10b981"/> {p.likeCount || 0}</span>
                              <span title="Bình luận" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={14} color="#f59e0b"/> {p.commentCount || 0}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', padding: '1rem', fontSize: 13, opacity: 0.8 }}>
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '-'}
                          </td>
                          <td style={{ textAlign: 'right', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              {p.status === 'DRAFT' && (
                                <button onClick={() => publishPost(p)} className="broadcast-action-btn" style={{ padding: '6px', minWidth: 'auto', color: '#10b981', borderColor: '#10b981' }} title="Đăng bài">
                                  <Send size={16} />
                                </button>
                              )}
                              <button onClick={() => openEdit(p)} className="broadcast-action-btn" style={{ padding: '6px', minWidth: 'auto' }} title="Sửa">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => openComments(p)} className="broadcast-action-btn" style={{ padding: '6px', minWidth: 'auto' }} title="Bình luận">
                                <MessageSquare size={16} />
                              </button>
                              <button onClick={() => deletePost(p)} className="broadcast-action-btn" style={{ padding: '6px', minWidth: 'auto', color: '#ef4444', borderColor: '#ef4444' }} title="Xóa">
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
            </div>
          </div>

          {/* Sidebar */}
          <div className="telemetry-sidebar">
            <TelemetryWidget
              title="Xu hướng nổi bật"
              icon={TrendingUp}
              type="trending"
              data={trendingTopics.length ? trendingTopics : []}
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
                        <div style={{ position: 'relative' }}>
                          {u.avatar ? (
                            <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-default)' }} />
                          ) : (
                            <div style={{ 
                              width: 32, height: 32, borderRadius: '50%', 
                              background: idx < 3 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.1)', 
                              color: idx < 3 ? '#f59e0b' : 'var(--text-secondary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700
                            }}>
                              {idx + 1}
                            </div>
                          )}
                          {u.avatar && idx < 3 && (
                            <div style={{ 
                              position: 'absolute', bottom: -4, right: -4, 
                              width: 16, height: 16, borderRadius: '50%', 
                              background: '#f59e0b', color: '#000',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, border: '2px solid var(--bg-card)'
                            }}>
                              {idx + 1}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{u.name || `User #${u.userId}`}</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--signal-cyan)' }}>{u.count} bài</div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="telemetry-widget">
              <div className="telemetry-widget-header">
                <Activity className="telemetry-icon" size={18} />
                <h3 className="telemetry-widget-title">Hoạt động gần đây</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentActivity.length === 0 ? (
                   <div style={{ fontSize: 13, opacity: 0.7, fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                    Chưa có hoạt động nào được ghi nhận
                  </div>
                ) : (
                  recentActivity.map(p => (
                    <div key={p.id} style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                        {decodeHtml(p.title)}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.6, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{p.userFullName || `User #${p.userId}`}</span>
                        <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button className="broadcast-button" onClick={() => navigate('/community')} style={{ width: '100%', justifyContent: 'center' }}>
                <span>Về trang Community</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- EDIT MODAL --- */}
        {activeModal === 'edit' && selectedPost && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem'
          }}>
            <div className="telemetry-widget" style={{ 
              width: '100%', maxWidth: '1200px', height: '90vh', 
              display: 'flex', flexDirection: 'column', margin: 0, padding: 0,
              overflow: 'hidden'
            }}>
              {/* Modal Header */}
              <div className="telemetry-widget-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Edit className="telemetry-icon" size={20} />
                  <h3 className="telemetry-widget-title">Chỉnh sửa bài viết</h3>
                </div>
                <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>
              
              {/* Modal Body */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
                {/* Left: Editor */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', borderRight: '1px solid var(--border-default)' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--signal-cyan)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>Tiêu đề</label>
                    <input 
                      value={editTitle} 
                      onChange={(e) => setEditTitle(e.target.value)} 
                      className="broadcast-title-input"
                      style={{ fontSize: '1.25rem', padding: '0.75rem', width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-default)', borderRadius: 8 }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--signal-cyan)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>Chuyên mục</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      style={{ 
                        width: '100%', padding: '0.75rem', 
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-default)', 
                        borderRadius: 8, color: 'var(--text-primary)' 
                      }}
                    >
                      <option value="">Chọn chuyên mục</option>
                      {channels.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          {channel.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--signal-cyan)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>Trạng thái</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
                      style={{ 
                        width: '100%', padding: '0.75rem', 
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-default)', 
                        borderRadius: 8, color: 'var(--text-primary)' 
                      }}
                    >
                      <option value="DRAFT">Bản nháp (Draft)</option>
                      <option value="PUBLISHED">Công khai (Published)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--signal-cyan)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>Thumbnail</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <input 
                          value={editThumbnail} 
                          onChange={(e) => setEditThumbnail(e.target.value)} 
                          placeholder="URL hình ảnh..."
                          style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)' }}
                        />
                      </div>
                      <button 
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="broadcast-action-btn"
                        style={{ padding: '0.75rem', minWidth: 'auto' }}
                      title="Upload ảnh"
                      disabled={isUploading}
                      >
                        {isUploading ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Image size={20} />}
                      </button>
                      <input ref={thumbnailInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleThumbnailUpload} />
                      {isUploading && (
                        <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>Đang upload... {uploadProgress}%</span>
                      )}
                    </div>
                    {uploadError && (
                      <div style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.9rem' }}>{uploadError}</div>
                    )}
                    {editThumbnail && (
                      <div style={{ marginTop: '0.5rem', height: 150, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                        <img src={editThumbnail} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--signal-cyan)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>Thẻ (Tags)</label>
                    <div className="broadcast-tags-wrapper" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '0.5rem' }}>
                      {editTags.length > 0 && (
                        <div className="broadcast-tags-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          {editTags.map((tag, index) => (
                            <span key={index} className="broadcast-tag" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(6, 182, 212, 0.2)', color: 'var(--signal-cyan)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
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
                        style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--signal-cyan)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>Nội dung (Markdown)</label>
                    <textarea 
                      value={editContent} 
                      onChange={(e) => setEditContent(e.target.value)} 
                      className="broadcast-content-textarea"
                      style={{ flex: 1, minHeight: '400px', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-default)', borderRadius: 8, resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Right: Preview */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', background: 'rgba(0,0,0,0.2)' }}>
                  <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Xem trước</label>
                  <div className="markdown-content" style={{ padding: '1rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', lineHeight: 1.3 }}>{editTitle || 'Tiêu đề bài viết'}</h1>
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

              {/* Modal Footer */}
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button onClick={() => setActiveModal(null)} className="broadcast-action-btn">Hủy bỏ</button>
                <button onClick={saveEdit} disabled={isSaving} className="broadcast-action-btn transmit">
                  <Save size={18} />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- COMMENTS MODAL --- */}
        {activeModal === 'comments' && selectedPost && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem'
          }}>
            <div className="telemetry-widget" style={{ 
              width: '100%', maxWidth: '800px', maxHeight: '90vh', 
              display: 'flex', flexDirection: 'column', margin: 0, padding: 0
            }}>
              <div className="telemetry-widget-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare className="telemetry-icon" size={20} />
                  <h3 className="telemetry-widget-title">Quản lý bình luận: {decodeHtml(selectedPost.title)}</h3>
                </div>
                <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                {comments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                    <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Chưa có bình luận nào trong bài viết này.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {comments.map((c) => (
                      <div key={c.id} style={{ 
                        padding: '1rem', background: 'rgba(255,255,255,0.03)', 
                        borderRadius: 8, border: '1px solid var(--border-default)',
                        position: 'relative'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div style={{ fontSize: 12, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {c.userAvatar ? (
                              <img src={c.userAvatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                            )}
                            <span style={{ color: 'var(--signal-cyan)', fontWeight: 600 }}>{c.userFullName || `User #${c.userId}`}</span>
                            <span>•</span>
                            <span>{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {c.hidden ? (
                              <button onClick={() => unhideComment(c)} className="broadcast-action-btn" style={{ padding: '4px 8px', fontSize: 12, minWidth: 'auto' }} title="Hiện lại">
                                <Eye size={14} /> Hiện
                              </button>
                            ) : (
                              <button onClick={() => initiateCommentAction(c, 'hide')} className="broadcast-action-btn" style={{ padding: '4px 8px', fontSize: 12, minWidth: 'auto', color: '#f59e0b', borderColor: '#f59e0b' }} title="Ẩn bình luận">
                                <EyeOff size={14} /> Ẩn
                              </button>
                            )}
                            <button onClick={() => initiateCommentAction(c, 'delete')} className="broadcast-action-btn" style={{ padding: '4px 8px', fontSize: 12, minWidth: 'auto', color: '#ef4444', borderColor: '#ef4444' }} title="Xóa vĩnh viễn">
                              <Trash2 size={14} /> Xóa
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
                          {c.hidden && <span style={{ color: '#f59e0b', marginRight: '0.5rem', fontSize: 11, border: '1px solid #f59e0b', padding: '1px 4px', borderRadius: 4, textTransform: 'uppercase' }}>Đã ẩn</span>}
                          {c.content}
                        </div>
                        
                        {c.moderationNote && (
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 4, fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={12} />
                            <span>Ghi chú: {c.moderationNote}</span>
                          </div>
                        )}

                        {/* Action Confirmation Overlay (Inline) */}
                        {commentActionId === c.id && (
                          <div style={{ 
                            marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', 
                            borderRadius: 8, border: `1px solid ${actionType === 'delete' ? '#ef4444' : '#f59e0b'}`
                          }}>
                            <h4 style={{ margin: '0 0 0.5rem', color: actionType === 'delete' ? '#ef4444' : '#f59e0b' }}>
                              {actionType === 'delete' ? 'Xác nhận xóa bình luận?' : 'Ẩn bình luận này?'}
                            </h4>
                            <p style={{ fontSize: 13, opacity: 0.8, marginBottom: '0.5rem' }}>
                              {actionType === 'delete' 
                                ? 'Hành động này không thể hoàn tác. Vui lòng nhập lý do xóa (tùy chọn):' 
                                : 'Bình luận sẽ bị ẩn khỏi người dùng khác. Vui lòng nhập lý do:'}
                            </p>
                            <input 
                              value={actionReason}
                              onChange={(e) => setActionReason(e.target.value)}
                              placeholder="Nhập lý do..."
                              style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-default)', borderRadius: 4, color: 'white', marginBottom: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button onClick={() => { setCommentActionId(null); setActionType(null); }} className="broadcast-action-btn" style={{ padding: '4px 12px', fontSize: 13 }}>Hủy</button>
                              <button onClick={confirmCommentAction} className="broadcast-action-btn" style={{ 
                                padding: '4px 12px', fontSize: 13, 
                                background: actionType === 'delete' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: actionType === 'delete' ? '#ef4444' : '#f59e0b',
                                borderColor: actionType === 'delete' ? '#ef4444' : '#f59e0b'
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
    </div>
  );
};

export default CommunityDashboardPage;
