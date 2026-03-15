import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import JourneyPromptModal from './JourneyPromptModal';

const JOURNEY_PROMPT_KEY = 'journey_prompt_shown';

const JourneyPromptWrapper: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem(JOURNEY_PROMPT_KEY);

    if (isAuthenticated && !hasSeenPrompt) {
      // Show prompt after a short delay to let the page settle
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem(JOURNEY_PROMPT_KEY, 'true');
  };

  if (!isAuthenticated) return null;

  return (
    <JourneyPromptModal
      isOpen={showPrompt}
      onClose={handleClose}
    />
  );
};

export default JourneyPromptWrapper;
