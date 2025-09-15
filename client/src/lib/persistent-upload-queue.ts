// CRITICAL #2: Upload Robustness - IndexedDB persistent queue with auto-resume
import { openDB, type IDBPDatabase } from 'idb';

export interface PersistentUploadItem {
  id: string;
  userId: string;
  testSessionId: string;
  segmentIndex: number;
  blob: Blob;
  timestamp: number;
  duration: number;
  retryCount: number;
  lastAttempt: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  uploadPath?: string;
  error?: string;
}

export interface UploadProgress {
  totalSegments: number;
  pendingSegments: number;
  completedSegments: number;
  failedSegments: number;
}

export class PersistentUploadQueue {
  private db: IDBPDatabase | null = null;
  private readonly dbName = 'VideoUploadQueue';
  private readonly dbVersion = 1;
  private readonly storeName = 'uploads';
  private readonly maxRetries = 5;
  private readonly baseDelayMs = 1000;
  
  private onProgressUpdate?: (progress: UploadProgress) => void;
  private onSegmentComplete?: (item: PersistentUploadItem) => void;
  private onError?: (error: string, item?: PersistentUploadItem) => void;

  async initialize(): Promise<void> {
    try {
      this.db = await openDB(this.dbName, this.dbVersion, {
        upgrade(db, oldVersion, newVersion) {
          if (oldVersion < 1) {
            const store = db.createObjectStore('uploads', { keyPath: 'id' });
            store.createIndex('testSessionId', 'testSessionId');
            store.createIndex('status', 'status');
            store.createIndex('userId', 'userId');
            store.createIndex('timestamp', 'timestamp');
          }
        },
      });
      
      // Auto-resume pending uploads on initialization
      await this.resumePendingUploads();
    } catch (error) {
      console.error('[PersistentUploadQueue] Failed to initialize:', error);
      this.onError?.('Failed to initialize upload queue database');
    }
  }

  setCallbacks(callbacks: {
    onProgressUpdate?: (progress: UploadProgress) => void;
    onSegmentComplete?: (item: PersistentUploadItem) => void;
    onError?: (error: string, item?: PersistentUploadItem) => void;
  }) {
    this.onProgressUpdate = callbacks.onProgressUpdate;
    this.onSegmentComplete = callbacks.onSegmentComplete;
    this.onError = callbacks.onError;
  }

  async addUploadItem(
    userId: string,
    testSessionId: string,
    segmentIndex: number,
    blob: Blob,
    duration: number
  ): Promise<string> {
    if (!this.db) {
      throw new Error('Upload queue not initialized');
    }

    const id = `${testSessionId}-${segmentIndex}-${Date.now()}`;
    const item: PersistentUploadItem = {
      id,
      userId,
      testSessionId,
      segmentIndex,
      blob,
      timestamp: Date.now(),
      duration,
      retryCount: 0,
      lastAttempt: 0,
      status: 'pending',
    };

    try {
      await this.db.add(this.storeName, item);
      await this.updateProgress();
      
      // Start upload immediately
      this.processUpload(item);
      
      return id;
    } catch (error) {
      console.error('[PersistentUploadQueue] Failed to add upload item:', error);
      this.onError?.('Failed to queue upload', item);
      throw error;
    }
  }

  private async processUpload(item: PersistentUploadItem): Promise<void> {
    if (!this.db) return;

    try {
      // Update status to uploading
      await this.updateItemStatus(item.id, 'uploading');
      
      // Get signed upload URL
      const uploadUrlResponse = await fetch('/api/video-recordings/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: item.userId,
          testSessionId: item.testSessionId,
          segmentIndex: item.segmentIndex,
        }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error(`Failed to get upload URL: ${uploadUrlResponse.status}`);
      }

      const { uploadURL } = await uploadUrlResponse.json();

      // Upload to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: item.blob,
        headers: {
          'Content-Type': 'video/webm',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      // Extract upload path from URL
      const uploadPath = new URL(uploadURL).pathname;

      // Notify backend of successful upload
      const notifyResponse = await fetch('/api/video-recordings/segment-uploaded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: item.userId,
          testSessionId: item.testSessionId,
          variantId: localStorage.getItem('currentVariantId'), // Stored during test
          segmentIndex: item.segmentIndex,
          uploadPath,
          duration: item.duration,
          timestamp: item.timestamp,
        }),
      });

      if (!notifyResponse.ok) {
        throw new Error(`Failed to notify backend: ${notifyResponse.status}`);
      }

      // Mark as completed
      const completedItem = { ...item, status: 'completed' as const, uploadPath };
      await this.updateItem(completedItem);
      await this.updateProgress();
      
      this.onSegmentComplete?.(completedItem);
      
      // Clean up completed items after 24 hours
      setTimeout(() => this.cleanupCompletedItem(item.id), 24 * 60 * 60 * 1000);

    } catch (error) {
      await this.handleUploadFailure(item, error as Error);
    }
  }

  private async handleUploadFailure(item: PersistentUploadItem, error: Error): Promise<void> {
    if (!this.db) return;

    const updatedItem = {
      ...item,
      retryCount: item.retryCount + 1,
      lastAttempt: Date.now(),
      error: error.message,
      status: 'failed' as const,
    };

    await this.updateItem(updatedItem);

    if (updatedItem.retryCount < this.maxRetries) {
      // Calculate exponential backoff with jitter
      const delayMs = this.baseDelayMs * Math.pow(2, updatedItem.retryCount) + 
                      Math.random() * this.baseDelayMs;
      
      console.log(`[PersistentUploadQueue] Retrying upload ${item.id} in ${delayMs}ms (attempt ${updatedItem.retryCount}/${this.maxRetries})`);
      
      // Schedule retry
      setTimeout(() => {
        this.updateItemStatus(item.id, 'pending').then(() => {
          this.processUpload({ ...updatedItem, status: 'pending' });
        });
      }, delayMs);
    } else {
      console.error(`[PersistentUploadQueue] Upload ${item.id} failed permanently after ${this.maxRetries} attempts:`, error);
      this.onError?.(`Upload failed permanently: ${error.message}`, updatedItem);
    }

    await this.updateProgress();
  }

  private async resumePendingUploads(): Promise<void> {
    if (!this.db) return;

    try {
      const pendingUploads = await this.db.getAllFromIndex(this.storeName, 'status', 'pending');
      const failedUploads = await this.db.getAllFromIndex(this.storeName, 'status', 'failed');
      
      console.log(`[PersistentUploadQueue] Resuming ${pendingUploads.length} pending and ${failedUploads.length} failed uploads`);

      // Resume pending uploads
      for (const item of pendingUploads) {
        this.processUpload(item);
      }

      // Retry failed uploads if they haven't exceeded max retries
      for (const item of failedUploads) {
        if (item.retryCount < this.maxRetries) {
          const timeSinceLastAttempt = Date.now() - item.lastAttempt;
          const minDelayMs = this.baseDelayMs * Math.pow(2, item.retryCount);
          
          if (timeSinceLastAttempt >= minDelayMs) {
            await this.updateItemStatus(item.id, 'pending');
            this.processUpload({ ...item, status: 'pending' });
          } else {
            // Schedule retry after remaining delay
            const remainingDelay = minDelayMs - timeSinceLastAttempt;
            setTimeout(() => {
              this.updateItemStatus(item.id, 'pending').then(() => {
                this.processUpload({ ...item, status: 'pending' });
              });
            }, remainingDelay);
          }
        }
      }

      await this.updateProgress();
    } catch (error) {
      console.error('[PersistentUploadQueue] Failed to resume uploads:', error);
    }
  }

  private async updateItem(item: PersistentUploadItem): Promise<void> {
    if (!this.db) return;
    await this.db.put(this.storeName, item);
  }

  private async updateItemStatus(id: string, status: PersistentUploadItem['status']): Promise<void> {
    if (!this.db) return;
    
    const item = await this.db.get(this.storeName, id);
    if (item) {
      item.status = status;
      await this.db.put(this.storeName, item);
    }
  }

  private async updateProgress(): Promise<void> {
    if (!this.db || !this.onProgressUpdate) return;

    try {
      const allItems = await this.db.getAll(this.storeName);
      const totalSegments = allItems.length;
      const completedSegments = allItems.filter(item => item.status === 'completed').length;
      const pendingSegments = allItems.filter(item => 
        item.status === 'pending' || item.status === 'uploading'
      ).length;
      const failedSegments = allItems.filter(item => 
        item.status === 'failed' && item.retryCount >= this.maxRetries
      ).length;

      this.onProgressUpdate({
        totalSegments,
        pendingSegments,
        completedSegments,
        failedSegments,
      });
    } catch (error) {
      console.error('[PersistentUploadQueue] Failed to update progress:', error);
    }
  }

  async getUploadProgress(testSessionId?: string): Promise<UploadProgress> {
    if (!this.db) {
      return { totalSegments: 0, pendingSegments: 0, completedSegments: 0, failedSegments: 0 };
    }

    try {
      let items: PersistentUploadItem[];
      if (testSessionId) {
        items = await this.db.getAllFromIndex(this.storeName, 'testSessionId', testSessionId);
      } else {
        items = await this.db.getAll(this.storeName);
      }

      return {
        totalSegments: items.length,
        completedSegments: items.filter(item => item.status === 'completed').length,
        pendingSegments: items.filter(item => 
          item.status === 'pending' || item.status === 'uploading'
        ).length,
        failedSegments: items.filter(item => 
          item.status === 'failed' && item.retryCount >= this.maxRetries
        ).length,
      };
    } catch (error) {
      console.error('[PersistentUploadQueue] Failed to get upload progress:', error);
      return { totalSegments: 0, pendingSegments: 0, completedSegments: 0, failedSegments: 0 };
    }
  }

  private async cleanupCompletedItem(id: string): Promise<void> {
    if (!this.db) return;
    
    try {
      await this.db.delete(this.storeName, id);
      await this.updateProgress();
    } catch (error) {
      console.error('[PersistentUploadQueue] Failed to cleanup completed item:', error);
    }
  }

  async clearTestSession(testSessionId: string): Promise<void> {
    if (!this.db) return;

    try {
      const items = await this.db.getAllFromIndex(this.storeName, 'testSessionId', testSessionId);
      for (const item of items) {
        await this.db.delete(this.storeName, item.id);
      }
      await this.updateProgress();
    } catch (error) {
      console.error('[PersistentUploadQueue] Failed to clear test session:', error);
    }
  }

  async getAllFailedUploads(userId?: string): Promise<PersistentUploadItem[]> {
    if (!this.db) return [];

    try {
      let items = await this.db.getAllFromIndex(this.storeName, 'status', 'failed');
      if (userId) {
        items = items.filter(item => item.userId === userId);
      }
      return items.filter(item => item.retryCount >= this.maxRetries);
    } catch (error) {
      console.error('[PersistentUploadQueue] Failed to get failed uploads:', error);
      return [];
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance for global use
export const persistentUploadQueue = new PersistentUploadQueue();