import React from "react";
import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Icon,
  Tag,
  Text,
  VStack,
  Avatar,
  Flex,
  IconButton,
  Menu,
  Badge,
  Separator,
} from "@chakra-ui/react";
import {
  FiBookmark,
  FiClock,
  FiDollarSign,
  FiEye,
  FiMapPin,
  FiMoreVertical,
  FiShare2,
  FiUsers,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  ShortTermJobPosting,
  ShortTermJobStatus,
} from "../../types/ShortTermJob";
import {
  StatusBadge,
  UrgencyBadge,
  StarRating,
} from "./ShortTermJobComponents";

// Type alias for convenience
type ShortTermJob = ShortTermJobPosting;

// ==================== TYPES ====================

interface ShortTermJobCardProps {
  job: ShortTermJob;
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
  onShare?: (jobId: string) => void;
  onEdit?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onPublish?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
  isOwner?: boolean;
  isSaved?: boolean;
  showActions?: boolean;
  variant?: "default" | "compact" | "featured";
}

// ==================== SHORT TERM JOB CARD ====================

export const ShortTermJobCard: React.FC<ShortTermJobCardProps> = ({
  job,
  onApply,
  onSave,
  onShare,
  onEdit,
  onDelete,
  onPublish,
  onViewDetails,
  isOwner = false,
  isSaved = false,
  showActions = true,
  variant = "default",
}) => {
  const navigate = useNavigate();

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Đã hết hạn";
    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Còn 1 ngày";
    if (diffDays <= 7) return `Còn ${diffDays} ngày`;
    return date.toLocaleDateString("vi-VN");
  };

  const isExpired = new Date(job.deadline) < new Date();
  const canApply =
    job.status === ShortTermJobStatus.PUBLISHED && !isExpired && !isOwner;

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(String(job.id));
    } else {
      navigate(`/short-term-jobs/${job.id}`);
    }
  };

  // ========== COMPACT VARIANT ==========
  if (variant === "compact") {
    return (
      <Card.Root
        borderWidth="1px"
        _hover={{ cursor: "pointer" }}
        onClick={handleCardClick}
      >
        <Card.Body py={3} px={4}>
          <HStack gap={4}>
            <VStack align="start" flex="1" gap={1}>
              <Heading size="sm" lineClamp={1}>
                {job.title}
              </Heading>
              <HStack gap={2} fontSize="sm" color="gray.500">
                <Icon as={FiDollarSign} />
                <Text color="green.600" fontWeight="bold">
                  {formatBudget(job.budget)}
                </Text>
                <Icon as={FiClock} ml={2} />
                <Text color={isExpired ? "red.500" : "gray.600"}>
                  {formatDeadline(job.deadline)}
                </Text>
              </HStack>
            </VStack>
            <StatusBadge status={job.status} type="job" size="sm" />
            <UrgencyBadge urgency={job.urgency} size="sm" />
          </HStack>
        </Card.Body>
      </Card.Root>
    );
  }

  // ========== FEATURED VARIANT ==========
  if (variant === "featured") {
    return (
      <Card.Root
        borderWidth="2px"
        borderColor="blue.400"
        boxShadow="lg"
        _hover={{ boxShadow: "xl", cursor: "pointer" }}
        onClick={handleCardClick}
        position="relative"
        overflow="hidden"
      >
        <Badge
          position="absolute"
          top={3}
          right={3}
          colorPalette="blue"
          variant="solid"
          borderRadius="full"
          px={3}
          py={1}
        >
          ⭐ Nổi bật
        </Badge>

        <Card.Header pb={2}>
          <HStack justify="space-between">
            <VStack align="start" gap={1}>
              <Heading size="md">{job.title}</Heading>
              <HStack>
                <Avatar.Root size="xs">
                  <Avatar.Fallback name={job.recruiterCompanyName} />
                </Avatar.Root>
                <Text fontSize="sm" color="gray.500">
                  {job.recruiterCompanyName}
                </Text>
                {job.recruiterRating && (
                  <StarRating
                    rating={job.recruiterRating}
                    size="sm"
                    showValue={false}
                  />
                )}
              </HStack>
            </VStack>
          </HStack>
        </Card.Header>

        <Card.Body py={2}>
          <Text lineClamp={2} color="gray.600" mb={3}>
            {job.description}
          </Text>

          <Flex wrap="wrap" gap={2} mb={3}>
            {job.requiredSkills
              .slice(0, 5)
              .map((skill: string, idx: number) => (
                <Tag.Root
                  key={idx}
                  size="sm"
                  colorPalette="blue"
                  variant="subtle"
                >
                  <Tag.Label>{skill}</Tag.Label>
                </Tag.Root>
              ))}
            {job.requiredSkills.length > 5 && (
              <Tag.Root size="sm" colorPalette="gray">
                <Tag.Label>+{job.requiredSkills.length - 5}</Tag.Label>
              </Tag.Root>
            )}
          </Flex>

          <Separator mb={3} />

          <HStack gap={4} fontSize="sm">
            <HStack>
              <Icon as={FiDollarSign} color="green.500" />
              <Text color="green.600" fontWeight="bold" fontSize="lg">
                {formatBudget(job.budget)}
              </Text>
            </HStack>
            <HStack>
              <Icon as={FiClock} color={isExpired ? "red.500" : "blue.500"} />
              <Text color={isExpired ? "red.500" : "gray.600"}>
                {formatDeadline(job.deadline)}
              </Text>
            </HStack>
            <HStack>
              <Icon as={FiMapPin} color="purple.500" />
              <Text>{job.isRemote ? "Remote" : job.location}</Text>
            </HStack>
          </HStack>
        </Card.Body>

        <Card.Footer pt={2}>
          <HStack w="100%" justify="space-between">
            <HStack gap={2}>
              <StatusBadge status={job.status} type="job" size="md" />
              <UrgencyBadge urgency={job.urgency} size="md" />
            </HStack>
            {canApply && (
              <Button
                colorPalette="blue"
                size="md"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply?.(String(job.id));
                }}
              >
                Ứng Tuyển Ngay
              </Button>
            )}
          </HStack>
        </Card.Footer>
      </Card.Root>
    );
  }

  // ========== DEFAULT VARIANT ==========
  return (
    <Card.Root
      borderWidth="1px"
      _hover={{ boxShadow: "md", cursor: "pointer" }}
      transition="all 0.2s"
    >
      <Card.Header pb={2}>
        <Flex>
          <VStack align="start" gap={1} flex="1" onClick={handleCardClick}>
            <Heading size="sm" lineClamp={2}>
              {job.title}
            </Heading>
            <HStack>
              <Avatar.Root size="xs">
                <Avatar.Fallback name={job.recruiterCompanyName} />
              </Avatar.Root>
              <Text fontSize="sm" color="gray.500">
                {job.recruiterCompanyName}
              </Text>
              {job.recruiterRating && (
                <StarRating
                  rating={job.recruiterRating}
                  size="sm"
                  showValue={false}
                />
              )}
            </HStack>
          </VStack>

          {showActions && (
            <Menu.Root>
              <Menu.Trigger asChild>
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Menu"
                >
                  <FiMoreVertical />
                </IconButton>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    value="view"
                    onClick={() => onViewDetails?.(String(job.id))}
                  >
                    <FiEye /> Xem chi tiết
                  </Menu.Item>
                  <Menu.Item
                    value="save"
                    onClick={() => onSave?.(String(job.id))}
                  >
                    <FiBookmark /> {isSaved ? "Đã lưu" : "Lưu công việc"}
                  </Menu.Item>
                  <Menu.Item
                    value="share"
                    onClick={() => onShare?.(String(job.id))}
                  >
                    <FiShare2 /> Chia sẻ
                  </Menu.Item>
                  {isOwner && (
                    <>
                      <Menu.Separator />
                      {job.status === ShortTermJobStatus.DRAFT && (
                        <>
                          <Menu.Item
                            value="publish"
                            onClick={() => onPublish?.(String(job.id))}
                            color="green.500"
                          >
                            <FiCheckCircle /> Đăng công việc
                          </Menu.Item>
                          <Menu.Item
                            value="edit"
                            onClick={() => onEdit?.(String(job.id))}
                          >
                            <FiEdit /> Chỉnh sửa
                          </Menu.Item>
                        </>
                      )}
                      <Menu.Item
                        value="delete"
                        onClick={() => onDelete?.(String(job.id))}
                        color="red.500"
                      >
                        <FiTrash2 /> Xóa
                      </Menu.Item>
                    </>
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          )}
        </Flex>
      </Card.Header>

      <Card.Body py={2} onClick={handleCardClick}>
        <Text lineClamp={2} color="gray.600" fontSize="sm" mb={3}>
          {job.description}
        </Text>

        <Flex wrap="wrap" gap={1} mb={3}>
          {job.requiredSkills.slice(0, 4).map((skill: string, idx: number) => (
            <Tag.Root key={idx} size="sm" colorPalette="blue" variant="subtle">
              <Tag.Label>{skill}</Tag.Label>
            </Tag.Root>
          ))}
          {job.requiredSkills.length > 4 && (
            <Tag.Root size="sm" colorPalette="gray">
              <Tag.Label>+{job.requiredSkills.length - 4}</Tag.Label>
            </Tag.Root>
          )}
        </Flex>

        <HStack gap={3} fontSize="sm" color="gray.600">
          <HStack>
            <Icon as={FiDollarSign} color="green.500" />
            <Text color="green.600" fontWeight="bold">
              {formatBudget(job.budget)}
            </Text>
          </HStack>
          <HStack>
            <Icon as={FiClock} color={isExpired ? "red.500" : "gray.500"} />
            <Text color={isExpired ? "red.500" : "gray.600"}>
              {formatDeadline(job.deadline)}
            </Text>
          </HStack>
          <HStack>
            <Icon as={FiUsers} />
            <Text>{job.applicantCount || 0} ứng viên</Text>
          </HStack>
        </HStack>
      </Card.Body>

      <Card.Footer pt={2}>
        <HStack w="100%" justify="space-between">
          <HStack gap={2}>
            <StatusBadge status={job.status} type="job" size="sm" />
            <UrgencyBadge urgency={job.urgency} size="sm" />
          </HStack>
          {canApply && (
            <Button
              colorPalette="blue"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onApply?.(String(job.id));
              }}
            >
              Ứng Tuyển
            </Button>
          )}
          {isOwner && job.status === ShortTermJobStatus.DRAFT && (
            <Button
              colorPalette="green"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPublish?.(String(job.id));
              }}
            >
              Đăng
            </Button>
          )}
        </HStack>
      </Card.Footer>
    </Card.Root>
  );
};

// ==================== JOB CARD LIST ====================

interface ShortTermJobListProps {
  jobs: ShortTermJob[];
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
  onShare?: (jobId: string) => void;
  onEdit?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onPublish?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
  isOwner?: boolean;
  savedJobs?: string[];
  variant?: "default" | "compact" | "featured";
  columns?: 1 | 2 | 3;
  emptyMessage?: string;
}

export const ShortTermJobList: React.FC<ShortTermJobListProps> = ({
  jobs,
  onApply,
  onSave,
  onShare,
  onEdit,
  onDelete,
  onPublish,
  onViewDetails,
  isOwner = false,
  savedJobs = [],
  variant = "default",
  columns = 2,
  emptyMessage = "Không có công việc nào",
}) => {
  if (!jobs || jobs.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Icon as={FiUsers} boxSize={12} color="gray.400" mb={4} />
        <Text color="gray.500">{emptyMessage}</Text>
      </Box>
    );
  }

  const gridColumns = {
    1: { base: "repeat(1, 1fr)" },
    2: { base: "repeat(1, 1fr)", md: "repeat(2, 1fr)" },
    3: { base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
  };

  return (
    <Box display="grid" gridTemplateColumns={gridColumns[columns]} gap={4}>
      {jobs.map((job) => (
        <ShortTermJobCard
          key={job.id}
          job={job}
          onApply={onApply}
          onSave={onSave}
          onShare={onShare}
          onEdit={onEdit}
          onDelete={onDelete}
          onPublish={onPublish}
          onViewDetails={onViewDetails}
          isOwner={isOwner}
          isSaved={savedJobs.includes(String(job.id))}
          variant={variant}
        />
      ))}
    </Box>
  );
};

export default ShortTermJobCard;
