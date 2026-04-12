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
 * Max size: 100MB (Cloudinary Free Tier limit)
 * NOTE: If upgrading to Cloudinary Plus plan, increase to 2GB
 */
export const uploadVideo = async (
  file: File,
  userId: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> => {
  
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
            
          }
        },
        timeout: 300000 // 5 minutes for large videos
      }
    );
    
    
    return response.data;
  } catch (error: any) {
    console.error('[UPLOAD_VIDEO] Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Upload document (PDF, DOCX, PPTX)
 * Max size: 10MB
 */
export const uploadDocument = async (
  file: File,
  userId: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> => {
  
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
            
          }
        }
      }
    );
    
    
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
  // Cloudinary Free Tier: video max 100MB
  // NOTE: If upgrading to Cloudinary Plus plan, increase to 2GB
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB (Cloudinary Free Tier)
  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `Video quá lớn. Tối đa 100MB. Hiện tại: ${formatFileSize(file.size)}`
    };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Định dạng không hợp lệ. Chỉ chấp nhận: MP4, WebM, MOV, AVI'
    };
  }
  
  
  return { valid: true };
};

/**
 * Validate document file
 */
export const validateDocument = (file: File): { valid: boolean; error?: string } => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File quá lớn. Tối đa 10MB. Hiện tại: ${formatFileSize(file.size)}`
    };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Định dạng không hợp lệ. Chỉ chấp nhận: PDF, DOCX, PPTX'
    };
  }
  
  
  return { valid: true };
};

/**
 * Upload image response from backend (matches MediaDTO)
 */
export interface ImageUploadResponse {
  id: number;
  url: string;
  fileName: string;
  type: string;
  fileSize?: number;
}

/**
 * Upload image to Cloudinary via backend
 * Max size: 10MB
 * Uses same endpoint as mediaService: /media/upload
 */
export const uploadImage = async (
  file: File,
  actorId?: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<ImageUploadResponse> => {
  
  const formData = new FormData();
  formData.append('file', file);
  if (actorId) {
    formData.append('actorId', String(actorId));
  }
  
  try {
    const response = await axiosInstance.post<ImageUploadResponse>(
      '/media/upload',
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
            
          }
        },
        timeout: 60000 // 1 minute
      }
    );
    
    
    return response.data;
  } catch (error: any) {
    console.error('[UPLOAD_IMAGE] Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Validate image file
 */
export const validateImage = (file: File): { valid: boolean; error?: string } => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `Ảnh quá lớn. Tối đa 10MB. Hiện tại: ${formatFileSize(file.size)}`
    };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Định dạng không hợp lệ. Chỉ chấp nhận: JPG, PNG, GIF, WebP'
    };
  }
  
  
  return { valid: true };
};
