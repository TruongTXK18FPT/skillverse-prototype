import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Info, Shield, X, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/shared/Toast";
import "../../styles/PasswordPages.css";

const SetPasswordPage = () => {
  const { user, setPassword } = useAuth();
  const { toast, isVisible, hideToast, showError } = useToast();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const canSetPassword =
    user?.authProvider === "GOOGLE" && !user?.googleLinked;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await setPassword({ newPassword, confirmPassword });
      navigate("/login?reason=password_changed", { replace: true });
    } catch (error: unknown) {
      const errorMessage =
        (error as Error).message || "Đặt mật khẩu thất bại. Vui lòng thử lại.";
      showError("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  if (!canSetPassword) {
    return (
      <div className="cosmic-password-page">
        <div className="cosmic-password-card" style={{ maxWidth: 480 }}>
          <div className="cosmic-password-alert">
            <Info size={22} className="cosmic-password-alert__icon" />
            <div>
              <h3 className="cosmic-password-alert__title">Không khả dụng</h3>
              <p className="cosmic-password-alert__text">
                Chức năng này chỉ dành cho người dùng đăng nhập bằng Google
                và chưa thiết lập mật khẩu dự phòng.
              </p>
              <button
                className="cosmic-password-alert__btn"
                onClick={() => navigate("/dashboard")}
              >
                Quay lại Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cosmic-password-page">
      <div className="cosmic-password-card">
        {/* LEFT: Form */}
        <div className="cosmic-password-card__left">
          <div className="cosmic-password-header">
            <div className="cosmic-password-header__icon-wrap">
              <Shield size={26} />
            </div>
            <h1 className="cosmic-password-header__title">
              Đặt mật khẩu dự phòng
            </h1>
            <p className="cosmic-password-header__subtitle">
              Tạo mật khẩu để đăng nhập bằng email khi Google không khả dụng
            </p>
          </div>

          <div className="cosmic-password-banner">
            <Info size={14} style={{ flexShrink: 0, marginTop: 2, color: "var(--cp-primary)" }} />
            <span>
              Tính năng tùy chọn — bạn vẫn có thể đăng nhập bằng Google bình thường.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="cosmic-password-form">
            <div className="cosmic-password-form__group">
              <label htmlFor="newPassword" className="cosmic-password-form__label">
                <Lock size={12} />
                Mật khẩu mới
              </label>
              <div
                className={`cosmic-password-form__input-wrap ${
                  errors.newPassword
                    ? "cosmic-password-form__input-wrap--error"
                    : ""
                }`}
              >
                <Lock size={16} className="cosmic-password-form__input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: "" });
                    }
                  }}
                  placeholder="Tối thiểu 8 ký tự"
                  className="cosmic-password-form__input"
                />
                <button
                  type="button"
                  className="cosmic-password-form__toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.newPassword && (
                <span className="cosmic-password-form__error">
                  {errors.newPassword}
                </span>
              )}
            </div>

            <div className="cosmic-password-form__group">
              <label
                htmlFor="confirmPassword"
                className="cosmic-password-form__label"
              >
                <Lock size={12} />
                Xác nhận mật khẩu
              </label>
              <div
                className={`cosmic-password-form__input-wrap ${
                  errors.confirmPassword
                    ? "cosmic-password-form__input-wrap--error"
                    : ""
                }`}
              >
                <Lock size={16} className="cosmic-password-form__input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: "" });
                    }
                  }}
                  placeholder="Nhập lại mật khẩu"
                  className="cosmic-password-form__input"
                />
                <button
                  type="button"
                  className="cosmic-password-form__toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="cosmic-password-form__error">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            <div className="cosmic-password-form__actions">
              <button
                type="button"
                className="cosmic-password-form__btn cosmic-password-form__btn--secondary"
                onClick={handleSkip}
                disabled={loading}
              >
                <X size={14} />
                Bỏ qua
              </button>
              <button
                type="submit"
                className="cosmic-password-form__btn cosmic-password-form__btn--primary"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đặt mật khẩu"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: Info */}
        <div className="cosmic-password-card__right">
          <div className="cosmic-password-info-card">
            <h3 className="cosmic-password-info-card__title">Lợi ích</h3>

            <div className="cosmic-password-benefit">
              <KeyRound size={15} className="cosmic-password-benefit__icon" />
              <div>
                <div className="cosmic-password-benefit__title">Đăng nhập linh hoạt</div>
                <div className="cosmic-password-benefit__text">Dùng email + password thay vì chỉ Google</div>
              </div>
            </div>

            <div className="cosmic-password-benefit">
              <ShieldCheck size={15} className="cosmic-password-benefit__icon" />
              <div>
                <div className="cosmic-password-benefit__title">Backup khi Google lỗi</div>
                <div className="cosmic-password-benefit__text">Không lo mất quyền truy cập</div>
              </div>
            </div>

            <div className="cosmic-password-benefit">
              <RefreshCw size={15} className="cosmic-password-benefit__icon" />
              <div>
                <div className="cosmic-password-benefit__title">Không phụ thuộc bên thứ 3</div>
                <div className="cosmic-password-benefit__text">Tự chủ hoàn toàn tài khoản</div>
              </div>
            </div>
          </div>

          <div className="cosmic-password-tips">
            <h4 className="cosmic-password-tips__title">Mẹo mật khẩu mạnh</h4>
            <ul className="cosmic-password-tips__list">
              <li className="cosmic-password-tips__item">Tối thiểu 8 ký tự</li>
              <li className="cosmic-password-tips__item">Kết hợp chữ hoa &amp; thường</li>
              <li className="cosmic-password-tips__item">Thêm số và ký tự đặc biệt</li>
              <li className="cosmic-password-tips__item">Không dùng thông tin cá nhân</li>
            </ul>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={isVisible}
          onClose={hideToast}
          autoCloseDelay={toast.autoCloseDelay}
        />
      )}
    </div>
  );
};

export default SetPasswordPage;
