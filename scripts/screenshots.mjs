import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

mkdirSync('screenshots', { recursive: true });

const browser = await chromium.launch();

// Mobile viewport
async function captureMobile(page, url, name, waitFor) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle' });
  if (waitFor) await p.waitForTimeout(waitFor);
  await p.screenshot({ path: `screenshots/${name}-mobile.png` });
  await ctx.close();
  console.log(`  ✅ ${name}-mobile.png`);
}

// Desktop viewport
async function captureDesktop(page, url, name, waitFor) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle' });
  if (waitFor) await p.waitForTimeout(waitFor);
  await p.screenshot({ path: `screenshots/${name}-desktop.png` });
  await ctx.close();
  console.log(`  ✅ ${name}-desktop.png`);
}

const BASE = 'http://localhost:3000';

console.log('📸 Capturing screenshots...\n');

// Home
await captureMobile(null, BASE, 'home', 2000);
await captureDesktop(null, BASE, 'home', 2000);

// Search (with a query)
await captureMobile(null, `${BASE}/search`, 'search', 1000);

// Profile
await captureMobile(null, `${BASE}/profile`, 'profile', 2000);
await captureDesktop(null, `${BASE}/profile`, 'profile', 2000);

// Find a list ID to screenshot
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);

// Click first list card
const listLink = await p.$('a[href^="/list/"]');
if (listLink) {
  const href = await listLink.getAttribute('href');
  await ctx.close();

  // List detail
  await captureMobile(null, `${BASE}${href}`, 'list-detail', 2000);
  await captureDesktop(null, `${BASE}${href}`, 'list-detail', 2000);
} else {
  await ctx.close();
  console.log('  ⚠️  No list cards found, skipping list detail');
}

// Create list (step 1)
await captureMobile(null, `${BASE}/create`, 'create-list', 1000);

// User profile
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p2 = await ctx2.newPage();
await p2.goto(`${BASE}/search`, { waitUntil: 'networkidle' });
await p2.waitForTimeout(500);
// Type in search
await p2.fill('input[type="text"]', 'sarah');
await p2.waitForTimeout(1500);
await p2.screenshot({ path: 'screenshots/search-results-mobile.png' });
console.log('  ✅ search-results-mobile.png');
await ctx2.close();

// User profile page
await captureMobile(null, `${BASE}/user/sarah_eats`, 'user-profile', 2000);

await browser.close();
console.log('\n🎉 All screenshots saved to /screenshots');
