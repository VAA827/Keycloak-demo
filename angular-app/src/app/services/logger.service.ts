import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private isProduction = environment.production;

  /**
   * Logs informational messages (only in development)
   */
  log(message: string, ...args: any[]): void {
    if (!this.isProduction) {
      console.log(message, ...args);
    }
  }

  /**
   * Logs informational messages with a prefix (only in development)
   */
  info(prefix: string, message: string, ...args: any[]): void {
    if (!this.isProduction) {
      console.log(`${prefix} ${message}`, ...args);
    }
  }

  /**
   * Logs warning messages (development and production)
   */
  warn(message: string, ...args: any[]): void {
    console.warn(message, ...args);
  }

  /**
   * Logs error messages (development and production)
   */
  error(message: string, error?: any): void {
    console.error(message, error);
  }

  /**
   * Logs debug messages (only in development)
   */
  debug(message: string, ...args: any[]): void {
    if (!this.isProduction) {
      console.debug(message, ...args);
    }
  }
}