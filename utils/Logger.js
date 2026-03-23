/**
 * Logger Utility
 * Structured logging with levels, timestamps, and test context.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

export class Logger {
  /**
   * @param {string} context - Logger context (e.g., page object name or test name)
   */
  constructor(context = '') {
    this.context = context;
    this.level = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;
  }

  _timestamp() {
    return new Date().toISOString().slice(11, 23);
  }

  _format(level, message) {
    const prefix = this.context ? `[${this.context}]` : '';
    return `${this._timestamp()} ${level} ${prefix} ${message}`;
  }

  debug(message) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.log(this._format('DEBUG', message));
    }
  }

  info(message) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.log(this._format('INFO ', message));
    }
  }

  warn(message) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(this._format('WARN ', message));
    }
  }

  error(message, error = null) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error(this._format('ERROR', message));
      if (error?.stack) {
        console.error(error.stack);
      }
    }
  }

  step(stepNumber, description) {
    this.info(`STEP ${stepNumber}: ${description}`);
  }

  section(title) {
    const border = '='.repeat(70);
    console.log(`\n${border}`);
    console.log(`  ${title}`);
    console.log(`${border}\n`);
  }

  subsection(title) {
    const border = '-'.repeat(50);
    console.log(`\n${border}`);
    console.log(`  ${title}`);
    console.log(`${border}\n`);
  }

  success(message) {
    this.info(`PASS: ${message}`);
  }

  fail(message) {
    this.error(`FAIL: ${message}`);
  }
}
