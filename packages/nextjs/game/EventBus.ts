import { EventMap } from "./EventTypes";
import { Events } from "phaser";

// Interface for the debug options
interface EmitterOptions {
  debugEnabled: boolean;
  logToConsole: boolean;
  filterEvents?: Array<keyof EventMap>;
  logPrefix?: string;
}

/**
 * Type-safe event emitter interface that extends Phaser's EventEmitter
 */
export interface TypedEventEmitter<T extends Record<string, any>> {
  on<K extends keyof T>(event: K, fn: (arg: T[K]) => void, context?: any): this;
  once<K extends keyof T>(event: K, fn: (arg: T[K]) => void, context?: any): this;
  off<K extends keyof T>(event: K, fn?: (arg: T[K]) => void, context?: any, once?: boolean): this;
  emit<K extends keyof T>(event: K, arg: T[K]): boolean;
  removeAllListeners<K extends keyof T>(event?: K): this;
  listenerCount<K extends keyof T>(event: K): number;
}

/**
 * Enhanced EventEmitter with debugging capabilities and type safety
 * Wraps Phaser's EventEmitter to provide debugging features and type safety
 */
class TypedEventBus extends Events.EventEmitter implements TypedEventEmitter<EventMap> {
  private emitterOptions: EmitterOptions = {
    debugEnabled: true,
    logToConsole: true,
    logPrefix: "[EventBus]",
  };

  private eventHistory: Array<{ event: keyof EventMap; args: any; timestamp: number }> = [];
  private maxHistorySize = 100;

  constructor(options: Partial<EmitterOptions> = {}) {
    super();
    this.configureOptions(options);
  }

  /**
   * Register an event listener with type safety
   * @override
   */
  on<K extends keyof EventMap>(event: K, fn: (arg: EventMap[K]) => void, context?: any): this {
    return super.on(event as string, fn, context);
  }

  /**
   * Register a one-time event listener with type safety
   * @override
   */
  once<K extends keyof EventMap>(event: K, fn: (arg: EventMap[K]) => void, context?: any): this {
    return super.once(event as string, fn, context);
  }

  /**
   * Remove an event listener with type safety
   * @override
   */
  off<K extends keyof EventMap>(event: K, fn?: (arg: EventMap[K]) => void, context?: any, once?: boolean): this {
    return super.off(event as string, fn, context, once);
  }

  /**
   * Emit an event with type safety and debugging if enabled
   * @override
   */
  emit<K extends keyof EventMap>(event: K, arg: EventMap[K]): boolean {
    // Log event for debugging if enabled
    if (this.emitterOptions.debugEnabled) {
      this.logEvent(event, arg);
      this.addToHistory(event, arg);
    }

    // Call the original emit method
    return super.emit(event as string, arg);
  }

  /**
   * Configure debug options
   */
  configureOptions(options: Partial<EmitterOptions>): void {
    this.emitterOptions = { ...this.emitterOptions, ...options };

    if (this.emitterOptions.debugEnabled) {
      console.log(`${this.emitterOptions.logPrefix} Debug mode enabled`);
    }
  }

  /**
   * Get event history
   */
  getEventHistory(): Array<{ event: keyof EventMap; args: any; timestamp: number }> {
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
  private logEvent(event: keyof EventMap, args: any): void {
    // Skip if filtering is enabled and this event is not in the filter
    if (
      this.emitterOptions.filterEvents &&
      this.emitterOptions.filterEvents.length > 0 &&
      !this.emitterOptions.filterEvents.includes(event)
    ) {
      return;
    }

    if (this.emitterOptions.logToConsole) {
      const prefix = this.emitterOptions.logPrefix || "";
      console.log(`${prefix} Event: ${String(event)}`, args);
    }
  }

  /**
   * Add an event to the history
   */
  private addToHistory(event: keyof EventMap, args: any): void {
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
export const EventBus = new TypedEventBus({});
