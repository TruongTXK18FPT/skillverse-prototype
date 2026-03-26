import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Search, Filter, Clock, CheckCircle, XCircle,
  RefreshCw, Eye, Loader2, MessageSquare, User,
} from 'lucide-react';
import {
  getAllBookingDisputes,
  getAdminBookingDisputeDetail,
  getAdminBookingDisputeEvidence,
  resolveBookingDispute,
  BookingDispute,
  BookingDisputeEvidence,
} from '../../services/bookingDisputeService';
import { showAppSuccess, showAppError } from '../../context/ToastContext';
import './AdminBookingDisputesTab.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'OPEN', label: 'Mở', color: '#f97316' },
  { value: 'UNDER_INVESTIGATION', label: 'Đang điều tra', color: '#eab308' },
  { value: 'AWAITING_RESPONSE', label: 'Chờ phản hồi', color: '#3b82f6' },
  { value: 'RESOLVED', label: 'Đã giải quyết', color: '#22c55e' },
  { value: 'DISMISSED', label: 'Bác bỏ', color: '#94a3b8' },
  { value: 'ESCALATED', label: 'Escalate', color: '#ef4444' },
];

const AdminBookingDisputesTab: React.FC = () => {
  const [disputes, setDisputes] = useState<BookingDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<BookingDispute | null>(null);
  const [evidence, setEvidence] = useState<BookingDisputeEvidence[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Resolve form
  const [resolution, setResolution] = useState<'FULL_REFUND' | 'FULL_RELEASE' | 'PARTIAL_REFUND' | 'PARTIAL_RELEASE'>('FULL_REFUND');
  const [notes, setNotes] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter, currentPage]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const data = await getAllBookingDisputes(statusFilter || undefined, currentPage, 20);
      setDisputes(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Error fetching disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDispute = async (dispute: BookingDispute) => {
    setSelectedDispute(dispute);
    setLoadingDetail(true);
    setShowResolveModal(false);
    try {
      const detail = await getAdminBookingDisputeDetail(dispute.id);
      setSelectedDispute(detail);
      const ev = await getAdminBookingDisputeEvidence(dispute.id);
      setEvidence(ev);
    } catch (err) {
      console.error('Error loading dispute detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;
    setResolving(true);
    try {
      await resolveBookingDispute(
        selectedDispute.id,
        resolution,
        notes || undefined,
        partialAmount ? parseFloat(partialAmount) : undefined
      );
      showAppSuccess('Đã giải quyết dispute', 'Dispute đã được xử lý thành công.');
      setShowResolveModal(false);
      setSelectedDispute(null);
      setEvidence([]);
      fetchDisputes();
    } catch (err: any) {
      showAppError('Giải quyết thất bại', err?.response?.data?.message || 'Lỗi khi giải quyết dispute');
    } finally {
      setResolving(false);
    }
  };

  const filteredDisputes = searchQuery
    ? disputes.filter(d =>
        d.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(d.id).includes(searchQuery) ||
        String(d.bookingId).includes(searchQuery)
      )
    : disputes;

  const getStatusColor = (status: string) =>
    STATUS_OPTIONS.find(s => s.value === status)?.color || '#94a3b8';
  const getStatusLabel = (status: string) =>
    STATUS_OPTIONS.find(s => s.value === status)?.label || status;

  return (
    <div className="abdt-container">
      <div className="abdt-header">
        <h2 className="abdt-title">
          <AlertTriangle size={20} /> Quản lý Dispute Booking
        </h2>
        <div className="abdt-controls">
          <div className="abdt-filter-group">
            <Filter size={16} />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(0); }}>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="abdt-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm dispute..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="abdt-refresh-btn" onClick={fetchDisputes}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="abdt-body">
        {/* List */}
        <div className="abdt-list">
          <div className="abdt-list-header">
            <span>Disputes ({totalElements})</span>
          </div>
          {loading ? (
            <div className="abdt-loading">
              <Loader2 className="abdt-spinner" size={24} />
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="abdt-empty">Không có dispute nào.</div>
          ) : (
            filteredDisputes.map(d => (
              <div
                key={d.id}
                className={`abdt-list-item ${selectedDispute?.id === d.id ? 'active' : ''}`}
                onClick={() => handleSelectDispute(d)}
              >
                <div className="abdt-item-header">
                  <span className="abdt-item-id">Dispute #{d.id}</span>
                  <span className="abdt-item-badge" style={{ color: getStatusColor(d.status) }}>
                    {getStatusLabel(d.status)}
                  </span>
                </div>
                <div className="abdt-item-info">
                  <span>Booking #{d.bookingId}</span>
                  <span>Initiator: #{d.initiatorId}</span>
                </div>
                <div className="abdt-item-reason">{d.reason}</div>
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="abdt-detail">
          {!selectedDispute ? (
            <div className="abdt-detail-empty">
              <AlertTriangle size={32} />
              <p>Chọn một dispute để xem chi tiết</p>
            </div>
          ) : loadingDetail ? (
            <div className="abdt-loading">
              <Loader2 className="abdt-spinner" size={24} />
            </div>
          ) : (
            <>
              <div className="abdt-detail-header">
                <h3>Dispute #{selectedDispute.id}</h3>
                <span className="abdt-detail-badge" style={{ color: getStatusColor(selectedDispute.status) }}>
                  {getStatusLabel(selectedDispute.status)}
                </span>
              </div>

              <div className="abdt-detail-info">
                <div className="abdt-detail-row">
                  <span className="abdt-detail-label">Booking ID:</span>
                  <span>#{selectedDispute.bookingId}</span>
                </div>
                <div className="abdt-detail-row">
                  <span className="abdt-detail-label">Người mở:</span>
                  <span>#{selectedDispute.initiatorId}</span>
                </div>
                <div className="abdt-detail-row">
                  <span className="abdt-detail-label">Người bị:</span>
                  <span>#{selectedDispute.respondentId}</span>
                </div>
                <div className="abdt-detail-row">
                  <span className="abdt-detail-label">Ngày tạo:</span>
                  <span>{new Date(selectedDispute.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                {selectedDispute.resolvedAt && (
                  <div className="abdt-detail-row">
                    <span className="abdt-detail-label">Ngày giải quyết:</span>
                    <span>{new Date(selectedDispute.resolvedAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>

              <div className="abdt-detail-section">
                <h4>Lý do</h4>
                <p className="abdt-reason">{selectedDispute.reason || 'Không có'}</p>
              </div>

              {selectedDispute.resolution && (
                <div className="abdt-detail-section">
                  <h4>Kết quả</h4>
                  <p><strong>{selectedDispute.resolution.replace('_', ' ')}</strong></p>
                  {selectedDispute.resolutionNotes && (
                    <p className="abdt-notes">{selectedDispute.resolutionNotes}</p>
                  )}
                </div>
              )}

              <div className="abdt-detail-section">
                <h4>Bằng chứng ({evidence.length})</h4>
                {evidence.length === 0 ? (
                  <p className="abdt-empty-evidence">Chưa có bằng chứng nào.</p>
                ) : (
                  <div className="abdt-evidence-list">
                    {evidence.map(ev => (
                      <div key={ev.id} className="abdt-evidence-item">
                        <div className="abdt-evidence-header">
                          <span className="abdt-evidence-type">{ev.evidenceType}</span>
                          <span className="abdt-evidence-submitter">
                            <User size={12} /> #{ev.submittedBy}
                          </span>
                        </div>
                        {ev.content && <p className="abdt-evidence-content">{ev.content}</p>}
                        {ev.fileUrl && (
                          <div className="abdt-evidence-file">
                            <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer">
                              {ev.fileName || 'Xem tệp'}
                            </a>
                          </div>
                        )}
                        {ev.description && <p className="abdt-evidence-desc">{ev.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolve actions */}
              {selectedDispute.status !== 'RESOLVED' && selectedDispute.status !== 'DISMISSED' && (
                <div className="abdt-actions">
                  {!showResolveModal ? (
                    <button className="abdt-btn abdt-btn-resolve" onClick={() => setShowResolveModal(true)}>
                      <CheckCircle size={16} /> Giải quyết Dispute
                    </button>
                  ) : (
                    <div className="abdt-resolve-form">
                      <h4>Giải quyết Dispute</h4>
                      <div className="abdt-form-group">
                        <label>Quyết định</label>
                        <select value={resolution} onChange={e => setResolution(e.target.value as any)}>
                          <option value="FULL_REFUND">Hoàn tiền đầy đủ cho learner</option>
                          <option value="FULL_RELEASE">Trả đầy đủ cho mentor</option>
                          <option value="PARTIAL_REFUND">Hoàn một phần cho learner</option>
                          <option value="PARTIAL_RELEASE">Trả một phần cho mentor</option>
                        </select>
                      </div>
                      {(resolution === 'PARTIAL_REFUND' || resolution === 'PARTIAL_RELEASE') && (
                        <div className="abdt-form-group">
                          <label>Số tiền hoàn (VND)</label>
                          <input
                            type="number"
                            value={partialAmount}
                            onChange={e => setPartialAmount(e.target.value)}
                            placeholder="Ví dụ: 150000"
                          />
                        </div>
                      )}
                      <div className="abdt-form-group">
                        <label>Ghi chú</label>
                        <textarea
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="Ghi chú về quyết định..."
                          rows={3}
                        />
                      </div>
                      <div className="abdt-resolve-actions">
                        <button className="abdt-btn abdt-btn-cancel" onClick={() => setShowResolveModal(false)}>
                          Hủy
                        </button>
                        <button className="abdt-btn abdt-btn-confirm" onClick={handleResolve} disabled={resolving}>
                          {resolving ? <Loader2 className="abdt-spinner" size={16} /> : <CheckCircle size={16} />}
                          {resolving ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="abdt-pagination">
          <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
            ← Trước
          </button>
          <span>Trang {currentPage + 1} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}>
            Sau →
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminBookingDisputesTab;
