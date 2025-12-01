import axiosInstance from './axiosInstance';

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'draft' | 'published' | 'archived';

export interface PostCreateRequest {
  title: string;
  content: string;
  status: PostStatus;
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
}

export interface PostUpdateRequest {
  title?: string;
  content?: string;
  status?: PostStatus;
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
}

export interface PostSummary {
  id: number;
  title: string;
  content: string;
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
  userId?: number;
  userFullName?: string;
  userAvatar?: string;
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentResponse {
  id: number;
  postId: number;
  userId: number;
  userFullName?: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  parentId?: number | null;
  hidden?: boolean;
  reportCount?: number;
  moderationNote?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

const toArray = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  const page = data as Partial<PageResponse<T>>;
  if (page && Array.isArray(page.content)) return page.content as T[];
  return [];
};

class CommunityService {
  async listPosts(params?: { page?: number; size?: number; status?: string; authorId?: number; search?: string }): Promise<{ items: PostSummary[]; total?: number }>{
    const { data } = await axiosInstance.get('/api/posts', { params });
    const items = toArray<PostSummary>(data);
    const total = (data as any)?.totalElements ?? items.length;
    return { items, total };
  }

  async listSavedPosts(params?: { page?: number; size?: number }): Promise<{ items: PostSummary[]; total?: number }> {
    const { data } = await axiosInstance.get('/api/posts/saved', { params });
    const items = toArray<PostSummary>(data);
    const total = (data as any)?.totalElements ?? items.length;
    return { items, total };
  }

  async getPost(id: number): Promise<PostSummary> {
    const { data } = await axiosInstance.get(`/api/posts/${id}`);
    return data as PostSummary;
  }

  async createPost(req: PostCreateRequest): Promise<PostSummary> {
    const { data } = await axiosInstance.post('/api/posts', req);
    return data as PostSummary;
  }

  async updatePost(id: number, req: PostUpdateRequest): Promise<PostSummary> {
    const { data } = await axiosInstance.put(`/api/posts/${id}`, req);
    return data as PostSummary;
  }

  async deletePost(id: number): Promise<void> {
    await axiosInstance.delete(`/api/posts/${id}`);
  }

  async likePost(id: number): Promise<PostSummary> {
    const { data } = await axiosInstance.post(`/api/posts/${id}/like`);
    return data as PostSummary;
  }

  async dislikePost(id: number): Promise<PostSummary> {
    const { data } = await axiosInstance.post(`/api/posts/${id}/dislike`);
    return data as PostSummary;
  }

  async savePost(id: number): Promise<void> {
    await axiosInstance.post(`/api/posts/${id}/save`);
  }

  async listComments(postId: number, page = 0, size = 20, includeHidden = false): Promise<{ items: CommentResponse[]; total?: number }>{
    const { data } = await axiosInstance.get(`/api/posts/${postId}/comments`, { params: { page, size, includeHidden } });
    const items = toArray<CommentResponse>(data);
    const total = (data as any)?.totalElements ?? items.length;
    return { items, total };
  }

  async addComment(postId: number, payload: { content: string; parentId?: number | null }): Promise<CommentResponse> {
    const { data } = await axiosInstance.post(`/api/posts/${postId}/comments`, payload);
    return data as CommentResponse;
  }

  async deleteComment(postId: number, commentId: number): Promise<void> {
    await axiosInstance.delete(`/api/posts/${postId}/comments/${commentId}`);
  }

  async hideComment(postId: number, commentId: number, note?: string): Promise<void> {
    await axiosInstance.post(`/api/posts/${postId}/comments/${commentId}/hide`, { note });
  }

  async unhideComment(postId: number, commentId: number): Promise<void> {
    await axiosInstance.post(`/api/posts/${postId}/comments/${commentId}/unhide`);
  }

  async reportComment(postId: number, commentId: number, reason: string): Promise<void> {
    await axiosInstance.post(`/api/posts/${postId}/comments/${commentId}/report`, { reason });
  }

  async getStats(): Promise<Record<string, number>> {
    const { data } = await axiosInstance.get('/api/posts/stats');
    return data as Record<string, number>;
  }

  async getTrends(): Promise<{ trends: { topic: string; count: number }[] }> {
    const { data } = await axiosInstance.get('/api/posts/trends');
    return data as { trends: { topic: string; count: number }[] };
  }
}

const communityService = new CommunityService();
export default communityService;

