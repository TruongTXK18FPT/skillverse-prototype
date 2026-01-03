import React, { useState, useEffect, useRef } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { 
  Send, 
  Smile, 
  ArrowLeft,
  Users,
  MoreVertical,
  Search,
  Shield,
  Image as ImageIcon
} from 'lucide-react';
import { API_BASE_URL } from '../../services/axiosInstance';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import './FamilyChatWindow.css';

interface FamilyChatWindowProps {
  familyMemberId: number; // Parent or Student ID
  familyMemberName: string;
  familyMemberAvatar?: string;
  currentUserId: number;
  currentUserName: string;
  isParent: boolean; // true if I'm parent, false if I'm student
  onBack: () => void;
}

interface Message {
  id: string;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
}

const FamilyChatWindow: React.FC<FamilyChatWindowProps> = ({
  familyMemberId,
  familyMemberName,
  familyMemberAvatar,
  currentUserId,
  currentUserName,
  isParent,
  onBack
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [connected, setConnected] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);

  const resolveAvatarUrl = (raw?: string): string => {
    if (!raw) return '/images/meowl.jpg';
    if (/^https?:\/\//i.test(raw)) return raw;
    const apiRoot = API_BASE_URL.replace(/\/api$/i, '');
    if (raw.startsWith('/')) return `${apiRoot}${raw}`;
    return `${apiRoot}/${raw}`;
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // WebSocket connection
  useEffect(() => {
    loadChatHistory(); // Load saved messages first
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, [familyMemberId]);
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      const storageKey = `family_chat_${currentUserId}_${familyMemberId}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, currentUserId, familyMemberId]);

  const connectWebSocket = () => {
    const socket = new SockJS(`${API_BASE_URL.replace('/api', '')}/ws`);
    const client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);

        // Subscribe to family chat messages
        // Topic format: /topic/family/{parentId}/{studentId}
        const topic = isParent 
          ? `/topic/family/${currentUserId}/${familyMemberId}`
          : `/topic/family/${familyMemberId}/${currentUserId}`;

        client.subscribe(topic, (message: IMessage) => {
          try {
            const msg = JSON.parse(message.body);
            const newMessage: Message = {
              id: msg.id || Date.now().toString(),
              senderId: msg.senderId,
              senderName: msg.senderName || (msg.senderId === currentUserId ? currentUserName : familyMemberName),
              content: msg.content,
              timestamp: msg.timestamp || new Date().toISOString()
            };
            
            // Handle duplicates and temp message replacement
            setMessages(prev => {
              // Check if this is an exact duplicate (same ID)
              const exactDuplicate = prev.some(m => m.id === newMessage.id);
              if (exactDuplicate) {
                return prev;
              }
              
              // Check if this is our own message coming back from server (replace temp message)
              if (newMessage.senderId === currentUserId) {
                const tempMsgIndex = prev.findIndex(m => 
                  m.id.toString().startsWith('temp-') &&
                  m.content === newMessage.content &&
                  Math.abs(new Date(m.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 2000
                );
                
                if (tempMsgIndex !== -1) {
                  const updated = [...prev];
                  updated[tempMsgIndex] = newMessage; // Replace temp with real
                  return updated;
                }
              }
              
              // Check if duplicate from another user (shouldn't happen but safety check)
              const contentDuplicate = prev.some(m =>
                m.senderId === newMessage.senderId &&
                m.content === newMessage.content &&
                Math.abs(new Date(m.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000
              );
              
              if (contentDuplicate) {
                return prev;
              }
              
              // New message from other user
              return [...prev, newMessage];
            });
            
            // Show notification if message is from family member and window is not focused
            if (msg.senderId !== currentUserId && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(familyMemberName, {
                body: msg.content.substring(0, 100),
                icon: resolveAvatarUrl(familyMemberAvatar),
                tag: `family-${familyMemberId}`,
                requireInteraction: false
              });
            }
          } catch (error) {
            console.error('Failed to parse family message:', error);
          }
        });

        // Load chat history (if backend provides it)
        loadChatHistory();
      },
      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
        setConnected(false);
      },
      onWebSocketClose: () => {
        setConnected(false);
      }
    });

    client.activate();
    stompClientRef.current = client;
  };

  const disconnectWebSocket = () => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
      setConnected(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      // Load messages from localStorage as fallback until backend API is available
      const storageKey = `family_chat_${currentUserId}_${familyMemberId}`;
      const savedMessages = localStorage.getItem(storageKey);
      
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      const storageKey = `family_chat_${currentUserId}_${familyMemberId}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, currentUserId, familyMemberId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !connected) return;

    const messageContent = inputText.trim();
    setInputText('');

    // Optimistic update - add message immediately
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      content: messageContent,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    const messagePayload = {
      senderId: currentUserId,
      senderName: currentUserName,
      recipientId: familyMemberId,
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    // Send via WebSocket
    // Destination format: /app/family/{parentId}/{studentId}
    const destination = isParent
      ? `/app/family/${currentUserId}/${familyMemberId}`
      : `/app/family/${familyMemberId}/${currentUserId}`;

    stompClientRef.current?.publish({
      destination,
      body: JSON.stringify(messagePayload)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string, isCustom?: boolean, customUrl?: string) => {
    // emoji is the actual emoji character or URL, not an object
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = (gifUrl: string, previewUrl: string) => {
    if (!connected) return;
    setShowGifPicker(false);

    const messagePayload = {
      senderId: currentUserId,
      senderName: currentUserName,
      recipientId: familyMemberId,
      content: `[GIF]${gifUrl}`,
      timestamp: new Date().toISOString()
    };

    const destination = isParent
      ? `/app/family/${currentUserId}/${familyMemberId}`
      : `/app/family/${familyMemberId}/${currentUserId}`;

    stompClientRef.current?.publish({
      destination,
      body: JSON.stringify(messagePayload)
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    // Convert to Vietnam timezone (GMT+7)
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  return (
    <div className="family-chat-window">
      {/* Header */}
      <div className="family-chat-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        
        <div className="family-chat-header-info">
          <img 
            src={resolveAvatarUrl(familyMemberAvatar)} 
            alt={familyMemberName}
            className="family-avatar"
          />
          <div className="family-info">
            <h3>{familyMemberName}</h3>
            <div className="family-status">
              <Shield size={14} />
              <span>{isParent ? 'Con' : 'Phụ huynh'}</span>
              {connected && <div className="status-dot connected" />}
            </div>
          </div>
        </div>

        <div className="family-chat-header-actions">
          <button className="header-action-btn" title="Tìm kiếm">
            <Search size={20} />
          </button>
          <button className="header-action-btn" title="Thêm">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {!connected && (
        <div className="connection-warning">
          🔄 Đang kết nối...
        </div>
      )}

      {/* Messages */}
      <div className="family-chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <Users size={48} />
            <p>Bắt đầu trò chuyện với {familyMemberName}</p>
            <span>Tin nhắn của bạn được bảo mật an toàn</span>
          </div>
        )}
        
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          const isGif = msg.content.startsWith('[GIF]');
          const gifUrl = isGif ? msg.content.replace('[GIF]', '') : null;
          
          return (
            <div 
              key={msg.id} 
              className={`family-message ${isMine ? 'mine' : 'theirs'}`}
            >
              {!isMine && (
                <img 
                  src={resolveAvatarUrl(familyMemberAvatar)} 
                  alt="" 
                  className="msg-avatar"
                />
              )}
              <div className="msg-content">
                <div className={`msg-bubble ${isGif ? 'gif-message' : ''}`}>
                  {isGif && gifUrl ? (
                    <img 
                      src={gifUrl} 
                      alt="GIF" 
                      className="msg-gif-image"
                      onClick={() => window.open(gifUrl, '_blank')}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
                <span className="msg-time">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="family-chat-input">
        <button 
          className="input-action-btn"
          onClick={() => {
            setShowEmojiPicker(!showEmojiPicker);
            setShowGifPicker(false);
          }}
          title="Emoji"
        >
          <Smile size={22} />
        </button>

        <button 
          className="input-action-btn gif-btn"
          onClick={() => {
            setShowGifPicker(!showGifPicker);
            setShowEmojiPicker(false);
          }}
          title="GIF"
          disabled={!connected}
        >
          <ImageIcon size={22} />
        </button>

        <textarea
          className="message-input"
          placeholder={connected ? "Nhập tin nhắn..." : "Đang kết nối..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!connected}
          rows={1}
        />

        <button 
          className="send-btn"
          onClick={handleSendMessage}
          disabled={!connected || !inputText.trim()}
        >
          <Send size={20} />
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="emoji-picker-container">
            <EmojiPicker
              isOpen={showEmojiPicker}
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        {/* GIF Picker */}
        {showGifPicker && (
          <div className="gif-picker-container">
            <GifPicker
              isOpen={showGifPicker}
              onGifSelect={handleGifSelect}
              onClose={() => setShowGifPicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyChatWindow;
