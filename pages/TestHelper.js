/**
 * Test Helper Utilities
 * Static utility methods for common test operations.
 */

export class TestHelper {
  /**
   * Wait with optional logging
   * @param {number} ms - Milliseconds to wait
   * @param {string} [message] - Optional log message
   */
  static async wait(ms, message = '') {
    if (message) {
      console.log(`  Waiting: ${message} (${ms}ms)`);
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry an async operation with exponential backoff
   * @param {Function} operation - Async function to retry
   * @param {number} [maxRetries=3] - Max attempts
   * @param {number} [initialDelayMs=1000] - Initial delay
   * @returns {Promise<any>}
   */
  static async retryWithBackoff(operation, maxRetries = 3, initialDelayMs = 1000) {
    let lastError;
    let delay = initialDelayMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          console.log(`  Attempt ${attempt}/${maxRetries} failed. Retrying in ${delay}ms...`);
          await TestHelper.wait(delay);
          delay *= 2;
        }
      }
    }

    throw lastError;
  }

  /**
   * Retry an async operation with fixed delay
   * @param {Function} operation - Async function to retry
   * @param {number} [maxRetries=3] - Max attempts
   * @param {number} [delayMs=1000] - Fixed delay between attempts
   * @returns {Promise<any>}
   */
  static async retryWithFixedDelay(operation, maxRetries = 3, delayMs = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          console.log(`  Attempt ${attempt}/${maxRetries} failed. Retrying in ${delayMs}ms...`);
          await TestHelper.wait(delayMs);
        }
      }
    }

    throw lastError;
  }

  /**
   * Get elapsed time in seconds from a start timestamp
   * @param {number} startTime - Start time from Date.now()
   * @returns {string} Formatted elapsed time
   */
  static getElapsedTime(startTime) {
    const seconds = (Date.now() - startTime) / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remaining = (seconds % 60).toFixed(1);
    return `${minutes}m ${remaining}s`;
  }

  /**
   * Get current timestamp in readable format
   * @returns {string}
   */
  static getCurrentTimestamp() {
    return new Date().toISOString();
  }
}
