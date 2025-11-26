import axiosInstance from './axiosInstance';

/**
 * File Upload Service
 * Handles video and document uploads with progress tracking
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResponse {
  mediaId: number;
  url: string;
  publicId: string;
  resourceType: string;
  fileSize: number;
  format: string;
  duration?: number; // For videos (seconds)
  originalFilename: string;
}

/**
 * Upload video with progress tracking
 * Max size: 300MB (Cloudinary Plus plan)
 */
export const uploadVideo = async (
  file: File,
  userId: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> => {
  console.log('[UPLOAD_VIDEO] Starting:', file.name, formatFileSize(file.size));
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId.toString());
  
  try {
    const response = await axiosInstance.post<UploadResponse>(
      '/media/upload/video',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage
            });
            console.log(`[UPLOAD_VIDEO] Progress: ${percentage}%`);
          }
        },
        timeout: 300000 // 5 minutes for large videos
      }
    );
    
    console.log('[UPLOAD_VIDEO] Success:', response.data.mediaId);
    return response.data;
  } catch (error: any) {
    console.error('[UPLOAD_VIDEO] Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Upload document (PDF, DOCX, PPTX)
 * Max size: 20MB
 */
export const uploadDocument = async (
  file: File,
  userId: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> => {
  console.log('[UPLOAD_DOCUMENT] Starting:', file.name, formatFileSize(file.size));
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId.toString());
  
  try {
    const response = await axiosInstance.post<UploadResponse>(
      '/media/upload/document',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage
            });
            console.log(`[UPLOAD_DOCUMENT] Progress: ${percentage}%`);
          }
        }
      }
    );
    
    console.log('[UPLOAD_DOCUMENT] Success:', response.data.mediaId);
    return response.data;
  } catch (error: any) {
    console.error('[UPLOAD_DOCUMENT] Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

/**
 * Validate video file
 */
export const validateVideo = (file: File): { valid: boolean; error?: string } => {
  const MAX_SIZE = 300 * 1024 * 1024; // 300MB (Cloudinary Plus)
  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  
  console.log('[VALIDATE_VIDEO]', file.name, file.type, formatFileSize(file.size));
  
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `Video quá lớn. Tối đa 300MB. Hiện tại: ${formatFileSize(file.size)}`
    };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Định dạng không hợp lệ. Chỉ chấp nhận: MP4, WebM, MOV, AVI'
    };
  }
  
  console.log('[VALIDATE_VIDEO] Valid');
  return { valid: true };
};

/**
 * Validate document file
 */
export const validateDocument = (file: File): { valid: boolean; error?: string } => {
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  console.log('[VALIDATE_DOCUMENT]', file.name, file.type, formatFileSize(file.size));
  
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File quá lớn. Tối đa 20MB. Hiện tại: ${formatFileSize(file.size)}`
    };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Định dạng không hợp lệ. Chỉ chấp nhận: PDF, DOCX, PPTX'
    };
  }
  
  console.log('[VALIDATE_DOCUMENT] Valid');
  return { valid: true };
};
