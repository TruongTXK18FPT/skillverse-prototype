import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './HoloProgressBar.css';

interface HoloProgressBarProps {
  value: number; // 0-100
  label?: string;
  color?: 'cyan' | 'purple' | 'orange' | 'green' | 'red' | 'yellow';
  height?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  animated?: boolean;
  delay?: number;
}

const HoloProgressBar: React.FC<HoloProgressBarProps> = ({
  value,
  label,
  color = 'cyan',
  height = 'md',
  showPercentage = true,
  animated = true,
  delay = 0
}) => {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (!animated) return;

    const timeout = setTimeout(() => {
      setDisplayValue(value);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [value, animated, delay]);

  const colorClass = `holo-progress--${color}`;
  const heightClass = `holo-progress--${height}`;

  return (
    <div className="holo-progress-wrapper">
      {label && (
        <div className="holo-progress__label-row">
          <span className="holo-progress__label">{label}</span>
          {showPercentage && (
            <span className={`holo-progress__percentage holo-progress__percentage--${color}`}>
              {Math.round(displayValue)}%
            </span>
          )}
        </div>
      )}
      <div className={`holo-progress ${heightClass} ${colorClass}`}>
        <div className="holo-progress__track">
          <motion.div
            className="holo-progress__bar"
            initial={{ width: 0 }}
            animate={{ width: `${displayValue}%` }}
            transition={{
              duration: 1.5,
              delay: delay,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <div className="holo-progress__glow"></div>
            <div className="holo-progress__leading-edge"></div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HoloProgressBar;