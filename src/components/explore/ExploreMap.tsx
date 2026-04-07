import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, Target, Clock, ArrowRight, Star } from 'lucide-react';
import { UNIVERSE_ZONES, ZoneConfig } from '../../config/exploreMapData';
import { useAuth } from '../../context/AuthContext';
import LoginRequiredModal from '../auth/LoginRequiredModal';
import ScannerHotspot from '../shared/ScannerHotspot';
import '../../styles/ExploreMap.css';

// Highlighted zone for new users
const RECOMMENDED_ZONE_ID = 'warrior-academy';

// Import sticker assets
import warriorSticker from '../../assets/zone-map/warrior.png';
import mothershipSticker from '../../assets/zone-map/mothership.png';
import neonMarketSticker from '../../assets/zone-map/neon-market.png';
import vortexSticker from '../../assets/zone-map/vortex.png';
import spaceMapBackground from '../../assets/zone-map/space-map.jpg';

// Import zone detail backgrounds
import warriorAcademyDetail from '../../assets/zone-map-detail/warrior-academy.png';
import mothershipDetail from '../../assets/zone-map-detail/mothership-inside.png';
import neonMarketDetail from '../../assets/zone-map-detail/neon-market-inside.png';
import wormholeDetail from '../../assets/zone-map-detail/worm-hole.png';

interface ExploreMapProps {
  onClose: () => void;
}

type ViewState = 'overview' | 'transition' | 'zone-preview';

const ExploreMap: React.FC<ExploreMapProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [viewState, setViewState] = useState<ViewState>('overview');
  const [selectedZone, setSelectedZone] = useState<ZoneConfig | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('00:00:00');
  const [hoveredZone, setHoveredZone] = useState<ZoneConfig | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState('');
  
  // Check if user has completed onboarding
  const [showQuestBox, setShowQuestBox] = useState(() => {
    return localStorage.getItem('onboarded') !== 'true';
  });

  // Handle quest CTA click
  const handleQuestClick = () => {
    if (!isAuthenticated) {
      setBlockedFeature('Lộ Trình');
      setShowLoginModal(true);
      return;
    }

    localStorage.setItem('onboarded', 'true');
    setShowQuestBox(false);
    navigate('/roadmap');
  };

  // Mark explore as visited
  useEffect(() => {
    localStorage.setItem('exploreVisited', 'true');
  }, []);

  // Update time every second - Vietnam time (UTC+7)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
      const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
      const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
      const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle zone click - trigger transition to zone preview
  const handleZoneClick = (zone: ZoneConfig) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setSelectedZone(zone);
    setViewState('transition');

    // After transition animation, show zone preview
    setTimeout(() => {
      setViewState('zone-preview');
      setIsTransitioning(false);
    }, 800); // Match CSS transition duration
  };

  // Handle back to overview
  const handleBackToOverview = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setViewState('transition');

    setTimeout(() => {
      setViewState('overview');
      setSelectedZone(null);
      setIsTransitioning(false);
    }, 800);
  };

  // Handle interaction point click - navigate to page
  const handleInteractionClick = (path: string, name: string, requiresAuth?: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      setBlockedFeature(name);
      setShowLoginModal(true);
      return;
    }

    navigate(path);
  };

  // Map zone IDs to their sticker images
  const getZoneSticker = (zoneId: string): string => {
    switch (zoneId) {
      case 'warrior-academy':
        return warriorSticker;
      case 'mothership':
        return mothershipSticker;
      case 'black-market':
        return neonMarketSticker;
      case 'wormhole':
        return vortexSticker;
      default:
        return '';
    }
  };

  // Map zone IDs to their detail background images
  const getZoneDetailBackground = (zoneId: string): string => {
    switch (zoneId) {
      case 'warrior-academy':
        return warriorAcademyDetail;
      case 'mothership':
        return mothershipDetail;
      case 'black-market':
        return neonMarketDetail;
      case 'wormhole':
        return wormholeDetail;
      default:
        return '';
    }
  };

  return (
    <div className="explore-map-overlay">
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Đăng nhập để tiếp tục"
        message="Bạn cần đăng nhập để truy cập khu vực này từ bản đồ khám phá"
        feature={blockedFeature || 'Explore Map'}
      />

      <div className="explore-map-container sci-fi-hud">
        {/* Background Image */}
        <div
          className="map-background-image"
          style={{
            backgroundImage: `url(${spaceMapBackground})`
          }}
        />

        {/* 1. Grid Layer */}
        <div className="hud-grid-layer">
          <div className="hud-vignette"></div>
        </div>

        {/* 2. HUD Frame */}
        <div className="hud-frame">
          <div className="hud-border"></div>
          
          {/* Top-Left Corner: SYS Status */}
          <div className="hud-corner-map top-left">
            <div className="hud-status-box">
              <span className="hud-text-small">● SYS.READY</span>
              <div className="hud-loading-bar"></div>
            </div>
          </div>

          {/* Top-Left-Controls: Action Buttons */}
          <div className="hud-corner-map top-left-controls">
            <div className="hud-controls">
              {viewState === 'zone-preview' && (
                <button
                  className="explore-map-hud-btn"
                  onClick={handleBackToOverview}
                  disabled={isTransitioning}
                  title="Quay lại"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <button
                className="explore-map-hud-btn"
                onClick={onClose}
                title="Đóng bản đồ"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Top-Right Corner: Data & UTC */}
          <div className="hud-corner-map top-right">
            <div className="hud-status-right">
              <div className="hud-time">[UTC: <span className="hud-timestamp">{currentTime}</span>]</div>
              <div className="hud-status-text">DATA FLOW: OPTIMAL</div>
            </div>
          </div>

          {/* Bottom-Left Corner: System Log */}
          <div className="hud-corner-map bottom-left">
            <div className="hud-ruler"></div>
            <div className="hud-system-log">[HỆ THỐNG: HOẠT ĐỘNG] <br/>
              [ĐÃ KẾT NỐI]
            </div>
          </div>

          {/* Bottom-Right Corner: Target Priority */}
          <div className="hud-corner-map bottom-right">
            <div className="hud-status-bottom">
              <div className="hud-scan-text">
                {hoveredZone ? `ĐANG XEM: ${hoveredZone.nameEnglish}` : 'DI CHUỘT ĐỂ KHÁM PHÁ'}
              </div>
              <div className="hud-target-text">[{hoveredZone ? 'CHỌN VÙNG NÀY' : 'SẴN SÀNG'}]</div>
            </div>
          </div>
        </div>

        {/* 3. Animation Layer */}
        <div className="hud-animation-layer">
          <div className="hud-scanline"></div>
          <div className="hud-particles"></div>
        </div>

        {/* Title removed - cleaner UI */}

        {/* Map Content */}
        <div className="explore-map-content">
          {/* Quest Box - Only show for new users who haven't onboarded */}
          {showQuestBox && viewState === 'overview' && (
            <div className="sv-quest-box">
              <div className="sv-quest-box-icon">
                <Target size={24} />
              </div>
              <div className="sv-quest-box-content">
                <h3 className="sv-quest-box-title">
                  <Target size={16} className="sv-quest-title-icon" />
                  <span>Nhiệm vụ tiếp theo của bạn</span>
                </h3>
                <p className="sv-quest-box-description">
                  Hoàn thành lộ trình học đầu tiên tại <strong>Học Viện Chiến Binh</strong>
                </p>
                <div className="sv-quest-box-meta">
                  <Clock size={14} />
                  <span>~10 phút</span>
                </div>
              </div>
              <button className="sv-quest-box-cta" onClick={handleQuestClick}>
                <span>Bắt đầu ngay</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* STATE 1: OVERVIEW - Show all zones */}
          {viewState === 'overview' && (
            <div className="universe-map-overview">
              {/* Space Background */}
              <div className="space-background"></div>

              {/* Connector Lines */}
              <svg className="universe-connections">
                {UNIVERSE_ZONES.map((zone, index) => {
                  const nextZone = UNIVERSE_ZONES[(index + 1) % UNIVERSE_ZONES.length];
                  return (
                    <line
                      key={`conn-${zone.id}-${nextZone.id}`}
                      x1={`${zone.mapX}%`}
                      y1={`${zone.mapY}%`}
                      x2={`${nextZone.mapX}%`}
                      y2={`${nextZone.mapY}%`}
                      className="connection-line"
                    />
                  );
                })}
              </svg>

              {/* Zone Markers */}
              {UNIVERSE_ZONES.map((zone) => {
                const isRecommended = zone.id === RECOMMENDED_ZONE_ID;
                return (
                  <button
                    key={zone.id}
                    className={`zone-marker ${isRecommended ? 'sv-zone-marker--recommended' : ''}`}
                    style={{
                      /* TODO: TUNE COORDINATES HERE */
                      left: `${zone.mapX}%`,
                      top: `${zone.mapY}%`,
                      '--zone-primary-color': zone.primaryColor,
                      '--zone-secondary-color': zone.secondaryColor
                    } as React.CSSProperties}
                    onClick={() => handleZoneClick(zone)}
                    onMouseEnter={() => setHoveredZone(zone)}
                    onMouseLeave={() => setHoveredZone(null)}
                  >
                    {/* Recommended Badge */}
                    {isRecommended && (
                      <div className="sv-zone-recommended-badge">
                        <Star size={12} />
                        <span>Nên bắt đầu từ đây</span>
                      </div>
                    )}
                    <div className="zone-marker-icon">
                      {/* Spinning rings and glow effect */}
                      <div className="zone-marker-ring"></div>
                      <div className="zone-marker-glow"></div>
                      {/* Sticker image on top */}
                      <img
                        src={getZoneSticker(zone.id)}
                        alt={zone.name}
                        className="zone-sticker-image"
                      />
                    </div>
                    <div className="zone-marker-label">
                      <span className="zone-marker-name">{zone.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* STATE 2: TRANSITION - Chromatic Aberration Effect */}
          {viewState === 'transition' && selectedZone && (
            <div className="universe-map-transition">
              {/* Soft glow overlay */}
              <div
                className="transition-flash-overlay"
                style={{
                  color: selectedZone.primaryColor
                }}
              ></div>

              {/* Zone sticker with chromatic effect */}
              <div className="transition-sticker-container">
                <img
                  src={getZoneSticker(selectedZone.id)}
                  alt={selectedZone.name}
                  className="transition-sticker-image"
                />
                <div
                  className="transition-zone-name"
                  style={{
                    color: selectedZone.primaryColor
                  }}
                >
                  {selectedZone.name}
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: ZONE PREVIEW - Show interaction points */}
          {viewState === 'zone-preview' && selectedZone && (
            <div
              className="zone-preview"
              style={{
                '--zone-primary-color': selectedZone.primaryColor,
                '--zone-secondary-color': selectedZone.secondaryColor
              } as React.CSSProperties}
            >
              {/* Zone Background - Detail Image */}
              <div
                className="zone-background"
                style={{
                  backgroundImage: `url(${getZoneDetailBackground(selectedZone.id)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Decorative elements */}
                <div className="zone-decoration-layer">
                </div>
              </div>

              {/* Scanner Hotspots - Simplified */}
              <div className="interaction-points-container">
                {selectedZone.interactions.map((interaction) => (
                  <ScannerHotspot
                    key={interaction.id}
                    x={interaction.zoneX}
                    y={interaction.zoneY}
                    label={interaction.name}
                    description={interaction.description}
                    icon={interaction.icon}
                    onClick={() => handleInteractionClick(interaction.path, interaction.name, interaction.requiresAuth)}
                    primaryColor={selectedZone.primaryColor}
                    additionalClass={interaction.highlight ? 'interaction-point--highlighted' : ''}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExploreMap;