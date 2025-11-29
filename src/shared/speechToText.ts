/**
 * STT helper using backend proxy: /v1/ai/speech/stt (axios base includes /api)
 * Avoids exposing provider keys and handles CORS securely.
 */
import { axiosInstance } from '../services/axiosInstance';

export type SttResponse = {
  text: string;
  confidence: number;
  source: string;
  durationMs: number;
};

export async function transcribeAudioViaBackend(audioBlob: Blob): Promise<SttResponse> {
  const form = new FormData();
  // WavRecorder tạo Blob với type 'audio/wav' → đặt tên file tương ứng để backend/provider nhận đúng định dạng
  form.append('file', audioBlob, 'audio.wav');

  try {
    const res = await axiosInstance.post<SttResponse>('/v1/ai/speech/stt', form, {
      // Let axios set multipart boundary automatically
      headers: { 'Content-Type': undefined },
    });
    return res.data;
  } catch (err: any) {
    const status = err?.response?.status;
    const msg = err?.response?.data || err?.message || 'Unknown error';
    throw new Error(`STT backend error ${status ?? 'N/A'}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
  }
}
