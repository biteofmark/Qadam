import { apiRequest } from "@/lib/queryClient";
import { persistentUploadQueue, type UploadProgress } from "@/lib/persistent-upload-queue";

export interface VideoRecordingConfig {
  userId: string;
  testSessionId: string;
  variantId: string;
  chunkDurationMs: number;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}

export interface VideoSegment {
  index: number;
  blob: Blob;
  timestamp: number;
  duration: number;
  uploadPath?: string;
}

export interface RecordingMetadata {
  testSessionId: string;
  totalSegments: number;
  totalDurationMs: number;
  uploadProgress: UploadProgress;
}

export class VideoRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private config: VideoRecordingConfig;
  private isRecording: boolean = false;
  private currentSegmentIndex: number = 0;
  private recordingStartTime: number = 0;
  private chunks: Blob[] = [];
  private isInitialized: boolean = false;
  
  private onSegmentReady?: (segment: VideoSegment) => void;
  private onUploadProgress?: (progress: UploadProgress) => void;
  private onRecordingStatusChange?: (isRecording: boolean) => void;
  private onError?: (error: string) => void;

  constructor(config: VideoRecordingConfig) {
    this.config = config;
  }

  setCallbacks(callbacks: {
    onSegmentReady?: (segment: VideoSegment) => void;
    onUploadProgress?: (progress: UploadProgress) => void;
    onRecordingStatusChange?: (isRecording: boolean) => void;
    onError?: (error: string) => void;
  }) {
    this.onSegmentReady = callbacks.onSegmentReady;
    this.onUploadProgress = callbacks.onUploadProgress;
    this.onRecordingStatusChange = callbacks.onRecordingStatusChange;
    this.onError = callbacks.onError;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      await persistentUploadQueue.initialize();
      
      // Set up persistent queue callbacks
      persistentUploadQueue.setCallbacks({
        onProgressUpdate: (progress) => {
          this.onUploadProgress?.(progress);
        },
        onSegmentComplete: (item) => {
          console.log(`[VideoRecordingService] Segment ${item.segmentIndex} upload completed`);
        },
        onError: (error, item) => {
          this.onError?.(`Upload error: ${error}`);
        }
      });
      
      // Store current variant ID for use in uploads
      if (this.config.variantId) {
        localStorage.setItem('currentVariantId', this.config.variantId);
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[VideoRecordingService] Failed to initialize:', error);
      this.onError?.('Failed to initialize video recording service');
      return false;
    }
  }

  async requestCameraPermission(): Promise<boolean> {
    try {
      // Request camera and microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      this.onError?.('Доступ к камере запрещен. Прокторинг невозможен.');
      return false;
    }
  }

  getVideoStream(): MediaStream | null {
    return this.mediaStream;
  }

  async startRecording(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
    }

    if (!this.mediaStream) {
      this.onError?.('Медиа поток не доступен');
      return false;
    }

    try {
      // Check browser support
      if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          this.onError?.('Браузер не поддерживает запись видео');
          return false;
        }
      }

      const options: MediaRecorderOptions = {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
          ? 'video/webm;codecs=vp9' 
          : 'video/webm;codecs=vp8',
        videoBitsPerSecond: this.config.videoBitsPerSecond || 1000000, // 1Mbps
        audioBitsPerSecond: this.config.audioBitsPerSecond || 128000   // 128kbps
      };

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecordedChunks();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.onError?.('Ошибка записи видео');
      };

      // Start recording with chunked intervals
      this.mediaRecorder.start();
      this.recordingStartTime = Date.now();
      this.isRecording = true;
      this.currentSegmentIndex = 0;
      
      this.onRecordingStatusChange?.(true);
      
      // Schedule chunk creation
      this.scheduleChunkCreation();

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.onError?.('Не удалось начать запись');
      return false;
    }
  }

  private scheduleChunkCreation() {
    if (!this.isRecording || !this.mediaRecorder) return;

    setTimeout(() => {
      if (this.isRecording && this.mediaRecorder?.state === 'recording') {
        // Stop current chunk and start new one
        this.mediaRecorder.stop();
        
        // Restart recording for next chunk
        setTimeout(() => {
          if (this.isRecording && this.mediaStream) {
            this.mediaRecorder = new MediaRecorder(this.mediaStream, {
              mimeType: this.mediaRecorder?.mimeType || 'video/webm;codecs=vp8'
            });
            
            this.mediaRecorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                this.chunks.push(event.data);
              }
            };
            
            this.mediaRecorder.onstop = () => {
              this.processRecordedChunks();
            };
            
            this.mediaRecorder.start();
            this.scheduleChunkCreation();
          }
        }, 100);
      }
    }, this.config.chunkDurationMs);
  }

  // CRITICAL #2: Upload Robustness - Use persistent queue instead of in-memory queue
  private async processRecordedChunks() {
    if (this.chunks.length === 0 || !this.isInitialized) return;

    const blob = new Blob(this.chunks, { type: 'video/webm' });
    const segment: VideoSegment = {
      index: this.currentSegmentIndex++,
      blob,
      timestamp: Date.now(),
      duration: this.config.chunkDurationMs
    };

    this.chunks = []; // Clear chunks for next segment
    
    try {
      // Add to persistent queue - will auto-upload with retry logic
      await persistentUploadQueue.addUploadItem(
        this.config.userId,
        this.config.testSessionId,
        segment.index,
        segment.blob,
        segment.duration
      );
      
      this.onSegmentReady?.(segment);
    } catch (error) {
      console.error('[VideoRecordingService] Failed to queue segment:', error);
      this.onError?.('Failed to queue video segment for upload');
    }
  }

  // CRITICAL #2: Upload Robustness - Removed old upload queue, now using PersistentUploadQueue
  async getUploadProgress(): Promise<UploadProgress> {
    if (!this.isInitialized) {
      return { totalSegments: 0, pendingSegments: 0, completedSegments: 0, failedSegments: 0 };
    }
    
    return await persistentUploadQueue.getUploadProgress(this.config.testSessionId);
  }

  private async uploadSegment(segment: VideoSegment): Promise<void> {
    try {
      // Get upload URL from backend
      const response = await apiRequest('POST', '/api/video-recordings/upload-url', {
        userId: this.config.userId,
        testSessionId: this.config.testSessionId,
        segmentIndex: segment.index
      });

      const { uploadURL } = await response.json();

      // Upload the video blob directly to Object Storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: segment.blob,
        headers: {
          'Content-Type': 'video/webm'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      // Update segment with upload path
      segment.uploadPath = uploadURL.split('?')[0]; // Remove query params
      
      // Notify backend about successful upload
      await apiRequest('POST', '/api/video-recordings/segment-uploaded', {
        userId: this.config.userId,
        testSessionId: this.config.testSessionId,
        variantId: this.config.variantId,
        segmentIndex: segment.index,
        uploadPath: segment.uploadPath,
        duration: segment.duration,
        timestamp: segment.timestamp
      });

      this.onUploadProgress?.(segment, true);
    } catch (error) {
      console.error('Segment upload failed:', error);
      this.onUploadProgress?.(segment, false);
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingMetadata> {
    this.isRecording = false;
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    this.onRecordingStatusChange?.(false);

    // Wait for remaining uploads to complete
    while (this.uploadQueue.length > 0 && this.isUploading) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Final metadata
    const metadata: RecordingMetadata = {
      testSessionId: this.config.testSessionId,
      totalSegments: this.currentSegmentIndex,
      totalDurationMs: Date.now() - this.recordingStartTime,
      uploadedSegments: [], // Will be populated by backend
      failedUploads: 0
    };

    // Notify backend about recording completion
    try {
      await apiRequest('POST', '/api/video-recordings/complete', {
        userId: this.config.userId,
        testSessionId: this.config.testSessionId,
        variantId: this.config.variantId,
        metadata
      });
    } catch (error) {
      console.error('Failed to complete recording:', error);
    }

    return metadata;
  }

  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  cleanup() {
    this.isRecording = false;
    
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.chunks = [];
    this.uploadQueue = [];
  }

  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      currentSegment: this.currentSegmentIndex,
      recordingDuration: this.isRecording ? Date.now() - this.recordingStartTime : 0,
      pendingUploads: this.uploadQueue.length
    };
  }
}