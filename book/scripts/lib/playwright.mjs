// Load the preinstalled Playwright (global npm root) and its Chromium.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.env.PLAYWRIGHT_MODULE_ROOT ?? execSync('npm root -g').toString().trim();
const require = createRequire(join(root, 'noop.js'));
export const { chromium } = require('playwright');

/** iPhone 17 Pro Max: 440 x 956 CSS px, DPR 3. */
export const IPHONE = {
  viewport: { width: 440, height: 956 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
};
