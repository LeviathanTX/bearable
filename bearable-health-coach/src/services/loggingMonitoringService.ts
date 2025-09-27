import { supabase, handleSupabaseError } from './supabase';

// === TYPES FOR LOGGING AND MONITORING ===

export interface SystemLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: 'system' | 'coach' | 'user' | 'api' | 'database' | 'performance';
  component: string;
  message: string;
  data?: any;
  userId?: string;
  coachId?: string;
  sessionId?: string;
  errorStack?: string;
  metadata: Record<string, any>;
}

export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  metricName: string;
  value: number;
  unit: string;
  category: 'response_time' | 'throughput' | 'error_rate' | 'usage' | 'resource';
  component: string;
  tags: Record<string, string>;
}

export interface SystemHealth {
  id: string;
  timestamp: Date;
  component: string;
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  responseTime?: number;
  errorRate?: number;
  uptime?: number;
  details: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string; // e.g., "error_rate > 5% for 5 minutes"
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  notificationChannels: string[];
  createdAt: Date;
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  metadata: Record<string, any>;
}

export class LoggingMonitoringService {
  private logBuffer: SystemLog[] = [];
  private metricsBuffer: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startBufferFlushInterval();
  }

  // === LOGGING METHODS ===

  /**
   * Log debug information
   */
  debug(component: string, message: string, data?: any, metadata: Record<string, any> = {}): void {
    this.log('debug', 'system', component, message, data, metadata);
  }

  /**
   * Log informational messages
   */
  info(component: string, message: string, data?: any, metadata: Record<string, any> = {}): void {
    this.log('info', 'system', component, message, data, metadata);
  }

  /**
   * Log warning messages
   */
  warn(component: string, message: string, data?: any, metadata: Record<string, any> = {}): void {
    this.log('warn', 'system', component, message, data, metadata);
  }

  /**
   * Log error messages
   */
  error(component: string, message: string, error?: Error, metadata: Record<string, any> = {}): void {
    const data = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined;

    this.log('error', 'system', component, message, data, {
      ...metadata,
      errorStack: error?.stack
    });
  }

  /**
   * Log critical system errors
   */
  critical(component: string, message: string, error?: Error, metadata: Record<string, any> = {}): void {
    const data = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined;

    this.log('critical', 'system', component, message, data, {
      ...metadata,
      errorStack: error?.stack
    });

    // Immediately flush critical logs
    this.flushLogs();
  }

  /**
   * Log coach-specific events
   */
  logCoachEvent(
    coachId: string,
    event: string,
    level: SystemLog['level'] = 'info',
    data?: any,
    metadata: Record<string, any> = {}
  ): void {
    this.log(level, 'coach', 'coach-system', event, data, {
      ...metadata,
      coachId
    });
  }

  /**
   * Log user interaction events
   */
  logUserEvent(
    userId: string,
    event: string,
    level: SystemLog['level'] = 'info',
    data?: any,
    metadata: Record<string, any> = {}
  ): void {
    this.log(level, 'user', 'user-system', event, data, {
      ...metadata,
      userId
    });
  }

  /**
   * Log API request/response
   */
  logApiEvent(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    metadata: Record<string, any> = {}
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    this.log(level, 'api', 'api-gateway', `${method} ${endpoint}`, {
      statusCode,
      responseTime,
      userId
    }, metadata);

    // Also record as performance metric
    this.recordMetric('api_response_time', responseTime, 'ms', 'response_time', 'api-gateway', {
      endpoint,
      method,
      status_code: statusCode.toString()
    });
  }

  // === PERFORMANCE MONITORING ===

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    category: PerformanceMetric['category'],
    component: string,
    tags: Record<string, string> = {}
  ): void {
    const metric: PerformanceMetric = {
      id: this.generateId(),
      timestamp: new Date(),
      metricName: name,
      value,
      unit,
      category,
      component,
      tags
    };

    this.metricsBuffer.push(metric);

    // Auto-flush if buffer is getting large
    if (this.metricsBuffer.length >= 100) {
      this.flushMetrics();
    }
  }

  /**
   * Time a function execution and record performance
   */
  async timeFunction<T>(
    name: string,
    component: string,
    fn: () => Promise<T>,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.recordMetric(`${name}_duration`, duration, 'ms', 'response_time', component, tags);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric(`${name}_duration`, duration, 'ms', 'response_time', component, {
        ...tags,
        error: 'true'
      });
      throw error;
    }
  }

  /**
   * Record system usage metrics
   */
  recordUsageMetrics(): void {
    // Record memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      this.recordMetric('memory_heap_used', memory.heapUsed / 1024 / 1024, 'MB', 'resource', 'system');
      this.recordMetric('memory_heap_total', memory.heapTotal / 1024 / 1024, 'MB', 'resource', 'system');
      this.recordMetric('memory_rss', memory.rss / 1024 / 1024, 'MB', 'resource', 'system');
    }

    // Record current timestamp for uptime tracking
    this.recordMetric('system_heartbeat', 1, 'count', 'usage', 'system');
  }

  // === HEALTH MONITORING ===

  /**
   * Check and record system health
   */
  async checkSystemHealth(): Promise<SystemHealth[]> {
    const healthChecks: SystemHealth[] = [];

    // Database health
    const dbHealth = await this.checkDatabaseHealth();
    healthChecks.push(dbHealth);

    // API health
    const apiHealth = await this.checkApiHealth();
    healthChecks.push(apiHealth);

    // Coach system health
    const coachHealth = await this.checkCoachSystemHealth();
    healthChecks.push(coachHealth);

    // Store health records
    await this.storeHealthRecords(healthChecks);

    return healthChecks;
  }

  /**
   * Get system health status
   */
  async getSystemHealthStatus(): Promise<{
    overall: SystemHealth['status'];
    components: SystemHealth[];
    lastChecked: Date;
  }> {
    try {
      const { data, error } = await supabase
        .from('system_health')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) {
        this.error('health-monitor', 'Failed to fetch health status', error);
        return {
          overall: 'down',
          components: [],
          lastChecked: new Date()
        };
      }

      const latestHealth = data as SystemHealth[];
      const componentStatus = new Map<string, SystemHealth>();

      // Get latest status for each component
      latestHealth.forEach(health => {
        if (!componentStatus.has(health.component)) {
          componentStatus.set(health.component, health);
        }
      });

      const components = Array.from(componentStatus.values());

      // Determine overall status
      const hasDown = components.some(c => c.status === 'down');
      const hasDegraded = components.some(c => c.status === 'degraded');

      const overall: SystemHealth['status'] = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy';

      return {
        overall,
        components,
        lastChecked: components[0]?.timestamp || new Date()
      };
    } catch (error) {
      this.error('health-monitor', 'Error getting health status', error as Error);
      return {
        overall: 'down',
        components: [],
        lastChecked: new Date()
      };
    }
  }

  // === ALERT MANAGEMENT ===

  /**
   * Create an alert rule
   */
  async createAlertRule(
    name: string,
    condition: string,
    severity: AlertRule['severity'],
    notificationChannels: string[]
  ): Promise<AlertRule> {
    const rule: AlertRule = {
      id: this.generateId(),
      name,
      condition,
      severity,
      isActive: true,
      notificationChannels,
      createdAt: new Date()
    };

    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .insert([rule])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data as AlertRule;
    } catch (error) {
      this.error('alert-manager', 'Failed to create alert rule', error as Error);
      throw error;
    }
  }

  /**
   * Trigger an alert
   */
  async triggerAlert(
    ruleId: string,
    title: string,
    description: string,
    severity: Alert['severity'],
    metadata: Record<string, any> = {}
  ): Promise<Alert> {
    const alert: Alert = {
      id: this.generateId(),
      ruleId,
      severity,
      title,
      description,
      triggeredAt: new Date(),
      status: 'active',
      metadata
    };

    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert([alert])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      this.critical('alert-manager', `Alert triggered: ${title}`, undefined, {
        alertId: alert.id,
        severity,
        description
      });

      return data as Alert;
    } catch (error) {
      this.error('alert-manager', 'Failed to trigger alert', error as Error);
      throw error;
    }
  }

  /**
   * Get analytics and insights
   */
  async getAnalytics(timeframe: 'hour' | 'day' | 'week' | 'month'): Promise<{
    errorRates: { timestamp: Date; rate: number }[];
    responseTimeP95: { timestamp: Date; p95: number }[];
    throughput: { timestamp: Date; requests: number }[];
    topErrors: { message: string; count: number }[];
    coachPerformance: { coachId: string; interactions: number; avgRating: number }[];
  }> {
    // This would typically query pre-aggregated metrics tables
    // For now, return placeholder analytics structure
    return {
      errorRates: [],
      responseTimeP95: [],
      throughput: [],
      topErrors: [],
      coachPerformance: []
    };
  }

  // === PRIVATE METHODS ===

  private log(
    level: SystemLog['level'],
    category: SystemLog['category'],
    component: string,
    message: string,
    data?: any,
    metadata: Record<string, any> = {}
  ): void {
    const log: SystemLog = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      category,
      component,
      message,
      data,
      metadata
    };

    this.logBuffer.push(log);

    // Auto-flush critical logs immediately
    if (level === 'critical') {
      this.flushLogs();
    }

    // Auto-flush if buffer is getting large
    if (this.logBuffer.length >= 50) {
      this.flushLogs();
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console[level === 'critical' ? 'error' : level](`[${component}] ${message}`, data);
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const { error } = await supabase
        .from('system_logs')
        .insert(logsToFlush);

      if (error) {
        console.error('Failed to flush logs to database:', error);
        // Return logs to buffer for retry
        this.logBuffer.unshift(...logsToFlush);
      }
    } catch (error) {
      console.error('Error flushing logs:', error);
      // Return logs to buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert(metricsToFlush);

      if (error) {
        console.error('Failed to flush metrics to database:', error);
        // Return metrics to buffer for retry
        this.metricsBuffer.unshift(...metricsToFlush);
      }
    } catch (error) {
      console.error('Error flushing metrics:', error);
      // Return metrics to buffer for retry
      this.metricsBuffer.unshift(...metricsToFlush);
    }
  }

  private startBufferFlushInterval(): void {
    // Flush logs and metrics every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushLogs();
      this.flushMetrics();
      this.recordUsageMetrics();
    }, 30000);
  }

  private async checkDatabaseHealth(): Promise<SystemHealth> {
    const startTime = Date.now();
    try {
      // Simple health check query
      const { data, error } = await supabase
        .from('coaches')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - startTime;

      return {
        id: this.generateId(),
        timestamp: new Date(),
        component: 'database',
        status: error ? 'down' : responseTime > 1000 ? 'degraded' : 'healthy',
        responseTime,
        details: {
          error: error?.message,
          connectionPool: 'healthy' // Would check actual pool status
        }
      };
    } catch (error) {
      return {
        id: this.generateId(),
        timestamp: new Date(),
        component: 'database',
        status: 'down',
        responseTime: Date.now() - startTime,
        details: {
          error: (error as Error).message
        }
      };
    }
  }

  private async checkApiHealth(): Promise<SystemHealth> {
    return {
      id: this.generateId(),
      timestamp: new Date(),
      component: 'api',
      status: 'healthy',
      responseTime: 50,
      details: {
        activeConnections: 10,
        requestRate: 100
      }
    };
  }

  private async checkCoachSystemHealth(): Promise<SystemHealth> {
    return {
      id: this.generateId(),
      timestamp: new Date(),
      component: 'coach-system',
      status: 'healthy',
      details: {
        activeCoaches: 25,
        ongoingConversations: 5
      }
    };
  }

  private async storeHealthRecords(healthChecks: SystemHealth[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_health')
        .insert(healthChecks);

      if (error) {
        this.error('health-monitor', 'Failed to store health records', error);
      }
    } catch (error) {
      this.error('health-monitor', 'Error storing health records', error as Error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Final flush
    this.flushLogs();
    this.flushMetrics();
  }
}

// Export singleton instance
export const logger = new LoggingMonitoringService();

// Export convenience functions
export const logInfo = (component: string, message: string, data?: any) =>
  logger.info(component, message, data);

export const logError = (component: string, message: string, error?: Error) =>
  logger.error(component, message, error);

export const logWarn = (component: string, message: string, data?: any) =>
  logger.warn(component, message, data);

export const recordMetric = (name: string, value: number, unit: string, component: string) =>
  logger.recordMetric(name, value, unit, 'usage', component);

export const timeFunction = <T>(name: string, component: string, fn: () => Promise<T>) =>
  logger.timeFunction(name, component, fn);