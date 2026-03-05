import React from "react";
import {
  Badge,
  Box,
  HStack,
  Icon,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import {
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiZap,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import {
  ShortTermJobStatus,
  ShortTermApplicationStatus,
  JobUrgency,
  SHORT_TERM_JOB_STATUS_DISPLAY,
  APPLICATION_STATUS_DISPLAY,
} from "../../types/ShortTermJob";

// ==================== STATUS BADGE ====================

interface StatusBadgeProps {
  status: ShortTermJobStatus | ShortTermApplicationStatus;
  type?: "job" | "application";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showDescription?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = "job",
  size = "md",
  showIcon = true,
  showDescription = false,
}) => {
  const displayInfo =
    type === "job"
      ? SHORT_TERM_JOB_STATUS_DISPLAY[status as ShortTermJobStatus]
      : APPLICATION_STATUS_DISPLAY[status as ShortTermApplicationStatus];

  if (!displayInfo) {
    return <Badge>{status}</Badge>;
  }

  const fontSize = size === "sm" ? "xs" : size === "lg" ? "md" : "sm";
  const padding = size === "sm" ? "1" : size === "lg" ? "3" : "2";

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Badge
          colorPalette={displayInfo.color}
          fontSize={fontSize}
          px={padding}
          py="1"
          borderRadius="md"
          display="flex"
          alignItems="center"
          gap="1"
          cursor="default"
        >
          {showIcon && displayInfo.icon && (
            <Text as="span">{displayInfo.icon}</Text>
          )}
          <Text as="span">{displayInfo.text}</Text>
        </Badge>
      </Tooltip.Trigger>
      {!showDescription && displayInfo.description && (
        <Tooltip.Positioner>
          <Tooltip.Content>{displayInfo.description}</Tooltip.Content>
        </Tooltip.Positioner>
      )}
    </Tooltip.Root>
  );
};

// ==================== URGENCY BADGE ====================

interface UrgencyBadgeProps {
  urgency: JobUrgency;
  size?: "sm" | "md" | "lg";
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({
  urgency,
  size = "md",
}) => {
  const urgencyConfig: Record<
    JobUrgency,
    { text: string; color: string; icon: React.ReactNode }
  > = {
    [JobUrgency.NORMAL]: {
      text: "Bình Thường",
      color: "gray",
      icon: <FiClock />,
    },
    [JobUrgency.URGENT]: {
      text: "Gấp",
      color: "orange",
      icon: <FiZap />,
    },
    [JobUrgency.VERY_URGENT]: {
      text: "Rất Gấp",
      color: "red",
      icon: <FiAlertCircle />,
    },
    [JobUrgency.ASAP]: {
      text: "Cần Ngay",
      color: "red",
      icon: <FiZap />,
    },
  };

  const config = urgencyConfig[urgency] || urgencyConfig[JobUrgency.NORMAL];
  const fontSize = size === "sm" ? "xs" : size === "lg" ? "md" : "sm";

  return (
    <Badge
      colorPalette={config.color}
      fontSize={fontSize}
      px="2"
      py="1"
      borderRadius="md"
      display="flex"
      alignItems="center"
      gap="1"
    >
      {config.icon}
      <Text as="span">{config.text}</Text>
    </Badge>
  );
};

// ==================== JOB INFO DISPLAY ====================

interface JobInfoProps {
  budget: number;
  deadline: string;
  isRemote: boolean;
  location?: string;
  urgency: JobUrgency;
  estimatedDuration?: string;
}

export const JobInfoDisplay: React.FC<JobInfoProps> = ({
  budget,
  deadline,
  isRemote,
  location,
  urgency,
  estimatedDuration,
}) => {
  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = new Date(deadline) < new Date();

  return (
    <VStack align="stretch" gap={2}>
      <HStack>
        <Icon as={FiDollarSign} color="green.500" />
        <Text fontWeight="bold" color="green.600">
          {formatBudget(budget)}
        </Text>
      </HStack>

      <HStack>
        <Icon as={FiClock} color={isExpired ? "red.500" : "blue.500"} />
        <Text color={isExpired ? "red.500" : "gray.600"}>
          {isExpired ? "Đã hết hạn: " : "Deadline: "}
          {formatDeadline(deadline)}
        </Text>
      </HStack>

      <HStack>
        <Icon as={FiMapPin} color="purple.500" />
        <Text color="gray.600">
          {isRemote ? "Remote" : location || "Tại văn phòng"}
        </Text>
      </HStack>

      {estimatedDuration && (
        <HStack>
          <Icon as={FiClock} color="orange.500" />
          <Text color="gray.600">Ước tính: {estimatedDuration}</Text>
        </HStack>
      )}

      <UrgencyBadge urgency={urgency} size="sm" />
    </VStack>
  );
};

// ==================== STATUS WORKFLOW INDICATOR ====================

interface WorkflowIndicatorProps {
  currentStatus: ShortTermJobStatus;
  showLabels?: boolean;
}

export const JobWorkflowIndicator: React.FC<WorkflowIndicatorProps> = ({
  currentStatus,
  showLabels = true,
}) => {
  const workflowSteps = [
    { status: ShortTermJobStatus.DRAFT, label: "Nháp" },
    { status: ShortTermJobStatus.PUBLISHED, label: "Đăng" },
    { status: ShortTermJobStatus.APPLIED, label: "Có UV" },
    { status: ShortTermJobStatus.IN_PROGRESS, label: "Đang Làm" },
    { status: ShortTermJobStatus.SUBMITTED, label: "Nộp Bài" },
    { status: ShortTermJobStatus.UNDER_REVIEW, label: "Review" },
    { status: ShortTermJobStatus.APPROVED, label: "Duyệt" },
    { status: ShortTermJobStatus.COMPLETED, label: "Xong" },
    { status: ShortTermJobStatus.PAID, label: "Đã Trả" },
  ];

  const currentIndex = workflowSteps.findIndex(
    (step) => step.status === currentStatus,
  );

  const getStepColor = (index: number) => {
    if (currentStatus === ShortTermJobStatus.CANCELLED) return "gray.300";
    if (currentStatus === ShortTermJobStatus.REJECTED) {
      if (index <= currentIndex) return "red.400";
      return "gray.300";
    }
    if (index < currentIndex) return "green.400";
    if (index === currentIndex) return "blue.500";
    return "gray.300";
  };

  if (
    currentStatus === ShortTermJobStatus.CANCELLED ||
    currentStatus === ShortTermJobStatus.DISPUTED
  ) {
    return (
      <Box>
        <StatusBadge status={currentStatus} type="job" size="lg" />
      </Box>
    );
  }

  return (
    <HStack gap={1} flexWrap="wrap">
      {workflowSteps.map((step, index) => (
        <React.Fragment key={step.status}>
          <VStack gap={1}>
            <Box
              w="8"
              h="8"
              borderRadius="full"
              bg={getStepColor(index)}
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontSize="sm"
              fontWeight="bold"
            >
              {index < currentIndex ? (
                <FiCheckCircle />
              ) : index === currentIndex ? (
                index + 1
              ) : (
                index + 1
              )}
            </Box>
            {showLabels && (
              <Text
                fontSize="xs"
                color={index === currentIndex ? "blue.600" : "gray.500"}
                fontWeight={index === currentIndex ? "bold" : "normal"}
              >
                {step.label}
              </Text>
            )}
          </VStack>
          {index < workflowSteps.length - 1 && (
            <Box
              w="4"
              h="0.5"
              bg={index < currentIndex ? "green.400" : "gray.300"}
              mt={showLabels ? "-4" : "0"}
            />
          )}
        </React.Fragment>
      ))}
    </HStack>
  );
};

// ==================== STAR RATING DISPLAY ====================

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = "md",
  showValue = true,
}) => {
  const fontSize = size === "sm" ? "sm" : size === "lg" ? "xl" : "md";
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  const getColor = (r: number) => {
    if (r >= 4.5) return "green.500";
    if (r >= 4.0) return "teal.500";
    if (r >= 3.0) return "yellow.500";
    if (r >= 2.0) return "orange.500";
    return "red.500";
  };

  return (
    <HStack gap={1}>
      {[...Array(fullStars)].map((_, i) => (
        <Text key={`full-${i}`} color={getColor(rating)} fontSize={fontSize}>
          ★
        </Text>
      ))}
      {hasHalfStar && (
        <Text color={getColor(rating)} fontSize={fontSize}>
          ★
        </Text>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Text key={`empty-${i}`} color="gray.300" fontSize={fontSize}>
          ☆
        </Text>
      ))}
      {showValue && (
        <Text
          fontSize={fontSize}
          color={getColor(rating)}
          fontWeight="bold"
          ml={1}
        >
          {rating.toFixed(1)}
        </Text>
      )}
    </HStack>
  );
};

export default {
  StatusBadge,
  UrgencyBadge,
  JobInfoDisplay,
  JobWorkflowIndicator,
  StarRating,
};
