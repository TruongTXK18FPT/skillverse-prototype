import React from "react";
import { Route, Routes } from "react-router-dom";
import {
  ShortTermJobListPage,
  ShortTermJobDetailPage,
  CreateShortTermJobPage,
  SubmitDeliverablePage,
  ReviewJobPage,
} from "../pages/business";

// ==================== SHORT-TERM JOB ROUTES ====================

/**
 * Routes cho module Short-term Job
 *
 * /short-term-jobs - Danh sách công việc ngắn hạn
 * /short-term-jobs/create - Tạo công việc mới
 * /short-term-jobs/:jobId - Chi tiết công việc
 * /short-term-jobs/:jobId/edit - Chỉnh sửa công việc
 * /short-term-jobs/:jobId/apply - Ứng tuyển công việc
 * /short-term-jobs/:jobId/submit - Nộp sản phẩm
 * /short-term-jobs/:jobId/review - Đánh giá
 */

const ShortTermJobRoutes: React.FC = () => {
  return (
    <Routes>
      {/* List Page */}
      <Route index element={<ShortTermJobListPage />} />

      {/* Create Page */}
      <Route path="create" element={<CreateShortTermJobPage />} />

      {/* Detail Page */}
      <Route path=":jobId" element={<ShortTermJobDetailPage />} />

      {/* Edit Page (reuses Create component) */}
      <Route path=":jobId/edit" element={<CreateShortTermJobPage />} />

      {/* Submit Deliverable Page */}
      <Route path=":jobId/submit" element={<SubmitDeliverablePage />} />

      {/* Review Page */}
      <Route path=":jobId/review" element={<ReviewJobPage />} />
    </Routes>
  );
};

export default ShortTermJobRoutes;
