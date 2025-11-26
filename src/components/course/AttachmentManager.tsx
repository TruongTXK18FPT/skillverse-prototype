import React, { useState, useEffect } from 'react';
import { Plus, FileText, Link as LinkIcon, Trash2, Download, ExternalLink } from 'lucide-react';
import FileUploadModal from './FileUploadModal';
import {
  AttachmentType,
  LessonAttachmentDTO,
  AddAttachmentRequest,
  listAttachments,
  addAttachment,
  deleteAttachment
} from '../../services/attachmentService';
import { UploadResponse } from '../../services/fileUploadService';
import { useAuth } from '../../context/AuthContext';
import './AttachmentManager.css';

interface AttachmentManagerProps {
  lessonId: number;
  editable?: boolean; // Can add/delete attachments
}

const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  lessonId,
  editable = false
}) => {
  const { user } = useAuth();
  
  const [attachments, setAttachments] = useState<LessonAttachmentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load attachments
  useEffect(() => {
    const loadData = async () => {
      console.log('[ATTACHMENT_MANAGER] Loading attachments for lessonId:', lessonId);
      setLoading(true);
      
      try {
        const data = await listAttachments(lessonId);
        setAttachments(data);
        console.log('[ATTACHMENT_MANAGER] Loaded:', data.length, 'attachments');
      } catch (err: any) {
        console.error('[ATTACHMENT_MANAGER] Load error:', err);
        setError('Không thể tải attachments');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [lessonId]);
  
  
  const handleUploadSuccess = async (result: UploadResponse) => {
    console.log('[ATTACHMENT_MANAGER] Upload success:', result.mediaId);
    
    if (!user) return;
    
    try {
      const request: AddAttachmentRequest = {
        title: result.originalFilename,
        mediaId: result.mediaId,
        type: AttachmentType.PDF, // Assume PDF for now
        orderIndex: attachments.length
      };
      
      const newAttachment = await addAttachment(lessonId, request, user.id);
      setAttachments([...attachments, newAttachment]);
      console.log('[ATTACHMENT_MANAGER] Attachment added:', newAttachment.id);
    } catch (err: any) {
      console.error('[ATTACHMENT_MANAGER] Add error:', err);
      setError('Không thể thêm attachment');
    }
  };
  
  const handleDelete = async (attachmentId: number) => {
    if (!user || !confirm('Xóa attachment này?')) return;
    
    console.log('[ATTACHMENT_MANAGER] Deleting:', attachmentId);
    
    try {
      await deleteAttachment(lessonId, attachmentId, user.id);
      setAttachments(attachments.filter(a => a.id !== attachmentId));
      console.log('[ATTACHMENT_MANAGER] Deleted successfully');
    } catch (err: any) {
      console.error('[ATTACHMENT_MANAGER] Delete error:', err);
      setError('Không thể xóa attachment');
    }
  };
  
  const getIcon = (type: AttachmentType) => {
    switch (type) {
      case AttachmentType.PDF:
      case AttachmentType.DOCX:
      case AttachmentType.PPTX:
        return <FileText size={20} className="attachment-icon" />;
      default:
        return <LinkIcon size={20} className="attachment-icon" />;
    }
  };
  
  if (loading) {
    return <div className="attachment-manager-loading">Đang tải...</div>;
  }
  
  return (
    <div className="attachment-manager">
      <div className="attachment-manager-header">
        <h3>📎 Tài liệu đính kèm</h3>
        {editable && (
          <div className="attachment-actions">
            <button 
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="btn-add-attachment"
              title="Upload PDF"
            >
              <Plus size={16} />
              Upload PDF
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="attachment-error">
          {error}
        </div>
      )}
      
      {attachments.length === 0 ? (
        <div className="attachment-empty">
          <FileText size={48} className="empty-icon" />
          <p>Chưa có tài liệu đính kèm</p>
          {editable && (
            <small>Click "Upload PDF" để thêm tài liệu</small>
          )}
        </div>
      ) : (
        <div className="attachment-list">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="attachment-item">
              <div className="attachment-info">
                {getIcon(attachment.type)}
                <div className="attachment-details">
                  <p className="attachment-title">{attachment.title}</p>
                  {attachment.fileSizeFormatted && (
                    <small className="attachment-size">{attachment.fileSizeFormatted}</small>
                  )}
                </div>
              </div>
              
              <div className="attachment-buttons">
                <a
                  href={attachment.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-download"
                  title="Tải về"
                >
                  {attachment.type === AttachmentType.EXTERNAL_LINK || 
                   attachment.type === AttachmentType.GITHUB ||
                   attachment.type === AttachmentType.GOOGLE_DRIVE ? (
                    <ExternalLink size={16} />
                  ) : (
                    <Download size={16} />
                  )}
                </a>
                
                {editable && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="btn-delete"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
          type="document"
          title="Upload PDF"
        />
      )}
    </div>
  );
};

export default AttachmentManager;
