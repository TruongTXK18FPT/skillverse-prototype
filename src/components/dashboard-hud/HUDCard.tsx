import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import './HUDCard.css';

interface HUDCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'chamfer' | 'chamfer-top';
  scanline?: boolean;
  decorated?: boolean;
  className?: string;
  delay?: number;
}

const HUDCard: React.FC<HUDCardProps> = ({
  children,
  title,
  subtitle,
  variant = 'default',
  scanline = false,
  decorated = false,
  className = '',
  delay = 0
}) => {
  const variantClass = variant !== 'default' ? `hud-card--${variant}` : '';
  const scanlineClass = scanline ? 'hud-card--scanline' : '';
  const decoratedClass = decorated ? 'hud-card--decorated' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={`hud-card ${variantClass} ${scanlineClass} ${decoratedClass} ${className}`}
    >
      {(title || subtitle) && (
        <div className="hud-card__header">
          {title && (
            <div className="hud-card__title-wrapper">
              <div className="hud-card__title-accent"></div>
              <h3 className="hud-card__title">{title}</h3>
            </div>
          )}
          {subtitle && (
            <p className="hud-card__subtitle">{subtitle}</p>
          )}
        </div>
      )}
      <div className="hud-card__body">
        {children}
      </div>
    </motion.div>
  );
};

export default HUDCard;
