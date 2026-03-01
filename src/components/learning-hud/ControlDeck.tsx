import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import './learning-hud.css';

interface ControlDeckProps {
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  canComplete: boolean;
  completeLabel?: string;
  completeState?: 'ready' | 'completed' | 'blocked';
}

const ControlDeck: React.FC<ControlDeckProps> = ({
  onPrevious,
  onNext,
  onComplete,
  canNavigatePrev,
  canNavigateNext,
  canComplete,
  completeLabel = 'Đánh dấu hoàn thành',
  completeState = 'ready'
}) => {
  return (
    <footer className="learning-hud-control-deck">
      <button
        className="learning-hud-nav-btn prev"
        onClick={onPrevious}
        disabled={!canNavigatePrev}
      >
        <ChevronLeft size={18} />
        <span>Bài trước</span>
      </button>

      <button
        className={`learning-hud-complete-btn ${completeState !== 'ready' ? `is-${completeState}` : ''}`}
        onClick={onComplete}
        disabled={!canComplete}
      >
        <CheckCircle size={20} />
        <span>{completeLabel}</span>
      </button>

      <button
        className="learning-hud-nav-btn next"
        onClick={onNext}
        disabled={!canNavigateNext}
      >
        <span>Bài tiếp theo</span>
        <ChevronRight size={18} />
      </button>
    </footer>
  );
};

export default ControlDeck;
