export type AutoUpgradeOutcome = 'UPGRADED' | 'SKIPPED' | 'ERROR';

const REASON_CODE_MESSAGE_MAP: Record<string, string> = {
  NONE: 'Không có vấn đề tương thích.',
  INVALID_INPUT: 'Thiếu dữ liệu cần thiết để nâng cấp revision.',
  POLICY_NOT_AUTO_COMPATIBLE_ONLY: 'Khóa học đang ở chế độ nâng cấp thủ công.',
  NO_REVISION_CHANGE: 'Revision hiện tại đã là revision mới nhất.',
  SOURCE_REVISION_NOT_FOUND: 'Không tìm thấy revision nguồn của learner.',
  TARGET_REVISION_NOT_APPROVED: 'Revision đích chưa được duyệt, hệ thống không thể nâng cấp.',
  COURSE_RULE_CHANGED: 'Revision mới thay đổi rule hoàn thành/chứng chỉ ở cấp khóa học.',
  ITEM_RULE_CHANGED: 'Revision mới thay đổi điều kiện đạt của quiz/assignment/lesson.',
  ITEM_REMOVED: 'Revision mới đã xóa nội dung learner đang theo học.',
  TARGET_NOT_MARKED_COMPATIBLE: 'Revision mới chưa được đánh dấu tương thích auto-upgrade.',
  EXECUTOR_ERROR: 'Lỗi hệ thống khi xử lý auto-upgrade.'
};

const UPGRADE_API_ERROR_MESSAGE_MAP: Record<string, string> = {
  COURSE_ACTIVE_REVISION_NOT_SET: 'Khóa học chưa có phiên bản hoạt động để nâng cấp.',
  COURSE_UPGRADE_BLOCKED_BY_ACTIVE_CERTIFICATE:
    'Bạn đã có chứng chỉ của khóa học này nên không thể chuyển sang phiên bản mới.',
  COURSE_UPGRADE_BLOCKED_BY_PENDING_ASSIGNMENT_GRADE:
    'Bạn đang có bài tập chờ chấm điểm, chưa thể nâng cấp phiên bản lúc này.',
  COURSE_UPGRADE_BLOCKED_BY_QUIZ_IN_PROGRESS:
    'Bạn đang làm quiz dở dang, vui lòng nộp bài hoặc chờ phiên làm bài hết hạn rồi thử lại.'
};

export const mapReasonCodeToVietnameseMessage = (
  reasonCode?: string | null,
  fallbackDetail?: string | null
): string => {
  const normalizedCode = (reasonCode ?? '').trim().toUpperCase();
  if (normalizedCode && REASON_CODE_MESSAGE_MAP[normalizedCode]) {
    return REASON_CODE_MESSAGE_MAP[normalizedCode];
  }
  if (fallbackDetail?.trim()) {
    return fallbackDetail.trim();
  }
  return 'Không có thông tin chi tiết từ backend.';
};

export const getAutoUpgradeOutcomeLabel = (outcome?: string | null): string => {
  const normalized = (outcome ?? '').trim().toUpperCase() as AutoUpgradeOutcome;
  if (normalized === 'UPGRADED') return 'Đã nâng cấp';
  if (normalized === 'ERROR') return 'Lỗi xử lý';
  return 'Bỏ qua nâng cấp';
};

export const getAutoUpgradeOutcomeClass = (outcome?: string | null): 'upgraded' | 'skipped' | 'error' => {
  const normalized = (outcome ?? '').trim().toUpperCase() as AutoUpgradeOutcome;
  if (normalized === 'UPGRADED') return 'upgraded';
  if (normalized === 'ERROR') return 'error';
  return 'skipped';
};

export const getUpgradePolicyMessage = (policy?: string | null): string => {
  if (policy === 'AUTO_COMPATIBLE_ONLY') {
    return 'Chế độ tự động: hệ thống chỉ tự chuyển khi phiên bản mới tương thích (không breaking).';
  }
  if (policy === 'MANUAL') {
    return 'Chế độ thủ công: bạn chủ động chọn thời điểm chuyển sang phiên bản mới.';
  }
  return 'Không xác định chính sách nâng cấp revision.';
};

export const mapUpgradeApiErrorToVietnameseMessage = (
  rawMessage?: string | null
): string => {
  const normalizedMessage = (rawMessage ?? '').trim();
  if (!normalizedMessage) {
    return 'Không thể nâng cấp revision lúc này. Vui lòng thử lại.';
  }

  const matchedKey = Object.keys(UPGRADE_API_ERROR_MESSAGE_MAP).find((key) =>
    normalizedMessage.toUpperCase().includes(key)
  );

  if (matchedKey) {
    return UPGRADE_API_ERROR_MESSAGE_MAP[matchedKey];
  }

  return 'Không thể nâng cấp revision lúc này. Vui lòng thử lại.';
};

const parseSnapshotIdentityPath = (rawMessage?: string | null): string | null => {
  if (!rawMessage) return null;
  const match = rawMessage.match(/COURSE_REVISION_CONTENT_ID_REQUIRED\s*[:@-]?\s*([^\s].*)?$/i);
  const rawPath = match?.[1]?.trim();
  return rawPath && rawPath.length > 0 ? rawPath : null;
};

const formatSnapshotIdentityPath = (path: string): string => {
  const moduleMatch = path.match(/^modules\[(\d+)]\.id$/i);
  if (moduleMatch) {
    const moduleIndex = Number(moduleMatch[1]);
    return `Module #${moduleIndex + 1}`;
  }

  const itemMatch = path.match(/^modules\[(\d+)]\.lessons\[(\d+)]\.id$/i);
  if (itemMatch) {
    const moduleIndex = Number(itemMatch[1]);
    const itemIndex = Number(itemMatch[2]);
    return `Module #${moduleIndex + 1}, nội dung #${itemIndex + 1}`;
  }

  return path;
};

export const mapRevisionSnapshotIdentityErrorToVietnameseMessage = (
  rawMessage?: string | null
): string | null => {
  if (!rawMessage || !rawMessage.toUpperCase().includes('COURSE_REVISION_CONTENT_ID_REQUIRED')) {
    return null;
  }

  const path = parseSnapshotIdentityPath(rawMessage);
  if (!path) {
    return 'Snapshot revision đang thiếu ID hợp lệ cho module hoặc nội dung học. Vui lòng lưu lại các mục vừa tạo rồi thử lại.';
  }

  return `Snapshot revision có mục thiếu ID hợp lệ tại ${formatSnapshotIdentityPath(path)}. Vui lòng mở mục này, lưu lại rồi gửi duyệt lại.`;
};
