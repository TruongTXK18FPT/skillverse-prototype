import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bot, Server, Database, RefreshCw, Cpu } from 'lucide-react';
import adminService, { RagProviderSettingsResponse } from '../../services/adminService';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/shared/Toast';
import './AdminRagProviderPage.css';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return apiMessage || fallback;
};

const AdminRagProviderPage: React.FC = () => {
  const { toast, isVisible, hideToast, showSuccess, showError } = useToast();
  const [settings, setSettings] = useState<RagProviderSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingGeneration, setUpdatingGeneration] = useState(false);
  const [updatingService, setUpdatingService] = useState(false);
  const [updatingJava, setUpdatingJava] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await adminService.getRagProviderSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải cấu hình RAG Provider.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleToggleAiRagService = async () => {
    if (!settings || updatingService) return;
    const nextState = !settings.aiRagServiceRuntimeEnabled;
    setUpdatingService(true);
    try {
      const updated = await adminService.updateAiRagServiceEnabled(nextState);
      setSettings(updated);
      showSuccess('Thành công', `AI-RAG-Service đã được ${nextState ? 'BẬT' : 'TẮT'}`);
    } catch (err) {
      showError('Thất bại', getApiErrorMessage(err, 'Không thể thay đổi trạng thái AI-RAG-Service.'));
    } finally {
      setUpdatingService(false);
    }
  };

  const handleToggleLocalAiGeneration = async () => {
    if (!settings || updatingGeneration) return;
    const nextState = !settings.localAiGenerationRuntimeEnabled;
    setUpdatingGeneration(true);
    try {
      const updated = await adminService.updateLocalAiGenerationEnabled(nextState);
      setSettings(updated);
      showSuccess('Thành công', `Local AI generation đã được ${nextState ? 'BẬT' : 'TẮT'}`);
    } catch (err) {
      showError('Thất bại', getApiErrorMessage(err, 'Không thể thay đổi trạng thái Local AI generation.'));
    } finally {
      setUpdatingGeneration(false);
    }
  };

  const handleToggleJavaRag = async () => {
    if (!settings || updatingJava) return;
    const nextState = !settings.javaRagRuntimeEnabled;
    setUpdatingJava(true);
    try {
      const updated = await adminService.updateJavaRagFallbackEnabled(nextState);
      setSettings(updated);
      showSuccess('Thành công', `Java RAG đã được ${nextState ? 'BẬT' : 'TẮT'}`);
    } catch (err) {
      showError('Thất bại', getApiErrorMessage(err, 'Không thể thay đổi trạng thái Java RAG.'));
    } finally {
      setUpdatingJava(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="admin-rag-provider-wrapper">
        <div className="admin-rag-provider-loading">Đang tải cấu hình...</div>
      </div>
    );
  }

  return (
    <div className="admin-rag-provider-wrapper">
      <header className="admin-rag-provider-header">
        <div>
          <span className="admin-rag-provider-eyebrow">AI & Tài Nguyên</span>
          <h1>Quản lý RAG Providers</h1>
          <p>Bật/tắt các provider phân giải ngữ cảnh RAG ở mức runtime. Cấu hình môi trường phải hợp lệ trước khi bật.</p>
        </div>
        <button
          type="button"
          className="admin-rag-provider-refresh-btn"
          onClick={() => void fetchSettings()}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'admin-rag-provider-spinning' : ''} />
          Làm mới
        </button>
      </header>

      {error && (
        <div className="admin-rag-provider-error-banner">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {settings && (
        <div className="admin-rag-provider-grid">

          {/* Local AI Generation Card */}
          <div className="admin-rag-provider-card">
            <div className="card-header">
              <div className="card-title">
                <Bot className="icon" />
                <h3>Local AI Generation</h3>
              </div>
              <div className={`status-badge ${settings.localAiGenerationConfigured ? 'status-ok' : 'status-error'}`}>
                {settings.localAiGenerationConfigured ? 'Cấu hình OK' : 'Thiếu cấu hình'}
              </div>
            </div>

            <div className="card-body">
              <p className="card-description">Công tắc runtime cho các lệnh generation đi qua LocalAiGateway.call(...), gồm chatbot, roadmap và grading nếu flow đó đang ưu tiên local AI.</p>

              <ul className="config-list">
                <li>
                  <span className="config-label">LOCAL_AI_ENABLED:</span>
                  <span className={`config-val ${settings.localAiGenerationConfigured ? 'val-good' : 'val-bad'}`}>
                    {settings.localAiGenerationConfigured ? 'true' : 'false/missing'}
                  </span>
                </li>
              </ul>

              <div className="toggle-container">
                <span className="toggle-label">Runtime State:</span>
                <button
                  className={`toggle-btn ${settings.localAiGenerationRuntimeEnabled ? 'toggle-on' : 'toggle-off'}`}
                  onClick={() => void handleToggleLocalAiGeneration()}
                  disabled={updatingGeneration || (!settings.localAiGenerationRuntimeEnabled && !settings.localAiGenerationConfigured)}
                >
                  <div className="toggle-knob"></div>
                </button>
                <span className="toggle-status-text">
                  {updatingGeneration ? 'Đang cập nhật...' : (settings.localAiGenerationRuntimeEnabled ? 'BẬT' : 'TẮT')}
                </span>
              </div>
            </div>
          </div>
          
          {/* AI-RAG-Service Card */}
          <div className="admin-rag-provider-card">
            <div className="card-header">
              <div className="card-title">
                <Server className="icon" />
                <h3>AI-RAG-Service</h3>
              </div>
              <div className={`status-badge ${settings.aiRagServiceConfigured ? 'status-ok' : 'status-error'}`}>
                {settings.aiRagServiceConfigured ? 'Cấu hình OK' : 'Thiếu cấu hình'}
              </div>
            </div>
            
            <div className="card-body">
              <p className="card-description">Dịch vụ RAG từ xa (Python/FastAPI) chuyên dụng cho xử lý Embedding và Vector Search hiệu năng cao.</p>
              
              <ul className="config-list">
                <li>
                  <span className="config-label">LOCAL_AI_ENABLED:</span>
                  <span className={`config-val ${settings.aiRagServiceConfigured ? 'val-good' : 'val-bad'}`}>
                    {settings.aiRagServiceConfigured ? 'true' : 'false/missing'}
                  </span>
                </li>
                <li>
                  <span className="config-label">LOCAL_AI_BASE_URL:</span>
                  <span className={`config-val ${settings.localAiBaseUrlPresent ? 'val-good' : 'val-bad'}`}>
                    {settings.localAiBaseUrlPresent ? 'Đã cấu hình' : 'Trống'}
                  </span>
                </li>
              </ul>

              <div className="toggle-container">
                <span className="toggle-label">Runtime State:</span>
                <button
                  className={`toggle-btn ${settings.aiRagServiceRuntimeEnabled ? 'toggle-on' : 'toggle-off'}`}
                  onClick={() => void handleToggleAiRagService()}
                  disabled={updatingService || (!settings.aiRagServiceRuntimeEnabled && !settings.aiRagServiceConfigured)}
                >
                  <div className="toggle-knob"></div>
                </button>
                <span className="toggle-status-text">
                  {updatingService ? 'Đang cập nhật...' : (settings.aiRagServiceRuntimeEnabled ? 'BẬT' : 'TẮT')}
                </span>
              </div>
            </div>
          </div>

          {/* Java RAG Card */}
          <div className="admin-rag-provider-card">
            <div className="card-header">
              <div className="card-title">
                <Database className="icon" />
                <h3>Java RAG</h3>
              </div>
              <div className={`status-badge ${(settings.javaRagEnvEnabled && settings.mistralEmbeddingKeyPresent) ? 'status-ok' : 'status-error'}`}>
                {(settings.javaRagEnvEnabled && settings.mistralEmbeddingKeyPresent) ? 'Cấu hình OK' : 'Thiếu cấu hình'}
              </div>
            </div>
            
            <div className="card-body">
              <p className="card-description">Provider RAG chạy trực tiếp trong Spring Boot, dùng Mistral Embeddings và pgvector. Có thể chạy độc lập hoặc làm dự phòng cho AI-RAG-Service.</p>
              
              <ul className="config-list">
                <li>
                  <span className="config-label">AI_RAG_JAVA_ENABLED:</span>
                  <span className={`config-val ${settings.javaRagEnvEnabled ? 'val-good' : 'val-bad'}`}>
                    {settings.javaRagEnvEnabled ? 'true' : 'false'}
                  </span>
                </li>
                <li>
                  <span className="config-label">MISTRAL_EMBEDDING_API_KEY:</span>
                  <span className={`config-val ${settings.mistralEmbeddingKeyPresent ? 'val-good' : 'val-bad'}`}>
                    {settings.mistralEmbeddingKeyPresent ? 'Đã cấu hình' : 'Trống'}
                  </span>
                </li>
              </ul>

              <div className="toggle-container">
                <span className="toggle-label">Runtime State:</span>
                <button
                  className={`toggle-btn ${settings.javaRagRuntimeEnabled ? 'toggle-on' : 'toggle-off'}`}
                  onClick={() => void handleToggleJavaRag()}
                  disabled={updatingJava || (!settings.javaRagRuntimeEnabled && !(settings.javaRagEnvEnabled && settings.mistralEmbeddingKeyPresent))}
                >
                  <div className="toggle-knob"></div>
                </button>
                <span className="toggle-status-text">
                  {updatingJava ? 'Đang cập nhật...' : (settings.javaRagRuntimeEnabled ? 'BẬT' : 'TẮT')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Effective Mode Indicator */}
          <div className="admin-rag-provider-summary">
            <div className="summary-icon">
              <Cpu size={32} />
            </div>
            <div className="summary-info">
              <h4>RAG mode đang có hiệu lực</h4>
              <div className={`mode-badge mode-${settings.effectiveMode.toLowerCase()}`}>
                {settings.effectiveMode === 'BOTH' && 'AI-RAG-Service + Java RAG dự phòng'}
                {settings.effectiveMode === 'AI_RAG_SERVICE' && 'Chỉ dùng AI-RAG-Service'}
                {settings.effectiveMode === 'JAVA_RAG' && 'Chỉ dùng Java RAG'}
                {settings.effectiveMode === 'NONE' && 'RAG đang tắt'}
              </div>
            </div>
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
        />
      )}
    </div>
  );
};

export default AdminRagProviderPage;
