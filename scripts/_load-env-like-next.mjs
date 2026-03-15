import fs from 'fs';
import path from 'path';

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!match) return null;
  const [, key, raw] = match;
  let value = raw.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  value = value.replace(/\\n/g, '\n');
  return { key, value };
}

export function loadEnvLikeNext(projectDir = process.cwd()) {
  const nodeEnv = process.env.NODE_ENV === 'production'
    ? 'production'
    : process.env.NODE_ENV === 'test'
      ? 'test'
      : 'development';

  const order = [
    `.env.${nodeEnv}.local`,
    nodeEnv === 'test' ? null : '.env.local',
    `.env.${nodeEnv}`,
    '.env',
  ].filter(Boolean);

  const loaded = [];
  for (const rel of order) {
    const file = path.join(projectDir, rel);
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      if (process.env[parsed.key] === undefined) {
        process.env[parsed.key] = parsed.value;
      }
    }
    loaded.push(rel);
  }
  return { nodeEnv, loaded };
}

export function sanitizeDbUrl(url) {
  if (!url) return '(not set)';
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}:${u.port || '(default)'}/${u.pathname.replace(/^\//, '')}`;
  } catch {
    return '(unparseable)';
  }
}
