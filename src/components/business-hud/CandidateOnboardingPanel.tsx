import React, { useState, useCallback, useRef } from 'react';
import {
  CreditCard,
  User,
  Calendar,
  MapPin,
  Home,
  Landmark,
  GitBranch,
  Hash,
  UserCheck,
  ScanLine,
  CheckCircle2,
  XCircle,
  Shield,
  Zap,
  Lock,
  AlertTriangle,
  Send,
  Loader2,
  Upload,
} from 'lucide-react';
import contractService, {
  IdCardExtractionResult,
  OnboardingInfoRequest,
} from '../../services/contractService';
import './CandidateOnboardingPanel.css';

// ==================== CONSTANTS ====================

const VIETNAM_BANKS = [
  'Vietcombank (VCB)',
  'VietinBank (CTG)',
  'BIDV',
  'Techcombank (TCB)',
  'MB Bank',
  'ACB',
  'Sacombank (STB)',
  'VPBank',
  'HDBank',
  'TPBank',
  'SHB',
  'OCB',
  'MSB',
  'LienVietPostBank',
  'SeABank',
  'Eximbank',
  'VIB',
  'Nam A Bank',
  'Bac A Bank',
  'Khác',
];

// ==================== TYPES ====================

interface CandidateOnboardingPanelProps {
  applicationId: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

// ==================== COMPONENT ====================

const CandidateOnboardingPanel: React.FC<CandidateOnboardingPanelProps> = ({
  applicationId,
  onComplete,
  onCancel,
}) => {
  // OCR state
  const [isScanningFront, setIsScanningFront] = useState(false);
  const [isScanningBack, setIsScanningBack] = useState(false);
  const [frontOcrResult, setFrontOcrResult] = useState<IdCardExtractionResult | null>(null);
  const [backOcrResult, setBackOcrResult] = useState<IdCardExtractionResult | null>(null);
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [idCardNumber, setIdCardNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [idCardDate, setIdCardDate] = useState('');
  const [idCardPlace, setIdCardPlace] = useState('');
  const [address, setAddress] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(true);
  const [hasPreviousInfo, setHasPreviousInfo] = useState(false);

  // ==================== FETCH PREVIOUS INFO ====================

  React.useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const info = await contractService.getLatestOnboardingInfo();
        if (isMounted && info) {
          setHasPreviousInfo(true);
          if (info.idCardNumber) setIdCardNumber(info.idCardNumber);
          if (info.fullName) setFullName(info.fullName);
          if (info.dateOfBirth) {
            // Convert dd/MM/yyyy to yyyy-MM-dd
            const parts = info.dateOfBirth.split('/');
            if (parts.length === 3) {
              setDateOfBirth(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
          }
          if (info.idCardDate) setIdCardDate(info.idCardDate);
          if (info.idCardPlace) setIdCardPlace(info.idCardPlace);
          if (info.address) setAddress(info.address);
          if (info.bankAccountNumber) setBankAccountNumber(info.bankAccountNumber);
          if (info.bankName) {
            if (info.bankName.includes(' - Chi nhánh ')) {
              const [name, branch] = info.bankName.split(' - Chi nhánh ');
              setBankName(name);
              setBankBranch(branch);
            } else {
              setBankName(info.bankName);
            }
          }
          if (info.bankAccountHolder) setBankAccountHolder(info.bankAccountHolder);
        }
      } catch (err) {
        console.error('Failed to fetch previous onboarding info:', err);
      } finally {
        if (isMounted) setIsLoadingPrevious(false);
      }
    };
    void fetchLatest();
    return () => {
      isMounted = false;
    };
  }, []);

  // ==================== OCR HANDLER ====================

  const processOcrResult = (result: IdCardExtractionResult) => {
    if (result.success) {
      if (result.idNumber) setIdCardNumber(result.idNumber);
      if (result.fullName) {
        setFullName(result.fullName);
        setBankAccountHolder(result.fullName);
      }
      if (result.dob) setDateOfBirth(result.dob);
      if (result.placeOfResidence) setAddress(result.placeOfResidence);
      if (result.issueDate) {
        const parts = result.issueDate.split('/');
        if (parts.length === 3) {
          setIdCardDate(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      if (result.issueLoc) setIdCardPlace(result.issueLoc);
    }
  };

  const handleFrontFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh (JPG, PNG, JPEG)');
      return;
    }
    setIsScanningFront(true);
    setError(null);
    setFrontOcrResult(null);
    try {
      const result = await contractService.ocrIdCard(applicationId, file);
      setFrontOcrResult(result);
      processOcrResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi OCR mặt trước');
    } finally {
      setIsScanningFront(false);
    }
  }, [applicationId]);

  const handleBackFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh (JPG, PNG, JPEG)');
      return;
    }
    setIsScanningBack(true);
    setError(null);
    setBackOcrResult(null);
    try {
      const result = await contractService.ocrIdCard(applicationId, file);
      setBackOcrResult(result);
      processOcrResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi OCR mặt sau');
    } finally {
      setIsScanningBack(false);
    }
  }, [applicationId]);

  const handleFrontDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length > 0) handleFrontFileSelect(e.dataTransfer.files[0]);
  }, [handleFrontFileSelect]);

  const handleBackDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length > 0) handleBackFileSelect(e.dataTransfer.files[0]);
  }, [handleBackFileSelect]);

  const handleFrontDropzoneClick = () => frontFileInputRef.current?.click();
  const handleBackDropzoneClick = () => backFileInputRef.current?.click();

  // ==================== SUBMIT HANDLER ====================

  const handleSubmit = async () => {
    // Validate
    if (!idCardNumber || !fullName || !idCardDate || !idCardPlace) {
      setError('Vui lòng điền đầy đủ thông tin CCCD');
      return;
    }
    if (!bankAccountNumber || !bankName || !bankAccountHolder) {
      setError('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const finalBankName = bankBranch.trim() 
        ? `${bankName.trim()} - Chi nhánh ${bankBranch.trim()}` 
        : bankName.trim();

      const data: OnboardingInfoRequest = {
        idCardNumber,
        fullName,
        dateOfBirth: dateOfBirth || undefined,
        idCardDate,
        idCardPlace,
        address: address || undefined,
        bankAccountNumber,
        bankName: finalBankName,
        bankAccountHolder,
      };

      await contractService.submitOnboardingInfo(applicationId, data);
      setSubmitted(true);
      onComplete?.();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== RENDER: SUCCESS STATE ====================

  if (submitted) {
    return (
      <div className="sv-onboarding-panel">
        <div className="sv-onboarding-success">
          <div className="sv-onboarding-success__icon">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="sv-onboarding-success__title">Hoàn tất cung cấp thông tin</h2>
          <p className="sv-onboarding-success__desc">
            Thông tin của bạn đã được gửi thành công. Nhà tuyển dụng sẽ soạn hợp đồng cho bạn.
          </p>
          <div className="sv-onboarding-success__waiting">
            <div className="sv-onboarding-success__waiting-dot" />
            Đang chờ nhà tuyển dụng gửi hợp đồng...
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER: FORM ====================

  return (
    <div className="sv-onboarding-panel">
      <div className="sv-onboarding-panel__header">
        <h2 className="sv-onboarding-panel__title">Cung Cấp Thông Tin Nhân Sự</h2>
        <p className="sv-onboarding-panel__subtitle">
          Vui lòng cung cấp thông tin CCCD và tài khoản ngân hàng để hoàn tất quy trình tuyển dụng
        </p>
      </div>

      {isLoadingPrevious ? (
        <div className="sv-onboarding-loading">
          <div className="sv-onboarding-loading__spinner" />
          <span className="sv-onboarding-loading__text">Đang kiểm tra dữ liệu nhân sự đã lưu...</span>
        </div>
      ) : hasPreviousInfo ? (
        <div className="sv-onboarding-status sv-onboarding-status--previous">
          <span className="sv-onboarding-status__icon">
            <Zap size={18} />
          </span>
          <span className="sv-onboarding-status__text">
            Thông tin nhân sự của bạn đã được lấy từ các hợp đồng trước đó. Bạn có thể kiểm tra lại và nhấn Gửi ngay.
          </span>
        </div>
      ) : (
        <div className="sv-onboarding-status sv-onboarding-status--info">
          <span className="sv-onboarding-status__icon">
            <Lock size={16} />
          </span>
          <span className="sv-onboarding-status__text">
            Ảnh CCCD của bạn sẽ KHÔNG được lưu trữ — chỉ trích xuất dữ liệu chữ qua AI
          </span>
        </div>
      )}

      {error && (
        <div className="sv-onboarding-status sv-onboarding-status--error">
          <span className="sv-onboarding-status__icon">
            <AlertTriangle size={16} />
          </span>
          <span className="sv-onboarding-status__text">{error}</span>
        </div>
      )}

      {/* ==================== SECTION 1: CCCD OCR ==================== */}
      <div className="sv-onboarding-section">
        <div className="sv-onboarding-section__header">
          <div className="sv-onboarding-section__icon">
            <Shield size={18} />
          </div>
          <h3 className="sv-onboarding-section__title sv-onboarding-section__title--cyan">
            Xác thực căn cước công dân
          </h3>
        </div>

        {!hasPreviousInfo && (
          <div className="sv-onboarding-form-grid">
            {/* Front Dropzone */}
            <div
              className={`sv-onboarding-dropzone ${isScanningFront ? 'sv-onboarding-dropzone--active' : ''}`}
              onClick={handleFrontDropzoneClick}
              onDrop={handleFrontDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {isScanningFront && (
                <div className="sv-onboarding-scanner">
                  <div className="sv-onboarding-scanner__line" />
                </div>
              )}
              <div className="sv-onboarding-dropzone__icon-wrapper">
                {isScanningFront ? <ScanLine size={22} /> : <Upload size={22} />}
              </div>
              <p className="sv-onboarding-dropzone__text">
                {isScanningFront ? (
                  'Đang quét mặt trước...'
                ) : (
                  <>
                    <span className="sv-onboarding-dropzone__text--highlight">Mặt trước</span> CCCD
                  </>
                )}
              </p>
              <p className="sv-onboarding-dropzone__hint">Kéo thả hoặc nhấn để chọn ảnh</p>
              <input
                ref={frontFileInputRef}
                className="sv-onboarding-dropzone__input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFrontFileSelect(e.target.files[0]);
                  }
                }}
              />
              {frontOcrResult && (
                <div className="sv-onboarding-ocr-result">
                  <span className={`sv-onboarding-ocr-result__badge ${frontOcrResult.success ? 'sv-onboarding-ocr-result__badge--success' : 'sv-onboarding-ocr-result__badge--error'}`}>
                    {frontOcrResult.success ? (
                      <><CheckCircle2 size={12} /> Thành công</>
                    ) : (
                      <><XCircle size={12} /> Thất bại</>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Back Dropzone */}
            <div
              className={`sv-onboarding-dropzone ${isScanningBack ? 'sv-onboarding-dropzone--active' : ''}`}
              onClick={handleBackDropzoneClick}
              onDrop={handleBackDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {isScanningBack && (
                <div className="sv-onboarding-scanner">
                  <div className="sv-onboarding-scanner__line" />
                </div>
              )}
              <div className="sv-onboarding-dropzone__icon-wrapper">
                {isScanningBack ? <ScanLine size={22} /> : <Upload size={22} />}
              </div>
              <p className="sv-onboarding-dropzone__text">
                {isScanningBack ? (
                  'Đang quét mặt sau...'
                ) : (
                  <>
                    <span className="sv-onboarding-dropzone__text--highlight">Mặt sau</span> CCCD
                  </>
                )}
              </p>
              <p className="sv-onboarding-dropzone__hint">Kéo thả hoặc nhấn để chọn ảnh</p>
              <input
                ref={backFileInputRef}
                className="sv-onboarding-dropzone__input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleBackFileSelect(e.target.files[0]);
                  }
                }}
              />
              {backOcrResult && (
                <div className="sv-onboarding-ocr-result">
                  <span className={`sv-onboarding-ocr-result__badge ${backOcrResult.success ? 'sv-onboarding-ocr-result__badge--success' : 'sv-onboarding-ocr-result__badge--error'}`}>
                    {backOcrResult.success ? (
                      <><CheckCircle2 size={12} /> Thành công</>
                    ) : (
                      <><XCircle size={12} /> Thất bại</>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CCCD Form Fields */}
        <div className="sv-onboarding-form-grid" style={{ marginTop: 20 }}>
          <div className="sv-onboarding-field">
            <label className="sv-onboarding-field__label sv-onboarding-field__label--required">
              <CreditCard size={12} /> Số CCCD
            </label>
            <input
              className="sv-onboarding-field__input"
              type="text"
              placeholder="07xxxxxxxxx"
              value={idCardNumber}
              onChange={(e) => setIdCardNumber(e.target.value)}
            />
          </div>
          <div className="sv-onboarding-field">
            <label className="sv-onboarding-field__label sv-onboarding-field__label--required">
              <User size={12} /> Họ và tên
            </label>
            <input
              className="sv-onboarding-field__input"
              type="text"
              placeholder="NGUYEN VAN A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="sv-onboarding-field">
            <label className="sv-onboarding-field__label">
              <Calendar size={12} /> Ngày sinh
            </label>
            <input
              className="sv-onboarding-field__input"
              type="text"
              placeholder="dd/MM/yyyy"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
          <div className="sv-onboarding-field">
            <label className="sv-onboarding-field__label sv-onboarding-field__label--required">
              <Calendar size={12} /> Ngày cấp
            </label>
            <input
              className="sv-onboarding-field__input"
              type="date"
              value={idCardDate}
              onChange={(e) => setIdCardDate(e.target.value)}
            />
          </div>
          <div className="sv-onboarding-field sv-onboarding-form-grid--full">
            <label className="sv-onboarding-field__label sv-onboarding-field__label--required">
              <MapPin size={12} /> Nơi cấp
            </label>
            <input
              className="sv-onboarding-field__input"
              type="text"
              placeholder="Cục Cảnh sát QLHC về TTXH"
              value={idCardPlace}
              onChange={(e) => setIdCardPlace(e.target.value)}
            />
          </div>
          <div className="sv-onboarding-field sv-onboarding-form-grid--full">
            <label className="sv-onboarding-field__label">
              <Home size={12} /> Địa chỉ thường trú
            </label>
            <input
              className="sv-onboarding-field__input"
              type="text"
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ==================== SECTION 2: BANK INFO ==================== */}
      <div className="sv-onboarding-section">
        <div className="sv-onboarding-section__header">
          <div className="sv-onboarding-section__icon sv-onboarding-section__icon--bank">
            <Landmark size={18} />
          </div>
          <h3 className="sv-onboarding-section__title sv-onboarding-section__title--emerald">
            Thông tin ngân hàng nhận lương
          </h3>
        </div>

        <div className="sv-onboarding-form-grid">
          <div className="sv-onboarding-field">
            <label className="sv-onboarding-field__label sv-onboarding-field__label--required">
              <Landmark size={12} /> Tên ngân hàng
            </label>
            <input
              className="sv-onboarding-field__input"
              type="text"
              list="vietnam-banks-list"
              placeholder="VD: Vietcombank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
            <datalist id="vietnam-banks-list">
              {VIETNAM_BANKS.map((bank) => (
                <option key={bank} value={bank} />
              ))}
            </datalist>
          </div>
          <div className="sv-onboarding-field">
            <label className="sv-onboarding-field__label">
              <GitBranch size={12} /> Chi nhánh
            </label>
            <input
              className="sv-onboarding-field__input"
              type="text"
              placeholder="VD: Chi nhánh Thăng Long"
              value={bankBranch}
              onChange={(e) => setBankBranch(e.target.value)}
            />
          </div>
          <div className="sv-onboarding-field">
            <label className="sv-onboarding-field__label sv-onboarding-field__label--required">
              <Hash size={12} /> Số tài khoản
            </label>
            <input
              className="sv-onboarding-field__input"
              type="text"
              placeholder="0123456789"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
            />
          </div>
          <div className="sv-onboarding-field">
            <label className="sv-onboarding-field__label sv-onboarding-field__label--required">
              <UserCheck size={12} /> Tên chủ tài khoản
            </label>
            <input
              className="sv-onboarding-field__input"
              type="text"
              placeholder="NGUYEN VAN A"
              value={bankAccountHolder}
              onChange={(e) => setBankAccountHolder(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ==================== ACTIONS ==================== */}
      <div className="sv-onboarding-actions">
        {onCancel && (
          <button className="sv-onboarding-btn sv-onboarding-btn--secondary" onClick={onCancel}>
            Hủy
          </button>
        )}
        <button
          className="sv-onboarding-btn sv-onboarding-btn--primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="sv-onboarding-spinner" />
              Đang gửi...
            </>
          ) : hasPreviousInfo ? (
            <>
              <Send size={16} />
              Dùng thông tin này & Gửi
            </>
          ) : (
            <>
              <Send size={16} />
              Xác nhận & Gửi thông tin
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CandidateOnboardingPanel;
