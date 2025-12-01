import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Bookmark, ArrowLeft, MessageCircle, Share2 } from 'lucide-react';
import communityService, { CommentResponse, PostSummary } from '../../services/communityService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { decodeHtml } from '../../utils/htmlDecoder';

const PostDetailPage: React.FC = () => {
  const { id } = useParams();
  const postId = Number(id);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [post, setPost] = useState<PostSummary | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [authorName, setAuthorName] = useState<string>('');
  const [authorAvatar, setAuthorAvatar] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const p = await communityService.getPost(postId);
        setPost(p);
        setLikeCount(typeof p.likeCount === 'number' ? p.likeCount : 0);
        setDislikeCount(typeof p.dislikeCount === 'number' ? p.dislikeCount : 0);
        const cs = await communityService.listComments(postId, 0, 50);
        setComments(cs.items);
        if (p.userId) {
          try {
            const profile = await userService.getUserProfile(p.userId);
            setAuthorName(profile.fullName || `User #${p.userId}`);
            setAuthorAvatar(profile.avatarMediaUrl || '');
          } catch {
            setAuthorName(`User #${p.userId}`);
          }
        }
      } catch (e) {
        setError('Không thể tải bài viết');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [postId]);

  const ensureAuth = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleLike = async () => {
    if (!ensureAuth()) return;
    try {
      await communityService.likePost(postId);
      if (isLiked) {
        setIsLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        setIsLiked(true);
        setLikeCount((c) => c + 1);
        if (isDisliked) {
          setIsDisliked(false);
          setDislikeCount((c) => Math.max(0, c - 1));
        }
      }
    } catch (error) {
      console.error('Failed to like post', error);
    }
  };

  const handleDislike = async () => {
    if (!ensureAuth()) return;
    try {
      await communityService.dislikePost(postId);
      if (isDisliked) {
        setIsDisliked(false);
        setDislikeCount((c) => Math.max(0, c - 1));
      } else {
        setIsDisliked(true);
        setDislikeCount((c) => c + 1);
        if (isLiked) {
          setIsLiked(false);
          setLikeCount((c) => Math.max(0, c - 1));
        }
      }
    } catch (error) {
      console.error('Failed to dislike post', error);
    }
  };

  const handleSave = async () => {
    if (!ensureAuth()) return;
    try {
      await communityService.savePost(postId);
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to save post', error);
    }
  };

  const handleAddComment = async () => {
    if (!ensureAuth() || !commentText.trim()) return;
    try {
      const created = await communityService.addComment(postId, { content: commentText.trim() });
      setComments((prev) => [created, ...prev]);
      setCommentText('');
    } catch (error) {
      console.error('Failed to add comment', error);
    }
  };

  if (loading) return (
    <div className="transmission-layout">
      <div className="transmission-container">
        <div className="transmission-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="transmission-layout">
      <div className="transmission-container">
        <div className="transmission-error">
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="broadcast-back-btn" style={{marginTop: '1rem'}}>
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!post) return <div style={{ padding: '2rem' }}>Không tìm thấy bài viết</div>;

  // Pre-process content: Decode HTML and convert <img> tags to Markdown
  let processedContent = decodeHtml(post.content || '');
  processedContent = processedContent.replace(/<img[^>]+src="([^"]+)"[^>]*>/g, '![]($1)');
  // Also handle <p> wrapping images if any
  processedContent = processedContent.replace(/<p>\s*(!\[\]\([^)]+\))\s*<\/p>/g, '$1');

  const decodedTitle = decodeHtml(post.title);

  return (
    <div className="transmission-layout">
      <div className="transmission-container">
        <div className="broadcast-form-header" style={{ marginBottom: '1rem' }}>
          <button onClick={() => navigate(-1)} className="broadcast-back-btn">
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
        </div>

        <article className="transmission-card" style={{ padding: '2rem', animation: 'none' }}>
          <h1 className="transmission-title" style={{ fontSize: '2rem', marginBottom: '1.5rem', lineHeight: 1.3 }}>
            {decodedTitle}
          </h1>

          {post.thumbnailUrl && (
            <div style={{ width: '100%', maxHeight: '400px', overflow: 'hidden', borderRadius: 12, marginBottom: '2rem', border: '1px solid var(--border-default)' }}>
              <img src={post.thumbnailUrl} alt={decodedTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px dashed var(--border-default)' }}>
            <div className="header-user-avatar" style={{ width: 48, height: 48 }}>
              {authorAvatar ? (
                <img src={authorAvatar} alt={authorName} className="header-avatar-img" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span style={{ display: 'inline-block', width: '100%', height: '100%', background: 'var(--sv-neutral-800)', borderRadius: '50%' }} />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{authorName || (post.userId ? `User #${post.userId}` : 'Người đăng')}</div>
              <div style={{ fontSize: 14, opacity: 0.7, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}</span>
                <span>•</span>
                <span>{post.viewCount || 0} lượt xem</span>
              </div>
            </div>
          </div>

          <div className="markdown-content" style={{ lineHeight: 1.8, fontSize: 16, color: 'var(--text-secondary)' }}>
            <ReactMarkdown
              children={processedContent}
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                h1: ({ node, ...props }) => <h1 style={{ margin: '1.5rem 0 1rem', color: 'var(--text-primary)' }} {...props} />,
                h2: ({ node, ...props }) => <h2 style={{ margin: '1.5rem 0 1rem', color: 'var(--text-primary)' }} {...props} />,
                h3: ({ node, ...props }) => <h3 style={{ margin: '1.25rem 0 0.75rem', color: 'var(--text-primary)' }} {...props} />,
                p: ({ node, ...props }) => <p style={{ margin: '1rem 0' }} {...props} />,
                ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5rem', margin: '1rem 0' }} {...props} />,
                ol: ({ node, ...props }) => <ol style={{ paddingLeft: '1.5rem', margin: '1rem 0' }} {...props} />,
                li: ({ node, ...props }) => <li style={{ margin: '0.5rem 0' }} {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    style={{
                      borderLeft: '4px solid var(--signal-cyan)',
                      paddingLeft: '1rem',
                      margin: '1.5rem 0',
                      fontStyle: 'italic',
                      color: 'var(--text-muted)'
                    }}
                    {...props}
                  />
                ),
                img: ({ node, ...props }) => (
                  <img
                    style={{
                      maxWidth: '100%',
                      borderRadius: 8,
                      margin: '1.5rem 0',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}
                    {...props}
                  />
                ),
                pre: ({ node, ...props }) => (
                  <pre
                    style={{
                      background: 'var(--sv-neutral-900)',
                      padding: '1rem',
                      borderRadius: 8,
                      overflowX: 'auto',
                      margin: '1.5rem 0',
                      border: '1px solid var(--border-default)'
                    }}
                    {...props}
                  />
                ),
                code: ({ node, ...props }) => (
                  <code
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '0.2em 0.4em',
                      borderRadius: 4,
                      fontSize: '0.9em',
                      fontFamily: 'monospace'
                    }}
                    {...props}
                  />
                )
              }}
            />
          </div>

          <div className="transmission-actions" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-default)' }}>
            <button className={`transmission-action-btn ${isLiked ? 'active' : ''}`} onClick={handleLike}>
              <ThumbsUp size={20} />
              <span>{likeCount}</span>
            </button>
            <button className={`transmission-action-btn ${isDisliked ? 'active' : ''}`} onClick={handleDislike}>
              <ThumbsDown size={20} />
              <span>{dislikeCount}</span>
            </button>
            <button className="transmission-action-btn">
              <MessageCircle size={20} />
              <span>{comments.length}</span>
            </button>
            <button className="transmission-action-btn">
              <Share2 size={20} />
              <span>Chia sẻ</span>
            </button>
            <button className={`transmission-action-btn ${isSaved ? 'active' : ''}`} onClick={handleSave} style={{ marginLeft: 'auto' }}>
              <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
              <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
            </button>
          </div>
        </article>

        <div style={{ marginTop: '2rem', maxWidth: '800px', margin: '2rem auto' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageCircle size={20} />
            Bình luận ({comments.length})
          </h3>
          
          <div className="broadcast-form-group" style={{ marginBottom: '2rem' }}>
            <div style={{ position: 'relative' }}>
              <textarea
                placeholder="Chia sẻ suy nghĩ của bạn..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="broadcast-content-textarea"
                style={{ minHeight: '100px', paddingRight: '4rem' }}
              />
              <button 
                className="broadcast-action-btn transmit" 
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                style={{ 
                  position: 'absolute', 
                  bottom: '10px', 
                  right: '10px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem'
                }}
              >
                Gửi
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="transmission-card" style={{ padding: '1.25rem', animation: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>User #{c.userId}</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>{new Date(c.createdAt).toLocaleString('vi-VN')}</div>
                  </div>
                  <div style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>{c.content}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
