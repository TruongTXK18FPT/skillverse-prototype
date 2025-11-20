import { LucideIcon } from 'lucide-react';
import {
  GraduationCap,
  Map,
  Users,
  MessageSquare,
  BarChart3,
  Bot,
  User,
  Wallet,
  Trophy,
  Briefcase
} from 'lucide-react';

/**
 * Zone Types for the Universe Map
 */
export type ZoneId = 'warrior-academy' | 'mothership' | 'black-market' | 'wormhole';

/**
 * Interaction Point - Sub-links within each zone
 */
export interface InteractionPoint {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: LucideIcon;
  // Coordinates for positioning within zone view (% based)
  zoneX: number;
  zoneY: number;
  // Visual configuration for Scanner Line
  direction: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  lineLength: number;
}

/**
 * Zone Configuration
 */
export interface ZoneConfig {
  id: ZoneId;
  name: string;
  nameEnglish: string;
  concept: string;
  primaryColor: string;
  secondaryColor: string;
  // Coordinates for positioning on the map (% based)
  mapX: number;
  mapY: number;
  interactions: InteractionPoint[];
}

/**
 * ZONE 1: WARRIOR ACADEMY (Học Viện Chiến Binh)
 * Concept: Educational hub, knowledge center
 * Colors: Blue/White
 */
const WARRIOR_ACADEMY: ZoneConfig = {
  id: 'warrior-academy',
  name: 'Học Viện Chiến Binh',
  nameEnglish: 'Warrior Academy',
  concept: 'Khu vực trường học, tri thức',
  primaryColor: '#3b82f6', // Blue
  secondaryColor: '#ffffff', // White
  /* TODO: TUNE COORDINATES HERE */
  mapX: 25, // 25% from left
  mapY: 32, // 35% from top
  interactions: [
    {
      id: 'courses',
      name: 'Khóa Học',
      description: 'Khám phá các khóa học chất lượng cao',
      path: '/courses',
      icon: GraduationCap,
      zoneX: 22,
      zoneY: 35,
      direction: 'top-left' as const,
      lineLength: 100
    },
    {
      id: 'roadmap',
      name: 'Lộ Trình',
      description: 'Lộ trình học tập và phát triển kỹ năng',
      path: '/roadmap',
      icon: Map,
      zoneX: 60,
      zoneY: 45,
      direction: 'top-right' as const,
      lineLength: 140
    },
    {
      id: 'mentorship',
      name: 'Cố Vấn',
      description: 'Kết nối với chuyên gia trong ngành',
      path: '/mentorship',
      icon: Users,
      zoneX: 85,
      zoneY: 60,
      direction: 'bottom-right' as const,
      lineLength: 80
    },
    {
      id: 'community',
      name: 'Cộng Đồng',
      description: 'Tham gia cộng đồng học tập sôi động',
      path: '/community',
      icon: MessageSquare,
      zoneX: 28,
      zoneY: 75,
      direction: 'bottom-left' as const,
      lineLength: 120
    }
  ]
};

/**
 * ZONE 2: MOTHERSHIP (Phi Thuyền Mẹ)
 * Concept: Personal command center
 * Colors: Silver/Cyan
 */
const MOTHERSHIP: ZoneConfig = {
  id: 'mothership',
  name: 'Phi Thuyền Mẹ',
  nameEnglish: 'Mothership',
  concept: 'Trung tâm chỉ huy cá nhân',
  primaryColor: '#06b6d4', // Cyan
  secondaryColor: '#c0c0c0', // Silver
  /* TODO: TUNE COORDINATES HERE */
  mapX: 63, // 68% from left
  mapY: 30, // 30% from top
  interactions: [
    {
      id: 'dashboard',
      name: 'Bảng Điều Khiển',
      description: 'Theo dõi tiến độ học tập và thành tích',
      path: '/dashboard',
      icon: BarChart3,
      zoneX: 73,
      zoneY: 58,
      direction: 'top-left' as const,
      lineLength: 90
    },
    {
      id: 'ai-assistant',
      name: 'Trợ Lý AI',
      description: 'Nhận hỗ trợ từ trợ lý AI thông minh',
      path: '/chatbot',
      icon: Bot,
      zoneX: 46.5,
      zoneY: 20,
      direction: 'bottom-right' as const,
      lineLength: 100
    },
    {
      id: 'profile',
      name: 'Hồ Sơ Cá Nhân',
      description: 'Quản lý và chia sẻ thành tích của bạn',
      path: '/portfolio',
      icon: User,
      zoneX: 21,
      zoneY: 58,
      direction: 'top-right' as const,
      lineLength: 85
    }
  ]
};

/**
 * ZONE 3: BLACK MARKET (Khu Chợ Đen)
 * Concept: Trading and entertainment hub with Star Whale
 * Colors: Purple/Neon Pink
 */
const BLACK_MARKET: ZoneConfig = {
  id: 'black-market',
  name: 'Khu Chợ Đen',
  nameEnglish: 'Black Market',
  concept: 'Nơi giao dịch và giải trí. Có con Cá Voi Ánh Sao bay ở trên',
  primaryColor: '#a855f7', // Purple
  secondaryColor: '#ec4899', // Neon Pink
  /* TODO: TUNE COORDINATES HERE */
  mapX: 38, // 30% from left
  mapY: 72, // 68% from top
  interactions: [
    {
      id: 'market',
      name: 'Khu Chợ',
      description: 'Ví và cửa hàng vật phẩm',
      path: '/my-wallet',
      icon: Wallet,
      zoneX: 20,
      zoneY: 77,
      direction: 'bottom-left' as const,
      lineLength: 95
    },
    {
      id: 'star-whale-games',
      name: 'Bụng Cá Voi',
      description: 'Trò chơi, bảng xếp hạng và huy hiệu',
      path: '/gamification',
      icon: Trophy,
      zoneX: 50,
      zoneY: 27,
      direction: 'top-right' as const,
      lineLength: 110
    }
  ]
};

/**
 * ZONE 4: WORMHOLE (Lỗ Sâu)
 * Concept: Portal to real-world missions
 * Colors: Orange/Red/Black
 */
const WORMHOLE: ZoneConfig = {
  id: 'wormhole',
  name: 'Lỗ Sâu',
  nameEnglish: 'Wormhole',
  concept: 'Cổng dịch chuyển đi làm nhiệm vụ thực tế',
  primaryColor: '#8b5cf6', // Purple/Violet
  secondaryColor: '#ec4899', // Pink
  /* TODO: TUNE COORDINATES HERE */
  mapX: 80, // 70% from left
  mapY: 65, // 65% from top
  interactions: [
    {
      id: 'jobs',
      name: 'Việc Làm',
      description: 'Tìm kiếm cơ hội việc làm phù hợp',
      path: '/jobs',
      icon: Briefcase,
      zoneX: 35,
      zoneY: 38,
      direction: 'top-left' as const,
      lineLength: 100
    }
  ]
};

/**
 * All zones configuration
 */
export const UNIVERSE_ZONES: ZoneConfig[] = [
  WARRIOR_ACADEMY,
  MOTHERSHIP,
  BLACK_MARKET,
  WORMHOLE
];

/**
 * Helper function to get zone by ID
 */
export const getZoneById = (zoneId: ZoneId): ZoneConfig | undefined => {
  return UNIVERSE_ZONES.find(zone => zone.id === zoneId);
};