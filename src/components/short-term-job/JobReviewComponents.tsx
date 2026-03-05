import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  Field,
  Heading,
  HStack,
  Icon,
  Textarea,
  VStack,
  Text,
  Separator,
  Avatar,
  Flex,
  Spacer,
  Badge,
  Progress,
  Tooltip,
} from "@chakra-ui/react";
import {
  FiStar,
  FiSend,
  FiCheck,
  FiX,
  FiThumbsUp,
  FiThumbsDown,
  FiMessageSquare,
} from "react-icons/fi";
import {
  CreateJobReviewRequest,
  JobReview,
  UserRatingSummary,
} from "../../types/ShortTermJob";
import { StarRating } from "./ShortTermJobComponents";
import { useToast } from "../../hooks/useToast";

// ==================== TYPES ====================

interface JobReviewFormProps {
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string;
  jobId: string;
  jobTitle: string;
  isRecruiterReview: boolean;
  onSubmit: (request: CreateJobReviewRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface RatingInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description?: string;
  required?: boolean;
  error?: string;
}

interface FormErrors {
  overallRating?: string;
  content?: string;
}

// ==================== CONSTANTS ====================

const RATING_LABELS: Record<number, string> = {
  1: "Rất tệ",
  2: "Tệ",
  3: "Trung bình",
  4: "Tốt",
  5: "Xuất sắc",
};

const RATING_COLORS: Record<number, string> = {
  1: "red.500",
  2: "orange.500",
  3: "yellow.500",
  4: "teal.500",
  5: "green.500",
};

// ==================== RATING INPUT COMPONENT ====================

const RatingInput: React.FC<RatingInputProps> = ({
  label,
  value,
  onChange,
  description,
  required = false,
  error,
}) => {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  return (
    <Field.Root invalid={!!error} required={required}>
      <Field.Label>{label}</Field.Label>
      {description && <Field.HelperText mb={2}>{description}</Field.HelperText>}
      <HStack gap={2}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Box
            key={star}
            cursor="pointer"
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange(star)}
            transition="transform 0.1s"
            _hover={{ transform: "scale(1.2)" }}
          >
            <Text
              fontSize="2xl"
              color={
                star <= displayValue
                  ? RATING_COLORS[displayValue] || "gray.300"
                  : "gray.300"
              }
            >
              {star <= displayValue ? "★" : "☆"}
            </Text>
          </Box>
        ))}
        {displayValue > 0 && (
          <Badge
            colorPalette={
              displayValue >= 4 ? "green" : displayValue >= 3 ? "yellow" : "red"
            }
          >
            {RATING_LABELS[displayValue]}
          </Badge>
        )}
      </HStack>
      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  );
};

// ==================== JOB REVIEW FORM COMPONENT ====================

export const JobReviewForm: React.FC<JobReviewFormProps> = ({
  targetUserName,
  targetUserAvatar,
  jobTitle,
  isRecruiterReview,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { showError, showSuccess } = useToast();

  const [formData, setFormData] = useState<CreateJobReviewRequest>({
    applicationId: 0,
    rating: 0,
    overallRating: 0,
    communicationRating: 0,
    qualityRating: 0,
    timelinessRating: 0,
    professionalismRating: 0,
    content: "",
    comment: "",
    strengths: "",
    areasForImprovement: "",
    wouldRecommend: true,
    isPublic: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // ========== VALIDATION ==========
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if ((formData.overallRating || 0) === 0) {
      newErrors.overallRating = "Vui lòng đánh giá tổng thể";
    }

    const contentText = formData.content || "";
    if (!contentText.trim()) {
      newErrors.content = "Vui lòng nhập nội dung đánh giá";
    } else if (contentText.length < 20) {
      newErrors.content = "Nội dung đánh giá phải có ít nhất 20 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========== HANDLERS ==========
  const handleRatingChange = (field: string, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "overallRating") {
      // Sync overallRating to rating
      setFormData((prev) => ({ ...prev, rating: value, overallRating: value }));
    }
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTextChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "content") {
      // Sync content to comment
      setFormData((prev) => ({ ...prev, comment: value, content: value }));
    }
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError("Lỗi", "Vui lòng kiểm tra lại thông tin");
      return;
    }

    try {
      await onSubmit(formData);
      showSuccess("Thành công", "Đánh giá đã được gửi");
    } catch {
      showError("Lỗi", "Không thể gửi đánh giá");
    }
  };

  // ========== RENDER ==========
  return (
    <VStack gap={4} align="stretch">
      {/* Target Info */}
      <Card.Root>
        <Card.Body>
          <HStack>
            <Avatar.Root size="md">
              {targetUserAvatar ? (
                <Avatar.Image src={targetUserAvatar} />
              ) : (
                <Avatar.Fallback name={targetUserName} />
              )}
            </Avatar.Root>
            <VStack align="start" gap={0}>
              <Text fontWeight="bold">{targetUserName}</Text>
              <Text fontSize="sm" color="gray.500">
                {isRecruiterReview ? "Freelancer" : "Nhà tuyển dụng"}
              </Text>
            </VStack>
            <Spacer />
            <VStack align="end" gap={0}>
              <Text fontSize="sm" color="gray.500">
                Công việc
              </Text>
              <Text fontWeight="bold" lineClamp={1}>
                {jobTitle}
              </Text>
            </VStack>
          </HStack>
        </Card.Body>
      </Card.Root>

      {/* Rating Form */}
      <Card.Root>
        <Card.Header>
          <Heading size="md">Đánh giá chi tiết</Heading>
        </Card.Header>
        <Card.Body>
          <VStack gap={6} align="stretch">
            {/* Overall Rating */}
            <RatingInput
              label="Đánh giá tổng thể"
              value={formData.overallRating || 0}
              onChange={(v) => handleRatingChange("overallRating", v)}
              required
              error={errors.overallRating}
            />

            <Separator />

            {/* Specific Ratings */}
            <RatingInput
              label="Giao tiếp"
              value={formData.communicationRating || 0}
              onChange={(v) => handleRatingChange("communicationRating", v)}
              description="Khả năng trao đổi, phản hồi kịp thời"
            />

            <RatingInput
              label={
                isRecruiterReview ? "Chất lượng công việc" : "Mô tả công việc"
              }
              value={formData.qualityRating || 0}
              onChange={(v) => handleRatingChange("qualityRating", v)}
              description={
                isRecruiterReview
                  ? "Chất lượng sản phẩm/dịch vụ được giao"
                  : "Độ chính xác của mô tả công việc"
              }
            />

            <RatingInput
              label="Đúng hạn"
              value={formData.timelinessRating || 0}
              onChange={(v) => handleRatingChange("timelinessRating", v)}
              description={
                isRecruiterReview
                  ? "Hoàn thành công việc đúng thời hạn"
                  : "Phản hồi và thanh toán đúng hạn"
              }
            />

            <RatingInput
              label="Tính chuyên nghiệp"
              value={formData.professionalismRating || 0}
              onChange={(v) => handleRatingChange("professionalismRating", v)}
              description="Thái độ làm việc chuyên nghiệp"
            />
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Written Review */}
      <Card.Root>
        <Card.Header>
          <Heading size="md">Nhận xét chi tiết</Heading>
        </Card.Header>
        <Card.Body>
          <VStack gap={4} align="stretch">
            <Field.Root invalid={!!errors.content} required>
              <Field.Label>Nội dung đánh giá</Field.Label>
              <Textarea
                value={formData.content || ""}
                onChange={(e) => handleTextChange("content", e.target.value)}
                placeholder="Chia sẻ trải nghiệm làm việc của bạn..."
                rows={4}
                maxLength={2000}
              />
              <Flex justify="space-between">
                {errors.content && (
                  <Field.ErrorText>{errors.content}</Field.ErrorText>
                )}
                <Field.HelperText>
                  {(formData.content || "").length}/2000
                </Field.HelperText>
              </Flex>
            </Field.Root>

            <Field.Root>
              <Field.Label>
                <HStack>
                  <Icon color="green.500">
                    <FiThumbsUp />
                  </Icon>
                  <Text>Điểm mạnh</Text>
                </HStack>
              </Field.Label>
              <Textarea
                value={formData.strengths || ""}
                onChange={(e) => handleTextChange("strengths", e.target.value)}
                placeholder="Những điểm bạn hài lòng..."
                rows={3}
                maxLength={1000}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>
                <HStack>
                  <Icon color="orange.500">
                    <FiThumbsDown />
                  </Icon>
                  <Text>Cần cải thiện</Text>
                </HStack>
              </Field.Label>
              <Textarea
                value={formData.areasForImprovement || ""}
                onChange={(e) =>
                  handleTextChange("areasForImprovement", e.target.value)
                }
                placeholder="Những điểm cần cải thiện..."
                rows={3}
                maxLength={1000}
              />
            </Field.Root>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Recommendation */}
      <Card.Root>
        <Card.Body>
          <HStack justify="space-between">
            <Text fontWeight="bold">
              Bạn có giới thiệu{" "}
              {isRecruiterReview ? "freelancer" : "nhà tuyển dụng"} này không?
            </Text>
            <HStack>
              <Button
                colorPalette={formData.wouldRecommend ? "green" : "gray"}
                variant={formData.wouldRecommend ? "solid" : "outline"}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    wouldRecommend: true,
                  }))
                }
              >
                <FiThumbsUp />
                Có
              </Button>
              <Button
                colorPalette={!formData.wouldRecommend ? "red" : "gray"}
                variant={!formData.wouldRecommend ? "solid" : "outline"}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    wouldRecommend: false,
                  }))
                }
              >
                <FiThumbsDown />
                Không
              </Button>
            </HStack>
          </HStack>
        </Card.Body>
      </Card.Root>

      {/* Actions */}
      <HStack justify="flex-end" gap={3}>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            <FiX />
            Hủy
          </Button>
        )}
        <Button colorPalette="blue" onClick={handleSubmit} loading={isLoading}>
          <FiSend />
          Gửi đánh giá
        </Button>
      </HStack>
    </VStack>
  );
};

// ==================== REVIEW DISPLAY COMPONENT ====================

interface JobReviewDisplayProps {
  review: JobReview;
  showJob?: boolean;
}

export const JobReviewDisplay: React.FC<JobReviewDisplayProps> = ({
  review,
  showJob = false,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Card.Root>
      <Card.Body>
        <VStack align="stretch" gap={3}>
          {/* Reviewer Info */}
          <Flex align="center">
            <HStack>
              <Avatar.Root size="sm">
                {review.reviewerAvatar ? (
                  <Avatar.Image src={review.reviewerAvatar} />
                ) : (
                  <Avatar.Fallback name={review.reviewerName} />
                )}
              </Avatar.Root>
              <VStack align="start" gap={0}>
                <Text fontWeight="bold">{review.reviewerName}</Text>
                <Text fontSize="xs" color="gray.500">
                  {formatDate(review.createdAt)}
                </Text>
              </VStack>
            </HStack>
            <Spacer />
            <StarRating rating={review.rating} size="md" />
          </Flex>

          {showJob && review.jobTitle && (
            <Text fontSize="sm" color="blue.500">
              Công việc: {review.jobTitle}
            </Text>
          )}

          <Separator />

          {/* Rating Details */}
          <HStack flexWrap="wrap" gap={4}>
            {review.communicationRating && (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <HStack>
                    <Icon color="blue.500">
                      <FiMessageSquare />
                    </Icon>
                    <Text fontSize="sm">{review.communicationRating}/5</Text>
                  </HStack>
                </Tooltip.Trigger>
                <Tooltip.Positioner>
                  <Tooltip.Content>Giao tiếp</Tooltip.Content>
                </Tooltip.Positioner>
              </Tooltip.Root>
            )}
            {review.qualityRating && (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <HStack>
                    <Icon color="green.500">
                      <FiCheck />
                    </Icon>
                    <Text fontSize="sm">{review.qualityRating}/5</Text>
                  </HStack>
                </Tooltip.Trigger>
                <Tooltip.Positioner>
                  <Tooltip.Content>Chất lượng</Tooltip.Content>
                </Tooltip.Positioner>
              </Tooltip.Root>
            )}
            {review.timelinessRating && (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <HStack>
                    <Icon color="yellow.500">
                      <FiStar />
                    </Icon>
                    <Text fontSize="sm">{review.timelinessRating}/5</Text>
                  </HStack>
                </Tooltip.Trigger>
                <Tooltip.Positioner>
                  <Tooltip.Content>Đúng hạn</Tooltip.Content>
                </Tooltip.Positioner>
              </Tooltip.Root>
            )}
          </HStack>

          {/* Review Content */}
          {review.comment && <Text>{review.comment}</Text>}

          {/* Strengths & Improvements */}
          {review.strengths && (
            <Box bg="green.50" p={3} borderRadius="md">
              <HStack mb={1}>
                <Icon color="green.500">
                  <FiThumbsUp />
                </Icon>
                <Text fontWeight="bold" fontSize="sm" color="green.700">
                  Điểm mạnh
                </Text>
              </HStack>
              <Text fontSize="sm" color="green.700">
                {review.strengths}
              </Text>
            </Box>
          )}

          {review.improvements && (
            <Box bg="orange.50" p={3} borderRadius="md">
              <HStack mb={1}>
                <Icon color="orange.500">
                  <FiThumbsDown />
                </Icon>
                <Text fontWeight="bold" fontSize="sm" color="orange.700">
                  Cần cải thiện
                </Text>
              </HStack>
              <Text fontSize="sm" color="orange.700">
                {review.improvements}
              </Text>
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

// ==================== USER RATING SUMMARY COMPONENT ====================

interface UserRatingSummaryDisplayProps {
  summary: UserRatingSummary;
  showBreakdown?: boolean;
}

export const UserRatingSummaryDisplay: React.FC<
  UserRatingSummaryDisplayProps
> = ({ summary, showBreakdown = true }) => {
  const ratingBreakdown = [
    { label: "Giao tiếp", value: summary.averageCommunicationRating },
    { label: "Chất lượng", value: summary.averageQualityRating },
    { label: "Đúng hạn", value: summary.averageTimelinessRating },
    { label: "Chuyên nghiệp", value: summary.averageProfessionalismRating },
  ].filter((item) => item.value && item.value > 0);

  return (
    <Card.Root>
      <Card.Body>
        <VStack gap={4}>
          {/* Overall */}
          <VStack>
            <StarRating rating={summary.averageRating || 0} size="lg" />
            <Text fontSize="sm" color="gray.500">
              {summary.totalReviews} đánh giá
            </Text>
          </VStack>

          {/* Breakdown */}
          {showBreakdown && ratingBreakdown.length > 0 && (
            <>
              <Separator />
              <VStack align="stretch" w="100%" gap={2}>
                {ratingBreakdown.map((item) => (
                  <HStack key={item.label} justify="space-between">
                    <Text fontSize="sm">{item.label}</Text>
                    <HStack>
                      <Progress.Root
                        value={(item.value || 0) * 20}
                        w="100px"
                        size="sm"
                        colorPalette={
                          (item.value || 0) >= 4
                            ? "green"
                            : (item.value || 0) >= 3
                              ? "yellow"
                              : "red"
                        }
                      >
                        <Progress.Track>
                          <Progress.Range />
                        </Progress.Track>
                      </Progress.Root>
                      <Text fontSize="sm" fontWeight="bold" minW="35px">
                        {(item.value || 0).toFixed(1)}
                      </Text>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </>
          )}

          {/* Job Stats */}
          <Separator />
          <HStack justify="space-around" w="100%">
            <VStack gap={0}>
              <Text fontWeight="bold" fontSize="lg" color="green.500">
                {summary.totalCompletedJobs}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Hoàn thành
              </Text>
            </VStack>
            <VStack gap={0}>
              <Text fontWeight="bold" fontSize="lg" color="blue.500">
                {summary.completionRate.toFixed(0)}%
              </Text>
              <Text fontSize="xs" color="gray.500">
                Tỷ lệ hoàn thành
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default JobReviewForm;
