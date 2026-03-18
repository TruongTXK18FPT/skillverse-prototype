import React, { useState, useEffect } from 'react';
import './MeowlKuruLoader.css';
import kuruImg from '../../assets/kuru-loader/meowl-kuru.png';

interface MeowlKuruLoaderProps {
  text?: string;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  className?: string;
  layout?: 'horizontal' | 'vertical'; // New prop for layout control
}

const MeowlKuruLoader: React.FC<MeowlKuruLoaderProps> = ({ 
  text = "Kuru Kuru...", 
  size = 'medium',
  fullScreen = false,
  className = '',
  layout = 'horizontal' // Default is historical horizontal layout
}) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const startFrame = 0;
  const endFrame = 7; // Loop from frame 1 to 8 (0-7)
  const cols = 4;
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => {
        const next = prev + 1;
        if (next > endFrame) {
          return startFrame;
        }
        return next;
      });
    }, 80); // Speed: 80ms per frame
    return () => clearInterval(interval);
  }, []);

  // Calculate position
  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);
  
  // Sizes
  const sizeMap = { tiny: 30, small: 60, medium: 100, large: 150 };
  const dim = sizeMap[size];

  const bgX = -(col * dim);
  const bgY = -(row * dim);

  const isVertical = layout === 'vertical';

  const containerClass = [
    'kuru-loader-root',
    fullScreen ? 'kuru-loader-root--fullscreen' : '',
    isVertical ? 'kuru-loader-root--vertical' : 'kuru-loader-root--horizontal',
    size !== 'tiny' ? 'kuru-loader-root--with-padding' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass}>
      <div 
        className="kuru-loader-sprite"
        style={{
          width: `${dim}px`,
          height: `${dim}px`,
          backgroundImage: `url(${kuruImg})`,
          backgroundPosition: `${bgX}px ${bgY}px`,
          backgroundSize: '400%', // 4 cols
        }} 
      />
      {text && (
        <div className={`kuru-loader-text ${isVertical ? 'kuru-loader-text--vertical' : 'kuru-loader-text--horizontal'}`}>
          {text}
        </div>
      )}
    </div>
  );
};

export default MeowlKuruLoader;
