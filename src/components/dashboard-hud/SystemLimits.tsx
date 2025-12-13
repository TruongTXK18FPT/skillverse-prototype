import React from 'react';
import { Cpu, Map, Zap, Shield, Database, Activity, Infinity as InfinityIcon } from 'lucide-react';
import './SystemLimits.css';

interface SystemLimitsProps {
  usageLimits?: {
    CHATBOT_REQUESTS: number;
    ROADM_MAPS_LIMIT: number;
    COIN_MULTIPLIER: number;
  };
  featureUsage?: any[];
}

interface LimitItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  current: number;
  max: number | null;
  isUnlimited: boolean;
  multiplier?: number;
  type: 'usage' | 'multiplier' | 'boolean';
  isEnabled?: boolean;
}

const SystemLimits: React.FC<SystemLimitsProps> = ({ usageLimits, featureUsage }) => {
  
  const getIconForFeature = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('chat') || lowerName.includes('bot')) return <Cpu size={20} />;
    if (lowerName.includes('roadmap') || lowerName.includes('map')) return <Map size={20} />;
    if (lowerName.includes('coin') || lowerName.includes('multiplier')) return <Zap size={20} />;
    if (lowerName.includes('storage') || lowerName.includes('save')) return <Database size={20} />;
    return <Shield size={20} />;
  };

  const normalizeData = (): LimitItem[] => {
    if (featureUsage && featureUsage.length > 0) {
      return featureUsage.map((feature, index) => ({
        id: `feature-${index}`,
        name: feature.featureName,
        icon: getIconForFeature(feature.featureName),
        current: feature.currentUsage || 0,
        max: feature.limit,
        isUnlimited: feature.isUnlimited,
        multiplier: feature.bonusMultiplier,
        type: feature.bonusMultiplier ? 'multiplier' : (feature.limit === null && !feature.isUnlimited ? 'boolean' : 'usage'),
        isEnabled: feature.isEnabled
      }));
    }

    if (usageLimits) {
      return [
        {
          id: 'chatbot',
          name: 'Chatbot Requests',
          icon: <Cpu size={20} />,
          current: 0, // We don't have current usage in usageLimits object usually, assuming 0 or need another source
          max: usageLimits.CHATBOT_REQUESTS,
          isUnlimited: false,
          type: 'usage'
        },
        {
          id: 'roadmaps',
          name: 'Roadmaps Limit',
          icon: <Map size={20} />,
          current: 0,
          max: usageLimits.ROADM_MAPS_LIMIT,
          isUnlimited: false,
          type: 'usage'
        },
        {
          id: 'coins',
          name: 'Coin Multiplier',
          icon: <Zap size={20} />,
          current: 0,
          max: null,
          isUnlimited: true,
          multiplier: usageLimits.COIN_MULTIPLIER,
          type: 'multiplier'
        }
      ];
    }

    return [];
  };

  const items = normalizeData();

  if (items.length === 0) return null;

  return (
    <div className="arm-system-limits-container">
      <div className="arm-limits-header">
        <div className="arm-limits-title">
          <Activity size={24} />
          SYSTEM LIMITS & CAPABILITIES
        </div>
      </div>

      <div className="arm-limits-grid">
        {items.map((item) => {
          const percentage = item.max && item.max > 0 ? Math.min(100, (item.current / item.max) * 100) : 0;
          const isWarning = percentage > 75;
          const isDanger = percentage > 90;

          return (
            <div key={item.id} className="arm-limit-card">
              <div className="arm-limit-header">
                <div className="arm-limit-info">
                  <div className="arm-limit-icon">
                    {item.icon}
                  </div>
                  <div className="arm-limit-name">{item.name}</div>
                </div>
                <div className={`arm-limit-badge ${item.type === 'multiplier' ? 'multiplier' : (item.isUnlimited ? 'unlimited' : 'limited')}`}>
                  {item.type === 'multiplier' ? 'BONUS' : (item.isUnlimited ? 'INF' : 'LIMIT')}
                </div>
              </div>

              <div className="arm-limit-stats">
                {item.type === 'multiplier' ? (
                  <div className="arm-limit-current">x{item.multiplier}</div>
                ) : item.type === 'boolean' ? (
                  <div className="arm-limit-current" style={{ fontSize: '1.2rem' }}>
                    {item.isEnabled ? 'ENABLED' : 'DISABLED'}
                  </div>
                ) : item.isUnlimited ? (
                  <div className="arm-limit-current"><InfinityIcon size={24} /></div>
                ) : (
                  <>
                    <div className="arm-limit-current">{item.current}</div>
                    <div className="arm-limit-max">/ {item.max}</div>
                  </>
                )}
              </div>

              {item.type === 'usage' && !item.isUnlimited && (
                <div className="arm-limit-progress-container">
                  <div 
                    className={`arm-limit-progress-bar ${isDanger ? 'danger' : isWarning ? 'warning' : ''}`}
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="arm-limit-progress-glow"></div>
                  </div>
                </div>
              )}
              
              {item.type === 'multiplier' && (
                 <div className="arm-limit-progress-container">
                  <div 
                    className="arm-limit-progress-bar warning"
                    style={{ width: '100%' }}
                  >
                    <div className="arm-limit-progress-glow"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SystemLimits;
