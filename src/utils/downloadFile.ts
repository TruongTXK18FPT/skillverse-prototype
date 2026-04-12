/**
 * Download a file via authenticated API call.
 * Uses axios to fetch the file with JWT auth, then triggers browser download.
 *
 * @param url - URL to download from
 * @param defaultFilename - Fallback filename if Content-Disposition header is missing
 * @param body - Optional POST body for endpoints that require it (e.g., snapshot attachments)
 */
import axiosInstance from '../services/axiosInstance';

export const downloadFile = async (
  url: string,
  defaultFilename: string = 'download',
  body?: Record<string, string>
): Promise<void> => {
  try {
    const config: Record<string, unknown> = { responseType: 'blob' };
    let response;

    if (body) {
      // POST request with JSON body (for URL-based streaming)
      response = await axiosInstance.post(url, body, config);
    } else {
      // GET request (for ID-based streaming)
      response = await axiosInstance.get(url, config);
    }

    // Extract filename from Content-Disposition header if present
    const contentDisposition = response.headers['content-disposition'];
    let filename = defaultFilename;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=(?:(\\?['"])(.*?)\1|([^;\n]*))/i);
      if (match && match[2]) {
        filename = match[2].replace(/['"]/g, '');
      } else if (match && match[3]) {
        filename = match[3].replace(/['"]/g, '');
      }
    }

    // Extract content type
    const contentType = response.headers['content-type'] || 'application/octet-stream';

    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: contentType });
    const downloadUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
  } catch (error) {
    console.error('[downloadFile] Download failed:', error);
    throw error;
  }
};
