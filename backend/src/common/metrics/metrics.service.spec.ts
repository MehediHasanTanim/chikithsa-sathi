import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('exports aggregate Prometheus metrics without retaining request query strings', () => {
    const metrics = new MetricsService();
    metrics.recordHttp('GET', '/v1/patients/:patientId', 200, 12);
    metrics.recordHttp('GET', '/v1/patients/:patientId', 200, 8);

    expect(metrics.prometheus()).toContain(
      'cm_http_requests_total{method="GET",path="/v1/patients/:patientId",status="200"} 2',
    );
    expect(metrics.prometheus()).toContain(
      'cm_http_request_duration_milliseconds_sum{method="GET",path="/v1/patients/:patientId",status="200"} 20',
    );
  });
});
