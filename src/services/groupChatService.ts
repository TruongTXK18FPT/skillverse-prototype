import axiosInstance from './axiosInstance';

export interface GroupChatCreateRequest {
  courseId: number;
  name: string;
  avatarUrl?: string;
}

/**
 * DTO for group chat member information
 */
export interface GroupMemberDTO {
  userId: number;
  userName: string;
  email: string;
  avatarUrl?: string;
  role: 'MENTOR' | 'STUDENT';
  joinedAt: string;
  isOnline: boolean;
}

export interface GroupChatResponse {
  id: number;
  courseId: number;
  mentorId: number;
  mentorName: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  isMember: boolean;
  memberCount: number;
  members?: GroupMemberDTO[];
}

/**
 * Message types for group chat
 */
export type MessageType = 'TEXT' | 'EMOJI' | 'GIF' | 'IMAGE';

export interface GroupChatMessage {
  id: number;
  groupId: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
  /** Message type: TEXT, EMOJI, GIF, IMAGE */
  messageType?: MessageType;
  /** URL for GIF content */
  gifUrl?: string;
  /** URL for Image content */
  imageUrl?: string;
  /** Custom emoji code */
  emojiCode?: string;
  /** Sender's avatar URL */
  senderAvatarUrl?: string;
}

export const createGroup = async (mentorId: number, request: GroupChatCreateRequest): Promise<GroupChatResponse> => {
  const response = await axiosInstance.post(`/group-chats?mentorId=${mentorId}`, request);
  return response.data;
};

export const updateGroup = async (groupId: number, mentorId: number, request: GroupChatCreateRequest): Promise<GroupChatResponse> => {
  const response = await axiosInstance.put(`/group-chats/${groupId}?mentorId=${mentorId}`, request);
  return response.data;
};

export const joinGroup = async (groupId: number, userId: number): Promise<void> => {
  await axiosInstance.post(`/group-chats/${groupId}/join?userId=${userId}`);
};

export const leaveGroup = async (groupId: number, userId: number): Promise<void> => {
  await axiosInstance.post(`/group-chats/${groupId}/leave?userId=${userId}`);
};

export const getMyGroups = async (userId: number): Promise<GroupChatResponse[]> => {
  const response = await axiosInstance.get(`/group-chats/my-groups?userId=${userId}`);
  return response.data;
};

export const getGroupByCourse = async (courseId: number, userId?: number): Promise<GroupChatResponse | null> => {
  const response = await axiosInstance.get(`/group-chats/course/${courseId}${userId ? `?userId=${userId}` : ''}`);
  return response.data;
};

export const getGroupMessages = async (groupId: number, userId: number): Promise<GroupChatMessage[]> => {
  const response = await axiosInstance.get(`/group-chats/${groupId}/messages?userId=${userId}`);
  return response.data;
};

/**
 * Get detailed group info including members list
 */
export const getGroupDetail = async (groupId: number, userId: number): Promise<GroupChatResponse> => {
  const response = await axiosInstance.get(`/group-chats/${groupId}/detail?userId=${userId}`);
  return response.data;
};

/**
 * Get list of members in a group
 */
export const getGroupMembers = async (groupId: number, userId: number): Promise<GroupMemberDTO[]> => {
  const response = await axiosInstance.get(`/group-chats/${groupId}/members?userId=${userId}`);
  return response.data;
};

/**
 * Get member count for a group
 */
export const getGroupMemberCount = async (groupId: number): Promise<number> => {
  const response = await axiosInstance.get(`/group-chats/${groupId}/member-count`);
  return response.data;
};

/**
 * Kick a member from the group (mentor only)
 */
export const kickMember = async (groupId: number, mentorId: number, targetUserId: number): Promise<void> => {
  await axiosInstance.post(`/group-chats/${groupId}/kick?mentorId=${mentorId}&targetUserId=${targetUserId}`);
};

/**
 * Send a message to group chat
 */
export interface SendMessageRequest {
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType?: MessageType;
  gifUrl?: string;
  imageUrl?: string;
  emojiCode?: string;
  senderAvatarUrl?: string;
}

export const sendMessage = async (message: SendMessageRequest): Promise<void> => {
  await axiosInstance.post(`/group-chats/${message.groupId}/messages`, {
    senderId: parseInt(message.senderId),
    content: message.content,
    messageType: message.messageType || 'TEXT',
    gifUrl: message.gifUrl,
    imageUrl: message.imageUrl,
    emojiCode: message.emojiCode,
    senderAvatarUrl: message.senderAvatarUrl
  });
};
