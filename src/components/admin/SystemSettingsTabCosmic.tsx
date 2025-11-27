import React, { useState } from 'react';
import {
  Settings, Server, Shield, Mail, CreditCard, Database,
  Globe, Lock, Key, Clock, HardDrive, Cpu, Activity,
  AlertTriangle, CheckCircle, RefreshCw, Save, RotateCcw,
  Wifi, Cloud, Zap, Copy, ExternalLink,
  Bell, Users, FileText, Terminal, Gauge, Layers
} from 'lucide-react';
import './SystemSettingsTabCosmic.css';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  checked, onChange, label, description, disabled 
}) => (
  <div className={`sys-toggle-item ${disabled ? 'disabled' : ''}`}>
    <div className="sys-toggle-info">
      <span className="sys-toggle-label">{label}</span>
      {description && <span className="sys-toggle-desc">{description}</span>}
    </div>
    <button
      type="button"
      className={`sys-toggle-switch ${checked ? 'active' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
    >
      <span className="sys-toggle-slider" />
    </button>
  </div>
);

const SystemSettingsTabCosmic: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // System Status
  const [systemStatus] = useState({
    status: 'operational',
    uptime: '99.97%',
    lastRestart: '15 ngày trước',
    version: 'v2.4.1',
    environment: 'production',
    cpuUsage: 42,
    memoryUsage: 68,
    diskUsage: 35,
    activeConnections: 1247
  });

  // Settings State
  const [settings, setSettings] = useState({
    // General
    platformName: 'SkillVerse',
    platformUrl: 'https://skillverse.vn',
    platformDescription: 'Nền tảng kết nối mentor và học viên hàng đầu Việt Nam',
    timezone: 'Asia/Ho_Chi_Minh',
    language: 'vi',
    maintenanceMode: false,
    debugMode: false,
    
    // Security
    userRegistration: true,
    emailVerification: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireSpecialChar: true,
    requireNumber: true,
    ipWhitelist: '',
    
    // Email
    emailProvider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@skillverse.vn',
    smtpEncryption: 'tls',
    emailFromName: 'SkillVerse',
    
    // Payment
    paymentGateway: 'vnpay',
    sandboxMode: true,
    commissionRate: 15,
    minWithdrawal: 100000,
    maxWithdrawal: 50000000,
    withdrawalFee: 0,
    autoApproveWithdrawal: false,
    
    // Performance
    cacheEnabled: true,
    cacheDriver: 'redis',
    cacheTtl: 3600,
    compressionEnabled: true,
    cdnEnabled: false,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    slackIntegration: false,
    webhookUrl: ''
  });

  const categories = [
    { id: 'general', label: 'Tổng quan', icon: Globe, color: '#8b5cf6' },
    { id: 'security', label: 'Bảo mật', icon: Shield, color: '#ef4444' },
    { id: 'email', label: 'Email', icon: Mail, color: '#06b6d4' },
    { id: 'payment', label: 'Thanh toán', icon: CreditCard, color: '#22c55e' },
    { id: 'performance', label: 'Hiệu năng', icon: Zap, color: '#f59e0b' },
    { id: 'notifications', label: 'Thông báo', icon: Bell, color: '#ec4899' },
  ];

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setUnsavedChanges(false);
      console.log('Settings saved:', settings);
    }, 1500);
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục cài đặt mặc định?')) {
      console.log('Reset settings');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderGeneralSettings = () => (
    <div className="sys-settings-panel">
      <div className="sys-panel-header">
        <Globe size={24} />
        <div>
          <h3>Cấu hình Tổng quan</h3>
          <p>Thiết lập thông tin cơ bản của nền tảng</p>
        </div>
      </div>

      <div className="sys-form-grid">
        <div className="sys-form-group full-width">
          <label>Tên nền tảng</label>
          <div className="sys-input-wrapper">
            <Layers size={18} />
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) => handleChange('platformName', e.target.value)}
            />
          </div>
        </div>

        <div className="sys-form-group full-width">
          <label>URL Website</label>
          <div className="sys-input-with-action">
            <div className="sys-input-wrapper">
              <Globe size={18} />
              <input
                type="url"
                value={settings.platformUrl}
                onChange={(e) => handleChange('platformUrl', e.target.value)}
              />
            </div>
            <button className="sys-icon-btn" onClick={() => window.open(settings.platformUrl, '_blank')}>
              <ExternalLink size={16} />
            </button>
          </div>
        </div>

        <div className="sys-form-group full-width">
          <label>Mô tả nền tảng</label>
          <textarea
            value={settings.platformDescription}
            onChange={(e) => handleChange('platformDescription', e.target.value)}
            rows={3}
          />
        </div>

        <div className="sys-form-group">
          <label>Múi giờ</label>
          <div className="sys-select-wrapper">
            <Clock size={18} />
            <select value={settings.timezone} onChange={(e) => handleChange('timezone', e.target.value)}>
              <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
              <option value="Asia/Bangkok">Thái Lan (GMT+7)</option>
              <option value="Asia/Singapore">Singapore (GMT+8)</option>
              <option value="UTC">UTC (GMT+0)</option>
            </select>
          </div>
        </div>

        <div className="sys-form-group">
          <label>Ngôn ngữ mặc định</label>
          <div className="sys-select-wrapper">
            <FileText size={18} />
            <select value={settings.language} onChange={(e) => handleChange('language', e.target.value)}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sys-toggles-section">
        <h4>Trạng thái hệ thống</h4>
        <ToggleSwitch
          checked={settings.maintenanceMode}
          onChange={(v) => handleChange('maintenanceMode', v)}
          label="Chế độ bảo trì"
          description="Tạm ngừng truy cập cho người dùng"
        />
        <ToggleSwitch
          checked={settings.debugMode}
          onChange={(v) => handleChange('debugMode', v)}
          label="Chế độ Debug"
          description="Hiển thị thông tin debug chi tiết"
        />
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="sys-settings-panel">
      <div className="sys-panel-header security">
        <Shield size={24} />
        <div>
          <h3>Cấu hình Bảo mật</h3>
          <p>Thiết lập các tùy chọn bảo mật hệ thống</p>
        </div>
      </div>

      <div className="sys-toggles-section">
        <h4>Đăng ký & Xác thực</h4>
        <ToggleSwitch
          checked={settings.userRegistration}
          onChange={(v) => handleChange('userRegistration', v)}
          label="Cho phép đăng ký mới"
          description="Người dùng có thể tạo tài khoản"
        />
        <ToggleSwitch
          checked={settings.emailVerification}
          onChange={(v) => handleChange('emailVerification', v)}
          label="Xác thực Email bắt buộc"
          description="Yêu cầu xác nhận email khi đăng ký"
        />
        <ToggleSwitch
          checked={settings.twoFactorAuth}
          onChange={(v) => handleChange('twoFactorAuth', v)}
          label="Xác thực 2 bước (2FA)"
          description="Bắt buộc cho tài khoản Admin"
        />
      </div>

      <div className="sys-form-grid">
        <div className="sys-form-group">
          <label>Thời gian phiên (phút)</label>
          <div className="sys-input-wrapper">
            <Clock size={18} />
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
              min={5}
              max={1440}
            />
          </div>
        </div>

        <div className="sys-form-group">
          <label>Số lần đăng nhập sai tối đa</label>
          <div className="sys-input-wrapper">
            <Lock size={18} />
            <input
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
              min={3}
              max={10}
            />
          </div>
        </div>

        <div className="sys-form-group">
          <label>Độ dài mật khẩu tối thiểu</label>
          <div className="sys-input-wrapper">
            <Key size={18} />
            <input
              type="number"
              value={settings.passwordMinLength}
              onChange={(e) => handleChange('passwordMinLength', parseInt(e.target.value))}
              min={6}
              max={32}
            />
          </div>
        </div>
      </div>

      <div className="sys-toggles-section">
        <h4>Chính sách mật khẩu</h4>
        <ToggleSwitch
          checked={settings.requireSpecialChar}
          onChange={(v) => handleChange('requireSpecialChar', v)}
          label="Yêu cầu ký tự đặc biệt"
          description="Mật khẩu phải chứa !@#$%^&*"
        />
        <ToggleSwitch
          checked={settings.requireNumber}
          onChange={(v) => handleChange('requireNumber', v)}
          label="Yêu cầu chữ số"
          description="Mật khẩu phải chứa ít nhất 1 số"
        />
      </div>

      <div className="sys-form-group full-width">
        <label>IP Whitelist (mỗi IP một dòng)</label>
        <textarea
          value={settings.ipWhitelist}
          onChange={(e) => handleChange('ipWhitelist', e.target.value)}
          rows={3}
          placeholder="192.168.1.1&#10;10.0.0.0/24"
        />
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="sys-settings-panel">
      <div className="sys-panel-header email">
        <Mail size={24} />
        <div>
          <h3>Cấu hình Email</h3>
          <p>Thiết lập SMTP và gửi email</p>
        </div>
      </div>

      <div className="sys-form-grid">
        <div className="sys-form-group">
          <label>Nhà cung cấp Email</label>
          <div className="sys-select-wrapper">
            <Mail size={18} />
            <select value={settings.emailProvider} onChange={(e) => handleChange('emailProvider', e.target.value)}>
              <option value="smtp">SMTP Custom</option>
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
              <option value="ses">Amazon SES</option>
            </select>
          </div>
        </div>

        <div className="sys-form-group">
          <label>Mã hóa</label>
          <div className="sys-select-wrapper">
            <Lock size={18} />
            <select value={settings.smtpEncryption} onChange={(e) => handleChange('smtpEncryption', e.target.value)}>
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
              <option value="none">Không mã hóa</option>
            </select>
          </div>
        </div>

        <div className="sys-form-group">
          <label>SMTP Host</label>
          <div className="sys-input-wrapper">
            <Server size={18} />
            <input
              type="text"
              value={settings.smtpHost}
              onChange={(e) => handleChange('smtpHost', e.target.value)}
            />
          </div>
        </div>

        <div className="sys-form-group">
          <label>SMTP Port</label>
          <div className="sys-input-wrapper">
            <Terminal size={18} />
            <input
              type="number"
              value={settings.smtpPort}
              onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="sys-form-group">
          <label>SMTP Username</label>
          <div className="sys-input-wrapper">
            <Users size={18} />
            <input
              type="text"
              value={settings.smtpUser}
              onChange={(e) => handleChange('smtpUser', e.target.value)}
            />
          </div>
        </div>

        <div className="sys-form-group">
          <label>Tên người gửi</label>
          <div className="sys-input-wrapper">
            <FileText size={18} />
            <input
              type="text"
              value={settings.emailFromName}
              onChange={(e) => handleChange('emailFromName', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="sys-test-connection">
        <button className="sys-test-btn">
          <Wifi size={16} />
          Kiểm tra kết nối SMTP
        </button>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="sys-settings-panel">
      <div className="sys-panel-header payment">
        <CreditCard size={24} />
        <div>
          <h3>Cấu hình Thanh toán</h3>
          <p>Thiết lập cổng thanh toán và hoa hồng</p>
        </div>
      </div>

      <div className="sys-form-grid">
        <div className="sys-form-group full-width">
          <label>Cổng thanh toán chính</label>
          <div className="sys-payment-options">
            {['vnpay', 'momo', 'stripe', 'paypal'].map(gateway => (
              <button
                key={gateway}
                className={`sys-payment-option ${settings.paymentGateway === gateway ? 'active' : ''}`}
                onClick={() => handleChange('paymentGateway', gateway)}
              >
                {gateway.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sys-toggles-section">
        <ToggleSwitch
          checked={settings.sandboxMode}
          onChange={(v) => handleChange('sandboxMode', v)}
          label="Chế độ Sandbox/Test"
          description="Sử dụng môi trường thử nghiệm"
        />
        <ToggleSwitch
          checked={settings.autoApproveWithdrawal}
          onChange={(v) => handleChange('autoApproveWithdrawal', v)}
          label="Tự động duyệt rút tiền"
          description="Rút tiền dưới ngưỡng được duyệt tự động"
        />
      </div>

      <div className="sys-form-grid">
        <div className="sys-form-group">
          <label>Tỷ lệ hoa hồng (%)</label>
          <div className="sys-input-wrapper">
            <Gauge size={18} />
            <input
              type="number"
              value={settings.commissionRate}
              onChange={(e) => handleChange('commissionRate', parseInt(e.target.value))}
              min={0}
              max={50}
            />
          </div>
        </div>

        <div className="sys-form-group">
          <label>Phí rút tiền (%)</label>
          <div className="sys-input-wrapper">
            <CreditCard size={18} />
            <input
              type="number"
              value={settings.withdrawalFee}
              onChange={(e) => handleChange('withdrawalFee', parseInt(e.target.value))}
              min={0}
              max={10}
            />
          </div>
        </div>

        <div className="sys-form-group">
          <label>Rút tiền tối thiểu (VNĐ)</label>
          <div className="sys-input-wrapper">
            <CreditCard size={18} />
            <input
              type="number"
              value={settings.minWithdrawal}
              onChange={(e) => handleChange('minWithdrawal', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="sys-form-group">
          <label>Rút tiền tối đa (VNĐ)</label>
          <div className="sys-input-wrapper">
            <CreditCard size={18} />
            <input
              type="number"
              value={settings.maxWithdrawal}
              onChange={(e) => handleChange('maxWithdrawal', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="sys-settings-panel">
      <div className="sys-panel-header performance">
        <Zap size={24} />
        <div>
          <h3>Cấu hình Hiệu năng</h3>
          <p>Tối ưu hóa tốc độ và cache</p>
        </div>
      </div>

      <div className="sys-toggles-section">
        <ToggleSwitch
          checked={settings.cacheEnabled}
          onChange={(v) => handleChange('cacheEnabled', v)}
          label="Bật Cache"
          description="Tăng tốc độ tải trang"
        />
        <ToggleSwitch
          checked={settings.compressionEnabled}
          onChange={(v) => handleChange('compressionEnabled', v)}
          label="Nén Gzip/Brotli"
          description="Giảm dung lượng truyền tải"
        />
        <ToggleSwitch
          checked={settings.cdnEnabled}
          onChange={(v) => handleChange('cdnEnabled', v)}
          label="CDN Integration"
          description="Sử dụng mạng phân phối nội dung"
        />
      </div>

      <div className="sys-form-grid">
        <div className="sys-form-group">
          <label>Cache Driver</label>
          <div className="sys-select-wrapper">
            <Database size={18} />
            <select value={settings.cacheDriver} onChange={(e) => handleChange('cacheDriver', e.target.value)}>
              <option value="redis">Redis</option>
              <option value="memcached">Memcached</option>
              <option value="file">File</option>
              <option value="database">Database</option>
            </select>
          </div>
        </div>

        <div className="sys-form-group">
          <label>Cache TTL (giây)</label>
          <div className="sys-input-wrapper">
            <Clock size={18} />
            <input
              type="number"
              value={settings.cacheTtl}
              onChange={(e) => handleChange('cacheTtl', parseInt(e.target.value))}
              min={60}
              max={86400}
            />
          </div>
        </div>
      </div>

      <div className="sys-cache-actions">
        <button className="sys-cache-btn clear">
          <RotateCcw size={16} />
          Xóa toàn bộ Cache
        </button>
        <button className="sys-cache-btn rebuild">
          <RefreshCw size={16} />
          Rebuild Cache
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="sys-settings-panel">
      <div className="sys-panel-header notifications">
        <Bell size={24} />
        <div>
          <h3>Cấu hình Thông báo</h3>
          <p>Quản lý các kênh thông báo</p>
        </div>
      </div>

      <div className="sys-toggles-section">
        <ToggleSwitch
          checked={settings.emailNotifications}
          onChange={(v) => handleChange('emailNotifications', v)}
          label="Thông báo Email"
          description="Gửi thông báo qua email"
        />
        <ToggleSwitch
          checked={settings.pushNotifications}
          onChange={(v) => handleChange('pushNotifications', v)}
          label="Push Notifications"
          description="Thông báo đẩy trên trình duyệt"
        />
        <ToggleSwitch
          checked={settings.smsNotifications}
          onChange={(v) => handleChange('smsNotifications', v)}
          label="Thông báo SMS"
          description="Gửi tin nhắn SMS (tốn phí)"
        />
        <ToggleSwitch
          checked={settings.slackIntegration}
          onChange={(v) => handleChange('slackIntegration', v)}
          label="Tích hợp Slack"
          description="Gửi thông báo đến Slack channel"
        />
      </div>

      <div className="sys-form-group full-width">
        <label>Webhook URL</label>
        <div className="sys-input-with-action">
          <div className="sys-input-wrapper">
            <Cloud size={18} />
            <input
              type="url"
              value={settings.webhookUrl}
              onChange={(e) => handleChange('webhookUrl', e.target.value)}
              placeholder="https://your-webhook-endpoint.com/notify"
            />
          </div>
          <button className="sys-icon-btn" onClick={() => copyToClipboard(settings.webhookUrl)}>
            <Copy size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'general': return renderGeneralSettings();
      case 'security': return renderSecuritySettings();
      case 'email': return renderEmailSettings();
      case 'payment': return renderPaymentSettings();
      case 'performance': return renderPerformanceSettings();
      case 'notifications': return renderNotificationSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="sys-cosmic">
      {/* Header */}
      <div className="sys-header">
        <div className="sys-header-content">
          <div className="sys-header-icon">
            <Settings size={32} className="rotating" />
          </div>
          <div className="sys-header-text">
            <h1>Cài Đặt Hệ Thống</h1>
            <p>Cấu hình và quản lý toàn bộ nền tảng SkillVerse</p>
          </div>
        </div>
        
        {unsavedChanges && (
          <div className="sys-unsaved-badge">
            <AlertTriangle size={14} />
            Có thay đổi chưa lưu
          </div>
        )}
      </div>

      {/* System Status Bar */}
      <div className="sys-status-bar">
        <div className="sys-status-main">
          <div className={`sys-status-indicator ${systemStatus.status}`}>
            <CheckCircle size={18} />
            <span>Hệ thống hoạt động bình thường</span>
          </div>
          <div className="sys-status-info">
            <span><Server size={14} /> {systemStatus.version}</span>
            <span><Activity size={14} /> Uptime: {systemStatus.uptime}</span>
            <span><Clock size={14} /> Restart: {systemStatus.lastRestart}</span>
          </div>
        </div>
        
        <div className="sys-status-metrics">
          <div className="sys-metric">
            <Cpu size={16} />
            <div className="sys-metric-bar">
              <div className="sys-metric-fill cpu" style={{ width: `${systemStatus.cpuUsage}%` }} />
            </div>
            <span>{systemStatus.cpuUsage}%</span>
          </div>
          <div className="sys-metric">
            <HardDrive size={16} />
            <div className="sys-metric-bar">
              <div className="sys-metric-fill memory" style={{ width: `${systemStatus.memoryUsage}%` }} />
            </div>
            <span>{systemStatus.memoryUsage}%</span>
          </div>
          <div className="sys-metric">
            <Database size={16} />
            <div className="sys-metric-bar">
              <div className="sys-metric-fill disk" style={{ width: `${systemStatus.diskUsage}%` }} />
            </div>
            <span>{systemStatus.diskUsage}%</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="sys-main">
        {/* Sidebar */}
        <div className="sys-sidebar">
          <div className="sys-sidebar-nav">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`sys-nav-item ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
                style={{ '--cat-color': cat.color } as React.CSSProperties}
              >
                <cat.icon size={20} />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="sys-sidebar-footer">
            <button 
              className="sys-save-btn" 
              onClick={handleSave} 
              disabled={loading || !unsavedChanges}
            >
              {loading ? <RefreshCw size={18} className="spinning" /> : <Save size={18} />}
              {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
            <button className="sys-reset-btn" onClick={handleReset}>
              <RotateCcw size={18} />
              Khôi phục mặc định
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="sys-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsTabCosmic;
