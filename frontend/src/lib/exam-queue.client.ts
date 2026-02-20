// Client-side exam queue for Edge Runtime compatibility
// This replaces the server-side exam-queue.ts

// 5 tipe soal: PILIHAN_GANDA, ESSAY, ISIAN_SINGKAT, BENAR_SALAH, PENCOCOKAN
type SoalType = 'PILIHAN_GANDA' | 'ESSAY' | 'ISIAN_SINGKAT' | 'BENAR_SALAH' | 'PENCOCOKAN';

interface QueuedAnswer {
  questionId: string;
  questionType: SoalType;
  answer: any;
  timestamp: number;
  retries: number;
}

interface QueueStatus {
  total: number;
  saved: number;
  pending: number;
  saving: number;
  failed: number;
}

type SaveCallback = (questionId: string, success: boolean) => void;

class ExamQueueClient {
  private examId: string | null = null;
  private pendingAnswers: Map<string, QueuedAnswer> = new Map(); // Pending answers waiting for batch
  private savedAnswers: Set<string> = new Set();
  private failedAnswers: QueuedAnswer[] = [];
  private isSaving = false;
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 3000; // 3 seconds debounce
  private onSaveCallback: SaveCallback | null = null;

  setExamId(id: string) {
    this.examId = id;
    this.pendingAnswers.clear();
    this.savedAnswers.clear();
    this.failedAnswers = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  // Set callback for when answers are saved
  onSave(callback: SaveCallback) {
    this.onSaveCallback = callback;
  }

  // Check if a question is pending save
  isPending(questionId: string): boolean {
    return this.pendingAnswers.has(questionId);
  }

  // Check if a question was saved successfully
  isSaved(questionId: string): boolean {
    return this.savedAnswers.has(questionId);
  }

  addAnswer(questionId: string, questionType: SoalType, answer: any) {
    // Add/update answer in pending map (overwrites previous value for same question)
    this.pendingAnswers.set(questionId, {
      questionId,
      questionType,
      answer,
      timestamp: Date.now(),
      retries: 0,
    });

    // Reset batch timer - wait 3 seconds after last activity
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    this.batchTimer = setTimeout(() => {
      this.flushPendingAnswers();
    }, this.DEBOUNCE_MS);
  }

  // Flush all pending answers as a batch
  private async flushPendingAnswers() {
    if (this.isSaving || this.pendingAnswers.size === 0 || !this.examId) return;

    this.isSaving = true;
    this.batchTimer = null;

    // Get all pending answers and clear the map
    const answersToSave = Array.from(this.pendingAnswers.values());
    this.pendingAnswers.clear();

    console.log(`[ExamQueue] Batching ${answersToSave.length} answers`);

    // Save all answers in parallel
    const results = await Promise.allSettled(
      answersToSave.map(async (item) => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          
          const response = await fetch(`${apiUrl}/siswa/ujian/${this.examId}/jawab`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              soalId: item.questionId,
              jawaban: item.answer,
            }),
          });

          if (response.ok) {
            this.savedAnswers.add(item.questionId);
            this.failedAnswers = this.failedAnswers.filter(f => f.questionId !== item.questionId);
            // Call callback with success
            if (this.onSaveCallback) {
              this.onSaveCallback(item.questionId, true);
            }
            return { success: true, questionId: item.questionId };
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error(`Error saving answer ${item.questionId}:`, error);
          // Add to failed if max retries reached
          if (item.retries >= 2) {
            this.failedAnswers.push(item);
            // Call callback with failure
            if (this.onSaveCallback) {
              this.onSaveCallback(item.questionId, false);
            }
          } else {
            // Re-add to pending for retry
            item.retries++;
            this.pendingAnswers.set(item.questionId, item);
          }
          return { success: false, questionId: item.questionId };
        }
      })
    );

    this.isSaving = false;

    // If there are retries pending, schedule another flush
    if (this.pendingAnswers.size > 0 && !this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushPendingAnswers();
      }, 1000); // Retry after 1 second
    }
  }

  getQueueStatus(): QueueStatus {
    return {
      total: this.savedAnswers.size + this.pendingAnswers.size + this.failedAnswers.length,
      saved: this.savedAnswers.size,
      pending: this.pendingAnswers.size,
      saving: this.isSaving ? 1 : 0,
      failed: this.failedAnswers.length,
    };
  }

  getFailedAnswers(): QueuedAnswer[] {
    return [...this.failedAnswers];
  }

  getPendingAnswers(): QueuedAnswer[] {
    return Array.from(this.pendingAnswers.values());
  }

  getAllAnswers(): Record<string, any> {
    const answers: Record<string, any> = {};
    for (const [questionId, item] of this.pendingAnswers) {
      answers[questionId] = item.answer;
    }
    return answers;
  }

  clearFailedAnswers() {
    this.failedAnswers = [];
  }

  clear() {
    this.pendingAnswers.clear();
    this.savedAnswers.clear();
    this.failedAnswers = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  // Flush all pending answers immediately (for exam submission)
  async flushAll(): Promise<boolean> {
    // Clear batch timer and flush immediately
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Flush pending answers
    await this.flushPendingAnswers();

    // Wait for saving to complete
    let attempts = 0;
    while ((this.isSaving || this.pendingAnswers.size > 0) && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }

    return this.failedAnswers.length === 0;
  }

  // Wait for all answers to be saved (with timeout)
  async waitForAllSaved(timeoutMs: number = 60000): Promise<boolean> {
    const startTime = Date.now();
    
    // First flush any pending
    await this.flushAll();
    
    // Wait for everything to complete
    while (Date.now() - startTime < timeoutMs) {
      if (this.pendingAnswers.size === 0 && !this.isSaving) {
        return this.failedAnswers.length === 0;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return false; // Timeout
  }
}

// Singleton instance
export const examQueue = new ExamQueueClient();

// Helper function to generate checksum
export function generateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
