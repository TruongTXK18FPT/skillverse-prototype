import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './uplink-styles.css';
import MentorChatWindow from '../chat/MentorChatWindow';
import { useAuth } from '../../context/AuthContext';

interface MentorChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string; // This is counterpartId
  mentorName: string;
  mentorAvatar: string;
  isMyRoleMentor?: boolean;
}

const MentorChatModal: React.FC<MentorChatModalProps> = ({
  isOpen,
  onClose,
  mentorId,
  mentorName,
  mentorAvatar,
  isMyRoleMentor = false
}) => {
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('uplink-scroll-lock');
    } else {
      document.body.classList.remove('uplink-scroll-lock');
    }

    return () => {
      document.body.classList.remove('uplink-scroll-lock');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const counterpartId = Number(mentorId);

  if (!Number.isFinite(counterpartId) || counterpartId <= 0) {
    return null;
  }

  return (
    <div className="uplink-modal-overlay uplink-modal-overlay--messenger" onClick={onClose}>
      <div className="uplink-chat-window chat-variant uplink-chat-window--messenger" onClick={e => e.stopPropagation()}>
        <button className="uplink-modal-close-floating" onClick={onClose} aria-label="Đóng cửa sổ chat">
          <X size={18} />
        </button>

        {user ? (
          <MentorChatWindow
            counterpartId={counterpartId}
            counterpartName={mentorName}
            counterpartAvatar={mentorAvatar}
            isMyRoleMentor={isMyRoleMentor}
            currentUserId={user.id}
            onBack={onClose}
          />
        ) : null}
      </div>
    </div>
  );
};

export default MentorChatModal;
