// src/lib/rateLimiter.ts
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minDelay = 2000; // 2 seconds between requests
  private readonly maxRetries = 3;
  private readonly retryDelay = 30000; // 30 seconds

  async addToQueue<T>(apiCall: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeWithRetry(apiCall);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async executeWithRetry<T>(
    apiCall: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minDelay) {
        await this.sleep(this.minDelay - timeSinceLastRequest);
      }

      this.lastRequestTime = Date.now();
      return await apiCall();
    } catch (error: any) {
      if (error?.status === 429 && retryCount < this.maxRetries) {
        console.warn(
          `Rate limit hit, retrying in ${this.retryDelay / 1000}s...`
        );
        await this.sleep(this.retryDelay);
        return this.executeWithRetry(apiCall, retryCount + 1);
      }
      throw error;
    }
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    }
    this.processing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

export const rateLimiter = new RateLimiter();
