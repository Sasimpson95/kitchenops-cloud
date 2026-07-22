import fs from 'node:fs';

const configPath = new URL('../capacitor.config.ts', import.meta.url);
const source = fs.readFileSync(configPath, 'utf8');

if (source.includes('REPLACE-WITH-YOUR-LIVE-KITCHENOPS-URL')) {
  console.error('\nKitchenOps Android setup is not configured yet.');
  console.error('Open capacitor.config.ts and replace:');
  console.error('  https://REPLACE-WITH-YOUR-LIVE-KITCHENOPS-URL');
  console.error('with your live HTTPS KitchenOps website URL.\n');
  process.exit(1);
}

const urlMatch = source.match(/const KITCHENOPS_LIVE_URL = ['"]([^'"]+)['"]/);
if (!urlMatch || !urlMatch[1].startsWith('https://')) {
  console.error('\nKITCHENOPS_LIVE_URL must be a valid HTTPS URL.\n');
  process.exit(1);
}

console.log(`KitchenOps Android URL: ${urlMatch[1]}`);
