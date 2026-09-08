import { Injectable } from '@nestjs/common';

type HttpMetric = { count: number; durationMs: number };

/** In-process Prometheus metrics. No request payloads, query strings, or identifiers are retained. */
@Injectable()
export class MetricsService {
  private readonly startedAt = Date.now();
  private readonly http = new Map<string, HttpMetric>();

  recordHttp(method: string, path: string, status: number, durationMs: number): void {
    const key = `${method}\u0000${path}\u0000${status}`;
    const previous = this.http.get(key) ?? { count: 0, durationMs: 0 };
    previous.count += 1;
    previous.durationMs += durationMs;
    this.http.set(key, previous);
  }

  prometheus(): string {
    const lines = [
      '# HELP cm_process_uptime_seconds Process uptime in seconds.',
      '# TYPE cm_process_uptime_seconds gauge',
      `cm_process_uptime_seconds ${(Date.now() - this.startedAt) / 1000}`,
      '# HELP cm_http_requests_total Completed HTTP requests.',
      '# TYPE cm_http_requests_total counter',
      '# HELP cm_http_request_duration_milliseconds HTTP request duration.',
      '# TYPE cm_http_request_duration_milliseconds summary',
    ];
    for (const [key, value] of this.http) {
      const [method, path, status] = key.split('\u0000');
      const labels = `method="${method}",path="${path}",status="${status}"`;
      lines.push(`cm_http_requests_total{${labels}} ${value.count}`);
      lines.push(`cm_http_request_duration_milliseconds_sum{${labels}} ${value.durationMs}`);
      lines.push(`cm_http_request_duration_milliseconds_count{${labels}} ${value.count}`);
    }
    return `${lines.join('\n')}\n`;
  }
}
