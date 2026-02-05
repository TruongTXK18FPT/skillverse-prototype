import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import '../../styles/MentorNotice.css';

export type MentorNoticeType = 'success' | 'error' | 'info' | 'warning';

interface MentorNotice {
  id: string;
  type: MentorNoticeType;
  message: string;
}

interface MentorNoticeOptions {
  durationMs?: number;
}

interface MentorNoticeContextValue {
  showNotice: (type: MentorNoticeType, message: string, options?: MentorNoticeOptions) => void;
  clearNotices: () => void;
}

const MentorNoticeContext = createContext<MentorNoticeContextValue | null>(null);

export const MentorNoticeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notices, setNotices] = useState<MentorNotice[]>([]);

  const clearNotices = useCallback(() => setNotices([]), []);

  const showNotice = useCallback((type: MentorNoticeType, message: string, options?: MentorNoticeOptions) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const durationMs = options?.durationMs ?? 3200;
    const next: MentorNotice = { id, type, message };
    setNotices(prev => [...prev, next]);

    if (durationMs > 0) {
      window.setTimeout(() => {
        setNotices(prev => prev.filter(n => n.id !== id));
      }, durationMs);
    }
  }, []);

  const value = useMemo(() => ({ showNotice, clearNotices }), [showNotice, clearNotices]);

  return (
    <MentorNoticeContext.Provider value={value}>
      {children}
      <div className="mentor-notice-stack" aria-live="polite">
        {notices.map(n => (
          <div key={n.id} className={`mentor-notice mentor-notice--${n.type}`}>
            <span className="mentor-notice__message">{n.message}</span>
            <button
              className="mentor-notice__close"
              onClick={() => setNotices(prev => prev.filter(x => x.id !== n.id))}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </MentorNoticeContext.Provider>
  );
};

export const useMentorNotice = (): MentorNoticeContextValue => {
  const ctx = useContext(MentorNoticeContext);
  if (!ctx) {
    throw new Error('useMentorNotice must be used within MentorNoticeProvider');
  }
  return ctx;
};
