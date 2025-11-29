/**
 * Simple WAV recorder using Web Audio API.
 * Produces 16kHz mono PCM WAV Blob for STT.
 */

export type RecorderState = {
  isRecording: boolean;
  audioUrl?: string;
  audioBlob?: Blob;
  durationMs: number;
};

export class WavRecorder {
  private stream?: MediaStream;
  private audioContext?: AudioContext;
  private sourceNode?: MediaStreamAudioSourceNode;
  private processor?: ScriptProcessorNode;
  private startTime?: number;
  private recordedSamples: Float32Array[] = [];
  private inputSampleRate = 48000; // default, will be set from context

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.inputSampleRate = this.audioContext.sampleRate;
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.recordedSamples = [];
    this.startTime = performance.now();

    this.processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      // copy buffer to avoid re-use
      this.recordedSamples.push(new Float32Array(input));
    };

    this.sourceNode.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  async stop(): Promise<RecorderState> {
    const durationMs = this.startTime ? Math.max(0, Math.round(performance.now() - this.startTime)) : 0;

    // cleanup graph
    this.processor?.disconnect();
    this.sourceNode?.disconnect();
    this.audioContext?.close();
    this.stream?.getTracks().forEach(t => t.stop());

    const wavBlob = this.buildWavBlob(this.recordedSamples, this.inputSampleRate, 16000);
    const audioUrl = URL.createObjectURL(wavBlob);

    // reset
    this.processor = undefined;
    this.sourceNode = undefined;
    this.audioContext = undefined;
    this.stream = undefined;
    this.recordedSamples = [];
    this.startTime = undefined;

    return {
      isRecording: false,
      audioUrl,
      audioBlob: wavBlob,
      durationMs,
    };
  }

  private buildWavBlob(chunks: Float32Array[], inputRate: number, targetRate: number): Blob {
    const pcm = this.mergeBuffers(chunks);
    const downsampled = this.downsampleBuffer(pcm, inputRate, targetRate);
    const wavBytes = this.encodeWAV(downsampled, targetRate);
    return new Blob([wavBytes], { type: 'audio/wav' });
  }

  private mergeBuffers(chunks: Float32Array[]): Float32Array {
    const length = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Float32Array(length);
    let offset = 0;
    for (const c of chunks) {
      result.set(c, offset);
      offset += c.length;
    }
    return result;
  }

  private downsampleBuffer(buffer: Float32Array, sampleRate: number, outRate: number): Int16Array {
    if (outRate === sampleRate) {
      return this.floatTo16BitPCM(buffer);
    }
    const ratio = sampleRate / outRate;
    const newLen = Math.round(buffer.length / ratio);
    const result = new Int16Array(newLen);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < newLen) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = Math.max(-32768, Math.min(32767, Math.round((accum / count) * 32767)));
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  private floatTo16BitPCM(buffer: Float32Array): Int16Array {
    const out = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      out[i] = s < 0 ? s * 32768 : s * 32767;
    }
    return out;
  }

  private encodeWAV(samples: Int16Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // file length minus RIFF identifier length and file description length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type
    this.writeString(view, 8, 'WAVE');
    // format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    this.writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, samples.length * 2, true);

    // write samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      view.setInt16(offset, samples[i], true);
    }

    return buffer;
  }

  private writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
}
