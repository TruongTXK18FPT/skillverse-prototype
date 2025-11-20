import React from 'react';
import { LucideIcon } from 'lucide-react';
import '../styles/ScannerHotspot.css';

interface ScannerHotspotProps {
  x: number;
  y: number;
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  primaryColor?: string;
}

const ScannerHotspot: React.FC<ScannerHotspotProps> = ({
  x,
  y,
  label,
  description,
  icon: Icon,
  onClick,
  primaryColor = '#06b6d4'
}) => {
  return (
    <button
      className="scanner-hotspot-simple"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        '--scanner-primary-color': primaryColor
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="scanner-info-icon">
        <Icon size={20} />
      </div>
      <div className="scanner-info-text">
        <div className="scanner-info-label">{label}</div>
        <div className="scanner-info-description">{description}</div>
      </div>
    </button>
  );
};

export default ScannerHotspot;