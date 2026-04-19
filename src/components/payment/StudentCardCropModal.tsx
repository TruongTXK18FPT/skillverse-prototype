import { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Cropper, { Area } from "react-easy-crop";
import { CheckCircle2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import getCroppedImg from "../../utils/cropImage";
import styles from "./StudentCardCropModal.module.css";

interface StudentCardCropModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => Promise<void> | void;
}

const CARD_ASPECT_RATIO = 85.6 / 54;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

const clampAspectRatio = (ratio: number) => {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return CARD_ASPECT_RATIO;
  }

  return Math.min(2.4, Math.max(0.56, ratio));
};

const StudentCardCropModal = ({
  isOpen,
  imageUrl,
  onCancel,
  onConfirm,
}: StudentCardCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [naturalAspectRatio, setNaturalAspectRatio] = useState<number | null>(
    null,
  );
  const [aspectMode, setAspectMode] = useState<"adaptive" | "card">(
    "adaptive",
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setCroppedAreaPixels(null);
    setErrorMessage(null);
    setNaturalAspectRatio(null);
    setAspectMode("adaptive");
  }, [isOpen, imageUrl]);

  useEffect(() => {
    if (!isOpen || !imageUrl) {
      return;
    }

    let isCurrent = true;
    const image = new Image();

    image.onload = () => {
      if (!isCurrent) {
        return;
      }

      const ratio = image.naturalWidth / image.naturalHeight;
      setNaturalAspectRatio(clampAspectRatio(ratio));
    };

    image.onerror = () => {
      if (!isCurrent) {
        return;
      }

      setNaturalAspectRatio(CARD_ASPECT_RATIO);
    };

    image.src = imageUrl;

    return () => {
      isCurrent = false;
    };
  }, [isOpen, imageUrl]);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, nextCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(nextCroppedAreaPixels);
    },
    [],
  );

  const handleCancel = () => {
    if (isCropping) {
      return;
    }

    onCancel();
  };

  const handleConfirm = async () => {
    if (!imageUrl || !croppedAreaPixels || isCropping) {
      return;
    }

    setIsCropping(true);
    setErrorMessage(null);

    try {
      const croppedFile = await getCroppedImg(imageUrl, croppedAreaPixels);
      if (!croppedFile) {
        throw new Error("Không thể cắt ảnh thẻ sinh viên.");
      }

      await onConfirm(croppedFile);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể cắt ảnh thẻ sinh viên.",
      );
    } finally {
      setIsCropping(false);
    }
  };

  const handleResetFrame = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
  };

  const handleSwitchAspectMode = (nextMode: "adaptive" | "card") => {
    setAspectMode(nextMode);
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
  };

  const effectiveAspectRatio =
    aspectMode === "adaptive"
      ? (naturalAspectRatio ?? CARD_ASPECT_RATIO)
      : CARD_ASPECT_RATIO;

  const aspectMetaText =
    aspectMode === "adaptive"
      ? `Tỉ lệ ảnh gốc ${effectiveAspectRatio.toFixed(2)}:1`
      : `Tỉ lệ thẻ chuẩn ${CARD_ASPECT_RATIO.toFixed(2)}:1`;

  if (!isOpen || !imageUrl) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className={styles.studentCardCropOverlay} onClick={handleCancel}>
      <div
        className={styles.studentCardCropModal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.studentCardCropHeader}>
          <h3>Cắt ảnh thẻ sinh viên</h3>
          <button
            type="button"
            className={styles.studentCardCropClose}
            onClick={handleCancel}
            disabled={isCropping}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <p className={styles.studentCardCropHint}>
          Kéo ảnh để căn khung. Mặc định modal giữ tỉ lệ ảnh gốc để tránh mất đầu
          hoặc mất phần dưới của thẻ.
        </p>

        <div className={styles.studentCardCropMode}>
          <button
            type="button"
            className={`${styles.studentCardCropModeBtn} ${
              aspectMode === "adaptive"
                ? styles.studentCardCropModeBtnActive
                : ""
            }`}
            onClick={() => handleSwitchAspectMode("adaptive")}
            disabled={isCropping}
          >
            Theo tỉ lệ ảnh gốc
          </button>
          <button
            type="button"
            className={`${styles.studentCardCropModeBtn} ${
              aspectMode === "card" ? styles.studentCardCropModeBtnActive : ""
            }`}
            onClick={() => handleSwitchAspectMode("card")}
            disabled={isCropping}
          >
            Khung thẻ chuẩn
          </button>
        </div>
        <p className={styles.studentCardCropAspectMeta}>{aspectMetaText}</p>

        <div className={styles.studentCardCropStage}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={effectiveAspectRatio}
            showGrid
            objectFit="contain"
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className={styles.studentCardCropTools}>
          <div className={styles.studentCardCropZoomLabel}>
            <ZoomOut size={16} />
            <span>Zoom</span>
            <ZoomIn size={16} />
          </div>
          <input
            aria-label="Zoom ảnh thẻ"
            className={styles.studentCardCropSlider}
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            disabled={isCropping}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <button
            type="button"
            className={styles.studentCardCropReset}
            onClick={handleResetFrame}
            disabled={isCropping}
          >
            <RotateCcw size={14} />
            Đặt lại khung
          </button>
        </div>

        {errorMessage && (
          <div className={styles.studentCardCropError}>{errorMessage}</div>
        )}

        <div className={styles.studentCardCropActions}>
          <button
            type="button"
            className={styles.studentCardCropSecondaryBtn}
            onClick={handleCancel}
            disabled={isCropping}
          >
            Hủy
          </button>
          <button
            type="button"
            className={styles.studentCardCropPrimaryBtn}
            onClick={handleConfirm}
            disabled={isCropping}
          >
            {isCropping ? (
              <span className={styles.studentCardCropSpinner} />
            ) : (
              <CheckCircle2 size={15} />
            )}
            Xác nhận ảnh
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default StudentCardCropModal;
