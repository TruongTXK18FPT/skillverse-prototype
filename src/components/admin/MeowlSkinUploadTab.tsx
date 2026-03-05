import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, Trash2, Edit2, X, List, Plus, BarChart2 } from 'lucide-react';
import { skinService, MeowlSkinResponse } from '../../services/skinService';
import SkinAnalyticsTab from './SkinAnalyticsTab';
import './skin-upload.css';

const MeowlSkinUploadTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'analytics'>('manage');
  const [skins, setSkins] = useState<MeowlSkinResponse[]>([]);
  const [formData, setFormData] = useState({
    skinCode: '',
    name: '',
    nameVi: '',
    price: 0,
    isPremium: false
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchSkins();
  }, []);

  const fetchSkins = async () => {
    try {
      const data = await skinService.getAllSkins();
      setSkins(data);
    } catch (error) {
      console.error('Failed to fetch skins:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleEdit = (skin: MeowlSkinResponse) => {
    setEditingId(skin.id);
    setFormData({
      skinCode: skin.skinCode,
      name: skin.name,
      nameVi: skin.nameVi,
      price: skin.price,
      isPremium: skin.isPremium
    });
    setPreview(skin.imageUrl);
    setFile(null);
    setActiveTab('upload'); // Switch to upload/edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      skinCode: '',
      name: '',
      nameVi: '',
      price: 0,
      isPremium: false
    });
    setPreview(null);
    setFile(null);
  };

  const handleDelete = async (id: number) => {
    if (!(await confirmAction('Bạn có chắc chắn muốn xóa skin này? Hành động này không thể hoàn tác.'))) return;

    try {
      setLoading(true);
      await skinService.deleteSkin(id);
      setStatus({ type: 'success', message: 'Xóa skin thành công!' });
      fetchSkins();
    } catch (error) {
      console.error('Delete failed:', error);
      setStatus({ type: 'error', message: 'Xóa thất bại.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      if (editingId) {
        // Update mode
        await skinService.updateSkin(editingId, formData);
        setStatus({ type: 'success', message: 'Cập nhật skin thành công!' });
      } else {
        // Create mode
        if (!file) {
          setStatus({ type: 'error', message: 'Vui lòng chọn file ảnh' });
          setLoading(false);
          return;
        }
        const data = new FormData();
        data.append('file', file);
        data.append('skinCode', formData.skinCode);
        data.append('name', formData.name);
        data.append('nameVi', formData.nameVi);
        data.append('price', formData.price.toString());
        data.append('isPremium', formData.isPremium.toString());

        await skinService.uploadSkin(data);
        setStatus({ type: 'success', message: 'Upload skin thành công!' });
      }

      // Reset form
      handleCancelEdit();
      fetchSkins();
      
      // If we were editing, maybe stay on form or go back? Let's stay on manage for clarity
      // Actually if success, maybe clear form and stay on upload for more uploads?
      // Or go back to manage list?
      // Let's reset to manage tab if update success, or stay on upload if create success (to create more).
      if (editingId) {
          setActiveTab('manage');
      }
      
    } catch (error) {
      console.error('Action failed:', error);
      setStatus({ type: 'error', message: editingId ? 'Cập nhật thất bại.' : 'Upload thất bại.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="skin-upload-container">
      <div className="skin-upload-title">
        {activeTab === 'upload' ? <Upload size={24} /> : <List size={24} />}
        {activeTab === 'upload' ? (editingId ? 'Cập Nhật Skin' : 'Upload Skin Mới') : 'Quản Lý Skin'}
      </div>

      {/* Tabs Navigation */}
      <div className="skin-upload-tabs">
        <button 
          className={`skin-upload-tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => {
              setActiveTab('manage');
              handleCancelEdit(); // Clear edit state when switching to manage
          }}
        >
          <List size={18} /> Quản Lý Skin
        </button>
        <button 
          className={`skin-upload-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Plus size={18} /> Upload Skin Mới
        </button>
        <button 
          className={`skin-upload-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart2 size={18} /> Thống Kê
        </button>
      </div>

      {status && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1rem', 
          borderRadius: '8px', 
          background: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: status.type === 'success' ? '#4ade80' : '#f87171',
          border: `1px solid ${status.type === 'success' ? '#22c55e' : '#ef4444'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {status.message}
        </div>
      )}

      {activeTab === 'analytics' && <SkinAnalyticsTab />}

      {/* Upload/Edit Form Tab */}
      {activeTab === 'upload' && (
        <form className="skin-upload-form" onSubmit={handleSubmit}>
          <div className="skin-upload-group">
            <label className="skin-upload-label">Skin Code (Unique ID)</label>
            <input
              type="text"
              name="skinCode"
              value={formData.skinCode}
              onChange={handleInputChange}
              className="skin-upload-input"
              placeholder="e.g., meowl-cyber"
              required
              disabled={!!editingId} // Disable editing ID
            />
          </div>

          <div className="skin-upload-group">
            <label className="skin-upload-label">Name (English)</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="skin-upload-input"
              placeholder="Cyber Meowl"
              required
            />
          </div>

          <div className="skin-upload-group">
            <label className="skin-upload-label">Tên (Tiếng Việt)</label>
            <input
              type="text"
              name="nameVi"
              value={formData.nameVi}
              onChange={handleInputChange}
              className="skin-upload-input"
              placeholder="Meowl Công Nghệ"
              required
            />
          </div>

          <div className="skin-upload-group">
            <label className="skin-upload-label">Giá (Xu)</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="skin-upload-input"
                min="0"
                required
                style={{ flex: 1 }}
              />
              <span style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '20px', 
                background: formData.price > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                color: formData.price > 0 ? '#fbbf24' : '#94a3b8',
                border: `1px solid ${formData.price > 0 ? '#f59e0b' : '#94a3b8'}`,
                fontSize: '0.9rem',
                fontWeight: 600
              }}>
                {formData.price > 0 ? 'Trả phí' : 'Miễn phí'}
              </span>
            </div>
          </div>

          <label className="skin-upload-checkbox-wrapper">
            <input
              type="checkbox"
              name="isPremium"
              checked={formData.isPremium}
              onChange={handleInputChange}
              className="skin-upload-checkbox"
            />
            <span className="skin-upload-label" style={{ color: '#f8fafc' }}>Là Skin Premium?</span>
          </label>

          {!editingId && (
            <div className="skin-upload-group">
              <label className="skin-upload-label">Hình ảnh Skin (Tự động resize & xóa nền)</label>
              <label className="skin-upload-file-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {preview ? (
                  <div className="skin-upload-preview">
                    <img src={preview} alt="Preview" />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
                    <ImageIcon size={48} />
                    <span>Click để chọn ảnh</span>
                  </div>
                )}
              </label>
            </div>
          )}
          
          {editingId && preview && (
             <div className="skin-upload-group">
               <label className="skin-upload-label">Hình ảnh hiện tại</label>
               <div className="skin-upload-preview">
                  <img src={preview} alt="Current" />
               </div>
               <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                 (Chức năng cập nhật ảnh chưa được hỗ trợ trong phiên bản này, vui lòng xóa và tạo mới nếu muốn đổi ảnh)
               </p>
             </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="skin-upload-submit-btn" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Đang xử lý...' : (editingId ? 'Cập Nhật' : 'Upload Skin')}
            </button>
            
            {editingId && (
              <button 
                type="button" 
                onClick={() => {
                    handleCancelEdit();
                    setActiveTab('manage');
                }}
                className="skin-upload-submit-btn" 
                style={{ background: 'rgba(148, 163, 184, 0.2)', flex: 0.5 }}
              >
                <X size={20} /> Hủy
              </button>
            )}
          </div>
        </form>
      )}

      {/* Manage/List Tab */}
      {activeTab === 'manage' && (
        <div className="skin-manage-grid">
          {skins.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  Chưa có skin nào được upload. Hãy chuyển sang tab "Upload Skin Mới".
              </div>
          )}
          {skins.map(skin => (
            <div key={skin.id} className="skin-manage-card">
              <div className="skin-manage-image-wrapper">
                <img src={skin.imageUrl} alt={skin.nameVi} className="skin-manage-image" />
              </div>
              
              <div className="skin-manage-info">
                <div className="skin-manage-name">{skin.nameVi}</div>
                <div className="skin-manage-code">{skin.skinCode}</div>
                <div className="skin-manage-meta">
                  <span className="skin-manage-price">{skin.isPremium ? 'Premium Only' : skin.price > 0 ? `${skin.price.toLocaleString()} Xu` : 'Miễn phí'}</span>
                  {skin.isPremium && <span className="skin-manage-badge">PREMIUM</span>}
                </div>
              </div>

              <div className="skin-manage-actions">
                <button 
                  onClick={() => handleEdit(skin)}
                  className="skin-manage-btn edit"
                >
                  <Edit2 size={16} /> Sửa
                </button>
                <button 
                  onClick={() => handleDelete(skin.id)}
                  className="skin-manage-btn delete"
                >
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeowlSkinUploadTab;