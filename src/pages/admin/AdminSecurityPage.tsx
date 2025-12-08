import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import './admin-security-page.css';

const AdminSecurityPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast, isVisible, hideToast, showError, showSuccess } = useToast();
  const [keyInput, setKeyInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10;
  const lockDurationMs = 5 * 60 * 1000;
  const verifyWindowMs = 15 * 60 * 1000;
  const [countdownSec, setCountdownSec] = useState<number>(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const now = useMemo(() => Date.now(), []);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const isAdmin = user.roles?.some(r => r.toUpperCase() === 'ADMIN');
    if (!isAdmin) {
      navigate('/unauthorized', { replace: true });
      return;
    }

    const verified = sessionStorage.getItem('adminKeyVerified') === 'true';
    const expiryStr = sessionStorage.getItem('adminKeyVerifiedExpiry');
    const notExpired = expiryStr ? parseInt(expiryStr, 10) > Date.now() : false;
    if (verified && notExpired) {
      navigate('/admin', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const lockStr = localStorage.getItem('adminSecurityLockUntil');
    const attStr = localStorage.getItem('adminSecurityAttempts');
    setLockedUntil(lockStr ? parseInt(lockStr, 10) : null);
    setAttempts(attStr ? parseInt(attStr, 10) : 0);
  }, []);

  useEffect(() => {
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AC();
      audioCtxRef.current = ctx;
      const gain = ctx.createGain();
      gain.gain.value = 0.6;
      gain.connect(ctx.destination);
      masterGainRef.current = gain;
    } catch (e) { void e; }
    return () => {
      try { audioCtxRef.current?.close(); } catch (e) { void e; }
      audioCtxRef.current = null;
      masterGainRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!lockedUntil) {
      setCountdownSec(0);
      return;
    }
    const update = () => {
      const remain = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setCountdownSec(remain);
      if (remain === 0) {
        localStorage.removeItem('adminSecurityLockUntil');
        setLockedUntil(null);
        setAttempts(0);
        localStorage.removeItem('adminSecurityAttempts');
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const playClick = () => {
    try {
      const ctx = audioCtxRef.current;
      const mg = masterGainRef.current;
      if (!ctx || !mg) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.connect(gain);
      gain.connect(mg);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) { void e; }
  };

  const logAccess = (status: 'SUCCESS' | 'FAIL', reason?: string) => {
    try {
      const logsStr = localStorage.getItem('adminSecurityLogs');
      const logs = logsStr ? JSON.parse(logsStr) : [];
      const entry = { ts: Date.now(), status, reason: reason || null, user: user?.email || null };
      logs.push(entry);
      if (logs.length > 200) logs.shift();
      localStorage.setItem('adminSecurityLogs', JSON.stringify(logs));
    } catch (e) { void e; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      if (lockedUntil && lockedUntil > Date.now()) {
        showError('Tạm khóa', 'Bạn đang bị khóa do thử sai nhiều lần.');
        logAccess('FAIL', 'LOCKED');
        return;
      }

      const configuredKey = import.meta.env.VITE_ADMIN_SECURITY_KEY as string | undefined;

      if (!configuredKey) {
        showError('Lỗi cấu hình', 'Khóa bảo mật admin chưa được thiết lập.');
        setSubmitting(false);
        return;
      }

      if (keyInput === configuredKey) {
        sessionStorage.setItem('adminKeyVerified', 'true');
        sessionStorage.setItem('adminKeyVerifiedExpiry', String(Date.now() + verifyWindowMs));
        localStorage.removeItem('adminSecurityAttempts');
        localStorage.removeItem('adminSecurityLockUntil');
        logAccess('SUCCESS');
        showSuccess('Xác thực thành công', 'Bạn đã mở khóa khu vực Admin.');
        navigate('/admin', { replace: true });
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        localStorage.setItem('adminSecurityAttempts', String(nextAttempts));
        if (nextAttempts >= maxAttempts) {
          const lu = Date.now() + lockDurationMs;
          setLockedUntil(lu);
          localStorage.setItem('adminSecurityLockUntil', String(lu));
          showError('Quá số lần thử', 'Bạn bị khóa 5 phút.');
          logAccess('FAIL', 'MAX_ATTEMPTS');
        } else {
          showError('Sai mã xác thực', `Còn ${maxAttempts - nextAttempts} lần thử.`);
          logAccess('FAIL', 'WRONG_CODE');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuestionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const a1 = (import.meta.env.VITE_ADMIN_Q1 as string | undefined) || '';
    const a2 = (import.meta.env.VITE_ADMIN_Q2 as string | undefined) || '';
    const a3 = (import.meta.env.VITE_ADMIN_Q3 as string | undefined) || '';
    if (q1 === a1 && q2 === a2 && q3 === a3) {
      sessionStorage.setItem('adminKeyVerified', 'true');
      sessionStorage.setItem('adminKeyVerifiedExpiry', String(Date.now() + verifyWindowMs));
      localStorage.removeItem('adminSecurityAttempts');
      localStorage.removeItem('adminSecurityLockUntil');
      logAccess('SUCCESS', 'QUESTIONS');
      showSuccess('Xác thực thành công', 'Bạn đã mở khóa khu vực Admin.');
      navigate('/admin', { replace: true });
    } else {
      showError('Sai câu trả lời', 'Vui lòng kiểm tra lại 3 câu hỏi.');
      logAccess('FAIL', 'WRONG_QUESTIONS');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-security admin-security--neon">
      <div className="admin-security__card">
        <form className="admin-security__form" onSubmit={handleSubmit}>
          <div className="admin-security__input-group">
            <Lock size={20} className="admin-security__input-icon" />
            <input
              type={showCode ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Nhập mã xác thực admin"
              className="admin-security__password-input"
              onFocus={playClick}
            />
            <button type="button" className="admin-security__toggle-btn" onClick={() => { playClick(); setShowCode(s => !s); }} aria-label="toggle">
              {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="admin-security__actions">
            <button className="admin-security__submit-btn" type="submit" disabled={submitting} onClick={playClick}>
              {submitting ? 'Đang xác thực...' : 'Mở khóa Admin'}
            </button>
            <button type="button" className="admin-security__forgot-btn" onClick={() => { playClick(); setShowQuestions(true); }}>Quên mã?</button>
          </div>

          {lockedUntil && lockedUntil > Date.now() && (
            <div className="admin-security__lock-notice">
              Bị khóa: còn <span className="admin-security__countdown">{Math.floor(countdownSec / 60)}:{String(countdownSec % 60).padStart(2, '0')}</span>
            </div>
          )}
        </form>
      </div>

      {showQuestions && (
        <div className="admin-security__questions">
          <div className="admin-security__questions-card">
            <h2 className="admin-security__questions-title">Xác thực phụ trợ</h2>
            <form onSubmit={(e) => { playClick(); handleQuestionsSubmit(e); }}>
              <label className="admin-security__question-label">Question 1 – Learning Goal</label>
              <input className="admin-security__question-input" value={q1} onChange={e => setQ1(e.target.value)} placeholder="Nhập câu trả lời" onFocus={playClick} />

              <label className="admin-security__question-label">Question 2 – Inspiration</label>
              <input className="admin-security__question-input" value={q2} onChange={e => setQ2(e.target.value)} placeholder="Nhập câu trả lời" onFocus={playClick} />

              <label className="admin-security__question-label">Question 3 – Secret Roadmap Name</label>
              <input className="admin-security__question-input" value={q3} onChange={e => setQ3(e.target.value)} placeholder="Nhập câu trả lời" onFocus={playClick} />

              <div className="admin-security__questions-actions">
                <button type="submit" className="admin-security__questions-submit" onClick={playClick}>Xác nhận</button>
                <button type="button" className="admin-security__questions-cancel" onClick={() => { playClick(); setShowQuestions(false); }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
          showCountdown={toast.showCountdown}
          countdownText={toast.countdownText}
          actionButton={toast.actionButton}
        />
      )}
    </div>
  );
};

export default AdminSecurityPage;
