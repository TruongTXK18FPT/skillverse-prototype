import React from 'react';
import { X } from 'lucide-react';
import './learning-hud.css';

interface NeuralModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  loading?: boolean;
}

/**
 * Reusable Neural-themed modal wrapper with backdrop and animations
 */
const NeuralModal: React.FC<NeuralModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '900px',
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="learning-hud-modal-overlay"
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(18, 23, 31, 0.95)',
          border: '1px solid var(--lhud-border-bright)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          maxWidth,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(6, 182, 212, 0.1)',
          animation: 'learning-hud-modal-slide-up 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid var(--lhud-border)',
          background: 'rgba(6, 182, 212, 0.03)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--lhud-text-primary)',
            margin: 0,
            letterSpacing: '0.5px'
          }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--lhud-text-dim)',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
              borderRadius: '4px',
              opacity: loading ? 0.3 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.color = 'var(--lhud-cyan)';
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--lhud-text-dim)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          padding: '1.5rem'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default NeuralModal;