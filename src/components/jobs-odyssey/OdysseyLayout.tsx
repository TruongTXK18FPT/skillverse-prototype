import { ReactNode } from 'react';

interface OdysseyLayoutProps {
  children: ReactNode;
}

const OdysseyLayout = ({ children }: OdysseyLayoutProps) => {
  // Generate wormhole particles
  const particles = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: 45 + Math.random() * 10,
    top: 40 + Math.random() * 20,
    size: 1 + Math.random() * 3,
    animationDelay: Math.random() * 5,
    animationDuration: 3 + Math.random() * 4
  }));

  // Generate floating cards with suit symbols
  const floatingCards = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: 10 + Math.random() * 80,
    top: 10 + Math.random() * 80,
    animationDelay: Math.random() * 15,
    animationDuration: 15 + Math.random() * 10,
    symbol: ['♦', '♣', '♥', '♠'][i % 4]
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

      {/* Floating Cards - Space Pirate Theme */}
      <div className="odyssey-floating-cards">
        {floatingCards.map((card) => (
          <div
            key={card.id}
            className="odyssey-floating-cards__card"
            data-symbol={card.symbol}
            style={{
              left: `${card.left}%`,
              top: `${card.top}%`,
              animationDelay: `${card.animationDelay}s`,
              animationDuration: `${card.animationDuration}s`
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
        {/* Header */}
        <header className="odyssey-header">
          <h1 className="odyssey-header__title">Bảng Công Việc</h1>
          <p className="odyssey-header__subtitle">Chọn cơ hội</p>
        </header>

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default OdysseyLayout;
