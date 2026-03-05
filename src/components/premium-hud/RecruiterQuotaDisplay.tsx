import React from 'react';
import { Box, Flex, Text, Progress, VStack, HStack, Icon } from '@chakra-ui/react';
import {
  Briefcase,
  Zap,
  Star,
  TrendingUp,
  Users,
  Bot,
  BarChart3,
  Database,
  Send,
  Key,
  Headphones,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface QuotaDisplayProps {
  label: string;
  used: number;
  limit: number;
  unlimited: boolean;
  resetInfo?: string;
  colorScheme?: string;
}

export const QuotaDisplay: React.FC<QuotaDisplayProps> = ({
  label,
  used,
  limit,
  unlimited,
  resetInfo,
  colorScheme = 'blue'
}) => {
  const percentage = unlimited ? 0 : (limit > 0 ? (used / limit) * 100 : 0);
  const remaining = unlimited ? '∞' : Math.max(0, limit - used);

  return (
    <Box
      bg="rgba(255, 255, 255, 0.05)"
      borderRadius="lg"
      p={4}
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.1)"
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Text color="gray.300" fontSize="sm" fontWeight="medium">
          {label}
        </Text>
        <Text color={colorScheme === 'blue' ? 'blue.300' : `${colorScheme}.300`} fontWeight="bold">
          {unlimited ? (
            <HStack spacing={1}>
              <Icon as={CheckCircle2} />
              <Text>Không giới hạn</Text>
            </HStack>
          ) : (
            `${remaining} / ${limit}`
          )}
        </Text>
      </Flex>

      {!unlimited && (
        <>
          <Progress
            value={percentage}
            size="sm"
            colorScheme={percentage > 80 ? 'red' : colorScheme}
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.1)"
          />
          <Flex justify="space-between" mt={2}>
            <Text color="gray.500" fontSize="xs">
              Đã sử dụng: {used}
            </Text>
            {resetInfo && (
              <Text color="gray.500" fontSize="xs">
                Reset: {resetInfo}
              </Text>
            )}
          </Flex>
        </>
      )}
    </Box>
  );
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  isEnabled: boolean;
  isHighlighted?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  isEnabled,
  isHighlighted = false
}) => {
  return (
    <Box
      bg={isHighlighted ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
      borderRadius="lg"
      p={4}
      border="1px solid"
      borderColor={isHighlighted ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.1)'}
      opacity={isEnabled ? 1 : 0.5}
      transition="all 0.2s"
      _hover={isEnabled ? { transform: 'translateY(-2px)' } : {}}
    >
      <HStack spacing={3}>
        <Box
          p={2}
          borderRadius="lg"
          bg={isEnabled ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.1)'}
        >
          <Icon
            as={icon}
            color={isEnabled ? 'blue.300' : 'gray.500'}
            boxSize={5}
          />
        </Box>
        <Box flex={1}>
          <Text color="white" fontWeight="medium" fontSize="sm">
            {title}
          </Text>
          <Text color="gray.400" fontSize="xs">
            {description}
          </Text>
        </Box>
        <Icon
          as={isEnabled ? CheckCircle2 : XCircle}
          color={isEnabled ? 'green.400' : 'gray.600'}
          boxSize={4}
        />
      </HStack>
    </Box>
  );
};

// Feature definitions with icons
export const RECRUITER_FEATURES = [
  {
    key: 'jobPosting',
    icon: Briefcase,
    title: 'Đăng tin tuyển dụng',
    description: 'Số lượng tin tuyển dụng dài hạn mỗi tháng',
    isQuota: true
  },
  {
    key: 'shortTermJobPosting',
    icon: Zap,
    title: 'Tin công việc ngắn hạn/Gig',
    description: 'Số lượng tin gig/công việc ngắn hạn mỗi tháng',
    isQuota: true
  },
  {
    key: 'jobBoost',
    icon: TrendingUp,
    title: 'Job Boost',
    description: 'Số lần đẩy tin lên đầu danh sách mỗi tháng',
    isQuota: true
  },
  {
    key: 'highlightJobs',
    icon: Star,
    title: 'Highlight tin tuyển dụng',
    description: 'Đánh dấu tin nổi bật để thu hút ứng viên',
    isFeature: true
  },
  {
    key: 'aiCandidateSuggestion',
    icon: Bot,
    title: 'AI Gợi ý ứng viên',
    description: 'AI tự động gợi ý ứng viên phù hợp với tin tuyển dụng',
    isFeature: true
  },
  {
    key: 'premiumCompanyProfile',
    icon: Database,
    title: 'Hồ sơ công ty Premium',
    description: 'Hồ sơ công ty nâng cao với logo, banner, video',
    isFeature: true
  },
  {
    key: 'analyticsDashboard',
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Bảng phân tích chi tiết về hiệu quả tuyển dụng',
    isFeature: true
  },
  {
    key: 'candidateDatabaseAccess',
    icon: Users,
    title: 'Truy cập CSDL ứng viên',
    description: 'Tìm kiếm và xem hồ sơ ứng viên trong hệ thống',
    isFeature: true
  },
  {
    key: 'automatedOutreach',
    icon: Send,
    title: 'Automated Outreach',
    description: 'Tự động gửi tin nhắn tiếp cận ứng viên phù hợp',
    isFeature: true
  },
  {
    key: 'apiAccess',
    icon: Key,
    title: 'API Access',
    description: 'Truy cập API để tích hợp với hệ thống của bạn',
    isFeature: true
  },
  {
    key: 'prioritySupport',
    icon: Headphones,
    title: 'Hỗ trợ ưu tiên',
    description: 'Đội ngũ hỗ trợ riêng, phản hồi nhanh chóng',
    isFeature: true
  }
];

export default QuotaDisplay;
