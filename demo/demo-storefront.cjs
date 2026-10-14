'use strict';

const { chromium } = require('C:/Users/Amane/AppData/Roaming/npm/node_modules/@playwright/mcp/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3000';
const VIDEO_DIR = path.join(__dirname, 'screenshots');
const OUTPUT_NAME = 'demo-storefront.webm';
const REHEARSAL = process.argv.includes('--rehearse');

async function ensureVisible(page, locator, label) {
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  const visible = await el.isVisible().catch(() => false);
  if (!visible) {
    const found = await page.evaluate(() => Array.from(document.querySelectorAll('button, input, select, textarea, a, h1, h2'))
      .filter(el => el.offsetParent !== null)
      .map(el => `${el.tagName}[${el.type || ''}] "${(el.textContent || el.value || '').trim().slice(0, 40)}"`)
      .join('\n  '));
    console.error(`REHEARSAL FAIL: "${label}" not visible.\n  Visible elements:\n  ${found}`);
    return false;
  }
  console.log(`REHEARSAL OK: "${label}"`);
  return true;
}

async function moveAndClick(page, locator, label, postClickDelay = 800) {
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  if (!await el.isVisible().catch(() => false)) {
    console.error(`WARNING: click skipped - "${label}" not visible`);
    return false;
  }
  try {
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const box = await el.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
      await page.waitForTimeout(400);
    }
    await el.click();
  } catch (error) {
    console.error(`WARNING: click failed on "${label}": ${error.message}`);
    return false;
  }
  await page.waitForTimeout(postClickDelay);
  return true;
}

async function moveTo(page, locator, label) {
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  if (!await el.isVisible().catch(() => false)) {
    console.warn(`WARNING: cursor pan skipped - "${label}" not visible`);
    return false;
  }
  try {
    const box = await el.boundingBox();
    if (!box) return false;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 9 });
    await page.waitForTimeout(650);
    return true;
  } catch (error) {
    console.warn(`WARNING: cursor pan failed on "${label}": ${error.message}`);
    return false;
  }
}

async function injectCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('demo-cursor')) return;
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3L19 12L12 13L9 20L5 3Z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
    cursor.style.cssText = 'position:fixed;z-index:999999;pointer-events:none;width:24px;height:24px;transition:left .1s,top .1s;filter:drop-shadow(1px 1px 2px rgba(0,0,0,.3));left:0;top:0';
    document.body.appendChild(cursor);
    document.addEventListener('mousemove', event => {
      cursor.style.left = event.clientX + 'px';
      cursor.style.top = event.clientY + 'px';
    });
  });
}

async function injectSubtitleBar(page) {
  await page.evaluate(() => {
    if (document.getElementById('demo-subtitle')) return;
    const bar = document.createElement('div');
    bar.id = 'demo-subtitle';
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:999998;text-align:center;padding:11px 24px;background:rgba(0,0,0,.76);color:white;font-family:"Segoe UI",Tahoma,sans-serif;font-size:16px;font-weight:500;letter-spacing:.2px;transition:opacity .3s;pointer-events:none;opacity:0';
    document.body.appendChild(bar);
  });
}

async function showSubtitle(page, text) {
  await page.evaluate(value => {
    const bar = document.getElementById('demo-subtitle');
    if (!bar) return;
    bar.textContent = value;
    bar.style.opacity = value ? '1' : '0';
  }, text);
  if (text) await page.waitForTimeout(800);
}

async function panElements(page, items) {
  for (const [locator, label] of items) await moveTo(page, locator, label);
}

async function checkVisible(page, locator, label) {
  if (!await ensureVisible(page, locator, label)) throw new Error(`Missing UI element: ${label}`);
}

async function rehearse() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await checkVisible(page, page.getByRole('heading', { name: 'Featured Products' }), 'Featured products heading');
    await checkVisible(page, page.locator('input[name="q"]'), 'Product search field');
    const productLink = page.getByRole('link', { name: 'Classic Terracotta Pot' }).last();
    await checkVisible(page, productLink, 'Classic Terracotta Pot link');
    if (!await moveAndClick(page, productLink, 'Open Classic Terracotta Pot')) throw new Error('Could not open product');

    await checkVisible(page, page.getByRole('heading', { name: 'Classic Terracotta Pot' }), 'Product title');
    await checkVisible(page, page.getByText('In stock · 6 available'), 'Stock status');
    const increase = page.getByRole('button', { name: 'Increase quantity' });
    await checkVisible(page, increase, 'Increase quantity button');
    const add = page.getByRole('button', { name: 'Add to cart' });
    await checkVisible(page, add, 'Add to cart button');
    if (!await moveAndClick(page, increase, 'Increase product quantity', 500)) throw new Error('Could not increase quantity');
    if (!await moveAndClick(page, add, 'Add product to cart', 1000)) throw new Error('Could not add product');

    const cartLink = page.getByRole('link', { name: /Cart/ }).first();
    await checkVisible(page, cartLink, 'Cart link');
    if (!await moveAndClick(page, cartLink, 'Open shopping cart')) throw new Error('Could not open cart');
    await checkVisible(page, page.getByRole('heading', { name: 'Shopping Cart' }), 'Shopping cart heading');
    await checkVisible(page, page.getByText('Order Summary'), 'Order summary');
    await checkVisible(page, page.getByText('฿900').last(), 'Cart total for two pots');
    console.log('REHEARSAL PASSED - all selectors and the cart flow work');
  } finally {
    await context.close();
    await browser.close();
  }
}

async function record() {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await injectCursor(page);
    await injectSubtitleBar(page);
    await showSubtitle(page, 'Step 1 - เลือกดูสินค้า');
    await panElements(page, [
      [page.getByRole('link', { name: 'Tnalp' }), 'Tnalp home link'],
      [page.locator('input[name="q"]'), 'Product search'],
      [page.getByRole('heading', { name: 'Featured Products' }), 'Featured products heading'],
      [page.getByRole('link', { name: 'Classic Terracotta Pot' }).last(), 'Featured product']
    ]);
    await page.waitForTimeout(1000);
    if (!await moveAndClick(page, page.getByRole('link', { name: 'Classic Terracotta Pot' }).last(), 'Open Classic Terracotta Pot', 1200)) throw new Error('Could not open product');
    await injectCursor(page);
    await injectSubtitleBar(page);

    await showSubtitle(page, 'Step 2 - ดูรายละเอียดสินค้า');
    await panElements(page, [
      [page.getByRole('heading', { name: 'Classic Terracotta Pot' }), 'Product title'],
      [page.getByText('฿450').first(), 'Product price'],
      [page.getByText('In stock · 6 available'), 'Available stock']
    ]);
    await showSubtitle(page, 'Step 3 - เพิ่มสินค้าในตะกร้า');
    if (!await moveAndClick(page, page.getByRole('button', { name: 'Increase quantity' }), 'Increase product quantity', 700)) throw new Error('Could not increase quantity');
    if (!await moveAndClick(page, page.getByRole('button', { name: 'Add to cart' }), 'Add product to cart', 1300)) throw new Error('Could not add product');
    const cartLink = page.getByRole('link', { name: /Cart/ }).first();
    if (!await moveAndClick(page, cartLink, 'Open shopping cart', 1200)) throw new Error('Could not open cart');
    await injectCursor(page);
    await injectSubtitleBar(page);

    await showSubtitle(page, 'Step 4 - ตรวจสอบยอดรวม');
    await panElements(page, [
      [page.getByRole('heading', { name: 'Shopping Cart' }), 'Shopping cart heading'],
      [page.getByText('Classic Terracotta Pot'), 'Cart item'],
      [page.getByText('Order Summary'), 'Order summary'],
      [page.getByText('฿900').last(), 'Cart total']
    ]);
    await page.waitForTimeout(2500);
    await showSubtitle(page, '');
  } finally {
    const video = page.video();
    await context.close();
    if (video) {
      const source = await video.path();
      const destination = path.join(VIDEO_DIR, OUTPUT_NAME);
      fs.copyFileSync(source, destination);
      console.log('Video saved:', destination);
    }
    await browser.close();
  }
}

(REHEARSAL ? rehearse() : record()).catch(error => {
  console.error('DEMO ERROR:', error.message);
  process.exitCode = 1;
});


