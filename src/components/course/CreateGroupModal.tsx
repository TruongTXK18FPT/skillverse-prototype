import React, { useState, useRef } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadImage } from '../../services/fileUploadService';
import './CreateGroupModal.css';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, avatarUrl: string) => void;
  initialName?: string;
  initialAvatar?: string;
  mode: 'create' | 'edit';
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ 
  isOpen, onClose, onSubmit, initialName = '', initialAvatar = '', mode 
}) => {
  const { user } = useAuth();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const response = await uploadImage(file, user.id);
      setAvatarUrl(response.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Upload ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="sv-group-modal-overlay">
      <div className="sv-group-modal-content">
        <button className="sv-group-modal-close" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="sv-group-modal-title">
          {mode === 'create' ? 'TẠO GROUP CHAT' : 'QUẢN LÝ GROUP CHAT'}
        </h2>

        <div className="sv-group-modal-form-group">
          <label className="sv-group-modal-label">Tên Nhóm</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="sv-group-modal-input"
            placeholder="Nhập tên nhóm..."
          />
        </div>

        <div className="sv-group-modal-form-group">
            <label className="sv-group-modal-label">Ảnh Đại Diện Nhóm</label>
            <div className="sv-group-modal-avatar-section">
                <div className="sv-group-modal-avatar-preview">
                    <img 
                        src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'G')}&background=00f3ff&color=000`} 
                        alt="Group Avatar" 
                        className="sv-group-modal-avatar-img"
                    />
                </div>
                <div className="sv-group-modal-avatar-controls">
                     <input
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="URL ảnh..."
                        className="sv-group-modal-input"
                        style={{ fontSize: '0.9rem', padding: '8px' }}
                    />
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                        accept="image/*"
                    />
                    <button 
                        onClick={triggerFileUpload}
                        disabled={uploading}
                        className="sv-group-modal-upload-btn"
                    >
                        <Upload size={12} />
                        {uploading ? 'Đang tải...' : 'Upload Ảnh'}
                    </button>
                </div>
            </div>
        </div>

        <div className="sv-group-modal-actions">
          <button
            onClick={onClose}
            className="sv-group-modal-btn-cancel"
          >
            Hủy
          </button>
          <button
            onClick={() => onSubmit(name, avatarUrl)}
            disabled={!name.trim()}
            className="sv-group-modal-btn-submit"
          >
            <Check size={16} />
            {mode === 'create' ? 'Tạo Nhóm' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
