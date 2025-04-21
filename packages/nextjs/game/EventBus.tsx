import { Events } from "phaser";

// Interface for the debug options
interface DebugOptions {
  enabled: boolean;
  logToConsole: boolean;
  filterEvents?: string[];
  logPrefix?: string;
}

/**
 * Enhanced EventEmitter with debugging capabilities
 * Wraps Phaser's EventEmitter to provide debugging features
 */
class DebugEventBus extends Events.EventEmitter {
  private debugOptions: DebugOptions = {
    enabled: true,
    logToConsole: true,
    logPrefix: "[EventBus]",
  };

  private eventHistory: { event: string; args: any[]; timestamp: number }[] = [];
  private maxHistorySize = 100;

  /**
   * Emit an event, with debugging if enabled
   * @override
   */
  emit(event: string, ...args: any[]): boolean {
    // Log event for debugging if enabled
    if (this.debugOptions.enabled) {
      this.logEvent(event, args);
      this.addToHistory(event, args);
    }

    // Call the original emit method
    return super.emit(event, ...args);
  }

  /**
   * Configure debug options
   */
  configureDebug(options: Partial<DebugOptions>): void {
    this.debugOptions = { ...this.debugOptions, ...options };

    if (this.debugOptions.enabled) {
      console.log(`${this.debugOptions.logPrefix} Debug mode enabled`);
    }
  }

  /**
   * Enable debug mode
   */
  enableDebug(): void {
    this.configureDebug({ enabled: true });
  }

  /**
   * Disable debug mode
   */
  disableDebug(): void {
    this.configureDebug({ enabled: false });
  }

  /**
   * Get event history
   */
  getEventHistory(): { event: string; args: any[]; timestamp: number }[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearEventHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Log an event to the console
   */
  private logEvent(event: string, args: any[]): void {
    // Skip if filtering is enabled and this event is not in the filter
    if (
      this.debugOptions.filterEvents &&
      this.debugOptions.filterEvents.length > 0 &&
      !this.debugOptions.filterEvents.includes(event)
    ) {
      return;
    }

    if (this.debugOptions.logToConsole) {
      const prefix = this.debugOptions.logPrefix || "";
      console.log(`${prefix} Event: ${event}`, ...args);
    }
  }

  /**
   * Add an event to the history
   */
  private addToHistory(event: string, args: any[]): void {
    this.eventHistory.push({
      event,
      args,
      timestamp: Date.now(),
    });

    // Limit the history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}

// Used to emit events between React components and Phaser scenes
// https://newdocs.phaser.io/docs/3.70.0/Phaser.Events.EventEmitter
export const EventBus: Events.EventEmitter =
  process.env.NODE_ENV === "development" ? new DebugEventBus() : new Events.EventEmitter();
