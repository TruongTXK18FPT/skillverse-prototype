import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './PetStyles.css';
import coffeeIcon from '../../assets/meowl-pet/interact-items/coffee/item.png';

interface PetContextMenuProps {
  petPosition: { x: number; y: number; width: number; height: number };
  onClose: () => void;
  onToggleLock: () => void;
  isLocked: boolean;
  onUseItem: (itemId: string) => void;
  level: number;
  xp: number;
  maxXp: number;
}

const ITEMS = [
  { id: 'coffee', name: 'Cà phê', icon: coffeeIcon, unlockLevel: 1 },
];

const PetContextMenu: React.FC<PetContextMenuProps> = ({
  petPosition,
  onClose,
  onToggleLock,
  isLocked,
  onUseItem,
  level,
  xp,
  maxXp
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'main' | 'inventory'>('main');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Calculate positions
  // Viewport Dimensions
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Pet Center
  const px = petPosition.x + petPosition.width / 2;
  const py = petPosition.y + petPosition.height / 2;

  // Menu Dimensions (Estimated)
  const MENU_WIDTH = 240;
  const MENU_HEIGHT = 220;
  const GAP_X = 60; // Distance from pet center to elbow
  const GAP_MENU = 40; // Distance from elbow to menu

  // 1. Determine Horizontal Side (Right or Left)
  // Check space on Right
  const spaceRight = vw - (px + GAP_X);
  // Check space on Left
  const spaceLeft = px - GAP_X;

  let isRight = true;
  // If not enough space on right for Menu + Gap, try left
  if (spaceRight < MENU_WIDTH + GAP_MENU + 20) {
    if (spaceLeft > MENU_WIDTH + GAP_MENU + 20) {
      isRight = false;
    } else {
      // If neither side fits perfectly, pick the larger one
      isRight = spaceRight > spaceLeft;
    }
  }

  // 2. Determine Vertical Position
  // Ideally center menu vertically with pet
  let menuY = py - MENU_HEIGHT / 2;

  // Clamp Vertical Position to keep in viewport
  if (menuY < 20) menuY = 20;
  if (menuY + MENU_HEIGHT > vh - 20) menuY = vh - MENU_HEIGHT - 20;

  // 3. Calculate Coordinates
  const elbowX = px + (isRight ? GAP_X : -GAP_X);
  const elbowY = py;

  const menuX = isRight 
    ? elbowX + GAP_MENU 
    : elbowX - GAP_MENU - MENU_WIDTH;

  // Connection point on the menu (connect to the side facing the pet)
  const connectX = isRight ? menuX : menuX + MENU_WIDTH;
  // Connect near the top of the menu for a "readout" look, but ensure it stays within menu bounds relative to Y
  // Let's connect at a fixed offset from menu top, e.g., 30px
  const connectY = menuY + 30;

  // Path: Start -> Elbow -> End
  const pathD = `M ${px} ${py} L ${elbowX} ${elbowY} L ${connectX} ${connectY}`;

  return ReactDOM.createPortal(
    <div className="pet-scanner-container">
      <svg className="pet-scanner-svg">
        <path d={pathD} className="pet-scanner-line" />
        {/* Optional: Dots at joints */}
        <circle cx={px} cy={py} r="3" fill="#00f2ff" />
        <circle cx={elbowX} cy={elbowY} r="2" fill="#00f2ff" />
        <circle cx={connectX} cy={connectY} r="3" fill="#00f2ff" />
      </svg>

      <div 
        className="pet-scanner-menu" 
        style={{ top: menuY, left: menuX, width: MENU_WIDTH }} 
        ref={menuRef}
      >
        <div className="pet-scanner-header">
          {view === 'main' ? 'SCANNING...' : 'INVENTORY'}
          {view === 'inventory' && (
            <button className="pet-scanner-back-btn" onClick={() => setView('main')}>
              ◀ BACK
            </button>
          )}
        </div>

        {view === 'main' ? (
          <>
            <div className="pet-scanner-stats">
              <div className="pet-stat-row">
                <span>LEVEL</span>
                <span style={{ color: '#fff' }}>{level}</span>
              </div>
              <div className="pet-stat-row">
                <span>STATUS</span>
                <span style={{ color: '#fff' }}>{isLocked ? 'LOCKED' : 'ACTIVE'}</span>
              </div>
              <div className="pet-stat-row">
                <span>XP</span>
                <span style={{ color: '#fff' }}>{xp} / {maxXp}</span>
              </div>
              <div className="pet-xp-bar-container">
                <div 
                  className="pet-xp-bar-fill" 
                  style={{ width: `${Math.min(100, (xp / maxXp) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pet-scanner-actions">
              <button className="pet-scanner-btn" onClick={onToggleLock}>
                <span>{isLocked ? '🔓' : '🔒'}</span>
                {isLocked ? 'UNLOCK POSITION' : 'LOCK POSITION'}
              </button>
              <button className="pet-scanner-btn" onClick={() => setView('inventory')}>
                <span>🎒</span>
                OPEN INVENTORY
              </button>
            </div>
          </>
        ) : (
          <div className="pet-scanner-inventory-grid">
            {ITEMS.map((item) => {
              const isLockedItem = level < item.unlockLevel;
              return (
                <div 
                  key={item.id} 
                  className={`pet-scanner-item ${isLockedItem ? 'locked' : ''}`}
                  onClick={() => {
                    if (!isLockedItem) {
                      onUseItem(item.id);
                      onClose();
                    }
                  }}
                >
                  <img src={item.icon} alt={item.name} />
                  <span>{item.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PetContextMenu;
