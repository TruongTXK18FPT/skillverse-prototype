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
  FiEye,
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
import recruitmentChatService from "../../services/recruitmentChatService";
import { RecruitmentJobContextType, RecruitmentSessionResponse } from "../../data/portfolioDTOs";
import RecruiterChatWindow from "../../components/chat/RecruiterChatWindow";
import MarkdownRenderer from "../../components/learning-report/MarkdownRenderer";
import {
  getApplicantDisplayName,
  getApplicantInitials,
  getApplicantSubtitle,
  getPortfolioPath,
  resolveRecruitmentAssetUrl,
} from "../../utils/recruitmentUi";

// ==================== HELPERS ====================

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

type ApplicantDecisionModalState = {
  application: ShortTermJobApplication;
  status:
    | ShortTermApplicationStatus.ACCEPTED
    | ShortTermApplicationStatus.REJECTED;
};

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
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [decisionModal, setDecisionModal] =
    useState<ApplicantDecisionModalState | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [selectedSession, setSelectedSession] =
    useState<RecruitmentSessionResponse | null>(null);
  const [chatApplicant, setChatApplicant] =
    useState<ShortTermJobApplication | null>(null);

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

  const handleOpenPortfolio = (application: ShortTermJobApplication) => {
    const portfolioPath = getPortfolioPath(application.portfolioSlug);
    if (!portfolioPath) {
      showInfo(
        "Chưa có portfolio",
        "Ứng viên này chưa công khai portfolio trên SkillVerse.",
      );
      return;
    }

    window.open(portfolioPath, "_blank", "noopener,noreferrer");
  };

  const handleOpenChat = async (application: ShortTermJobApplication) => {
    if (!jobId) return;

    try {
      setIsActionBusy(true);
      const session = await recruitmentChatService.getOrCreateSession(
        application.userId,
        Number(jobId),
        "MANUAL",
        RecruitmentJobContextType.SHORT_TERM_JOB,
      );
      setChatApplicant(application);
      setSelectedSession(session);
      showSuccess(
        "Đã mở chat",
        "Cuộc trò chuyện đã được gắn đúng ngữ cảnh công việc hiện tại.",
      );
    } catch (error: unknown) {
      const errMsg =
        (error as { message?: string })?.message ||
        "Không thể mở cuộc trò chuyện với ứng viên";
      showError("Lỗi", errMsg);
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleOpenDecision = (
    application: ShortTermJobApplication,
    status:
      | ShortTermApplicationStatus.ACCEPTED
      | ShortTermApplicationStatus.REJECTED,
  ) => {
    const applicantName = getApplicantDisplayName(
      application.userFullName,
      application.userEmail,
    );
    const noteTemplate =
      status === ShortTermApplicationStatus.ACCEPTED
        ? `Chào ${applicantName}, hồ sơ của bạn phù hợp với công việc "${job?.title}". Mời bạn vào chat theo job để thống nhất phạm vi công việc, timeline và cách phối hợp.`
        : `Chào ${applicantName}, cảm ơn bạn đã ứng tuyển vào "${job?.title}". Hiện tại chúng tôi ưu tiên hồ sơ phù hợp hơn với yêu cầu chuyên môn và tiến độ của công việc này.`;

    setDecisionModal({ application, status });
    setDecisionNote(noteTemplate);
  };

  const refreshOwnerSnapshot = useCallback(async () => {
    if (!jobId) return;

    const jobData = await shortTermJobService.getJobDetails(Number(jobId));
    setJob(jobData);

    const currentUserId = user?.id ?? 0;
    const ownerView = jobData.recruiterId === currentUserId;
    setIsOwner(ownerView);

    if (ownerView) {
      const response = await shortTermJobService.getJobApplicants(
        Number(jobId),
        0,
        50,
      );
      setApplications(response.content);
    }
  }, [jobId, user]);

  const handleDecisionSubmit = async () => {
    if (!decisionModal) return;

    const note = decisionNote.trim();
    if (!note || note.length < 12) {
      showError(
        "Thiếu nội dung",
        "Vui lòng nhập ghi chú hoặc lý do đầy đủ để ứng viên nhận được phản hồi rõ ràng.",
      );
      return;
    }

    try {
      setIsActionBusy(true);
      const request: UpdateShortTermApplicationStatusRequest = {
        status: decisionModal.status,
        message:
          decisionModal.status === ShortTermApplicationStatus.ACCEPTED
            ? note
            : undefined,
        reason: note,
      };

      await shortTermJobService.updateApplicationStatus(
        decisionModal.application.id,
        request,
      );
      await refreshOwnerSnapshot();
      showSuccess(
        decisionModal.status === ShortTermApplicationStatus.ACCEPTED
          ? "Đã duyệt ứng viên"
          : "Đã từ chối ứng viên",
        `${getApplicantDisplayName(
          decisionModal.application.userFullName,
          decisionModal.application.userEmail,
        )} đã được cập nhật trạng thái.`,
      );
      setDecisionModal(null);
      setDecisionNote("");
    } catch (error: unknown) {
      const errMsg =
        (error as { message?: string })?.message ||
        "Không thể cập nhật trạng thái ứng tuyển";
      showError("Lỗi", errMsg);
    } finally {
      setIsActionBusy(false);
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
  const pendingApplicants = applications.filter(
    (application) => application.status === ShortTermApplicationStatus.PENDING,
  ).length;
  const shortlistedApplicants = applications.filter((application) =>
    [
      ShortTermApplicationStatus.ACCEPTED,
      ShortTermApplicationStatus.WORKING,
      ShortTermApplicationStatus.IN_PROGRESS,
      ShortTermApplicationStatus.SUBMITTED,
      ShortTermApplicationStatus.APPROVED,
      ShortTermApplicationStatus.COMPLETED,
      ShortTermApplicationStatus.PAID,
    ].includes(application.status),
  ).length;
  const portfolioApplicants = applications.filter((application) =>
    Boolean(application.portfolioSlug),
  ).length;
  const currentUserName = user?.fullName || user?.email || "Recruiter";

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
                      <MarkdownRenderer content={job.description || ""} />
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
                <>
                  <Tabs.Content value="applicants">
                    <VStack gap={4} align="stretch">
                      <Card.Root
                        bg="white"
                        borderWidth="1px"
                        borderColor="blue.100"
                        shadow="sm"
                      >
                        <Card.Body>
                          <Flex
                            gap={4}
                            justify="space-between"
                            direction={{ base: "column", lg: "row" }}
                            align={{ base: "stretch", lg: "center" }}
                          >
                            <VStack align="start" gap={1}>
                              <Heading size="md">
                                Bảng điều phối ứng viên
                              </Heading>
                              <Text color="gray.600" maxW="2xl">
                                Xem nhanh hồ sơ phù hợp, mở portfolio, phản hồi
                                có lý do rõ ràng và chat đúng ngữ cảnh công việc
                                ngay trên trang chi tiết.
                              </Text>
                            </VStack>

                            <SimpleGrid
                              columns={{ base: 1, sm: 3 }}
                              gap={3}
                              minW={{ base: "100%", lg: "380px" }}
                            >
                              <Box
                                p={4}
                                borderRadius="xl"
                                bg="blue.50"
                                borderWidth="1px"
                                borderColor="blue.100"
                              >
                                <Text fontSize="sm" color="blue.700">
                                  Tổng ứng viên
                                </Text>
                                <Heading size="lg" color="blue.900">
                                  {applications.length}
                                </Heading>
                              </Box>
                              <Box
                                p={4}
                                borderRadius="xl"
                                bg="orange.50"
                                borderWidth="1px"
                                borderColor="orange.100"
                              >
                                <Text fontSize="sm" color="orange.700">
                                  Chờ duyệt
                                </Text>
                                <Heading size="lg" color="orange.900">
                                  {pendingApplicants}
                                </Heading>
                              </Box>
                              <Box
                                p={4}
                                borderRadius="xl"
                                bg="purple.50"
                                borderWidth="1px"
                                borderColor="purple.100"
                              >
                                <Text fontSize="sm" color="purple.700">
                                  Có portfolio
                                </Text>
                                <Heading size="lg" color="purple.900">
                                  {portfolioApplicants}
                                </Heading>
                              </Box>
                            </SimpleGrid>
                          </Flex>

                          {shortlistedApplicants > 0 && (
                            <Alert.Root
                              status="success"
                              mt={4}
                              borderRadius="xl"
                            >
                              <Alert.Indicator />
                              <Alert.Content>
                                Đã có {shortlistedApplicants} ứng viên được đưa
                                vào giai đoạn tiếp theo của công việc này.
                              </Alert.Content>
                            </Alert.Root>
                          )}
                        </Card.Body>
                      </Card.Root>

                      {job.status === ShortTermJobStatus.PENDING_APPROVAL ? (
                        <Alert.Root status="info" borderRadius="xl">
                          <Alert.Indicator />
                          <Alert.Content>
                            Công việc đang chờ duyệt. Sau khi được duyệt, danh
                            sách ứng viên sẽ hiển thị đầy đủ tại đây.
                          </Alert.Content>
                        </Alert.Root>
                      ) : applications.length === 0 ? (
                        <Alert.Root status="info" borderRadius="xl">
                          <Alert.Indicator />
                          <Alert.Content>
                            Chưa có ứng viên nào cho công việc này.
                          </Alert.Content>
                        </Alert.Root>
                      ) : (
                        applications.map((app) => {
                          const displayName = getApplicantDisplayName(
                            app.userFullName,
                            app.userEmail,
                          );
                          const subtitle = getApplicantSubtitle(
                            app.userProfessionalTitle,
                            Boolean(app.portfolioSlug),
                          );
                          const avatarUrl = resolveRecruitmentAssetUrl(
                            app.userAvatar,
                          );

                          return (
                            <Card.Root
                              key={app.id}
                              bg="white"
                              borderWidth="1px"
                              borderColor={
                                app.status ===
                                ShortTermApplicationStatus.PENDING
                                  ? "orange.100"
                                  : "gray.200"
                              }
                              shadow="sm"
                              overflow="hidden"
                            >
                              <Card.Body>
                                <VStack align="stretch" gap={4}>
                                  <Flex
                                    justify="space-between"
                                    gap={4}
                                    direction={{ base: "column", lg: "row" }}
                                    align={{ base: "stretch", lg: "center" }}
                                  >
                                    <HStack align="start" gap={4}>
                                      <Avatar.Root
                                        size="lg"
                                        bg="blue.50"
                                        color="blue.700"
                                      >
                                        {avatarUrl ? (
                                          <Avatar.Image
                                            src={avatarUrl}
                                            alt={displayName}
                                          />
                                        ) : (
                                          <Avatar.Fallback name={displayName}>
                                            {getApplicantInitials(
                                              app.userFullName,
                                              app.userEmail,
                                            )}
                                          </Avatar.Fallback>
                                        )}
                                      </Avatar.Root>
                                      <VStack align="start" gap={1}>
                                        <Flex
                                          wrap="wrap"
                                          gap={2}
                                          align="center"
                                        >
                                          <Heading size="sm">
                                            {displayName}
                                          </Heading>
                                          <StatusBadge
                                            status={app.status}
                                            type="application"
                                            size="sm"
                                          />
                                          {app.portfolioSlug && (
                                            <Badge
                                              colorPalette="purple"
                                              variant="subtle"
                                            >
                                              Portfolio
                                            </Badge>
                                          )}
                                        </Flex>
                                        <Text fontSize="sm" color="gray.600">
                                          {subtitle}
                                        </Text>
                                        <Flex wrap="wrap" gap={2}>
                                          <Tag.Root
                                            size="sm"
                                            colorPalette="gray"
                                            variant="subtle"
                                          >
                                            <Tag.Label>
                                              Ứng tuyển{" "}
                                              {formatDate(app.appliedAt)}
                                            </Tag.Label>
                                          </Tag.Root>
                                          {app.proposedDuration && (
                                            <Tag.Root
                                              size="sm"
                                              colorPalette="blue"
                                              variant="subtle"
                                            >
                                              <Tag.Label>
                                                Thời lượng{" "}
                                                {app.proposedDuration}
                                              </Tag.Label>
                                            </Tag.Root>
                                          )}
                                        </Flex>
                                      </VStack>
                                    </HStack>

                                    <Flex wrap="wrap" gap={2}>
                                      {typeof app.userCompletedJobs ===
                                        "number" && (
                                        <Badge
                                          colorPalette="blue"
                                          variant="subtle"
                                          px={3}
                                          py={2}
                                        >
                                          {app.userCompletedJobs} job hoàn thành
                                        </Badge>
                                      )}
                                      {typeof app.userRating === "number" && (
                                        <Badge
                                          colorPalette="yellow"
                                          variant="subtle"
                                          px={3}
                                          py={2}
                                        >
                                          ⭐ {app.userRating.toFixed(1)}
                                        </Badge>
                                      )}
                                      {app.proposedPrice && (
                                        <Badge
                                          colorPalette="green"
                                          variant="subtle"
                                          px={3}
                                          py={2}
                                        >
                                          {formatBudget(app.proposedPrice)}
                                        </Badge>
                                      )}
                                    </Flex>
                                  </Flex>

                                  {app.coverLetter && (
                                    <Box
                                      p={4}
                                      bg="gray.50"
                                      borderRadius="xl"
                                      borderWidth="1px"
                                      borderColor="gray.100"
                                    >
                                      <Text
                                        fontSize="xs"
                                        textTransform="uppercase"
                                        letterSpacing="0.08em"
                                        color="gray.500"
                                        mb={2}
                                        fontWeight="semibold"
                                      >
                                        Lời nhắn ứng tuyển
                                      </Text>
                                      <Text
                                        fontSize="sm"
                                        color="gray.700"
                                        whiteSpace="pre-wrap"
                                      >
                                        {app.coverLetter}
                                      </Text>
                                    </Box>
                                  )}

                                  <Flex wrap="wrap" gap={3}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenPortfolio(app)}
                                    >
                                      <FiEye /> Xem portfolio
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenChat(app)}
                                      disabled={isActionBusy}
                                    >
                                      <FiMessageSquare /> Chat theo job
                                    </Button>
                                    {(app.status ===
                                      ShortTermApplicationStatus.PENDING ||
                                      app.status ===
                                        ShortTermApplicationStatus.REJECTED) && (
                                      <Button
                                        colorPalette="green"
                                        size="sm"
                                        onClick={() =>
                                          handleOpenDecision(
                                            app,
                                            ShortTermApplicationStatus.ACCEPTED,
                                          )
                                        }
                                        disabled={isActionBusy}
                                      >
                                        <FiCheck /> Duyệt ứng viên
                                      </Button>
                                    )}
                                    {(app.status ===
                                      ShortTermApplicationStatus.PENDING ||
                                      app.status ===
                                        ShortTermApplicationStatus.ACCEPTED) && (
                                      <Button
                                        colorPalette="red"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleOpenDecision(
                                            app,
                                            ShortTermApplicationStatus.REJECTED,
                                          )
                                        }
                                        disabled={isActionBusy}
                                      >
                                        <FiX /> Từ chối có lý do
                                      </Button>
                                    )}
                                  </Flex>
                                </VStack>
                              </Card.Body>
                            </Card.Root>
                          );
                        })
                      )}
                    </VStack>
                  </Tabs.Content>
                </>
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

      <Dialog.Root
        open={Boolean(decisionModal)}
        onOpenChange={(event) => {
          if (!event.open) {
            setDecisionModal(null);
            setDecisionNote("");
          }
        }}
        size="lg"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              {decisionModal?.status === ShortTermApplicationStatus.ACCEPTED
                ? "Duyệt ứng viên"
                : "Từ chối ứng viên"}
            </Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                <Alert.Root
                  status={
                    decisionModal?.status ===
                    ShortTermApplicationStatus.ACCEPTED
                      ? "success"
                      : "warning"
                  }
                  borderRadius="xl"
                >
                  <Alert.Indicator />
                  <Alert.Content>
                    {decisionModal ? (
                      <>
                        {decisionModal.status ===
                        ShortTermApplicationStatus.ACCEPTED
                          ? `Chia sẻ lời mời hợp tác rõ ràng cho ${getApplicantDisplayName(
                              decisionModal.application.userFullName,
                              decisionModal.application.userEmail,
                            )}.`
                          : `Nêu lý do cụ thể để ${getApplicantDisplayName(
                              decisionModal.application.userFullName,
                              decisionModal.application.userEmail,
                            )} nhận được phản hồi minh bạch.`}
                      </>
                    ) : null}
                  </Alert.Content>
                </Alert.Root>
                <Textarea
                  value={decisionNote}
                  onChange={(event) => setDecisionNote(event.target.value)}
                  placeholder={
                    decisionModal?.status ===
                    ShortTermApplicationStatus.ACCEPTED
                      ? "Mô tả lý do chọn ứng viên, bước tiếp theo, timeline và cách phối hợp."
                      : "Mô tả lý do từ chối rõ ràng, lịch sự và đủ cụ thể."
                  }
                  rows={7}
                />
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="ghost"
                onClick={() => {
                  setDecisionModal(null);
                  setDecisionNote("");
                }}
              >
                Hủy
              </Button>
              <Button
                colorPalette={
                  decisionModal?.status === ShortTermApplicationStatus.ACCEPTED
                    ? "green"
                    : "red"
                }
                onClick={handleDecisionSubmit}
                loading={isActionBusy}
              >
                {decisionModal?.status === ShortTermApplicationStatus.ACCEPTED
                  ? "Xác nhận duyệt"
                  : "Xác nhận từ chối"}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <Dialog.Root
        open={Boolean(selectedSession)}
        onOpenChange={(event) => {
          if (!event.open) {
            setSelectedSession(null);
            setChatApplicant(null);
          }
        }}
        size="cover"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="1120px"
            w="calc(100vw - 32px)"
            h={{ base: "80vh", xl: "84vh" }}
            p={0}
            overflow="hidden"
          >
            {selectedSession && (
              <RecruiterChatWindow
                session={selectedSession}
                currentUserId={user?.id || 0}
                currentUserName={currentUserName}
                onBack={() => {
                  setSelectedSession(null);
                  setChatApplicant(null);
                }}
                onViewProfile={() => {
                  if (chatApplicant) {
                    handleOpenPortfolio(chatApplicant);
                  }
                }}
              />
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

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
