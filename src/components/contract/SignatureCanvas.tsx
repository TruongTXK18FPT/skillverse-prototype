import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Undo2, Check, PenLine, AlertCircle } from 'lucide-react';
import { uploadMedia } from '../../services/mediaService';
import { getCurrentUserId } from '../../utils/authStorage';
import './SignatureCanvas.css';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  lineWidth: number;
}

interface SignatureCanvasProps {
  onConfirm: (signatureUrl: string) => void;
  onCancel?: () => void;
  width?: number;
  height?: number;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onConfirm,
  onCancel,
  width = 600,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [useTextMode, setUseTextMode] = useState(false);
  const [textAgreed, setTextAgreed] = useState(false);

  const LINE_WIDTH = 2.5;
  const LINE_COLOR = '#1a1a1a';

  const getEventPosition = useCallback(
    (e: MouseEvent | TouchEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ('touches' in e) {
        const touch = e.touches[0] || e.changedTouches[0];
        if (!touch) return null;
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw existing strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }

    // Draw placeholder text if no strokes
    if (strokes.length === 0 && currentStroke.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = 'italic 16px Times New Roman';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Ký tên tại đây / Sign here',
        canvas.width / 2,
        canvas.height / 2,
      );
      ctx.fillStyle = '#ddd';
      ctx.font = '12px Times New Roman';
      ctx.fillText('(Vẽ chữ ký bằng chuột hoặc ngón tay)', canvas.width / 2, canvas.height / 2 + 20);
    }
  }, [strokes, currentStroke]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const pos = getEventPosition(e.nativeEvent as MouseEvent | TouchEvent);
      if (!pos) return;
      setIsDrawing(true);
      setCurrentStroke([pos]);
    },
    [getEventPosition],
  );

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getEventPosition(e.nativeEvent as MouseEvent | TouchEvent);
      if (!pos) return;
      setCurrentStroke((prev) => [...prev, pos]);
    },
    [isDrawing, getEventPosition],
  );

  const handleEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      setStrokes((prev) => [
        ...prev,
        { points: currentStroke, color: LINE_COLOR, lineWidth: LINE_WIDTH },
      ]);
    }
    setCurrentStroke([]);
  }, [isDrawing, currentStroke]);

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  const handleConfirm = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsUploading(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const file = new File([blob], 'signature.png', { type: 'image/png' });

      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const result = await uploadMedia(file, userId);
      onConfirm(result.url);
    } catch (error) {
      console.error('Failed to upload signature:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextConfirm = async () => {
    setIsUploading(true);
    try {
      // For text mode, we still need a canvas to store a "confirmation" as an image
      // Create a simple confirmation image with the text "DA XAC NHAN"
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 100);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 16px Times New Roman';
        ctx.textAlign = 'center';
        ctx.fillText('XÁC NHẬN ĐỒNG Ý KÝ HỢP ĐỒNG', 200, 55);
      }
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const file = new File([blob], 'signature-confirm.png', { type: 'image/png' });

      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const result = await uploadMedia(file, userId);
      onConfirm(result.url);
    } catch (error) {
      console.error('Failed to upload signature confirmation:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="signature-canvas-wrapper">
      <div className="signature-canvas-header">
        <h4 className="signature-canvas-title">
          <PenLine size={16} />
          Vẽ chữ ký
        </h4>
        <p className="signature-canvas-legal">
          Theo quy định pháp luật Việt Nam, chữ ký điện tử trong hợp đồng lao động
          có giá trị pháp lý khi được xác nhận bởi các bên ký thỏa thuận.
          Bằng việc ký hợp đồng này, bạn xác nhận đã đọc, hiểu và đồng ý với
          toàn bộ các điều khoản trong hợp đồng.
        </p>
      </div>

      <div className="signature-canvas-body">
        <div className="signature-canvas-toolbar">
          <button
            type="button"
            className="sig-toolbar-btn"
            onClick={handleUndo}
            disabled={strokes.length === 0 || isUploading}
            title="Hoàn tác"
          >
            <Undo2 size={14} />
            Hoàn tác
          </button>
          <button
            type="button"
            className="sig-toolbar-btn"
            onClick={handleClear}
            disabled={strokes.length === 0 || isUploading}
            title="Xóa tất cả"
          >
            <Eraser size={14} />
            Xóa
          </button>
          <span className="sig-toolbar-sep" />
          <button
            type="button"
            className={`sig-toolbar-btn ${useTextMode ? 'sig-toolbar-btn--active' : ''}`}
            onClick={() => setUseTextMode(!useTextMode)}
            disabled={isUploading}
          >
            <AlertCircle size={14} />
            {useTextMode ? 'Chuyển sang vẽ chữ ký' : 'Xác nhận không vẽ chữ ký'}
          </button>
        </div>

        {!useTextMode ? (
          <div className="signature-canvas-container">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="signature-canvas"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
              style={{ touchAction: 'none' }}
            />
            <div className="signature-canvas-border" />
          </div>
        ) : (
          <div className="signature-text-confirm">
            <AlertCircle size={20} className="sig-text-icon" />
            <p className="sig-text-message">
              Nếu bạn không muốn vẽ chữ ký, vui lòng xác nhận đồng ý bằng cách
              đánh dấu vào ô bên dưới.
            </p>
            <label className="sig-checkbox-label">
              <input
                type="checkbox"
                checked={textAgreed}
                onChange={(e) => setTextAgreed(e.target.checked)}
                disabled={isUploading}
              />
              <span>
                Tôi xác nhận đồng ý với các điều khoản trong hợp đồng này và xác nhận
                chữ ký điện tử của tôi.
              </span>
            </label>
          </div>
        )}

        <label className="sig-terms-label">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            disabled={isUploading}
          />
          <span>
            Tôi đã đọc kỹ và đồng ý với toàn bộ các điều khoản trong hợp đồng lao
            động này. Tôi hiểu rằng chữ ký điện tử này có giá trị pháp lý tương
            đương chữ ký tay.
          </span>
        </label>

        <div className="signature-canvas-actions">
          {onCancel && (
            <button
              type="button"
              className="sig-btn sig-btn--cancel"
              onClick={onCancel}
              disabled={isUploading}
            >
              Hủy
            </button>
          )}
          {!useTextMode ? (
            <button
              type="button"
              className="sig-btn sig-btn--confirm"
              onClick={handleConfirm}
              disabled={
                !agreedToTerms ||
                (strokes.length === 0 && currentStroke.length === 0) ||
                isUploading
              }
            >
              {isUploading ? (
                <>
                  <span className="sig-spinner" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Xác nhận chữ ký
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="sig-btn sig-btn--confirm"
              onClick={handleTextConfirm}
              disabled={!agreedToTerms || !textAgreed || isUploading}
            >
              {isUploading ? (
                <>
                  <span className="sig-spinner" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Xác nhận đồng ý
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvas;
