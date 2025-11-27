import React from 'react';
import './learning-hud.css';

interface NeuralCardProps {
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Reusable Neural-themed card component
 */
const NeuralCard: React.FC<NeuralCardProps> = ({
  children,
  className = '',
  glowOnHover = false,
  style,
  onClick
}) => {
  return (
    <div
      className={`learning-hud-card ${glowOnHover ? 'learning-hud-card-glow' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default NeuralCard;