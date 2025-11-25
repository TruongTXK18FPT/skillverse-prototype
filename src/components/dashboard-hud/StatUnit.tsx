import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import './StatUnit.css';

interface StatUnitProps {
  value: string | number;
  label: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color?: 'cyan' | 'purple' | 'orange' | 'green' | 'red' | 'yellow';
  delay?: number;
  animated?: boolean;
}

const StatUnit: React.FC<StatUnitProps> = ({
  value,
  label,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'cyan',
  delay = 0,
  animated = true
}) => {
  const [displayValue, setDisplayValue] = useState<string | number>(
    animated && typeof value === 'number' ? 0 : value
  );

  useEffect(() => {
    if (!animated || typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }

    const timeout = setTimeout(() => {
      const duration = 1500; // ms
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [value, animated, delay]);

  const colorClass = `stat-unit--${color}`;
  const trendClass = trend !== 'neutral' ? `stat-unit__change--${trend}` : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={`stat-unit ${colorClass}`}
    >
      <div className="stat-unit__header">
        <div className={`stat-unit__icon-wrapper stat-unit__icon-wrapper--${color}`}>
          <Icon className="stat-unit__icon" size={24} />
        </div>
        <div className="stat-unit__info">
          <div className="stat-unit__value">{displayValue}</div>
          <div className="stat-unit__label">{label}</div>
        </div>
      </div>

      {change && (
        <div className={`stat-unit__change ${trendClass}`}>
          {trend === 'up' && '▲ '}
          {trend === 'down' && '▼ '}
          {change}
        </div>
      )}

      <div className="stat-unit__glow"></div>
    </motion.div>
  );
};

export default StatUnit;
