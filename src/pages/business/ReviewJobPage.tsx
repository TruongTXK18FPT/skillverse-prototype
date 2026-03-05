import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  Breadcrumb,
  Card,
  HStack,
  Text,
  Alert,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import { FiArrowLeft, FiStar } from "react-icons/fi";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { JobReviewForm, StatusBadge } from "../../components/short-term-job";
import shortTermJobService from "../../services/shortTermJobService";
import jobReviewService from "../../services/jobReviewService";
import {
  ShortTermJobPosting,
  ShortTermJobApplication,
  ShortTermApplicationStatus,
  CreateJobReviewRequest,
} from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";

// Type alias for consistency
type ShortTermJob = ShortTermJobPosting;

// ==================== PAGE COMPONENT ====================

const ReviewJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");

  const [job, setJob] = useState<ShortTermJob | null>(null);
  const [application, setApplication] =
    useState<ShortTermJobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Determine if current user is recruiter or applicant
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [targetUser, setTargetUser] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);

  // ========== FETCH DATA ==========
  const fetchData = useCallback(async () => {
    if (!jobId) return;

    setIsLoading(true);
    try {
      const jobData = await shortTermJobService.getJobDetails(Number(jobId));
      setJob(jobData);

      // TODO: Get current user ID from auth context
      const currentUserId = 0;
      const isJobOwner = jobData.recruiterId === currentUserId;
      setIsRecruiter(isJobOwner);

      if (isJobOwner && applicationId) {
        // Recruiter reviewing applicant
        const response = await shortTermJobService.getJobApplicants(
          Number(jobId),
          0,
          100,
        );
        const app = response.content.find(
          (a: ShortTermJobApplication) => a.id === Number(applicationId),
        );

        if (!app) {
          showError("Lỗi", "Không tìm thấy đơn ứng tuyển");
          navigate(`/short-term-jobs/${jobId}`);
          return;
        }

        // Check if job is completed and paid
        if (
          app.status !== ShortTermApplicationStatus.PAID &&
          app.status !== ShortTermApplicationStatus.COMPLETED
        ) {
          showWarning(
            "Không thể đánh giá",
            "Chỉ có thể đánh giá sau khi công việc hoàn thành và thanh toán",
          );
          navigate(`/short-term-jobs/${jobId}`);
          return;
        }

        setApplication(app);
        setTargetUser({
          id: String(app.userId),
          name: app.userFullName,
        });

        // Check if already reviewed
        const canReview = await jobReviewService.canWriteReview(app.id);
        setHasReviewed(!canReview);
      } else {
        // Applicant reviewing recruiter
        const myApplications = await shortTermJobService.getMyApplications();
        const myApp = myApplications.find(
          (app: ShortTermJobApplication) => app.jobId === Number(jobId),
        );

        if (!myApp) {
          showError("Lỗi", "Bạn chưa ứng tuyển công việc này");
          navigate(`/short-term-jobs/${jobId}`);
          return;
        }

        // Check if job is completed and paid
        if (
          myApp.status !== ShortTermApplicationStatus.PAID &&
          myApp.status !== ShortTermApplicationStatus.COMPLETED
        ) {
          showWarning(
            "Không thể đánh giá",
            "Chỉ có thể đánh giá sau khi công việc hoàn thành và thanh toán",
          );
          navigate(`/short-term-jobs/${jobId}`);
          return;
        }

        setApplication(myApp);
        setTargetUser({
          id: String(jobData.recruiterId),
          name: jobData.recruiterCompanyName,
        });

        // Check if already reviewed
        const canReview = await jobReviewService.canWriteReview(myApp.id);
        setHasReviewed(!canReview);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showError("Lỗi", "Không thể tải thông tin");
      navigate("/short-term-jobs");
    } finally {
      setIsLoading(false);
    }
  }, [jobId, applicationId, navigate, showError, showWarning]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ========== HANDLERS ==========
  const handleSubmit = async (request: CreateJobReviewRequest) => {
    setIsSubmitting(true);
    try {
      await jobReviewService.createReview(request);

      showSuccess("Thành công", "Đánh giá đã được gửi. Cảm ơn bạn!");
      navigate(`/short-term-jobs/${jobId}`);
    } catch (error: unknown) {
      const errMsg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Không thể gửi đánh giá";
      showError("Lỗi", errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== RENDER ==========
  if (isLoading) {
    return (
      <Box bg="gray.50" minH="100vh" py={6}>
        <Container maxW="container.lg">
          <Flex justify="center" py={20}>
            <Spinner size="xl" />
          </Flex>
        </Container>
      </Box>
    );
  }

  if (!job || !application || !targetUser) {
    return (
      <Box bg="gray.50" minH="100vh" py={6}>
        <Container maxW="container.lg">
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>Không tìm thấy thông tin</Alert.Content>
          </Alert.Root>
        </Container>
      </Box>
    );
  }

  if (hasReviewed) {
    return (
      <Box bg="gray.50" minH="100vh" py={6}>
        <Container maxW="container.lg">
          <VStack gap={6}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/short-term-jobs/${jobId}`)}
              alignSelf="flex-start"
            >
              <FiArrowLeft /> Quay lại
            </Button>

            <Alert.Root status="info">
              <Alert.Indicator />
              <Alert.Content>
                <Box>
                  <Text fontWeight="bold">Bạn đã đánh giá</Text>
                  <Text fontSize="sm">
                    Bạn đã đánh giá{" "}
                    {isRecruiter ? "freelancer" : "nhà tuyển dụng"} này cho công
                    việc &quot;{job.title}&quot;.
                  </Text>
                </Box>
              </Alert.Content>
            </Alert.Root>

            <Button
              colorPalette="blue"
              onClick={() => navigate(`/short-term-jobs/${jobId}`)}
            >
              Quay lại công việc
            </Button>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" py={6}>
      <Container maxW="container.lg">
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
              <Breadcrumb.Link
                onClick={() => navigate(`/short-term-jobs/${jobId}`)}
              >
                {job.title}
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.CurrentLink>Đánh giá</Breadcrumb.CurrentLink>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>

        {/* Header */}
        <VStack align="start" gap={2} mb={6}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/short-term-jobs/${jobId}`)}
          >
            <FiArrowLeft /> Quay lại
          </Button>
          <Heading size="lg">
            <HStack>
              <FiStar />
              <Text>
                Đánh giá {isRecruiter ? "Freelancer" : "Nhà tuyển dụng"}
              </Text>
            </HStack>
          </Heading>
        </VStack>

        {/* Job Summary */}
        <Card.Root bg="white" mb={6}>
          <Card.Body>
            <VStack align="stretch" gap={3}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" color="gray.500">
                    Công việc
                  </Text>
                  <Text fontWeight="bold" fontSize="lg">
                    {job.title}
                  </Text>
                </VStack>
                <StatusBadge status={application.status} type="application" />
              </Flex>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Info */}
        <Alert.Root status="info" mb={6}>
          <Alert.Indicator />
          <Alert.Content>
            <Box>
              <Text fontWeight="bold">Lưu ý về đánh giá</Text>
              <Text fontSize="sm">
                Đánh giá của bạn sẽ được công khai và giúp cộng đồng hiểu rõ hơn
                về {isRecruiter ? "freelancer" : "nhà tuyển dụng"} này. Hãy đánh
                giá một cách trung thực và xây dựng.
              </Text>
            </Box>
          </Alert.Content>
        </Alert.Root>

        {/* Review Form */}
        <JobReviewForm
          targetUserId={targetUser.id}
          targetUserName={targetUser.name}
          targetUserAvatar={targetUser.avatar}
          jobId={jobId!}
          jobTitle={job.title}
          isRecruiterReview={isRecruiter}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/short-term-jobs/${jobId}`)}
          isLoading={isSubmitting}
        />
      </Container>
    </Box>
  );
};

export default ReviewJobPage;
