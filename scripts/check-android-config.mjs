import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'capacitor.config.ts');
const generatedPath = path.join(
  root,
  'android',
  'app',
  'src',
  'main',
  'assets',
  'capacitor.config.json'
);
const sourceOnly = process.argv.includes('--source-only');

const source = fs.readFileSync(sourcePath, 'utf8');

if (source.includes('REPLACE-WITH-YOUR-LIVE-KITCHENOPS-URL')) {
  console.error('\nKitchenOps Android setup is not configured yet.');
  console.error('Open capacitor.config.ts and replace the placeholder with the live HTTPS KitchenOps URL.\n');
  process.exit(1);
}

const urlMatch = source.match(/const KITCHENOPS_LIVE_URL = ['"]([^'"]+)['"]/);
if (!urlMatch || !urlMatch[1].startsWith('https://')) {
  console.error('\nKITCHENOPS_LIVE_URL must be a valid HTTPS URL.\n');
  process.exit(1);
}

const liveUrl = urlMatch[1];
console.log(`KitchenOps Android source URL: ${liveUrl}`);

if (sourceOnly) {
  process.exit(0);
}

if (!fs.existsSync(generatedPath)) {
  console.error('\nGenerated Android Capacitor config is missing.');
  console.error('Run: npm run android:sync\n');
  process.exit(1);
}

let generated;
try {
  generated = JSON.parse(fs.readFileSync(generatedPath, 'utf8'));
} catch {
  console.error('\nGenerated Android Capacitor config is invalid JSON.');
  console.error('Run: npm run android:sync\n');
  process.exit(1);
}

const generatedUrl = generated?.server?.url;
if (generatedUrl !== liveUrl) {
  console.error('\nGenerated Android Capacitor config is stale.');
  console.error(`Source URL:    ${liveUrl}`);
  console.error(`Generated URL: ${generatedUrl ?? '(missing)'}`);
  console.error('Run: npm run android:sync\n');
  process.exit(1);
}

console.log(`KitchenOps Android generated URL: ${generatedUrl}`);
console.log('KitchenOps Android config: PASS');
