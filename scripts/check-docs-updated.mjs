import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ownershipPath = path.resolve('docs/ownership.yml');

if (!fs.existsSync(ownershipPath)) {
  console.error(`docs guard: ownership mapping not found at ${ownershipPath}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const baseArg = args.find((arg) => arg.startsWith('--base='));
const baseBranchEnv =
  process.env.BASE_BRANCH ||
  (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : undefined);
const defaultBaseRef = baseArg ? baseArg.split('=')[1] : baseBranchEnv || 'origin/main';

const baseRef = defaultBaseRef;
const baseFetchTarget = baseRef.includes('/') ? baseRef.split('/').slice(1).join('/') : baseRef;

try {
  execSync(`git fetch origin ${baseFetchTarget} --depth=1`, { stdio: 'ignore' });
} catch (error) {
  console.warn(`docs guard: git fetch failed for ${baseFetchTarget} (${error.message})`);
}

const diffOutput = execSync(`git diff --name-only ${baseRef}...HEAD`, {
  encoding: 'utf-8',
}).trim();

const changedFiles = diffOutput ? diffOutput.split(/\r?\n/).filter(Boolean) : [];
const changedSet = new Set(changedFiles.map((file) => normalizePath(file)));

const ownershipContent = fs.readFileSync(ownershipPath, 'utf-8');
const entries = parseOwnership(ownershipContent);

if (!changedFiles.length) {
  console.log(`docs guard: no files changed relative to ${baseRef}`);
  process.exit(0);
}

const violations = [];

for (const entry of entries) {
  const docPath = normalizePath(entry.doc);
  const docFullPath = path.resolve(docPath);
  const docExists = fs.existsSync(docFullPath);
  const docTouched = docExists && changedSet.has(docPath);
  const codeChanged = entry.paths.some((pattern) =>
    changedFiles.some((file) => matchesPattern(normalizePath(file), pattern)),
  );

  if (codeChanged && docExists && !docTouched) {
    violations.push({ entry, docPath });
  }
}

if (violations.length) {
  console.error('docs guard: the following docs were not updated:');
  for (const violation of violations) {
    console.error(
      `  • ${violation.entry.doc} (code touched in ${violation.entry.paths.join(', ')})`,
    );
  }
  console.error('If a referenced doc exists, please update it alongside your code change.');
  process.exit(1);
}

console.log('docs guard: documentation updates satisfy ownership mapping.');

function parseOwnership(content) {
  const lines = content.split(/\r?\n/);
  const data = [];
  let current = null;
  let inPaths = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const indentation = rawLine.match(/^(\s*)/)?.[1]?.length ?? 0;

    if (indentation === 0 && line.endsWith(':')) {
      if (current) data.push(current);
      current = { key: line.replace(/:$/, ''), doc: '', paths: [] };
      inPaths = false;
      continue;
    }

    if (!current) continue;

    if (line.startsWith('doc:')) {
      current.doc = line.replace(/^doc:\s*/, '').trim();
      inPaths = false;
      continue;
    }

    if (line === 'paths:') {
      inPaths = true;
      continue;
    }

    if (inPaths && line.startsWith('- ')) {
      current.paths.push(line.replace(/^- /, '').trim());
      continue;
    }

    if (line.endsWith(':')) {
      inPaths = false;
    }
  }

  if (current) data.push(current);
  return data;
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function matchesPattern(file, pattern) {
  const regex = globToRegex(pattern);
  return regex.test(file);
}

function globToRegex(pattern) {
  const escapedSegments = pattern.split('/').map((segment) => {
    if (segment === '**') {
      return '.*';
    }
    const escaped = segment.replace(/[-[\]{}()+?.\\^$|]/g, '\\$&');
    return escaped.replace(/\*/g, '[^/]*');
  });

  const regexString = `^${escapedSegments.join('/')}$$`;
  return new RegExp(regexString);
}

