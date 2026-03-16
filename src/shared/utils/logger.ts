import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  file?: string;
  line?: number;
  stack?: string;
  context?: any;
}

class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'app.log');
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getCallerInfo(providedStack?: string): { file: string; line: number } {
    const stack = providedStack || new Error().stack;
    if (!stack) return { file: 'unknown', line: 0 };

    const lines = stack.split('\n');
    // If we have a provided stack (from an error), start from line 1
    // Otherwise skip first 3 lines: Error, getCallerInfo, and the logger method
    const startIndex = providedStack ? 1 : 3;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/at\s+.*\s+\((.+):(\d+):\d+\)|at\s+(.+):(\d+):\d+/);
      if (match) {
        const filePath = match[1] || match[3];
        const lineNumber = parseInt(match[2] || match[4]);
        const fileName = path.basename(filePath);
        
        // Skip internal Node.js files and logger files
        if (fileName.includes('node_modules') || fileName === 'logger.ts' || fileName === 'errorHandler.ts') {
          continue;
        }
        
        return { file: fileName, line: lineNumber };
      }
    }
    return { file: 'unknown', line: 0 };
  }

  private writeLog(entry: LogEntry): void {
    const logLine = JSON.stringify(entry) + '\n';
    
    // Write to file
    fs.appendFileSync(this.logFile, logLine);
    
    // Also log to console with color coding
    const color = entry.level === 'ERROR' ? '\x1b[31m' : entry.level === 'WARN' ? '\x1b[33m' : '\x1b[36m';
    const reset = '\x1b[0m';
    const fileInfo = entry.file ? ` (${entry.file}:${entry.line})` : '';
    
    console.log(`${color}[${entry.timestamp}] ${entry.level}${reset}: ${entry.message}${fileInfo}`);
    if (entry.stack && env.nodeEnv === 'development') {
      console.log(entry.stack);
    }
  }

  info(message: string, context?: any): void {
    const caller = this.getCallerInfo();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      file: caller.file,
      line: caller.line,
      context
    };
    this.writeLog(entry);
  }

  warn(message: string, context?: any): void {
    const caller = this.getCallerInfo();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      file: caller.file,
      line: caller.line,
      context
    };
    this.writeLog(entry);
  }

  error(message: string, error?: Error | any, context?: any): void {
    const caller = this.getCallerInfo(error?.stack);
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: error?.message || message,
      file: caller.file,
      line: caller.line,
      stack: error?.stack || (error instanceof Error ? error.stack : undefined),
      context: {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message
        } : error
      }
    };
    this.writeLog(entry);
  }

  // Method to read recent logs
  getRecentLogs(lines: number = 100): LogEntry[] {
    try {
      if (!fs.existsSync(this.logFile)) return [];
      
      const content = fs.readFileSync(this.logFile, 'utf-8');
      const logLines = content.trim().split('\n').slice(-lines);
      
      return logLines
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  // Method to clear logs
  clearLogs(): void {
    if (fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '');
    }
  }
}

export const logger = new Logger();