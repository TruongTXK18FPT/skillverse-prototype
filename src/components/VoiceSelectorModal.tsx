import React from 'react';
import VoiceSelector from './VoiceSelector';
import '../styles/VoiceSelector.css';

interface VoiceSelectorModalProps {
  open: boolean;
  onClose: () => void;
  selectedVoice: string;
  onChange: (voiceId: string) => void;
  onPreview: (voiceId: string) => void;
  loadingVoiceId?: string | null;
}

const VoiceSelectorModal: React.FC<VoiceSelectorModalProps> = ({ open, onClose, selectedVoice, onChange, onPreview, loadingVoiceId }) => {
  if (!open) return null;
  return (
    <div className="sv-voice-modal__overlay" role="dialog" aria-modal="true">
      <div className="sv-voice-modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="sv-voice-modal__header">
          <div className="sv-voice-modal__title">Chọn giọng đọc</div>
          <button className="sv-voice-modal__close" type="button" onClick={onClose}>Đóng</button>
        </div>
        <VoiceSelector
          selectedVoice={selectedVoice}
          onChange={onChange}
          onPreview={onPreview}
          loadingVoiceId={loadingVoiceId}
        />
      </div>
    </div>
  );
};

export default VoiceSelectorModal;
