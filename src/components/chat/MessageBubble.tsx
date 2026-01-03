import React, { useState } from 'react';
import { 
  Heart, 
  Reply, 
  MoreHorizontal, 
  Download, 
  Copy, 
  Trash2,
  ExternalLink,
  Check,
  CheckCheck,
  Clock,
  ImageIcon
} from 'lucide-react';
import './MessageBubble.css';

export type MessageType = 'TEXT' | 'EMOJI' | 'GIF' | 'IMAGE';

export interface MessageData {
  id: string;
  content: string;
  messageType: MessageType;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  timestamp: string;
  gifUrl?: string;
  imageUrl?: string;
  emojiCode?: string;
  reactions?: MessageReaction[];
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  isEdited?: boolean;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

interface MessageBubbleProps {
  message: MessageData;
  isOwnMessage: boolean;
  currentUserId: string;
  showAvatar?: boolean;
  showSenderName?: boolean;
  onReply?: (message: MessageData) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onImageClick?: (imageUrl: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  currentUserId,
  showAvatar = true,
  showSenderName = true,
  onReply,
  onReact,
  onDelete,
  onCopy,
  onImageClick
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const quickReactions = ['❤️', '😂', '😮', '😢', '👍', '👎'];

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const handleCopyText = () => {
    if (message.content && onCopy) {
      onCopy(message.content);
    } else if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
    setShowActions(false);
  };

  const handleDownloadImage = async () => {
    const url = message.imageUrl || message.gifUrl;
    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `skillverse_${message.id}.${message.gifUrl ? 'gif' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
    setShowActions(false);
  };

  const handleReaction = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowReactions(false);
  };

  const renderMessageStatus = () => {
    if (!isOwnMessage) return null;

    switch (message.status) {
      case 'sending':
        return <Clock size={12} className="message-status sending" />;
      case 'sent':
        return <Check size={12} className="message-status sent" />;
      case 'delivered':
        return <CheckCheck size={12} className="message-status delivered" />;
      case 'read':
        return <CheckCheck size={12} className="message-status read" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (message.messageType) {
      case 'EMOJI':
        return (
          <div className="message-emoji-large">
            {message.emojiCode || message.content}
          </div>
        );

      case 'GIF':
        return (
          <div className="message-gif-container">
            {!imageLoaded && !imageError && (
              <div className="message-media-loading">
                <div className="loading-spinner" />
                <span>Đang tải GIF...</span>
              </div>
            )}
            {imageError ? (
              <div className="message-media-error">
                <ImageIcon size={32} />
                <span>Không thể tải GIF</span>
              </div>
            ) : (
              <img
                src={message.gifUrl}
                alt="GIF"
                className={`message-gif ${imageLoaded ? 'loaded' : ''}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                onClick={() => message.gifUrl && window.open(message.gifUrl, '_blank')}
              />
            )}
            <div className="gif-badge">GIF</div>
          </div>
        );

      case 'IMAGE':
        return (
          <div className="message-image-container">
            {!imageLoaded && !imageError && (
              <div className="message-media-loading">
                <div className="loading-spinner" />
                <span>Đang tải ảnh...</span>
              </div>
            )}
            {imageError ? (
              <div className="message-media-error">
                <ImageIcon size={32} />
                <span>Không thể tải ảnh</span>
              </div>
            ) : (
              <img
                src={message.imageUrl}
                alt="Shared image"
                className={`message-image ${imageLoaded ? 'loaded' : ''}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                onClick={() => message.imageUrl && onImageClick?.(message.imageUrl)}
              />
            )}
          </div>
        );

      case 'TEXT':
      default:
        return (
          <div className="message-text">
            {message.content}
            {message.isEdited && (
              <span className="message-edited">(đã chỉnh sửa)</span>
            )}
          </div>
        );
    }
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    return (
      <div className="message-reactions">
        {message.reactions.map((reaction, index) => (
          <button
            key={index}
            className={`reaction-badge ${reaction.userIds.includes(currentUserId) ? 'own' : ''}`}
            onClick={() => handleReaction(reaction.emoji)}
            title={`${reaction.count} người đã thả ${reaction.emoji}`}
          >
            <span className="reaction-emoji">{reaction.emoji}</span>
            {reaction.count > 1 && (
              <span className="reaction-count">{reaction.count}</span>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div 
      className={`message-bubble-wrapper ${isOwnMessage ? 'own' : 'other'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {/* Avatar */}
      {!isOwnMessage && showAvatar && (
        <div className="message-avatar">
          {message.senderAvatarUrl ? (
            <img src={message.senderAvatarUrl} alt={message.senderName} />
          ) : (
            <div className="avatar-placeholder">
              {message.senderName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className="message-content-wrapper">
        {/* Sender name */}
        {!isOwnMessage && showSenderName && (
          <div className="message-sender-name">{message.senderName}</div>
        )}

        {/* Message bubble */}
        <div className={`message-bubble ${message.messageType.toLowerCase()}`}>
          {renderContent()}

          {/* Time and status */}
          <div className="message-meta">
            <span className="message-time">{formatTime(message.timestamp)}</span>
            {renderMessageStatus()}
          </div>
        </div>

        {/* Reactions */}
        {renderReactions()}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className={`message-actions ${isOwnMessage ? 'left' : 'right'}`}>
          {/* Quick reaction */}
          <button 
            className="action-btn reaction"
            onClick={() => setShowReactions(!showReactions)}
            title="Thả cảm xúc"
          >
            <Heart size={16} />
          </button>

          {/* Reply */}
          {onReply && (
            <button 
              className="action-btn"
              onClick={() => onReply(message)}
              title="Trả lời"
            >
              <Reply size={16} />
            </button>
          )}

          {/* More options */}
          <button 
            className="action-btn more"
            title="Thêm"
          >
            <MoreHorizontal size={16} />
            
            {/* Dropdown menu */}
            <div className="action-dropdown">
              {message.messageType === 'TEXT' && (
                <button onClick={handleCopyText}>
                  <Copy size={14} />
                  <span>Sao chép</span>
                </button>
              )}
              
              {(message.imageUrl || message.gifUrl) && (
                <>
                  <button onClick={handleDownloadImage}>
                    <Download size={14} />
                    <span>Tải xuống</span>
                  </button>
                  <button onClick={() => window.open(message.imageUrl || message.gifUrl, '_blank')}>
                    <ExternalLink size={14} />
                    <span>Mở tab mới</span>
                  </button>
                </>
              )}
              
              {isOwnMessage && onDelete && (
                <button className="danger" onClick={() => onDelete(message.id)}>
                  <Trash2 size={14} />
                  <span>Xóa tin nhắn</span>
                </button>
              )}
            </div>
          </button>

          {/* Quick reactions popup */}
          {showReactions && (
            <div className="quick-reactions-popup">
              {quickReactions.map((emoji, index) => (
                <button
                  key={index}
                  className="quick-reaction-btn"
                  onClick={() => handleReaction(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
