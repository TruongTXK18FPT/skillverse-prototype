import React, { useEffect, useState, useCallback } from 'react';
import { Archive, RotateCcw, X, Search, Loader } from 'lucide-react';
import { TaskResponse } from '../../../types/TaskBoard';
import { taskBoardService } from '../../../services/taskBoardService';
import '../styles/ArchivedTasksModal.css';

interface ArchivedTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
  roadmapSessionId?: number;
}

const PAGE_SIZE = 20;

const ArchivedTasksModal: React.FC<ArchivedTasksModalProps> = ({
  isOpen,
  onClose,
  onRestore,
  roadmapSessionId,
}) => {
  const [archivedTasks, setArchivedTasks] = useState<TaskResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const hasMore = archivedTasks.length < total;

  const loadPage = useCallback(async (page: number, isAppend: boolean) => {
    if (isAppend) setIsLoadingMore(true);
    else setIsLoading(true);
    try {
      const result = await taskBoardService.getArchivedTasks(roadmapSessionId, page, PAGE_SIZE);
      if (isAppend) {
        setArchivedTasks((prev) => [...prev, ...result.items]);
      } else {
        setArchivedTasks(result.items);
      }
      setTotal(result.total);
      setCurrentPage(page);
    } catch (e) {
      console.warn('Failed to load archived tasks:', e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [roadmapSessionId]);

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setArchivedTasks([]);
    setTotal(0);
    setCurrentPage(0);
    loadPage(0, false);
  }, [isOpen, loadPage]);

  const handleLoadMore = () => {
    loadPage(currentPage + 1, true);
  };

  const handleRestore = async (taskId: string) => {
    setRestoringId(taskId);
    try {
      await taskBoardService.unarchiveTask(taskId);
      setArchivedTasks((prev) => prev.filter((t) => t.id !== taskId));
      setTotal((prev) => prev - 1);
      onRestore();
    } catch (e) {
      console.warn('Failed to restore task:', e);
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  const filtered = archivedTasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="archived-modal-overlay" onClick={onClose}>
      <div
        className="archived-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="archived-modal-title"
      >
        {/* Header */}
        <div className="archived-modal-header">
          <h3 id="archived-modal-title" className="archived-modal-title">
            <Archive size={18} />
            Đã ẩn ({total})
          </h3>
          <button
            className="archived-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        {total > 0 && (
          <div className="archived-modal-search">
            <Search size={14} className="archived-modal-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="archived-modal-search-input"
            />
          </div>
        )}

        {/* Body */}
        <div className="archived-modal-body">
          {isLoading ? (
            <div className="archived-modal-empty">Đang tải...</div>
          ) : total === 0 ? (
            <div className="archived-modal-empty">
              <Archive size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p>Không có công việc nào bị ẩn.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="archived-modal-empty">
              <p>Không tìm thấy kết quả phù hợp.</p>
            </div>
          ) : (
            <>
              <div className="archived-modal-list">
                {filtered.map((task) => (
                  <div key={task.id} className="archived-modal-item">
                    <div className="archived-modal-item-content">
                      <div className="archived-modal-item-title">{task.title}</div>
                      {task.description && (
                        <div className="archived-modal-item-desc">{task.description}</div>
                      )}
                      {task.deadline && (
                        <div className="archived-modal-item-deadline">
                          Deadline: {new Date(task.deadline).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                    <button
                      className="archived-modal-restore-btn"
                      onClick={() => handleRestore(task.id)}
                      disabled={restoringId === task.id}
                      title="Khôi phục"
                    >
                      {restoringId === task.id ? (
                        '...'
                      ) : (
                        <>
                          <RotateCcw size={14} />
                          Khôi phục
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <button
                  className="archived-modal-load-more"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader size={14} className="spin" />
                      Đang tải...
                    </>
                  ) : (
                    `Xem thêm (${total - archivedTasks.length} còn lại)`
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {total > 0 && (
          <div className="archived-modal-footer">
            <button className="archived-modal-btn-close" onClick={onClose}>
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedTasksModal;
