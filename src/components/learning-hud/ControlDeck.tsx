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
}

const ControlDeck: React.FC<ControlDeckProps> = ({
  onPrevious,
  onNext,
  onComplete,
  canNavigatePrev,
  canNavigateNext,
  canComplete
}) => {
  return (
    <footer className="learning-hud-control-deck">
      <button
        className="learning-hud-nav-btn prev"
        onClick={onPrevious}
        disabled={!canNavigatePrev}
      >
        <ChevronLeft size={18} />
        <span>Prev Link</span>
      </button>

      <button
        className="learning-hud-complete-btn"
        onClick={onComplete}
        disabled={!canComplete}
      >
        <CheckCircle size={20} />
        <span>Mark Data Processed</span>
      </button>

      <button
        className="learning-hud-nav-btn next"
        onClick={onNext}
        disabled={!canNavigateNext}
      >
        <span>Initialize Next</span>
        <ChevronRight size={18} />
      </button>
    </footer>
  );
};

export default ControlDeck;