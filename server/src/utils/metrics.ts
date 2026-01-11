// Simple metrics collector (use Prometheus in production)

type MetricValue = number;

class Metrics {
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  increment(name: string, labels?: Record<string, string>, value = 1) {
    const key = this.formatKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  observe(name: string, value: number, labels?: Record<string, string>) {
    const key = this.formatKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key)!.push(value);
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    return this.counters.get(this.formatKey(name, labels)) || 0;
  }

  getHistogram(name: string, labels?: Record<string, string>): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  } {
    const key = this.formatKey(name, labels);
    const values = this.histograms.get(key) || [];
    return {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      min: values.length > 0 ? Math.min(...values) : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
    };
  }

  getAllMetrics(): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // Counters
    for (const [key, value] of this.counters.entries()) {
      result[`counter_${key}`] = value;
    }

    // Histograms
    for (const [key, histogram] of this.histograms.entries()) {
      result[`histogram_${key}`] = this.getHistogram(key.split('{')[0], this.parseLabels(key));
    }

    return result;
  }

  private formatKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  private parseLabels(key: string): Record<string, string> {
    const match = key.match(/\{([^}]+)\}/);
    if (!match) return {};
    const labels: Record<string, string> = {};
    match[1].split(',').forEach((pair) => {
      const [k, v] = pair.split('=');
      if (k && v) {
        labels[k.trim()] = v.trim().replace(/"/g, '');
      }
    });
    return labels;
  }
}

export const metrics = new Metrics();

