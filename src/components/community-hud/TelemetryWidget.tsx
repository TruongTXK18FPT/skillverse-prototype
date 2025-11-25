import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, FileText, Zap, LucideIcon } from 'lucide-react';

interface TrendingTopic {
  name: string;
  posts: number;
  trend: 'up' | 'down';
}

interface StatData {
  label: string;
  value: number;
}

interface TelemetryWidgetProps {
  title: string;
  icon: LucideIcon;
  type: 'trending' | 'stats';
  data: TrendingTopic[] | StatData[];
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const TelemetryWidget: React.FC<TelemetryWidgetProps> = ({ title, icon: Icon, type, data }) => {
  const [animatedValues, setAnimatedValues] = useState<number[]>([]);

  useEffect(() => {
    // Animate numbers on mount
    if (type === 'stats') {
      const statsData = data as StatData[];
      const targets = statsData.map((item) => item.value);
      const steps = 30;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

        setAnimatedValues(targets.map((target) => Math.floor(target * eased)));

        if (currentStep >= steps) {
          clearInterval(interval);
          setAnimatedValues(targets);
        }
      }, 30);

      return () => clearInterval(interval);
    }
  }, [data, type]);

  const renderTrendingTopics = () => {
    const topics = data as TrendingTopic[];
    const maxPosts = Math.max(...topics.map((t) => t.posts));

    return (
      <div className="spectrum-analyzer">
        {topics.map((topic, index) => (
          <div key={index} className="spectrum-bar">
            <span className="spectrum-label">{topic.name}</span>
            <div className="spectrum-meter">
              <div
                className="spectrum-fill"
                style={{
                  width: `${(topic.posts / maxPosts) * 100}%`,
                  animationDelay: `${index * 0.1}s`,
                }}
              />
            </div>
            <span className="spectrum-value">{topic.posts}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderStats = () => {
    const stats = data as StatData[];

    return (
      <div className="stat-counter">
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value">
              {formatNumber(animatedValues[index] || 0)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="telemetry-widget">
      <div className="telemetry-widget-header">
        <Icon className="telemetry-icon" size={18} />
        <h3 className="telemetry-widget-title">{title}</h3>
      </div>
      {type === 'trending' ? renderTrendingTopics() : renderStats()}
    </div>
  );
};

export default TelemetryWidget;