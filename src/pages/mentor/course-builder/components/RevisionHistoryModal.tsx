import React from "react";
import { FiX } from "react-icons/fi";
import { CourseRevisionDTO } from "../../../../services/courseService";

interface RevisionHistoryModalProps {
  isOpen: boolean;
  revisionHistory: CourseRevisionDTO[];
  activeRevision: CourseRevisionDTO | null;
  courseTitle: string;
  onClose: () => void;
  onOpenRevision: (revision: CourseRevisionDTO) => void;
  onFormatDate: (date?: string | null) => string;
  onGetStatusTone: (status?: string | null) => string;
  onGetStatusLabel: (status?: string | null) => string;
}

const RevisionHistoryModal: React.FC<RevisionHistoryModalProps> = ({
  isOpen,
  revisionHistory,
  activeRevision,
  courseTitle,
  onClose,
  onOpenRevision,
  onFormatDate,
  onGetStatusTone,
  onGetStatusLabel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="cb-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="cb-modal cb-revision-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Lịch sử phiên bản"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cb-modal__header">
          <div>
            <h3>Lịch sử phiên bản</h3>
            <p className="cb-revision-modal__subtitle">
              {courseTitle || "Khóa học"}
            </p>
          </div>
          <button
            className="cb-button cb-button--secondary cb-button--sm"
            onClick={onClose}
          >
            <FiX /> Đóng
          </button>
        </div>

        <div className="cb-revision-modal__list">
          {revisionHistory.map((revision) => {
            const isCurrentRevision = activeRevision?.id === revision.id;
            return (
              <article
                key={revision.id}
                className={`cb-revision-row${isCurrentRevision ? " is-current" : ""}`}
              >
                <div className="cb-revision-row__info">
                  <div className="cb-revision-row__line">
                    <span
                      className={`cb-revision-status cb-revision-status--${onGetStatusTone(revision.status)}`}
                    >
                      {onGetStatusLabel(revision.status)}
                    </span>
                    <span className="cb-revision-row__number">
                      #{revision.revisionNumber}
                    </span>
                    {isCurrentRevision && (
                      <span className="cb-revision-row__current">
                        Đang mở
                      </span>
                    )}
                  </div>
                  <div className="cb-revision-row__meta">
                    <span>
                      Tạo: {onFormatDate(revision.createdAt)}
                    </span>
                    <span>
                      Cập nhật: {onFormatDate(revision.updatedAt)}
                    </span>
                  </div>
                </div>
                <button
                  className="cb-button cb-button--secondary cb-button--sm"
                  onClick={() => onOpenRevision(revision)}
                >
                  Mở
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RevisionHistoryModal;
