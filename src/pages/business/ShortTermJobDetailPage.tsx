import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
  Breadcrumb,
  Avatar,
  Separator,
  Tag,
  Card,
  Flex,
  Spacer,
  Badge,
  Tabs,
  Spinner,
  Alert,
  Dialog,
  Textarea,
  SimpleGrid,
  Stat,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FiBookmark,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiEdit,
  FiMapPin,
  FiMessageSquare,
  FiSend,
  FiShare2,
  FiTrash2,
  FiUser,
  FiUsers,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import {
  StatusBadge,
  UrgencyBadge,
  JobWorkflowIndicator,
  StarRating,
  DeliverableDisplay,
  JobReviewDisplay,
} from "../../components/short-term-job";
import shortTermJobService from "../../services/shortTermJobService";
import jobReviewService from "../../services/jobReviewService";
import {
  ShortTermJobResponse,
  ShortTermJobStatus,
  ShortTermJobApplication,
  ShortTermApplicationStatus,
  JobReviewResponse,
  UserRatingSummary,
  UpdateShortTermApplicationStatusRequest,
} from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";

// ==================== HELPERS ====================

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ==================== PAGE COMPONENT ====================

const ShortTermJobDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();
  const { user } = useAuth();
  const { jobId } = useParams<{ jobId: string }>();
  const {
    open: applyOpen,
    onOpen: onApplyOpen,
    onClose: onApplyClose,
    setOpen: setApplyOpen,
  } = useDisclosure();
  const {
    open: deleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
    setOpen: setDeleteOpen,
  } = useDisclosure();

  // State
  const [job, setJob] = useState<ShortTermJobResponse | null>(null);
  const [applications, setApplications] = useState<ShortTermJobApplication[]>(
    [],
  );
  const [reviews, setReviews] = useState<JobReviewResponse[]>([]);
  const [recruiterRating, setRecruiterRating] =
    useState<UserRatingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [myApplication, setMyApplication] =
    useState<ShortTermJobApplication | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // ========== FETCH DATA ==========
  const fetchJob = useCallback(async () => {
    if (!jobId) return;

    setIsLoading(true);
    try {
      const jobData = await shortTermJobService.getJobDetails(Number(jobId));
      setJob(jobData);

      // Check ownership using auth context
      const currentUserId = user?.id ?? 0;
      setIsOwner(jobData.recruiterId === currentUserId);

      // Fetch recruiter rating
      try {
        const rating = await jobReviewService.getUserRatingSummary(
          jobData.recruiterId,
        );
        setRecruiterRating(rating);
      } catch {
        // Rating may not be available
      }
    } catch (error) {
      console.error("Failed to fetch job:", error);
      showError("Lỗi", "Không thể tải thông tin công việc");
      navigate("/short-term-jobs");
    } finally {
      setIsLoading(false);
    }
  }, [jobId, navigate, showError, user]);

  const fetchApplications = useCallback(async () => {
    if (!jobId || !isOwner) return;

    try {
      const response = await shortTermJobService.getJobApplicants(
        Number(jobId),
        0,
        50,
      );
      setApplications(response.content);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    }
  }, [jobId, isOwner]);

  const checkMyApplication = useCallback(async () => {
    if (!jobId || isOwner) return;

    try {
      const myApps = await shortTermJobService.getMyApplications();
      const application = myApps.find(
        (app: ShortTermJobApplication) => app.jobId === Number(jobId),
      );
      if (application) {
        setHasApplied(true);
        setMyApplication(application);
      }
    } catch (error) {
      console.error("Failed to check application:", error);
    }
  }, [jobId, isOwner]);

  const fetchReviews = useCallback(async () => {
    if (!job?.recruiterId) return;

    try {
      const reviewsData = await jobReviewService.getPublicReviewsForUser(
        job.recruiterId,
      );
      setReviews(reviewsData);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  }, [job?.recruiterId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    if (job) {
      fetchApplications();
      checkMyApplication();
      fetchReviews();
    }
  }, [job, fetchApplications, checkMyApplication, fetchReviews]);

  // ========== HANDLERS ==========
  const handleApply = async () => {
    if (!jobId) return;

    setIsApplying(true);
    try {
      const application = await shortTermJobService.applyToJob(Number(jobId), {
        coverLetter: applyMessage,
      });

      setHasApplied(true);
      setMyApplication(application);
      onApplyClose();

      showSuccess("Thành công", "Đơn ứng tuyển đã được gửi");
    } catch (error: unknown) {
      const errMsg =
        (error as { message?: string })?.message ||
        "Không thể gửi đơn ứng tuyển";
      showError("Lỗi", errMsg);
    } finally {
      setIsApplying(false);
    }
  };

  const handlePublish = async () => {
    if (!jobId) return;

    try {
      const updatedJob = await shortTermJobService.publishJob(Number(jobId));
      setJob(updatedJob);
      showSuccess("Thành công", "Công việc đã được đăng");
    } catch (error: unknown) {
      const errMsg =
        (error as { message?: string })?.message || "Không thể đăng công việc";
      showError("Lỗi", errMsg);
    }
  };

  const handleDelete = async () => {
    if (!jobId) return;

    try {
      await shortTermJobService.deleteJob(Number(jobId));
      showSuccess("Thành công", "Công việc đã được xóa");
      navigate("/short-term-jobs");
    } catch (error: unknown) {
      const errMsg =
        (error as { message?: string })?.message || "Không thể xóa công việc";
      showError("Lỗi", errMsg);
    }
    onDeleteClose();
  };

  const handleSaveJob = () => {
    setIsSaved(!isSaved);
    showInfo(
      isSaved ? "Đã bỏ lưu" : "Đã lưu công việc",
      isSaved ? "Công việc đã bị xóa khỏi danh sách" : "Đã thêm vào danh sách",
    );
  };

  const handleAcceptApplication = async (applicationId: number) => {
    try {
      const request: UpdateShortTermApplicationStatusRequest = {
        status: ShortTermApplicationStatus.ACCEPTED,
        message: "Chấp nhận ứng viên",
      };
      await shortTermJobService.updateApplicationStatus(applicationId, request);
      showSuccess("Thành công", "Đã chấp nhận ứng viên");
      fetchApplications();
      fetchJob();
    } catch (error: unknown) {
      const errMsg =
        (error as { message?: string })?.message ||
        "Không thể chấp nhận ứng viên";
      showError("Lỗi", errMsg);
    }
  };

  const handleRejectApplication = async (applicationId: number) => {
    try {
      const request: UpdateShortTermApplicationStatusRequest = {
        status: ShortTermApplicationStatus.REJECTED,
        reason: "Không phù hợp",
      };
      await shortTermJobService.updateApplicationStatus(applicationId, request);
      showInfo("Thông báo", "Đã từ chối ứng viên");
      fetchApplications();
    } catch (error) {
      console.error("Failed to reject application:", error);
    }
  };

  // ========== RENDER HELPERS ==========
  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = job ? new Date(job.deadline) < new Date() : false;
  const canApply =
    job &&
    job.status === ShortTermJobStatus.PUBLISHED &&
    !isExpired &&
    !isOwner &&
    !hasApplied;

  // ========== RENDER ==========
  if (isLoading) {
    return (
      <Box bg="gray.50" minH="100vh" py={6}>
        <Container maxW="container.xl">
          <Flex justify="center" py={20}>
            <Spinner size="xl" />
          </Flex>
        </Container>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box bg="gray.50" minH="100vh" py={6}>
        <Container maxW="container.xl">
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>Không tìm thấy công việc</Alert.Content>
          </Alert.Root>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" py={6}>
      <Container maxW="container.xl">
        {/* Breadcrumb */}
        <Breadcrumb.Root mb={6}>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link onClick={() => navigate("/short-term-jobs")}>
                Công việc ngắn hạn
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.CurrentLink>{job.title}</Breadcrumb.CurrentLink>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>

        <Flex gap={6} direction={{ base: "column", lg: "row" }}>
          {/* Main Content */}
          <Box flex="1">
            {/* Header Card */}
            <Card.Root bg="white" mb={6}>
              <Card.Body>
                <VStack align="stretch" gap={4}>
                  {/* Title & Status */}
                  <Flex wrap="wrap" gap={3} align="center">
                    <Heading size="lg" flex="1">
                      {job.title}
                    </Heading>
                    <StatusBadge status={job.status} type="job" size="lg" />
                    <UrgencyBadge urgency={job.urgency} size="md" />
                  </Flex>

                  {/* Workflow Indicator */}
                  <JobWorkflowIndicator currentStatus={job.status} />

                  {/* Recruiter */}
                  <Flex align="center" pt={2}>
                    <HStack>
                      <Avatar.Root size="md">
                        <Avatar.Fallback>
                          {getInitials(job.recruiterCompanyName)}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <VStack align="start" gap={0}>
                        <Text fontWeight="bold">
                          {job.recruiterCompanyName}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Nhà tuyển dụng
                        </Text>
                      </VStack>
                    </HStack>
                    <Spacer />
                    {recruiterRating && recruiterRating.averageRating && (
                      <StarRating
                        rating={recruiterRating.averageRating}
                        size="sm"
                      />
                    )}
                  </Flex>

                  {/* Actions */}
                  <HStack pt={2} flexWrap="wrap">
                    {canApply && (
                      <Button
                        colorPalette="blue"
                        size="lg"
                        onClick={onApplyOpen}
                      >
                        Ứng tuyển ngay
                      </Button>
                    )}
                    {hasApplied && (
                      <Badge colorPalette="green" p={2} fontSize="sm">
                        ✓ Đã ứng tuyển
                      </Badge>
                    )}
                    {isOwner && job.status === ShortTermJobStatus.DRAFT && (
                      <Button colorPalette="green" onClick={handlePublish}>
                        <FiSend /> Đăng công việc
                      </Button>
                    )}
                    {isOwner &&
                      (job.status === ShortTermJobStatus.DRAFT ||
                        job.status === ShortTermJobStatus.PUBLISHED) && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            navigate(`/short-term-jobs/${jobId}/edit`)
                          }
                        >
                          <FiEdit /> Chỉnh sửa
                        </Button>
                      )}
                    <Button variant="ghost" onClick={handleSaveJob}>
                      {isSaved ? (
                        <FiBookmark fill="currentColor" />
                      ) : (
                        <FiBookmark />
                      )}
                      {isSaved ? "Đã lưu" : "Lưu"}
                    </Button>
                    <Button variant="ghost">
                      <FiShare2 /> Chia sẻ
                    </Button>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        colorPalette="red"
                        onClick={onDeleteOpen}
                      >
                        <FiTrash2 /> Xóa
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Tabs */}
            <Tabs.Root defaultValue="details">
              <Tabs.List>
                <Tabs.Trigger value="details">Chi tiết</Tabs.Trigger>
                {isOwner && (
                  <Tabs.Trigger value="applicants">
                    Ứng viên{" "}
                    <Badge ml={2} colorPalette="blue">
                      {applications.length}
                    </Badge>
                  </Tabs.Trigger>
                )}
                {myApplication && (
                  <Tabs.Trigger value="my-application">
                    Đơn của tôi
                  </Tabs.Trigger>
                )}
              </Tabs.List>

              {/* Details Tab */}
              <Tabs.Content value="details">
                <VStack gap={6} align="stretch">
                  {/* Description */}
                  <Card.Root bg="white">
                    <Card.Header>
                      <Heading size="md">Mô tả công việc</Heading>
                    </Card.Header>
                    <Card.Body pt={0}>
                      <Text whiteSpace="pre-wrap">{job.description}</Text>
                    </Card.Body>
                  </Card.Root>

                  {/* Skills */}
                  <Card.Root bg="white">
                    <Card.Header>
                      <Heading size="md">Kỹ năng cần thiết</Heading>
                    </Card.Header>
                    <Card.Body pt={0}>
                      <Flex wrap="wrap" gap={2}>
                        {job.requiredSkills.map((skill, idx) => (
                          <Tag.Root
                            key={idx}
                            size="lg"
                            colorPalette="blue"
                            variant="subtle"
                          >
                            <Tag.Label>{skill}</Tag.Label>
                          </Tag.Root>
                        ))}
                      </Flex>
                    </Card.Body>
                  </Card.Root>

                  {/* Milestones */}
                  {job.milestones && job.milestones.length > 0 && (
                    <Card.Root bg="white">
                      <Card.Header>
                        <Heading size="md">Cột mốc thanh toán</Heading>
                      </Card.Header>
                      <Card.Body pt={0}>
                        <VStack align="stretch" gap={3}>
                          {job.milestones.map((milestone, idx) => (
                            <Box
                              key={idx}
                              p={4}
                              borderWidth="1px"
                              borderRadius="md"
                              borderLeftWidth="4px"
                              borderLeftColor="blue.500"
                            >
                              <Flex justify="space-between" mb={2}>
                                <Text fontWeight="bold">{milestone.title}</Text>
                                <Text color="green.600" fontWeight="bold">
                                  {formatBudget(milestone.amount)}
                                </Text>
                              </Flex>
                              <Text fontSize="sm" color="gray.600" mb={2}>
                                {milestone.description}
                              </Text>
                              <HStack fontSize="sm" color="gray.500">
                                <Icon>
                                  <FiClock />
                                </Icon>
                                <Text>
                                  Deadline: {formatDate(milestone.deadline)}
                                </Text>
                              </HStack>
                            </Box>
                          ))}
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  )}
                </VStack>
              </Tabs.Content>

              {/* Applications Tab (Owner only) */}
              {isOwner && (
                <Tabs.Content value="applicants">
                  <VStack gap={4} align="stretch">
                    {applications.length === 0 ? (
                      <Alert.Root status="info">
                        <Alert.Indicator />
                        <Alert.Content>Chưa có ứng viên nào</Alert.Content>
                      </Alert.Root>
                    ) : (
                      applications.map((app) => (
                        <Card.Root key={app.id} bg="white">
                          <Card.Body>
                            <Flex align="center" gap={4}>
                              <Avatar.Root size="md">
                                <Avatar.Fallback>
                                  {getInitials(app.userFullName)}
                                </Avatar.Fallback>
                              </Avatar.Root>
                              <VStack align="start" gap={0} flex="1">
                                <Text fontWeight="bold">
                                  {app.userFullName}
                                </Text>
                                <StatusBadge
                                  status={app.status}
                                  type="application"
                                  size="sm"
                                />
                              </VStack>
                              <Text fontSize="sm" color="gray.500">
                                {formatDate(app.appliedAt)}
                              </Text>
                            </Flex>

                            {app.coverLetter && (
                              <Box mt={4} p={3} bg="gray.50" borderRadius="md">
                                <Text fontSize="sm">{app.coverLetter}</Text>
                              </Box>
                            )}

                            {app.status ===
                              ShortTermApplicationStatus.PENDING && (
                              <HStack mt={4}>
                                <Button
                                  colorPalette="green"
                                  size="sm"
                                  onClick={() =>
                                    handleAcceptApplication(app.id)
                                  }
                                >
                                  <FiCheck /> Chấp nhận
                                </Button>
                                <Button
                                  colorPalette="red"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRejectApplication(app.id)
                                  }
                                >
                                  <FiX /> Từ chối
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <FiMessageSquare /> Nhắn tin
                                </Button>
                              </HStack>
                            )}
                          </Card.Body>
                        </Card.Root>
                      ))
                    )}
                  </VStack>
                </Tabs.Content>
              )}

              {/* My Application Tab */}
              {myApplication && (
                <Tabs.Content value="my-application">
                  <Card.Root bg="white">
                    <Card.Body>
                      <VStack align="stretch" gap={4}>
                        <Flex justify="space-between" align="center">
                          <Heading size="md">Đơn ứng tuyển của bạn</Heading>
                          <StatusBadge
                            status={myApplication.status}
                            type="application"
                            size="md"
                          />
                        </Flex>

                        <Separator />

                        <HStack>
                          <Icon color="gray.500">
                            <FiCalendar />
                          </Icon>
                          <Text>
                            Ngày ứng tuyển:{" "}
                            {formatDate(myApplication.appliedAt)}
                          </Text>
                        </HStack>

                        {myApplication.coverLetter && (
                          <Box>
                            <Text fontWeight="bold" mb={2}>
                              Thư xin việc:
                            </Text>
                            <Box p={4} bg="gray.50" borderRadius="md">
                              <Text whiteSpace="pre-wrap">
                                {myApplication.coverLetter}
                              </Text>
                            </Box>
                          </Box>
                        )}

                        {myApplication.status ===
                          ShortTermApplicationStatus.IN_PROGRESS && (
                          <Button
                            colorPalette="blue"
                            onClick={() =>
                              navigate(`/short-term-jobs/${jobId}/submit`)
                            }
                          >
                            Nộp sản phẩm
                          </Button>
                        )}

                        {myApplication.deliverables &&
                          myApplication.deliverables.length > 0 && (
                            <Box>
                              <Text fontWeight="bold" mb={3}>
                                Sản phẩm đã nộp:
                              </Text>
                              <DeliverableDisplay
                                deliverables={myApplication.deliverables}
                                columns={2}
                              />
                            </Box>
                          )}
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                </Tabs.Content>
              )}
            </Tabs.Root>
          </Box>

          {/* Sidebar */}
          <Box w={{ base: "100%", lg: "350px" }}>
            <VStack gap={4} position="sticky" top="6">
              {/* Job Summary */}
              <Card.Root bg="white" w="100%">
                <Card.Header>
                  <Heading size="md">Thông tin công việc</Heading>
                </Card.Header>
                <Card.Body pt={0}>
                  <VStack align="stretch" gap={4}>
                    <Flex justify="space-between">
                      <HStack color="gray.500">
                        <Icon>
                          <FiDollarSign />
                        </Icon>
                        <Text>Ngân sách</Text>
                      </HStack>
                      <Text fontWeight="bold" color="green.600" fontSize="lg">
                        {formatBudget(job.budget)}
                      </Text>
                    </Flex>

                    <Separator />

                    <Flex justify="space-between">
                      <HStack color="gray.500">
                        <Icon>
                          <FiClock />
                        </Icon>
                        <Text>Hạn ứng tuyển</Text>
                      </HStack>
                      <Text
                        fontWeight="bold"
                        color={isExpired ? "red.500" : "gray.700"}
                      >
                        {formatDate(job.deadline)}
                      </Text>
                    </Flex>

                    <Separator />

                    <Flex justify="space-between">
                      <HStack color="gray.500">
                        <Icon>
                          <FiMapPin />
                        </Icon>
                        <Text>Địa điểm</Text>
                      </HStack>
                      <Text fontWeight="bold">
                        {job.isRemote ? "Remote" : job.location}
                      </Text>
                    </Flex>

                    <Flex justify="space-between">
                      <HStack color="gray.500">
                        <Icon>
                          <FiClock />
                        </Icon>
                        <Text>Thời gian</Text>
                      </HStack>
                      <Text fontWeight="bold">{job.estimatedDuration}</Text>
                    </Flex>

                    <Flex justify="space-between">
                      <HStack color="gray.500">
                        <Icon>
                          <FiUsers />
                        </Icon>
                        <Text>Ứng viên</Text>
                      </HStack>
                      <Text fontWeight="bold">
                        {job.applicantCount}/{job.maxApplicants ?? "∞"}
                      </Text>
                    </Flex>

                    {job.publishedAt && (
                      <>
                        <Separator />
                        <Flex justify="space-between">
                          <HStack color="gray.500">
                            <Icon>
                              <FiCalendar />
                            </Icon>
                            <Text>Ngày đăng</Text>
                          </HStack>
                          <Text fontWeight="bold">
                            {formatDate(job.publishedAt)}
                          </Text>
                        </Flex>
                      </>
                    )}

                    {job.startTime && (
                      <>
                        <Separator />
                        <Flex justify="space-between">
                          <HStack color="gray.500">
                            <Icon>
                              <FiClock />
                            </Icon>
                            <Text>Bắt đầu</Text>
                          </HStack>
                          <Text fontWeight="bold">
                            {formatDate(job.startTime)}
                          </Text>
                        </Flex>
                      </>
                    )}

                    <Separator />
                    <Flex justify="space-between">
                      <HStack color="gray.500">
                        <Icon>
                          <FiCalendar />
                        </Icon>
                        <Text>Ngày tạo</Text>
                      </HStack>
                      <Text fontWeight="bold" fontSize="sm">
                        {formatDate(job.createdAt)}
                      </Text>
                    </Flex>
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Recruiter Card */}
              <Card.Root bg="white" w="100%">
                <Card.Header>
                  <Heading size="md">Về nhà tuyển dụng</Heading>
                </Card.Header>
                <Card.Body pt={0}>
                  <VStack align="stretch" gap={4}>
                    <HStack>
                      <Avatar.Root size="lg">
                        <Avatar.Fallback>
                          {getInitials(job.recruiterCompanyName)}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <VStack align="start" gap={0}>
                        <Text fontWeight="bold" fontSize="lg">
                          {job.recruiterCompanyName}
                        </Text>
                        {recruiterRating && recruiterRating.averageRating && (
                          <StarRating
                            rating={recruiterRating.averageRating}
                            size="sm"
                          />
                        )}
                      </VStack>
                    </HStack>

                    {recruiterRating && (
                      <SimpleGrid columns={2} gap={2}>
                        <Stat.Root size="sm">
                          <Stat.ValueText>
                            {recruiterRating.totalCompletedJobs}
                          </Stat.ValueText>
                          <Stat.Label>Công việc</Stat.Label>
                        </Stat.Root>
                        <Stat.Root size="sm">
                          <Stat.ValueText>
                            {recruiterRating.completionRate}%
                          </Stat.ValueText>
                          <Stat.Label>Hoàn thành</Stat.Label>
                        </Stat.Root>
                      </SimpleGrid>
                    )}

                    <Button variant="outline" w="100%">
                      <FiUser /> Xem hồ sơ
                    </Button>
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Reviews */}
              {reviews.length > 0 && (
                <Card.Root bg="white" w="100%">
                  <Card.Header>
                    <Heading size="md">Đánh giá gần đây</Heading>
                  </Card.Header>
                  <Card.Body pt={0}>
                    <VStack gap={3}>
                      {reviews.slice(0, 2).map((review) => (
                        <JobReviewDisplay key={review.id} review={review} />
                      ))}
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}
            </VStack>
          </Box>
        </Flex>
      </Container>

      {/* Apply Dialog */}
      <Dialog.Root
        open={applyOpen}
        onOpenChange={(e) => setApplyOpen(e.open)}
        size="lg"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>Ứng tuyển: {job.title}</Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body>
              <VStack gap={4}>
                <Alert.Root status="info">
                  <Alert.Indicator />
                  <Alert.Content>
                    Viết thư giới thiệu bản thân để tăng cơ hội được chọn
                  </Alert.Content>
                </Alert.Root>
                <Textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="Giới thiệu về kinh nghiệm, kỹ năng và lý do bạn phù hợp với công việc này..."
                  rows={6}
                />
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" mr={3} onClick={onApplyClose}>
                Hủy
              </Button>
              <Button
                colorPalette="blue"
                onClick={handleApply}
                loading={isApplying}
              >
                Gửi đơn ứng tuyển
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={deleteOpen}
        onOpenChange={(e) => setDeleteOpen(e.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>Xác nhận xóa</Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body>
              Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể
              hoàn tác.
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" mr={3} onClick={onDeleteClose}>
                Hủy
              </Button>
              <Button colorPalette="red" onClick={handleDelete}>
                Xóa
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default ShortTermJobDetailPage;
