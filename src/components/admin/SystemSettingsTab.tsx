import React, { useState } from 'react';
import './SystemSettingsTab.css';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, title, description }) => (
  <div className="administrator-settings-toggle">
    <div className="administrator-settings-toggle-info">
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
    <button 
      type="button"
      className={`administrator-settings-switch ${checked ? 'active' : ''}`}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      role="switch"
      aria-checked={checked}
      aria-label={`${title}: ${checked ? 'Bật' : 'Tắt'}`}
    />
  </div>
);

const SystemSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState({
    platformName: 'SkillVerse',
    platformDescription: 'Nền tảng kết nối mentor và học viên',
    maintenanceMode: false,
    userRegistration: true,
    emailVerification: true,
    twoFactorAuth: false,
    maxFileSize: '10',
    sessionTimeout: '30',
    commissionRate: '15',
    withdrawalThreshold: '100000',
    emailProvider: 'smtp',
    emailHost: 'smtp.gmail.com',
    emailPort: '587',
    paymentGateway: 'vnpay',
    sandboxMode: true
  });

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    console.log('Saving settings:', settings);
    alert('Cài đặt đã được lưu thành công!');
  };

  const handleResetSettings = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục cài đặt mặc định?')) {
      console.log('Resetting settings to default');
      alert('Cài đặt đã được khôi phục về mặc định!');
    }
  };

  return (
    <div className="administrator-settings">
      <div className="administrator-settings-header">
        <h2>Cài Đặt Hệ Thống</h2>
        <p>Cấu hình và quản lý các thông số của nền tảng</p>
      </div>

      <div className="administrator-settings-status">
        Hệ thống đang hoạt động bình thường
      </div>

      <div className="administrator-settings-sections">
        <div className="administrator-settings-section platform">
          <h3>Cấu Hình Nền Tảng</h3>
          
          <div className="administrator-settings-form-group">
            <label htmlFor="platform-name">Tên nền tảng:</label>
            <input
              id="platform-name"
              type="text"
              value={settings.platformName}
              onChange={(e) => handleSettingChange('platformName', e.target.value)}
            />
          </div>

          <div className="administrator-settings-form-group">
            <label htmlFor="platform-description">Mô tả nền tảng:</label>
            <textarea
              id="platform-description"
              value={settings.platformDescription}
              onChange={(e) => handleSettingChange('platformDescription', e.target.value)}
              rows={3}
            />
          </div>

          <ToggleSwitch
            checked={settings.maintenanceMode}
            onChange={(checked) => handleSettingChange('maintenanceMode', checked)}
            title="Chế độ bảo trì"
            description="Tạm thời ngừng hoạt động nền tảng để bảo trì"
          />

          <ToggleSwitch
            checked={settings.userRegistration}
            onChange={(checked) => handleSettingChange('userRegistration', checked)}
            title="Cho phép đăng ký"
            description="Người dùng mới có thể tạo tài khoản"
          />

          <div className="administrator-settings-grid">
            <div className="administrator-settings-form-group">
              <label htmlFor="max-file-size">Kích thước file tối đa (MB):</label>
              <input
                id="max-file-size"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => handleSettingChange('maxFileSize', e.target.value)}
              />
            </div>
            <div className="administrator-settings-form-group">
              <label htmlFor="session-timeout">Thời gian phiên (phút):</label>
              <input
                id="session-timeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
              />
            </div>
          </div>

          <button className="administrator-settings-btn save" onClick={handleSaveSettings}>
            Lưu cài đặt nền tảng
          </button>
        </div>

        <div className="administrator-settings-section security">
          <h3>Cấu Hình Bảo Mật</h3>
          
          <ToggleSwitch
            checked={settings.emailVerification}
            onChange={(checked) => handleSettingChange('emailVerification', checked)}
            title="Xác thực email"
            description="Yêu cầu xác thực email khi đăng ký"
          />

          <ToggleSwitch
            checked={settings.twoFactorAuth}
            onChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
            title="Xác thực 2 bước"
            description="Bắt buộc xác thực 2 bước cho admin"
          />

          <div className="administrator-settings-form-group">
            <label htmlFor="password-policy">Chính sách mật khẩu:</label>
            <select id="password-policy">
              <option value="basic">Cơ bản (8 ký tự)</option>
              <option value="medium">Trung bình (8 ký tự + số)</option>
              <option value="strong">Mạnh (8 ký tự + số + ký tự đặc biệt)</option>
            </select>
          </div>

          <div className="administrator-settings-form-group">
            <label htmlFor="max-login-attempts">Số lần đăng nhập sai tối đa:</label>
            <select id="max-login-attempts">
              <option value="3">3 lần</option>
              <option value="5">5 lần</option>
              <option value="10">10 lần</option>
            </select>
          </div>

          <button className="administrator-settings-btn save" onClick={handleSaveSettings}>
            Lưu cài đặt bảo mật
          </button>
        </div>

        <div className="administrator-settings-section email">
          <h3>Cấu Hình Email</h3>
          
          <div className="administrator-settings-form-group">
            <label htmlFor="email-provider">Nhà cung cấp email:</label>
            <select
              id="email-provider"
              value={settings.emailProvider}
              onChange={(e) => handleSettingChange('emailProvider', e.target.value)}
            >
              <option value="smtp">SMTP</option>
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
            </select>
          </div>

          <div className="administrator-settings-grid">
            <div className="administrator-settings-form-group">
              <label htmlFor="smtp-host">Host SMTP:</label>
              <input
                id="smtp-host"
                type="text"
                value={settings.emailHost}
                onChange={(e) => handleSettingChange('emailHost', e.target.value)}
              />
            </div>
            <div className="administrator-settings-form-group">
              <label htmlFor="smtp-port">Cổng SMTP:</label>
              <input
                id="smtp-port"
                type="text"
                value={settings.emailPort}
                onChange={(e) => handleSettingChange('emailPort', e.target.value)}
              />
            </div>
          </div>

          <div className="administrator-settings-form-group">
            <label htmlFor="default-email">Email gửi đi mặc định:</label>
            <input
              id="default-email"
              type="email"
              placeholder="noreply@skillverse.com"
            />
          </div>

          <button className="administrator-settings-btn save" onClick={handleSaveSettings}>
            Lưu cài đặt email
          </button>
        </div>

        <div className="administrator-settings-section payment">
          <h3>Cấu Hình Thanh Toán</h3>
          
          <div className="administrator-settings-form-group">
            <label htmlFor="payment-gateway">Cổng thanh toán:</label>
            <select
              id="payment-gateway"
              value={settings.paymentGateway}
              onChange={(e) => handleSettingChange('paymentGateway', e.target.value)}
            >
              <option value="vnpay">VNPay</option>
              <option value="momo">MoMo</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          <ToggleSwitch
            checked={settings.sandboxMode}
            onChange={(checked) => handleSettingChange('sandboxMode', checked)}
            title="Chế độ thử nghiệm"
            description="Sử dụng môi trường test cho thanh toán"
          />

          <div className="administrator-settings-grid">
            <div className="administrator-settings-form-group">
              <label htmlFor="commission-rate">Tỷ lệ hoa hồng (%):</label>
              <input
                id="commission-rate"
                type="number"
                value={settings.commissionRate}
                onChange={(e) => handleSettingChange('commissionRate', e.target.value)}
              />
            </div>
            <div className="administrator-settings-form-group">
              <label htmlFor="withdrawal-threshold">Ngưỡng rút tiền (VNĐ):</label>
              <input
                id="withdrawal-threshold"
                type="number"
                value={settings.withdrawalThreshold}
                onChange={(e) => handleSettingChange('withdrawalThreshold', e.target.value)}
              />
            </div>
          </div>

          <button className="administrator-settings-btn save" onClick={handleSaveSettings}>
            Lưu cài đặt thanh toán
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button className="administrator-settings-btn reset" onClick={handleResetSettings}>
          Khôi phục cài đặt mặc định
        </button>
      </div>
    </div>
  );
};

export default SystemSettingsTab;
