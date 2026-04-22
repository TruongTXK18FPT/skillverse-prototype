/**
 * [Nghiệp vụ] Hiển thị trạng thái final verification gate của journey và CTA phù hợp.
 *
 * Theo spec §1.1.1-§1.1.3: free learner mặc định dừng ở COMPLETED_UNVERIFIED;
 * khi journey.finalVerificationRequired=true, learner phải đi qua gate trước
 * khi completeJourney thành công.
 *
 * Gate component này KHÔNG tự gọi completeJourney — parent page control.
 */
import { type FC, useCallback, useEffect, useState } from 'react';
import { CheckCircle, Clock, ShieldCheck, ShieldOff, UserCheck } from 'lucide-react';
import { getCompletionGate } from '../../services/nodeMentoringService';
import type {
  FinalGateStatus,
  JourneyCompletionGateResponse,
} from '../../types/NodeMentoring';
import './NodeVerificationGate.css';

interface NodeVerificationGateProps {
  journeyId: number;
  /** Parent may pass its own hook; else the gate is fetched on mount. */
  gate?: JourneyCompletionGateResponse | null;
  onBookMentorClick?: () => void;
  onOpenDossierClick?: () => void;
  onCompleteClick?: () => void;
  /** Learner requests mentor final verification — transitions journey to AWAITING_VERIFICATION. */
  onRequestVerificationClick?: () => void;
}

const statusMeta: Record<
  FinalGateStatus,
  { label: string; icon: JSX.Element; cls: string; desc: string }
> = {
  NOT_REQUIRED: {
    label: 'Không yêu cầu xác thực',
    icon: <ShieldOff size={16} />,
    cls: 'nvg-badge--muted',
    desc:
      'Journey này không bật final verification gate. Learner có thể kết thúc ở trạng thái COMPLETED_UNVERIFIED.',
  },
  BLOCKED: {
    label: 'Chưa đủ điều kiện hoàn tất',
    icon: <Clock size={16} />,
    cls: 'nvg-badge--pending',
    desc: 'Cần hoàn tất các yêu cầu bên dưới trước khi complete journey.',
  },
  PASSED: {
    label: 'Đã đạt gate',
    icon: <CheckCircle size={16} />,
    cls: 'nvg-badge--approved',
    desc: 'Tất cả điều kiện đã hoàn tất. Bạn có thể complete journey.',
  },
};

const NodeVerificationGate: FC<NodeVerificationGateProps> = ({
  journeyId,
  gate: externalGate,
  onBookMentorClick,
  onOpenDossierClick,
  onCompleteClick,
  onRequestVerificationClick,
}) => {
  const [gate, setGate] = useState<JourneyCompletionGateResponse | null>(externalGate ?? null);
  const [loading, setLoading] = useState(!externalGate);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCompletionGate(journeyId);
      setGate(data);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Không tải được trạng thái gate.');
    } finally {
      setLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    if (externalGate) {
      setGate(externalGate);
      setLoading(false);
      return;
    }
    load();
  }, [externalGate, load]);

  if (loading) {
    return <div className="nvg-container nvg-container--loading">Đang kiểm tra gate…</div>;
  }

  if (error || !gate) {
    return (
      <div className="nvg-container nvg-container--error">
        {error || 'Không có dữ liệu gate.'}
      </div>
    );
  }

  const meta = statusMeta[gate.finalGateStatus];

  return (
    <div className="nvg-container">
      <div className="nvg-header">
        <div className="nvg-header__title">
          <ShieldCheck size={18} />
          <h3>Final verification gate</h3>
        </div>
        <span className={`nvg-badge ${meta.cls}`}>
          {meta.icon} {meta.label}
        </span>
      </div>

      <p className="nvg-desc">{meta.desc}</p>

      {gate.finalGateStatus === 'BLOCKED' && gate.blockingReasons.length > 0 && (
        <ul className="nvg-reasons">
          {gate.blockingReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {gate.finalGateStatus !== 'NOT_REQUIRED' && (
        <div className="nvg-checklist">
          <div
            className={`nvg-checklist__item ${
              gate.hasPassCompletionReport ? 'is-done' : ''
            }`}
          >
            <UserCheck size={14} />
            Mentor đã gửi completion report với quyết định <strong>PASS</strong>
          </div>
          {gate.journeyOutputVerificationRequired && (
            <div
              className={`nvg-checklist__item ${
                gate.outputAssessmentApproved ? 'is-done' : ''
              }`}
            >
              <CheckCircle size={14} />
              Output assessment cuối journey đã <strong>APPROVED</strong>
            </div>
          )}
        </div>
      )}

      <div className="nvg-actions">
        {gate.finalGateStatus === 'BLOCKED' && onBookMentorClick && (
          <button
            type="button"
            className="nvg-btn nvg-btn--primary"
            onClick={onBookMentorClick}
          >
            Đặt lịch mentor
          </button>
        )}
        {gate.finalVerificationRequired && onRequestVerificationClick && (
          <button
            type="button"
            className="nvg-btn nvg-btn--secondary"
            onClick={onRequestVerificationClick}
          >
            Yêu cầu xác thực mentor
          </button>
        )}
        {onOpenDossierClick && (
          <button
            type="button"
            className="nvg-btn nvg-btn--ghost"
            onClick={onOpenDossierClick}
          >
            Xem dossier
          </button>
        )}
        {gate.finalGateStatus === 'PASSED' && onCompleteClick && (
          <button
            type="button"
            className="nvg-btn nvg-btn--primary"
            onClick={onCompleteClick}
          >
            Complete journey
          </button>
        )}
      </div>
    </div>
  );
};

export default NodeVerificationGate;
