/**
 * TTS helper calling backend: /v1/ai/speech/tts (axios base includes /api)
 * Returns audio Blob and handles 403 (non-premium) gracefully.
 */
import { axiosInstance } from '../services/axiosInstance';

export async function synthesizeSpeechViaBackend(text: string, voice?: string, speed?: number): Promise<Blob> {
  try {
    const res = await axiosInstance.post(
      '/v1/ai/speech/tts',
      { text, voice, speed },
      { responseType: 'arraybuffer' }
    );
    const contentType = (res.headers['content-type'] as string) || 'audio/mpeg';
    return new Blob([res.data], { type: contentType });
  } catch (err: any) {
    const status = err?.response?.status;
    const msg = err?.response?.data || err?.message || 'Unknown error';
    if (status === 403) {
      throw new Error('FORBIDDEN:' + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
    }
    throw new Error(`TTS backend error ${status ?? 'N/A'}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
  }
}
