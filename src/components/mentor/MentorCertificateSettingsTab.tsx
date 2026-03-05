import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, PenTool, RotateCcw, Save, ShieldCheck, Trash2 } from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import Toast from '../shared/Toast';
import { useToast } from '../../hooks/useToast';
import {
  createMyMentorSignatureFromDrawing,
  getMyMentorProfile,
  MentorSignatureDrawStrokeDTO,
  MentorProfile,
  removeMyMentorSignature,
} from '../../services/mentorProfileService';
import '../../styles/MentorCertificateSettingsTab.css';

const SIGNATURE_CANVAS_WIDTH = 720;
const SIGNATURE_CANVAS_HEIGHT = 220;

const MentorCertificateSettingsTab: React.FC = () => {
  const { toast, isVisible, hideToast, showError, showSuccess, showInfo } = useToast();
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureStrokesRef = useRef<MentorSignatureDrawStrokeDTO[]>([]);
  const currentStrokeRef = useRef<MentorSignatureDrawStrokeDTO | null>(null);

  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [signatureLoadFailed, setSignatureLoadFailed] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const profileData = await getMyMentorProfile();
        setProfile(profileData);
        setSignatureLoadFailed(false);
      } catch (error) {
        console.error('Failed to load mentor certificate settings:', error);
        showError('Lỗi', 'Không thể tải cài đặt chứng chỉ');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [showError]);

  const resetCanvas = useCallback(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#111827';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    signatureStrokesRef.current = [];
    currentStrokeRef.current = null;
    setHasDrawnSignature(false);
  }, []);

  useEffect(() => {
    if (drawMode) {
      resetCanvas();
    }
  }, [drawMode, resetCanvas]);

  const persistDrawingSignature = async (strokes: MentorSignatureDrawStrokeDTO[]) => {
    setUploading(true);
    try {
      const result = await createMyMentorSignatureFromDrawing({
        canvasWidth: SIGNATURE_CANVAS_WIDTH,
        canvasHeight: SIGNATURE_CANVAS_HEIGHT,
        strokes,
      });
      setProfile((prev) => (
        prev
          ? {
              ...prev,
              signatureUrl: result.signatureUrl,
            }
          : prev
      ));
      setSignatureLoadFailed(false);
      setDrawMode(false);
      showSuccess('Thành công', 'Đã cập nhật chữ ký dùng cho chứng chỉ cấp mới');
    } catch (error) {
      console.error('Failed to create mentor signature from drawing:', error);
      showError('Lỗi', 'Lưu chữ ký từ hệ thống thất bại');
    } finally {
      setUploading(false);
    }
  };

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    const point = getCanvasPoint(event);
    if (!canvas || !context || !point) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    const nextStroke: MentorSignatureDrawStrokeDTO = {
      lineWidth: 3,
      points: [{ x: point.x, y: point.y }],
    };
    signatureStrokesRef.current.push(nextStroke);
    currentStrokeRef.current = nextStroke;
    setIsDrawing(true);
    setHasDrawnSignature(true);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }

    const context = signatureCanvasRef.current?.getContext('2d');
    const point = getCanvasPoint(event);
    if (!context || !point) {
      return;
    }

    context.lineTo(point.x, point.y);
    context.stroke();
    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push({ x: point.x, y: point.y });
    }
  };

  const handleCanvasPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    currentStrokeRef.current = null;
    setIsDrawing(false);
  };

  const handleSaveDrawnSignature = async () => {
    if (!hasDrawnSignature) {
      showInfo('Chưa có chữ ký', 'Hãy ký vào vùng vẽ trước khi lưu.');
      return;
    }

    const strokes = signatureStrokesRef.current
      .filter((stroke) => stroke.points.length >= 2)
      .map((stroke) => ({
        lineWidth: stroke.lineWidth,
        points: stroke.points.map((point) => ({ x: point.x, y: point.y })),
      }));

    if (strokes.length === 0) {
      showInfo('Chưa có chữ ký', 'Nét ký chưa đủ để lưu. Hãy ký thêm.');
      return;
    }

    await persistDrawingSignature(strokes);
  };

  const handleRemoveSignature = async () => {
    if (!profile?.signatureUrl && !signatureLoadFailed) {
      showInfo('Không có chữ ký', 'Hiện tại bạn chưa có chữ ký riêng để gỡ.');
      return;
    }

    if (!(await confirmAction('Gỡ chữ ký hiện tại và chuyển về xác thực nền tảng?'))) {
      return;
    }

    setUploading(true);
    try {
      await removeMyMentorSignature();
      setProfile((prev) => (prev ? { ...prev, signatureUrl: undefined } : prev));
      setSignatureLoadFailed(false);
      setDrawMode(false);
      resetCanvas();
      showSuccess('Đã gỡ chữ ký', 'Chứng chỉ mới sẽ dùng xác thực nền tảng cho tới khi bạn thiết lập chữ ký mới.');
    } catch (error) {
      console.error('Failed to remove mentor signature:', error);
      showError('Lỗi', 'Không thể gỡ chữ ký hiện tại');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="mentor-certificate-settings mentor-certificate-settings--loading">
        <MeowlKuruLoader size="small" text="" />
        <p>Đang tải cài đặt chứng chỉ...</p>
      </div>
    );
  }

  const shouldShowSignatureImage = Boolean(profile?.signatureUrl) && !signatureLoadFailed && !drawMode;

  return (
    <div className="mentor-certificate-settings">
      <div className="mentor-certificate-settings__header">
        <div>
          <h2>Cài Đặt Chứng Chỉ</h2>
          <p>
            Quản lý chữ ký dùng khi Skillverse phát hành chứng chỉ cho các khóa học của bạn.
          </p>
        </div>
        <div className="mentor-certificate-settings__status">
          <ShieldCheck size={18} />
          {profile?.signatureUrl && !signatureLoadFailed ? 'Đã có chữ ký mặc định' : 'Đang dùng xác thực nền tảng'}
        </div>
      </div>

      <div className="mentor-certificate-settings__grid">
        <section className="mentor-certificate-settings__panel">
          <div className="mentor-certificate-settings__panel-head">
            <h3>Chữ ký mặc định của người hướng dẫn</h3>
            <span>Tùy chọn</span>
          </div>

          <p className="mentor-certificate-settings__copy">
            Chữ ký này không bắt buộc để tạo khóa học. Nếu bạn chưa tải chữ ký lên, chứng chỉ vẫn
            được phát hành bình thường và hiển thị xác thực từ nền tảng Skillverse.
          </p>

          <div className="mentor-certificate-settings__preview">
            {drawMode ? (
              <div className="mentor-certificate-settings__canvas-shell">
                <canvas
                  ref={signatureCanvasRef}
                  width={SIGNATURE_CANVAS_WIDTH}
                  height={SIGNATURE_CANVAS_HEIGHT}
                  className="mentor-certificate-settings__canvas"
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerLeave={handleCanvasPointerUp}
                />
                <p className="mentor-certificate-settings__draw-hint">
                  Ký trực tiếp trong khung. Hệ thống chỉ nhận chữ ký tạo từ canvas này.
                </p>
              </div>
            ) : shouldShowSignatureImage ? (
              <img
                src={profile?.signatureUrl ?? ''}
                alt="Chữ ký người hướng dẫn"
                className="mentor-certificate-settings__image"
                onError={() => setSignatureLoadFailed(true)}
              />
            ) : (
              <div className="mentor-certificate-settings__fallback">
                <PenTool size={18} />
                <div>
                  <strong>{signatureLoadFailed ? 'Chữ ký hiện tại không thể hiển thị' : 'Chưa có chữ ký riêng'}</strong>
                  <p>
                    {signatureLoadFailed
                      ? 'Bạn có thể ký lại trực tiếp trên hệ thống để thay thế.'
                      : 'Chứng chỉ mới sẽ dùng xác thực nền tảng thay cho chữ ký tay của người hướng dẫn.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="mentor-certificate-settings__hint">
            Chữ ký chỉ được tạo từ nét vẽ trực tiếp trên hệ thống (không nhận upload ảnh bên ngoài).
          </p>

          <div className="mentor-certificate-settings__actions">
            <button
              type="button"
              className="mentor-certificate-settings__secondary-btn"
              onClick={() => setDrawMode((prev) => !prev)}
              disabled={uploading}
            >
              <PenTool size={16} />
              {drawMode ? 'Hủy ký trực tiếp' : 'Ký trên hệ thống'}
            </button>

            {(profile?.signatureUrl || signatureLoadFailed) && (
              <button
                type="button"
                className="mentor-certificate-settings__danger-btn"
                onClick={() => void handleRemoveSignature()}
                disabled={uploading}
              >
                <Trash2 size={16} />
                Gỡ chữ ký
              </button>
            )}
          </div>

          {drawMode && (
            <div className="mentor-certificate-settings__canvas-actions">
              <button
                type="button"
                className="mentor-certificate-settings__secondary-btn"
                onClick={resetCanvas}
                disabled={uploading}
              >
                <RotateCcw size={16} />
                Xóa nét ký
              </button>
              <button
                type="button"
                className="mentor-certificate-settings__primary-btn"
                onClick={() => void handleSaveDrawnSignature()}
                disabled={uploading}
              >
                <Save size={16} />
                {uploading ? 'Đang lưu chữ ký...' : 'Lưu chữ ký vừa ký'}
              </button>
            </div>
          )}
        </section>

        <section className="mentor-certificate-settings__panel">
          <div className="mentor-certificate-settings__panel-head">
            <h3>Quy tắc phát hành</h3>
            <span>Đóng dấu thời điểm cấp</span>
          </div>

          <div className="mentor-certificate-settings__rule-list">
            <article className="mentor-certificate-settings__rule">
              <ShieldCheck size={18} />
              <div>
                <strong>Không chặn tạo khóa học</strong>
                <p>
                  Bạn chưa có chữ ký vẫn tạo và xuất bản khóa học bình thường. Chữ ký chỉ tác động
                  đến giao diện chứng chỉ khi chứng chỉ được cấp.
                </p>
              </div>
            </article>

            <article className="mentor-certificate-settings__rule">
              <AlertCircle size={18} />
              <div>
                <strong>Chứng chỉ cũ không bị thay đổi</strong>
                <p>
                  Khi chứng chỉ được phát hành, hệ thống lưu lại chữ ký tại đúng thời điểm cấp.
                  Nếu bạn đổi chữ ký sau này thì chỉ chứng chỉ mới dùng bản mới.
                </p>
              </div>
            </article>

            <article className="mentor-certificate-settings__rule">
              <PenTool size={18} />
              <div>
                <strong>Không có chữ ký vẫn có cơ chế thay thế an toàn</strong>
                <p>
                  Nếu bạn chưa thiết lập chữ ký, chứng chỉ hiển thị xác thực phát hành bởi Skillverse
                  thay vì cố hiển thị một chữ ký giả.
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>

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

export default MentorCertificateSettingsTab;
