import React, { useEffect, useState } from "react";
import { FiArrowLeft, FiChevronRight, FiInfo, FiZap } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { ShortTermJobForm } from "../../components/short-term-job";
import shortTermJobService from "../../services/shortTermJobService";
import {
  CreateShortTermJobRequest,
  ShortTermJobResponse,
  ShortTermJobStatus,
} from "../../types/ShortTermJob";
import { useToast } from "../../hooks/useToast";
import "../../components/business-hud/recruiter-hub.css";

const CreateShortTermJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { jobId } = useParams<{ jobId: string }>();

  const [isLoading, setIsLoading] = useState(false);
  const [existingJob, setExistingJob] = useState<ShortTermJobResponse | null>(
    null,
  );
  const [isFetching, setIsFetching] = useState(!!jobId);

  const isEditMode = !!jobId;
  const editableJob =
    existingJob as (ShortTermJobResponse & Partial<CreateShortTermJobRequest>) |
      null;

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        return;
      }

      setIsFetching(true);
      try {
        const job = await shortTermJobService.getJobDetails(Number(jobId));

        if (
          job.status !== ShortTermJobStatus.DRAFT &&
          job.status !== ShortTermJobStatus.PUBLISHED
        ) {
          showError(
            "Không thể chỉnh sửa",
            "Chỉ có thể chỉnh sửa công việc ở trạng thái Nháp hoặc Đã đăng.",
          );
          navigate(`/short-term-jobs/${jobId}`);
          return;
        }

        setExistingJob(job);
      } catch (error) {
        console.error("Failed to fetch job:", error);
        showError("Lỗi", "Không thể tải thông tin công việc.");
        navigate("/short-term-jobs");
      } finally {
        setIsFetching(false);
      }
    };

    void fetchJob();
  }, [jobId, navigate, showError]);

  const handleSubmit = async (
    data: CreateShortTermJobRequest,
    publish: boolean,
  ) => {
    setIsLoading(true);
    try {
      let savedJob: ShortTermJobResponse;

      if (isEditMode && jobId) {
        savedJob = await shortTermJobService.updateJob(Number(jobId), data);

        if (publish && savedJob.status === ShortTermJobStatus.DRAFT) {
          savedJob = await shortTermJobService.publishJob(Number(jobId));
        }

        showSuccess(
          "Thành công",
          publish
            ? "Công việc đã được cập nhật và đăng."
            : "Công việc đã được cập nhật.",
        );
      } else {
        savedJob = await shortTermJobService.createJob(data);

        if (publish) {
          savedJob = await shortTermJobService.publishJob(savedJob.id);
        }

        showSuccess(
          "Thành công",
          publish ? "Công việc đã được đăng." : "Công việc đã được lưu nháp.",
        );
      }

      navigate(`/short-term-jobs/${savedJob.id}`);
    } catch (error: unknown) {
      console.error("Failed to save job:", error);
      const errMsg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Không thể lưu công việc.";
      showError("Lỗi", errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode && jobId) {
      navigate(`/short-term-jobs/${jobId}`);
      return;
    }

    navigate("/short-term-jobs");
  };

  if (isFetching) {
    return (
      <div className="stj-create-shell">
        <div className="rh-loading">
          <div className="rh-spinner" />
          <span>Đang tải thông tin công việc...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="stj-create-shell">
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div
          className="stj-create-breadcrumb"
          style={{ marginBottom: "1.25rem" }}
        >
          <button onClick={() => navigate("/short-term-jobs")}>
            Công việc ngắn hạn
          </button>
          <span>
            <FiChevronRight />
          </span>
          <span style={{ color: "#e2e8f0" }}>
            {isEditMode ? "Chỉnh sửa" : "Tạo mới"}
          </span>
        </div>

        <div className="stj-create-hero">
          <div className="stj-create-hero__icon">
            <FiZap size={26} />
          </div>
          <div className="stj-create-hero__text">
            <h1>
              {isEditMode
                ? "Chỉnh sửa công việc ngắn hạn"
                : "Đăng công việc ngắn hạn mới"}
            </h1>
            <p>
              {isEditMode
                ? "Cập nhật thông tin, yêu cầu và cách phối hợp cho công việc của bạn."
                : "Tạo một tin đăng ngắn gọn, đủ ý và dễ nhận việc cho ứng viên phù hợp."}
            </p>
          </div>
          <button
            className="stj-create-back-btn"
            onClick={handleCancel}
            style={{ marginLeft: "auto" }}
          >
            <FiArrowLeft size={15} /> Quay lại
          </button>
        </div>

        <div className="stj-create-info-box">
          <FiInfo size={16} />
          <div>
            <strong style={{ color: "#e2e8f0" }}>Lưu ý: </strong>
            Bạn có thể lưu nháp trước, sau đó quay lại chỉnh sửa và xuất bản khi
            nội dung đã hoàn chỉnh. Tin đăng sau khi xuất bản sẽ bắt đầu hiển
            thị cho ứng viên.
          </div>
        </div>

        <ShortTermJobForm
          initialData={
            editableJob
              ? {
                  title: editableJob.title,
                  description: editableJob.description,
                  budget: editableJob.budget,
                  deadline: editableJob.deadline,
                  requiredSkills: editableJob.requiredSkills,
                  urgency: editableJob.urgency,
                  isRemote: editableJob.isRemote,
                  location: editableJob.location,
                  estimatedDuration: editableJob.estimatedDuration,
                  maxApplicants: editableJob.maxApplicants,
                  paymentMethod: editableJob.paymentMethod,
                  isNegotiable: editableJob.isNegotiable,
                  requirements: editableJob.requirements,
                  workDeadline: editableJob.workDeadline,
                  subCategory: editableJob.subCategory,
                  allowsRevision: editableJob.allowsRevision,
                  maxRevisions: editableJob.maxRevisions,
                  tags: editableJob.tags,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          mode={isEditMode ? "edit" : "create"}
        />
      </div>
    </div>
  );
};

export default CreateShortTermJobPage;
