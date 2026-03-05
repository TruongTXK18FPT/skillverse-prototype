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
  Separator,
  Icon,
} from "@chakra-ui/react";
import { FiArrowLeft, FiAlertTriangle } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import {
  DeliverableUpload,
  StatusBadge,
} from "../../components/short-term-job";
import shortTermJobService from "../../services/shortTermJobService";
import {
  ShortTermJobPosting,
  ShortTermJobApplication,
  ShortTermApplicationStatus,
  SubmitDeliverableRequest,
} from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";

// Type alias for consistency
type ShortTermJob = ShortTermJobPosting;

// ==================== PAGE COMPONENT ====================

const SubmitDeliverablePage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  const { jobId } = useParams<{ jobId: string }>();

  const [job, setJob] = useState<ShortTermJob | null>(null);
  const [application, setApplication] =
    useState<ShortTermJobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ========== FETCH DATA ==========
  const fetchData = useCallback(async () => {
    if (!jobId) return;

    setIsLoading(true);
    try {
      // Fetch job details
      const jobData = await shortTermJobService.getJobDetails(Number(jobId));
      setJob(jobData);

      // Fetch user's application
      const myApplications = await shortTermJobService.getMyApplications();
      const myApp = myApplications.find(
        (app: ShortTermJobApplication) => app.jobId === Number(jobId),
      );

      if (!myApp) {
        showError("Lỗi", "Bạn chưa ứng tuyển công việc này");
        navigate(`/short-term-jobs/${jobId}`);
        return;
      }

      // Check if application is in progress (WORKING is the actual status)
      if (
        myApp.status !== ShortTermApplicationStatus.WORKING &&
        myApp.status !== ShortTermApplicationStatus.IN_PROGRESS
      ) {
        showWarning(
          "Không thể nộp sản phẩm",
          "Chỉ có thể nộp sản phẩm khi đang thực hiện công việc",
        );
        navigate(`/short-term-jobs/${jobId}`);
        return;
      }

      setApplication(myApp);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showError("Lỗi", "Không thể tải thông tin");
      navigate("/short-term-jobs");
    } finally {
      setIsLoading(false);
    }
  }, [jobId, navigate, showError, showWarning]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ========== HANDLERS ==========
  const handleSubmit = async (request: SubmitDeliverableRequest) => {
    if (!application) return;

    setIsSubmitting(true);
    try {
      await shortTermJobService.submitDeliverables({
        ...request,
        applicationId: application.id,
      });

      showSuccess(
        "Thành công",
        request.isFinalSubmission
          ? "Sản phẩm cuối cùng đã được nộp"
          : "Sản phẩm đã được lưu",
      );

      if (request.isFinalSubmission) {
        navigate(`/short-term-jobs/${jobId}`);
      } else {
        fetchData(); // Refresh data
      }
    } catch (error: unknown) {
      const errMsg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Không thể nộp sản phẩm";
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

  if (!job || !application) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isDeadlineSoon = () => {
    const deadline = new Date(job.deadline);
    const now = new Date();
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours < 24 && diffHours > 0;
  };

  const isOverdue = new Date(job.deadline) < new Date();

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
              <Breadcrumb.CurrentLink>Nộp sản phẩm</Breadcrumb.CurrentLink>
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
          <Heading size="lg">Nộp sản phẩm</Heading>
        </VStack>

        {/* Job Info Card */}
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

              <Separator />

              <HStack justify="space-between" flexWrap="wrap">
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" color="gray.500">
                    Deadline
                  </Text>
                  <Text
                    fontWeight="bold"
                    color={
                      isOverdue
                        ? "red.500"
                        : isDeadlineSoon()
                          ? "orange.500"
                          : "gray.700"
                    }
                  >
                    {formatDate(job.deadline)}
                  </Text>
                </VStack>

                <VStack align="start" gap={0}>
                  <Text fontSize="sm" color="gray.500">
                    Số lần chỉnh sửa còn lại
                  </Text>
                  <Text fontWeight="bold">
                    {3 - (application.revisionCount || 0)} / 3
                  </Text>
                </VStack>

                <VStack align="start" gap={0}>
                  <Text fontSize="sm" color="gray.500">
                    Lần nộp
                  </Text>
                  <Text fontWeight="bold">
                    {application.submissionCount || 0}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Deadline Warning */}
        {isDeadlineSoon() && (
          <Alert.Root status="warning" mb={6}>
            <Alert.Indicator>
              <Icon>
                <FiAlertTriangle />
              </Icon>
            </Alert.Indicator>
            <Alert.Content>
              <Box>
                <Text fontWeight="bold">Deadline sắp đến!</Text>
                <Text fontSize="sm">
                  Còn ít hơn 24 giờ để hoàn thành công việc. Hãy nộp sản phẩm
                  sớm nhất có thể.
                </Text>
              </Box>
            </Alert.Content>
          </Alert.Root>
        )}

        {isOverdue && (
          <Alert.Root status="error" mb={6}>
            <Alert.Indicator />
            <Alert.Content>
              <Box>
                <Text fontWeight="bold">Đã quá deadline!</Text>
                <Text fontSize="sm">
                  Bạn vẫn có thể nộp sản phẩm nhưng có thể bị ảnh hưởng đến đánh
                  giá.
                </Text>
              </Box>
            </Alert.Content>
          </Alert.Root>
        )}

        {/* Previous Deliverables */}
        {application.deliverables && application.deliverables.length > 0 && (
          <Card.Root bg="white" mb={6}>
            <Card.Header>
              <Heading size="md">Sản phẩm đã nộp trước đó</Heading>
            </Card.Header>
            <Card.Body pt={0}>
              <Alert.Root status="info" mb={4}>
                <Alert.Indicator />
                <Alert.Content>
                  <Text fontSize="sm">
                    Bạn đã nộp {application.deliverables.length} sản phẩm. Nộp
                    mới sẽ thay thế các sản phẩm cũ.
                  </Text>
                </Alert.Content>
              </Alert.Root>
              {/* Display existing deliverables if needed */}
            </Card.Body>
          </Card.Root>
        )}

        {/* Upload Form */}
        <DeliverableUpload
          applicationId={application.id}
          existingDeliverables={application.deliverables}
          maxFiles={10}
          maxFileSize={50}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          isFinalSubmission={true}
        />
      </Container>
    </Box>
  );
};

export default SubmitDeliverablePage;
