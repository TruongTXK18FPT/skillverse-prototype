import React from "react";
import {
  Briefcase,
  Zap,
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  ArrowRight,
  FileText,
  Shield,
} from "lucide-react";
import "./short-term-fleet.css";

interface JobTypeSelectorProps {
  onSelectFullTime: () => void;
  onSelectShortTerm: () => void;
}

const JobTypeSelector: React.FC<JobTypeSelectorProps> = ({
  onSelectFullTime,
  onSelectShortTerm,
}) => {
  return (
    <div className="stj-type-selector">
      <h2 className="stj-type-selector__title">Chọn Loại Hình Tuyển Dụng</h2>
      <p className="stj-type-selector__subtitle">
        Chọn hình thức phù hợp với nhu cầu tuyển dụng của doanh nghiệp
      </p>

      <div className="stj-type-selector__grid">
        {/* Full-time Card */}
        <div
          className="stj-type-card stj-type-card--fulltime"
          onClick={onSelectFullTime}
        >
          <div className="stj-type-card__icon">
            <Briefcase size={36} />
          </div>
          <h3 className="stj-type-card__title">Tuyển Dụng Dài Hạn</h3>
          <p className="stj-type-card__desc">
            Đăng tin tuyển dụng nhân viên chính thức, thực tập sinh hoặc cộng
            tác viên lâu dài.
          </p>
          <ul className="stj-type-card__features">
            <li className="stj-type-card__feature">
              <span className="stj-type-card__feature-icon">
                <Users size={12} />
              </span>
              Quản lý ứng viên đa giai đoạn
            </li>
            <li className="stj-type-card__feature">
              <span className="stj-type-card__feature-icon">
                <FileText size={12} />
              </span>
              Quy trình phỏng vấn chuyên nghiệp
            </li>
            <li className="stj-type-card__feature">
              <span className="stj-type-card__feature-icon">
                <Shield size={12} />
              </span>
              Hợp đồng và chế độ đãi ngộ
            </li>
            <li className="stj-type-card__feature">
              <span className="stj-type-card__feature-icon">
                <CheckCircle size={12} />
              </span>
              Số lượng tuyển linh hoạt
            </li>
          </ul>
          <div className="stj-type-card__action">
            <button className="stj-type-card__btn">
              Đăng Tuyển Dụng <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Short-term Card */}
        <div
          className="stj-type-card stj-type-card--shortterm"
          onClick={onSelectShortTerm}
        >
          <div className="stj-type-card__icon">
            <Zap size={36} />
          </div>
          <h3 className="stj-type-card__title">Việc Ngắn Hạn / Gig</h3>
          <p className="stj-type-card__desc">
            Đăng công việc freelance, dự án ngắn hạn hoặc task cần hoàn thành
            nhanh.
          </p>
          <ul className="stj-type-card__features">
            <li className="stj-type-card__feature">
              <span className="stj-type-card__feature-icon">
                <Clock size={12} />
              </span>
              Deadline và milestone rõ ràng
            </li>
            <li className="stj-type-card__feature">
              <span className="stj-type-card__feature-icon">
                <DollarSign size={12} />
              </span>
              Thanh toán theo dự án
            </li>
            <li className="stj-type-card__feature">
              <span className="stj-type-card__feature-icon">
                <CheckCircle size={12} />
              </span>
              Review & đánh giá chất lượng
            </li>
            <li className="stj-type-card__feature">
              <span className="stj-type-card__feature-icon">
                <Zap size={12} />
              </span>
              Quy trình nhanh gọn
            </li>
          </ul>
          <div className="stj-type-card__action">
            <button className="stj-type-card__btn">
              Đăng Việc Ngắn Hạn <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobTypeSelector;
