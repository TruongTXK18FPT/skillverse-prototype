import React from 'react';
import '../styles/VoiceSelector.css';
import { PlayCircle, Volume2 } from 'lucide-react';
import { FPT_VOICES, VoiceOption } from '../shared/fptVoices';
import '../styles/VoiceSelector.css';

interface VoiceSelectorProps {
  selectedVoice: string;
  onChange: (voiceId: string) => void;
  onPreview: (voiceId: string) => void;
  loadingVoiceId?: string | null;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onChange, onPreview, loadingVoiceId }) => {
  return (
    <div className="sv-voice-selector">
      <div className="sv-voice-selector__title">Giọng đọc</div>
      <div className="sv-voice-selector__grid">
        {FPT_VOICES.map((v: VoiceOption) => (
          <label key={v.id} className={`sv-voice-option ${selectedVoice === v.id ? 'selected' : ''}`}>
            <input
              type="radio"
              name="voice"
              value={v.id}
              checked={selectedVoice === v.id}
              onChange={() => onChange(v.id)}
            />
            <span className="sv-voice-option__label">
              {v.label}
              {v.popular && (
                <span className="sv-voice-popular">
                  <Volume2 size={14} /> Most Popular
                </span>
              )}
            </span>
            <button
              type="button"
              className="sv-voice-option__preview"
              onClick={() => onPreview(v.id)}
              title="Nghe thử"
            >
              {loadingVoiceId === v.id ? (
                <span className="sv-preview-loading" />
              ) : (
                <PlayCircle size={18} />
              )}
            </button>
          </label>
        ))}
      </div>
    </div>
  );
};

export default VoiceSelector;
