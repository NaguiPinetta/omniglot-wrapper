type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.isDevelopment && level === 'debug') {
      return; // Skip debug logs in production
    }

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    switch (level) {
      case 'debug':
        console.debug(`[${entry.timestamp}] DEBUG: ${message}`, data || '');
        break;
      case 'info':
        console.info(`[${entry.timestamp}] INFO: ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`[${entry.timestamp}] WARN: ${message}`, data || '');
        break;
      case 'error':
        console.error(`[${entry.timestamp}] ERROR: ${message}`, data || '');
        break;
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * Create a scoped logger with a prefix
   */
  scope(prefix: string): Logger {
    const scopedLogger = new Logger();
    scopedLogger.debug = (message: string, data?: any) => this.debug(`[${prefix}] ${message}`, data);
    scopedLogger.info = (message: string, data?: any) => this.info(`[${prefix}] ${message}`, data);
    scopedLogger.warn = (message: string, data?: any) => this.warn(`[${prefix}] ${message}`, data);
    scopedLogger.error = (message: string, data?: any) => this.error(`[${prefix}] ${message}`, data);
    return scopedLogger;
  }
}

export const logger = new Logger();

// Convenience function for API modules
export const createApiLogger = (module: string) => logger.scope(module); 