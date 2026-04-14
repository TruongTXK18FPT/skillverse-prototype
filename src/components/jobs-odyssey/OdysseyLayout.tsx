import { ReactNode } from 'react';

interface OdysseyLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
}

const OdysseyLayout = ({ children, hideHeader = false }: OdysseyLayoutProps) => {
  // Generate wormhole particles
  const particles = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: 45 + Math.random() * 10,
    top: 40 + Math.random() * 20,
    size: 1 + Math.random() * 3,
    animationDelay: Math.random() * 5,
    animationDuration: 3 + Math.random() * 4
  }));

  return (
    <div className="odyssey-container">
      {/* Wormhole Background */}
      <div className="odyssey-wormhole">
        <div className="odyssey-wormhole__core"></div>
        <div className="odyssey-wormhole__ring odyssey-wormhole__ring--1"></div>
        <div className="odyssey-wormhole__ring odyssey-wormhole__ring--2"></div>
        <div className="odyssey-wormhole__ring odyssey-wormhole__ring--3"></div>
      </div>

      {/* Hyperspace Particles */}
      <div className="odyssey-hyperspace">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="odyssey-hyperspace__particle"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: `${particle.animationDuration}s`
            }}
          />
        ))}
      </div>

      {/* Cyberpunk Grid Overlay */}
      <div className="odyssey-grid-overlay"></div>

      {/* Neon Scan Lines */}
      <div className="odyssey-scan-lines"></div>

      {/* Main Content Area */}
      <div className="odyssey-content">
        {/* Header - hide when child component renders its own header */}
        {!hideHeader && (
          <header className="odyssey-header">
            <h1 className="odyssey-header__title">Cơ Hội Việc Làm</h1>
            <p className="odyssey-header__subtitle">Khám phá công việc phù hợp với bạn</p>
          </header>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default OdysseyLayout;
