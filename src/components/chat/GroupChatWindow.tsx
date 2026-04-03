import React, { useState, useEffect, useRef } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { 
  Send, 
  Smile, 
  Gift, 
  Users, 
  MoreVertical,
  ArrowLeft,
  X,
  Reply,
  ChevronDown,
  Bell,
  BellOff,
  Search
} from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import MemberListModal from './MemberListModal';
import MessageBubble, { MessageData, MessageType } from './MessageBubble';
import { getGroupMessages, sendMessage, getGroupDetail, type GroupMemberDTO } from '../../services/groupChatService';
import { API_BASE_URL } from '../../services/axiosInstance';
import { useChatSettings } from '../../context/ChatSettingsContext';
import { playNotificationSound } from '../../utils/notificationSound';
import './GroupChatWindow.css';

interface GroupInfo {
  groupId: string;
  groupName: string;
  groupImageUrl?: string;
  memberCount: number;
  mentorId: string;
  mentorName: string;
  description?: string;
  members?: GroupMemberDTO[];
}

interface GroupChatWindowProps {
  groupId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onBack?: () => void;
  onGroupInfoUpdate?: (info: GroupInfo) => void;
}

const GroupChatWindow: React.FC<GroupChatWindowProps> = ({
  groupId,
  currentUserId: rawCurrentUserId,
  currentUserName,
  currentUserAvatar,
  onBack,
  onGroupInfoUpdate
}) => {
  // Ensure currentUserId is always string for comparison
  const currentUserId = String(rawCurrentUserId);
  const { settings } = useChatSettings();

  // State
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [inputText, setInputText] = useState('');
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Picker states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState<MessageData | null>(null);
  
  // Notification state
  const [isMuted, setIsMuted] = useState(false);
  
  // Scroll state
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Image preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stompClientRef = useRef<Client | null>(null);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load group info and messages
  useEffect(() => {
    loadGroupData();
    setupWebSocket();

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [groupId]);

  // Helper to get user info from members list
  const getUserInfo = (senderId: string) => {
    if (!groupInfo?.members) return { name: null, avatar: null };
    
    const member = groupInfo.members.find(m => m.userId.toString() === senderId);
    if (member) {
      return {
        name: member.userName || member.userEmail,
        avatar: member.userAvatarUrl
      };
    }
    return { name: null, avatar: null };
  };

  const loadGroupData = async () => {
    setIsLoading(true);
    try {
      // Load group details
      const userId = parseInt(currentUserId);
      const detail = await getGroupDetail(parseInt(groupId), userId);
      const info: GroupInfo = {
        groupId: detail.id.toString(),
        groupName: detail.name,
        groupImageUrl: detail.avatarUrl,
        memberCount: detail.memberCount || 0,
        mentorId: detail.mentorId.toString(),
        mentorName: detail.mentorName || '',
        description: undefined,
        members: detail.members
      };
      setGroupInfo(info);
      onGroupInfoUpdate?.(info);

      // Load messages
      const msgs = await getGroupMessages(parseInt(groupId), userId);
      const formattedMessages: MessageData[] = msgs.map((msg: any) => {
        const parsedSenderId = msg.senderId != null ? String(msg.senderId) : '';
        
        // Get user info from members if missing from message
        const userInfo = getUserInfo(parsedSenderId);
        
        return {
          id: (msg.id || msg.messageId).toString(),
          content: msg.content,
          messageType: (msg.messageType || 'TEXT') as MessageType,
          senderId: parsedSenderId,
          senderName: msg.senderName || userInfo.name || 'Unknown',
          senderAvatarUrl: msg.senderAvatarUrl || userInfo.avatar,
          timestamp: msg.timestamp || msg.sentAt,
          gifUrl: msg.gifUrl,
          imageUrl: msg.imageUrl,
          emojiCode: msg.emojiCode,
          status: 'read'
        };
      });
      setMessages(formattedMessages);
      
      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Failed to load group data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocket = () => {
    const socketUrl = API_BASE_URL.replace(/\/api\/?$/i, '/ws');
    const socket = new SockJS(socketUrl);
    const client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      // Subscribe to group messages
      client.subscribe(`/topic/group.${groupId}`, (message: IMessage) => {
        const newMessage = JSON.parse(message.body);
        handleNewMessage(newMessage);
      });
    };

    client.onStompError = (frame) => {
      console.error('STOMP error:', frame);
    };

    client.activate();
    stompClientRef.current = client;
  };

  const handleNewMessage = (msg: any) => {
    // Extract senderId with proper type handling
    const rawSenderId = msg.senderId ?? msg.sender_id;
    const parsedSenderId = rawSenderId != null ? String(rawSenderId) : '';
    
    // Get user info from members if missing from message
    const userInfo = getUserInfo(parsedSenderId);
    
    const newMsg: MessageData = {
      id: (msg.messageId || msg.id || Date.now()).toString(),
      content: msg.content,
      messageType: (msg.messageType || 'TEXT') as MessageType,
      senderId: parsedSenderId,
      senderName: msg.senderName || msg.sender_name || userInfo.name || 'Unknown',
      senderAvatarUrl: msg.senderAvatarUrl || msg.sender_avatar_url || userInfo.avatar,
      timestamp: msg.timestamp || new Date().toISOString(),
      gifUrl: msg.gifUrl || msg.gif_url,
      imageUrl: msg.imageUrl || msg.image_url,
      emojiCode: msg.emojiCode || msg.emoji_code,
      status: 'delivered'
    };

    // Check if user is at bottom BEFORE adding message
    const container = messagesContainerRef.current;
    const wasAtBottom = container ? 
      container.scrollHeight - container.scrollTop - container.clientHeight < 100 : true;

    // Check if message already exists to prevent duplicates
    setMessages(prev => {
      // Check if message with same ID or same content+timestamp already exists
      const isDuplicate = prev.some(m => 
        m.id === newMsg.id || 
        (m.senderId === newMsg.senderId && 
         m.content === newMsg.content && 
         Math.abs(new Date(m.timestamp).getTime() - new Date(newMsg.timestamp).getTime()) < 1000)
      );
      
      if (isDuplicate) {
        return prev;
      }
      
      return [...prev, newMsg];
    });

    // Scroll handling after state update
    if (container) {
      if (wasAtBottom) {
        // Use requestAnimationFrame to ensure DOM has updated, instant scroll to prevent jump
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollToBottom(true));
        });
      } else if (newMsg.senderId !== currentUserId) {
        setUnreadCount(prev => prev + 1);
        setShowScrollDown(true);
        
        // Browser notification (controlled by notifyNewMessage)
        if (settings.notifyNewMessage && !isMuted && document.hidden) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newMsg.senderName, {
              body: newMsg.messageType === 'TEXT' ? newMsg.content : `Đã gửi ${newMsg.messageType === 'GIF' ? 'GIF' : newMsg.messageType === 'IMAGE' ? 'hình ảnh' : 'emoji'}`,
              icon: newMsg.senderAvatarUrl || '/images/meowl.jpg',
              tag: `group-${groupId}`,
              requireInteraction: false
            });
          }
        }
        // Sound notification (controlled by soundNotification)
        if (settings.soundNotification && !isMuted) {
          playNotificationSound();
        }
      }
    }
  };

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
    setUnreadCount(0);
    setShowScrollDown(false);
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isAtBottom) {
        setShowScrollDown(false);
        setUnreadCount(0);
      }
    }
  };

  // Send message handlers
  const handleSendMessage = async (
    type: MessageType = 'TEXT',
    content?: string,
    gifUrl?: string,
    imageUrl?: string,
    emojiCode?: string
  ) => {
    const messageContent = content || inputText.trim();
    
    // Validation based on message type
    if (type === 'TEXT' && !messageContent) return;
    if (type === 'GIF' && !gifUrl) return;
    if (type === 'IMAGE' && !imageUrl) return;
    if (type === 'EMOJI' && !emojiCode) return;

    setIsSending(true);

    try {
      // Optimistic update
      const tempMessage: MessageData = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        messageType: type,
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatarUrl: currentUserAvatar,
        timestamp: new Date().toISOString(),
        gifUrl,
        imageUrl,
        emojiCode,
        status: 'sending'
      };
      setMessages(prev => [...prev, tempMessage]);
      setInputText('');
      setReplyingTo(null);
      scrollToBottom();

      // Send via API
      await sendMessage({
        groupId,
        content: messageContent,
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatarUrl: currentUserAvatar,
        messageType: type,
        gifUrl,
        imageUrl,
        emojiCode
      });

      // Update status
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mark as failed
      setMessages(prev => 
        prev.filter(msg => !msg.id.startsWith('temp-'))
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Emoji handler - receives 3 separate parameters from EmojiPicker
  const handleEmojiSelect = (emoji: string, isCustom?: boolean, _customUrl?: string) => {
    if (isCustom) {
      // Send as emoji message type with custom emoji
      handleSendMessage('EMOJI', emoji, undefined, undefined, emoji);
    } else {
      // Insert native emoji into input
      setInputText(prev => prev + emoji);
      inputRef.current?.focus();
    }
    setShowEmojiPicker(false);
  };

  // GIF handler - receives both urls from GifPicker
  const handleGifSelect = (gifUrl: string, previewUrl: string) => {
    handleSendMessage('GIF', 'GIF', gifUrl);
    setShowGifPicker(false);
  };

  // Image handler
  const handleImageSelect = (imageUrl: string) => {
    handleSendMessage('IMAGE', 'Image', undefined, imageUrl);
  };

  // Reply handler
  const handleReply = (message: MessageData) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  // Delete handler
  const handleDeleteMessage = async (messageId: string) => {
    // TODO: Implement delete API
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  // Copy handler
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: Show toast notification
  };

  // Reaction handler
  const handleReaction = (messageId: string, emoji: string) => {
    // TODO: Implement reaction API
  };

  // Member kicked handler
  const handleMemberKicked = () => {
    // Reload group info
    loadGroupData();
  };

  // Close all pickers
  const closeAllPickers = () => {
    setShowEmojiPicker(false);
    setShowGifPicker(false);
  };

  return (
    <div className="group-chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              <ArrowLeft size={20} />
            </button>
          )}
          
          <div className="chat-group-info" onClick={() => setShowMemberList(true)}>
            <div className="chat-group-avatar">
              {groupInfo?.groupImageUrl ? (
                <img src={groupInfo.groupImageUrl} alt={groupInfo.groupName} />
              ) : (
                <Users size={24} />
              )}
            </div>
            <div className="chat-group-details">
              <h3 className="chat-group-name">{groupInfo?.groupName || 'Loading...'}</h3>
              <span className="chat-group-members">
                {groupInfo?.memberCount || 0} thành viên • {groupInfo?.mentorName && `Mentor: ${groupInfo.mentorName}`}
              </span>
            </div>
          </div>
        </div>

        <div className="chat-header-actions">
          <button className="header-action-btn" title="Tìm kiếm">
            <Search size={20} />
          </button>
          <button 
            className={`header-action-btn ${isMuted ? 'muted' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Bật thông báo' : 'Tắt thông báo'}
          >
            {isMuted ? <BellOff size={20} /> : <Bell size={20} />}
          </button>
          <button 
            className="header-action-btn"
            onClick={() => setShowMemberList(true)}
            title="Danh sách thành viên"
          >
            <Users size={20} />
            {groupInfo?.memberCount && (
              <span className="member-count-badge">{groupInfo.memberCount}</span>
            )}
          </button>
          <button 
            className="header-action-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Cài đặt nhóm"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="chat-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="chat-loading">
            <div className="loading-spinner" />
            <span>Đang tải tin nhắn...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <Users size={48} />
            <h4>Chào mừng đến với nhóm!</h4>
            <p>Hãy bắt đầu cuộc trò chuyện đầu tiên</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
              const showName = showAvatar && message.senderId !== currentUserId;
              const isOwn = message.senderId === currentUserId;
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={isOwn}
                  currentUserId={currentUserId}
                  showAvatar={showAvatar}
                  showSenderName={showName}
                  onReply={handleReply}
                  onReact={handleReaction}
                  onDelete={message.senderId === currentUserId ? handleDeleteMessage : undefined}
                  onCopy={handleCopy}
                  onImageClick={setPreviewImage}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {/* Scroll to bottom button */}
        {showScrollDown && (
          <button className="scroll-down-btn" onClick={() => scrollToBottom()}>
            <ChevronDown size={20} />
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </button>
        )}
      </div>

      {/* Reply preview */}
      {replyingTo && (
        <div className="reply-preview">
          <Reply size={16} />
          <div className="reply-content">
            <span className="reply-to">Trả lời {replyingTo.senderName}</span>
            <span className="reply-text">
              {replyingTo.messageType === 'IMAGE' ? '📷 Hình ảnh' :
               replyingTo.messageType === 'GIF' ? '🎬 GIF' :
               replyingTo.messageType === 'EMOJI' ? replyingTo.emojiCode :
               replyingTo.content.substring(0, 50) + (replyingTo.content.length > 50 ? '...' : '')}
            </span>
          </div>
          <button className="reply-close" onClick={() => setReplyingTo(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="chat-input-area">
        <div className="input-actions-left">
          <button 
            className={`input-action-btn ${showEmojiPicker ? 'active' : ''}`}
            onClick={() => {
              closeAllPickers();
              setShowEmojiPicker(!showEmojiPicker);
            }}
            title="Emoji"
          >
            <Smile size={22} />
          </button>
          <button 
            className={`input-action-btn ${showGifPicker ? 'active' : ''}`}
            onClick={() => {
              closeAllPickers();
              setShowGifPicker(!showGifPicker);
            }}
            title="GIF"
          >
            <Gift size={22} />
          </button>
        </div>

        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="message-input"
            placeholder="Nhập tin nhắn..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
          />
        </div>

        <div className="input-actions-right">
          <button 
            className="send-btn"
            onClick={() => handleSendMessage()}
            disabled={isSending || !inputText.trim()}
          >
            <Send size={20} />
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="picker-container emoji">
            <EmojiPicker
              isOpen={showEmojiPicker}
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        {/* GIF Picker */}
        {showGifPicker && (
          <div className="picker-container gif">
            <GifPicker
              isOpen={showGifPicker}
              onGifSelect={(gifUrl, previewUrl) => handleGifSelect(gifUrl, previewUrl)}
              onClose={() => setShowGifPicker(false)}
            />
          </div>
        )}
      </div>

      {/* Member List Modal */}
      {showMemberList && groupInfo && (
        <MemberListModal
          isOpen={showMemberList}
          onClose={() => setShowMemberList(false)}
          groupId={parseInt(groupInfo.groupId)}
          groupName={groupInfo.groupName}
          mentorId={parseInt(groupInfo.mentorId)}
          onMemberKicked={handleMemberKicked}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="image-preview-modal" onClick={() => setPreviewImage(null)}>
          <button className="preview-close">
            <X size={24} />
          </button>
          <img src={previewImage} alt="Preview" />
        </div>
      )}
    </div>
  );
};

export default GroupChatWindow;
