import React from 'react';
import './learning-hud.css';

interface NeuralButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

/**
 * Reusable Neural-themed button component
 */
const NeuralButton: React.FC<NeuralButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
  style
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`learning-hud-button learning-hud-button-${variant} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
};

export default NeuralButton;