import axiosInstance from './axiosInstance';

/**
 * Lesson Attachment Service
 * Handles PDF and resource attachments for Reading lessons
 */

export enum AttachmentType {
  PDF = 'PDF',
  DOCX = 'DOCX',
  PPTX = 'PPTX',
  XLSX = 'XLSX',
  EXTERNAL_LINK = 'EXTERNAL_LINK',
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  GITHUB = 'GITHUB',
  YOUTUBE = 'YOUTUBE',
  WEBSITE = 'WEBSITE'
}

export interface LessonAttachmentDTO {
  id: number;
  title: string;
  description?: string;
  downloadUrl: string;
  type: AttachmentType;
  fileSize?: number;
  fileSizeFormatted?: string;
  orderIndex?: number;
  createdAt: string;
}

export interface AddAttachmentRequest {
  title: string;
  description?: string;
  mediaId?: number;      // For uploaded files
  externalUrl?: string;  // For external links
  type: AttachmentType;
  orderIndex?: number;
}

/**
 * Add attachment to lesson
 */
export const addAttachment = async (
  lessonId: number,
  request: AddAttachmentRequest,
  actorId: number
): Promise<LessonAttachmentDTO> => {
  console.log('[ATTACHMENT_ADD] Starting:', lessonId, request.title);
  
  try {
    const response = await axiosInstance.post<LessonAttachmentDTO>(
      `/lessons/${lessonId}/attachments`,
      request,
      {
        params: { actorId }
      }
    );
    
    console.log('[ATTACHMENT_ADD] Success:', response.data.id);
    return response.data;
  } catch (error: any) {
    console.error('[ATTACHMENT_ADD] Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * List all attachments for a lesson
 */
export const listAttachments = async (
  lessonId: number
): Promise<LessonAttachmentDTO[]> => {
  console.log('[ATTACHMENT_LIST] Fetching for lessonId:', lessonId);
  
  try {
    const response = await axiosInstance.get<LessonAttachmentDTO[]>(
      `/lessons/${lessonId}/attachments`
    );
    
    console.log('[ATTACHMENT_LIST] Found:', response.data.length, 'attachments');
    return response.data;
  } catch (error: any) {
    console.error('[ATTACHMENT_LIST] Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete an attachment
 */
export const deleteAttachment = async (
  lessonId: number,
  attachmentId: number,
  actorId: number
): Promise<void> => {
  console.log('[ATTACHMENT_DELETE] Starting:', attachmentId);
  
  try {
    await axiosInstance.delete(
      `/lessons/${lessonId}/attachments/${attachmentId}`,
      {
        params: { actorId }
      }
    );
    
    console.log('[ATTACHMENT_DELETE] Success');
  } catch (error: any) {
    console.error('[ATTACHMENT_DELETE] Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Reorder attachments
 */
export const reorderAttachments = async (
  lessonId: number,
  attachmentIds: number[],
  actorId: number
): Promise<void> => {
  console.log('[ATTACHMENT_REORDER] Starting:', attachmentIds);
  
  try {
    await axiosInstance.put(
      `/lessons/${lessonId}/attachments/reorder`,
      attachmentIds,
      {
        params: { actorId }
      }
    );
    
    console.log('[ATTACHMENT_REORDER] Success');
  } catch (error: any) {
    console.error('[ATTACHMENT_REORDER] Error:', error.response?.data || error.message);
    throw error;
  }
};
