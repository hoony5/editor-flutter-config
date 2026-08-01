import * as fs from 'fs';
import * as path from 'path';

const METRICS_DIR = '.flutter-tools';
const METRICS_FILE = 'metrics.json';

export interface BuildRecord {
  timestamp: string;
  platform: string;
  sizeBytes: number;
  label?: string;
}

export interface PerfRecord {
  timestamp: string;
  frameTimeMs: number;
  memoryMb: number;
  label?: string;
}

export interface Metrics {
  builds: BuildRecord[];
  perf: PerfRecord[];
}

export function readMetrics(root: string): Metrics {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, METRICS_DIR, METRICS_FILE), 'utf-8'));
  } catch {
    return { builds: [], perf: [] };
  }
}

export function writeMetrics(root: string, metrics: Metrics): void {
  const dir = path.join(root, METRICS_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, METRICS_FILE), JSON.stringify(metrics, null, 2) + '\n');
}

export function addBuildRecord(root: string, record: BuildRecord): Metrics {
  const m = readMetrics(root);
  m.builds.push(record);
  if (m.builds.length > 50) m.builds = m.builds.slice(-50);
  writeMetrics(root, m);
  return m;
}

export function addPerfRecord(root: string, record: PerfRecord): Metrics {
  const m = readMetrics(root);
  m.perf.push(record);
  if (m.perf.length > 50) m.perf = m.perf.slice(-50);
  writeMetrics(root, m);
  return m;
}
