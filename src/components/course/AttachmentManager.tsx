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
import { downloadFile } from '../../utils/downloadFile';
import './AttachmentManager.css';

interface AttachmentManagerProps {
  lessonId: number;
  editable?: boolean; // Can add/delete attachments
  hideWhenEmpty?: boolean;
  showHeader?: boolean;
  headerText?: string;
}

const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  lessonId,
  editable = false,
  hideWhenEmpty = false,
  showHeader = true,
  headerText
}) => {
  const { user } = useAuth();
  
  const [attachments, setAttachments] = useState<LessonAttachmentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load attachments
  useEffect(() => {
    let isDisposed = false;

    const loadData = async () => {
      if (!lessonId) {
        if (!isDisposed) {
          setAttachments([]);
          setError(null);
          setLoading(false);
        }
        return;
      }

      if (!user?.id) {
        if (!isDisposed) {
          setLoading(false);
        }
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await listAttachments(lessonId, user.id);
        if (isDisposed) {
          return;
        }
        setAttachments(data);
        
      } catch (err: any) {
        if (isDisposed) {
          return;
        }
        console.error('[ATTACHMENT_MANAGER] Load error:', err);
        setAttachments([]);
        setError('Không thể tải attachments');
      } finally {
        if (!isDisposed) {
          setLoading(false);
        }
      }
    };
    
    loadData();

    return () => {
      isDisposed = true;
    };
  }, [lessonId, user?.id]);
  
  
  const handleUploadSuccess = async (result: UploadResponse) => {
    
    
    if (!user) return;
    
    try {
      const request: AddAttachmentRequest = {
        title: result.originalFilename,
        mediaId: result.mediaId,
        type: AttachmentType.PDF, // Assume PDF for now
        orderIndex: attachments.length
      };
      
      const newAttachment = await addAttachment(lessonId, request, user.id);
      setError(null);
      setAttachments((prev) => [...prev, newAttachment]);
      
    } catch (err: any) {
      console.error('[ATTACHMENT_MANAGER] Add error:', err);
      setError('Không thể thêm attachment');
    }
  };
  
  const handleDelete = async (attachmentId: number) => {
    if (!user || !(await confirmAction('Xóa attachment này?'))) return;
    
    
    
    try {
      await deleteAttachment(lessonId, attachmentId, user.id);
      setError(null);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      
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

  if (hideWhenEmpty && !editable && attachments.length === 0 && !error) {
    return null;
  }

  const shouldShowHeader = showHeader && (editable || attachments.length > 0 || !!error);
  
  return (
    <div className="attachment-manager">
      {shouldShowHeader && (
        <div className="attachment-manager-header">
          <h3>{headerText || 'Tài liệu đính kèm'}</h3>
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
      )}
      
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
                {attachment.type === AttachmentType.EXTERNAL_LINK ||
                 attachment.type === AttachmentType.GITHUB ||
                 attachment.type === AttachmentType.GOOGLE_DRIVE ? (
                  <a
                    href={attachment.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-download"
                    title="Mở liên kết"
                  >
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <button
                    onClick={() => downloadFile(
                      `/api/lessons/${lessonId}/attachments/${attachment.id}/download`,
                      attachment.title
                    )}
                    className="btn-download"
                    title="Tải về"
                  >
                    <Download size={16} />
                  </button>
                )}
                
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
