'use strict';

const { chromium } = require('C:/Users/Amane/AppData/Roaming/npm/node_modules/@playwright/mcp/node_modules/playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3000';
const VIDEO_DIR = path.join(__dirname, 'screenshots');
const REHEARSAL_ORDER_ID = '6acf0738000d3e2a32d8a3b7';
const ORDER_GUARD = path.join(os.tmpdir(), `tnalp-demo-checkout-${crypto.createHash('sha256').update(__dirname).digest('hex').slice(0, 12)}.lock`);
const CUSTOMER_EMAIL = process.env.DEMO_CUSTOMER_EMAIL;
const CUSTOMER_PASSWORD = process.env.DEMO_CUSTOMER_PASSWORD;
const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD;

function locatorFor(page, locator) {
  return typeof locator === 'string' ? page.locator(locator).first() : locator;
}

async function checkVisible(page, locator, label) {
  const el = locatorFor(page, locator);
  try {
    await el.waitFor({ state: 'visible', timeout: 8000 });
    console.log(`REHEARSAL OK: ${label}`);
  } catch {
    const found = await page.evaluate(() => Array.from(document.querySelectorAll('button, input, select, textarea, a, h1, h2, h3'))
      .filter(node => node.offsetParent !== null)
      .map(node => `${node.tagName}[${node.type || ''}] "${(node.textContent || node.value || '').trim().slice(0, 48)}"`)
      .join('\n  '));
    throw new Error(`Missing UI element: ${label}\nVisible elements:\n  ${found}`);
  }
}

async function moveTo(page, locator, label) {
  const el = locatorFor(page, locator);
  await checkVisible(page, el, label);
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 9 });
    await page.waitForTimeout(550);
  }
}

async function moveAndClick(page, locator, label, delay = 700) {
  const el = locatorFor(page, locator);
  await checkVisible(page, el, label);
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
    await page.waitForTimeout(350);
  }
  await el.click({ timeout: 8000 });
  await page.waitForTimeout(delay);
}

async function typeSlowly(locator, value) {
  await locator.fill('');
  await locator.pressSequentially(value, { delay: 42 });
}

async function injectOverlays(page) {
  await page.evaluate(() => {
    if (!document.getElementById('demo-cursor')) {
      const cursor = document.createElement('div');
      cursor.id = 'demo-cursor';
      cursor.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3L19 12L12 13L9 20L5 3Z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      cursor.style.cssText = 'position:fixed;z-index:999999;pointer-events:none;width:24px;height:24px;transition:left .1s,top .1s;filter:drop-shadow(1px 1px 2px rgba(0,0,0,.3));left:0;top:0';
      document.body.appendChild(cursor);
      document.addEventListener('mousemove', event => {
        cursor.style.left = event.clientX + 'px';
        cursor.style.top = event.clientY + 'px';
      });
    }
    if (!document.getElementById('demo-subtitle')) {
      const bar = document.createElement('div');
      bar.id = 'demo-subtitle';
      bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:999998;text-align:center;padding:11px 24px;background:rgba(0,0,0,.78);color:white;font-family:"Segoe UI",Tahoma,sans-serif;font-size:16px;font-weight:500;letter-spacing:.2px;transition:opacity .3s;pointer-events:none;opacity:0';
      document.body.appendChild(bar);
    }
  });
}

async function subtitle(page, text) {
  await injectOverlays(page);
  await page.evaluate(value => {
    const bar = document.getElementById('demo-subtitle');
    if (bar) {
      bar.textContent = value;
      bar.style.opacity = value ? '1' : '0';
    }
  }, text);
  if (text) await page.waitForTimeout(800);
}

async function pan(page, items) {
  for (const [locator, label] of items) await moveTo(page, locator, label);
}

async function scrollTo(page, locator, label) {
  const el = locatorFor(page, locator);
  await checkVisible(page, el, label);
  await el.evaluate(node => node.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await page.waitForTimeout(900);
}

async function login(page, email, password, expectedPath) {
  const emailField = page.locator('input[type="email"]');
  const passwordField = page.locator('input[type="password"]');
  await checkVisible(page, emailField, 'Sign-in email field');
  await checkVisible(page, passwordField, 'Sign-in password field');
  await typeSlowly(emailField, email);
  await typeSlowly(passwordField, password);
  const submit = page.getByRole('button', { name: /sign in/i }).last();
  await moveAndClick(page, submit, 'Submit sign-in form', 500);
  await page.waitForURL(url => expectedPath(url), { timeout: 15000 });
}

async function openAdminPage(page, name) {
  const menu = page.getByRole('button', { name: 'Management' });
  await moveAndClick(page, menu, 'Open Management menu', 350);
  const menuContainer = page.locator('#admin-nav-dropdown').locator('xpath=..');
  const link = menuContainer.getByRole('link', { name, exact: true });
  await moveAndClick(page, link, `Open ${name}`, 800);
  const pathName = `/admin/${name.toLowerCase()}`;
  await page.waitForURL(url => url.pathname.toLowerCase() === pathName, { timeout: 10000 });
}

async function startBrowser(record = false) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ...(record ? { recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } } } : {})
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  return { browser, context, page };
}

async function finishBrowser(browser, context, page, outputName) {
  const video = page.video();
  await context.close();
  if (video && outputName) {
    const source = await video.path();
    const destination = path.join(VIDEO_DIR, outputName);
    fs.copyFileSync(source, destination);
    if (source !== destination && fs.existsSync(source)) fs.unlinkSync(source);
    console.log('Video saved:', destination);
  }
  await browser.close();
}

function requireCredentials(...pairs) {
  for (const [name, value] of pairs) {
    if (!value) throw new Error(`Set ${name} in the environment before running this demo.`);
  }
}

async function prepareCheckout(page, isRecording) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await checkVisible(page, page.getByRole('heading', { name: 'Featured Products' }), 'Featured Products');
  const product = page.getByRole('link', { name: 'Classic Terracotta Pot' }).last();
  await moveAndClick(page, product, 'Open Classic Terracotta Pot', 800);
  await checkVisible(page, page.getByRole('heading', { name: 'Classic Terracotta Pot' }), 'Product page heading');
  await checkVisible(page, page.getByRole('button', { name: 'Add to cart' }), 'Add to cart button');
  if (isRecording) {
    await subtitle(page, 'Step 1 - เลือกสินค้า');
    await pan(page, [
      [page.getByRole('heading', { name: 'Classic Terracotta Pot' }), 'Product name'],
      [page.getByText('฿450').first(), 'Product price'],
      [page.getByText(/In stock/).first(), 'Stock status']
    ]);
    await subtitle(page, 'Step 2 - เพิ่มสินค้าในตะกร้า');
  }
  await moveAndClick(page, page.getByRole('button', { name: 'Add to cart' }), 'Add one pot to cart', 800);
  const cartLink = page.getByRole('link', { name: /Cart/ }).first();
  await moveAndClick(page, cartLink, 'Open shopping cart', 700);
  await checkVisible(page, page.getByRole('heading', { name: 'Shopping Cart' }), 'Shopping Cart heading');
  await checkVisible(page, page.getByText('Order Summary'), 'Order Summary');
  await checkVisible(page, page.getByText('฿450').last(), 'One-pot cart total');
  if (isRecording) {
    await injectOverlays(page);
    await subtitle(page, 'Step 3 - ตรวจสอบตะกร้า');
    await pan(page, [
      [page.getByRole('heading', { name: 'Shopping Cart' }), 'Shopping cart heading'],
      [page.getByText('Classic Terracotta Pot'), 'Cart item'],
      [page.getByText('Order Summary'), 'Order summary'],
      [page.getByText('฿450').last(), 'Cart total']
    ]);
  }
  await moveAndClick(page, page.getByRole('button', { name: /Proceed to Checkout/i }), 'Proceed to checkout', 700);
  await page.waitForURL(url => url.pathname === '/signin', { timeout: 10000 });
}

async function completeCheckout(page, isRecording, mockOrder) {
  await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, url => url.pathname === '/shipping');
  await checkVisible(page, page.locator('#fullName'), 'Full name field');
  if (isRecording) await subtitle(page, 'Step 4 - เข้าสู่ระบบและกรอกที่อยู่');
  const address = [
    ['#fullName', 'Demo Customer'],
    ['#phoneNumber', '0812345678'],
    ['#address', '99 Demo Road'],
    ['#district', 'Pathum Wan'],
    ['#province', 'Bangkok'],
    ['#postalCode', '10330']
  ];
  for (const [selector, value] of address) await typeSlowly(page.locator(selector), value);
  await pan(page, address.map(([selector], index) => [page.locator(selector), `Shipping field ${index + 1}`]));
  await moveAndClick(page, page.getByRole('button', { name: /Continue to Payment/i }), 'Continue to payment', 750);
  await page.waitForURL(url => url.pathname === '/payment', { timeout: 10000 });
  const promptPay = page.locator('#PromptPay');
  await checkVisible(page, promptPay, 'PromptPay payment option');
  if (!await promptPay.isChecked()) await moveAndClick(page, promptPay, 'Select PromptPay', 400);
  if (isRecording) {
    await subtitle(page, 'Step 5 - เลือก PromptPay');
    await pan(page, [
      [promptPay, 'PromptPay option'],
      [page.getByRole('button', { name: /Continue to Place Order/i }), 'Continue to place order']
    ]);
  }
  await moveAndClick(page, page.getByRole('button', { name: /Continue to Place Order/i }), 'Continue to place order', 750);
  await page.waitForURL(url => url.pathname === '/placeorder', { timeout: 10000 });
  await checkVisible(page, page.getByRole('heading', { name: 'Review Order' }), 'Review Order heading');
  await checkVisible(page, page.getByText('฿450').last(), 'Review order total');
  if (isRecording) {
    await subtitle(page, 'Step 6 - ตรวจสอบคำสั่งซื้อ');
    await pan(page, [
      [page.getByRole('heading', { name: 'Review Order' }), 'Review Order heading'],
      [page.getByText('Classic Terracotta Pot'), 'Order item'],
      [page.getByText('฿450').last(), 'Order total']
    ]);
  }

  if (mockOrder) {
    await page.route('**/api/orders*', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Rehearsal order', order: { _id: REHEARSAL_ORDER_ID } })
        });
      } else {
        await route.continue();
      }
    });
  } else {
    fs.writeFileSync(ORDER_GUARD, `Order submit attempted ${new Date().toISOString()}\n`, { flag: 'wx' });
    console.log('Submitting one local demo order; payment remains pending.');
  }
  const placeOrder = page.getByRole('button', { name: /Place Order/ });
  await moveAndClick(page, placeOrder, 'Place order', 1000);
  await page.waitForURL(url => /^\/order\/[^/]+$/.test(url.pathname), { timeout: 15000 });
  const pending = page.getByText(/Payment Pending/i).first();
  await checkVisible(page, pending, 'Pending payment status');
  const orderId = new URL(page.url()).pathname.split('/').pop();
  console.log(`${mockOrder ? 'REHEARSAL_ORDER_ID' : 'CREATED_ORDER_ID'}=${orderId}`);
  await checkVisible(page, page.locator('img[alt="PromptPay QR code for this order"]'), 'PromptPay QR image');
  await checkVisible(page, page.locator('#slipFile'), 'Payment proof upload field');
}

async function rehearseCheckout() {
  requireCredentials(['DEMO_CUSTOMER_EMAIL', CUSTOMER_EMAIL], ['DEMO_CUSTOMER_PASSWORD', CUSTOMER_PASSWORD]);
  const { browser, context, page } = await startBrowser();
  try {
    await prepareCheckout(page, false);
    await completeCheckout(page, false, true);
    console.log('REHEARSAL PASSED - checkout flow, mocked order submission, pending state and payment UI work');
  } finally {
    await finishBrowser(browser, context, page);
  }
}

async function recordCheckout() {
  requireCredentials(['DEMO_CUSTOMER_EMAIL', CUSTOMER_EMAIL], ['DEMO_CUSTOMER_PASSWORD', CUSTOMER_PASSWORD]);
  if (fs.existsSync(ORDER_GUARD)) {
    throw new Error('Checkout demo order submission has already been attempted for this workspace. Refusing to create a duplicate.');
  }
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  const { browser, context, page } = await startBrowser(true);
  try {
    await prepareCheckout(page, true);
    await completeCheckout(page, true, false);
    await subtitle(page, 'Step 7 - ตรวจสอบการชำระเงิน');
    const qr = page.locator('img[alt="PromptPay QR code for this order"]');
    await scrollTo(page, qr, 'PromptPay QR image');
    await pan(page, [
      [qr, 'PromptPay QR image'],
      [page.getByText('012-345-6789'), 'PromptPay number']
    ]);
    const upload = page.locator('#slipFile');
    await scrollTo(page, upload, 'Payment proof upload field');
    await pan(page, [
      [upload, 'Payment proof upload'],
      [page.getByRole('button', { name: /Submit Proof/i }), 'Submit payment proof']
    ]);
    await page.waitForTimeout(1400);
    await subtitle(page, 'สถานะคำสั่งซื้อ: รอชำระเงิน');
    await page.waitForTimeout(1800);
  } finally {
    await finishBrowser(browser, context, page, 'demo-checkout.webm');
  }
}

async function enterAdmin(page, recording) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  const signInLink = page.getByRole('link', { name: 'Sign In' }).first();
  if (recording) {
    await injectOverlays(page);
    await subtitle(page, 'Step 1 - เข้าสู่ระบบ Admin');
  }
  await moveAndClick(page, signInLink, 'Open admin sign in', 600);
  await page.waitForURL(url => url.pathname === '/signin', { timeout: 10000 });
  if (new URL(page.url()).searchParams.get('redirect') !== '/admin/dashboard') {
    await page.goto(`${BASE_URL}/signin?redirect=/admin/dashboard`, { waitUntil: 'networkidle' });
  }
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD, url => url.pathname === '/admin/dashboard');
  await checkVisible(page, page.getByRole('heading', { name: 'Dashboard' }), 'Admin dashboard');
  if (recording) await injectOverlays(page);
}

async function rehearseAdmin() {
  requireCredentials(['DEMO_ADMIN_EMAIL', ADMIN_EMAIL], ['DEMO_ADMIN_PASSWORD', ADMIN_PASSWORD]);
  const { browser, context, page } = await startBrowser();
  try {
    await enterAdmin(page, false);
    const metricCards = page.locator('.metric-card');
    if (await metricCards.count() < 3) throw new Error('Dashboard did not render all three metric cards.');
    await checkVisible(page, metricCards.nth(0), 'Dashboard total users');
    await checkVisible(page, metricCards.nth(1), 'Dashboard total orders');
    await checkVisible(page, metricCards.nth(2), 'Dashboard revenue');
    await openAdminPage(page, 'Orders');
    await checkVisible(page, page.getByRole('heading', { name: 'Orders' }), 'Orders page');
    await checkVisible(page, page.getByRole('button', { name: 'View Details' }).first(), 'Order details action');
    await openAdminPage(page, 'Products');
    await checkVisible(page, page.getByRole('heading', { name: 'Products' }), 'Products page');
    await openAdminPage(page, 'Users');
    await checkVisible(page, page.getByRole('heading', { name: 'Users' }), 'Users page');
    console.log('REHEARSAL PASSED - admin dashboard, orders, products and users pages work');
  } finally {
    await finishBrowser(browser, context, page);
  }
}

async function recordAdmin() {
  requireCredentials(['DEMO_ADMIN_EMAIL', ADMIN_EMAIL], ['DEMO_ADMIN_PASSWORD', ADMIN_PASSWORD]);
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  const { browser, context, page } = await startBrowser(true);
  try {
    await enterAdmin(page, true);
    await subtitle(page, 'Step 2 - Dashboard');
    const metricCards = page.locator('.metric-card');
    if (await metricCards.count() < 3) throw new Error('Dashboard did not render all three metric cards.');
    await pan(page, [
      [metricCards.nth(0), 'Total users card'],
      [metricCards.nth(1), 'Total orders card'],
      [metricCards.nth(2), 'Revenue card']
    ]);
    const recent = page.getByText(/Recent Orders/i).first();
    if (await recent.isVisible().catch(() => false)) {
      await scrollTo(page, recent, 'Recent orders section');
      await pan(page, [[recent, 'Recent orders section']]);
    }
    const lowStock = page.getByText(/Low Stock/i).first();
    if (await lowStock.isVisible().catch(() => false)) {
      await scrollTo(page, lowStock, 'Low stock section');
      await pan(page, [[lowStock, 'Low stock section']]);
    }
    await openAdminPage(page, 'Orders');
    await checkVisible(page, page.getByRole('heading', { name: 'Orders' }), 'Orders page');
    await subtitle(page, 'Step 3 - จัดการคำสั่งซื้อ');
    const count = page.getByText(/\d+ orders · \d+ pending/i).first();
    await checkVisible(page, count, 'Order and pending counts');
    await pan(page, [
      [count, 'Order and pending counts'],
      [page.locator('select').first(), 'Order status filter'],
      [page.getByRole('button', { name: 'View Details' }).first(), 'Latest order details action']
    ]);
    await openAdminPage(page, 'Products');
    await checkVisible(page, page.getByRole('heading', { name: 'Products' }), 'Products page');
    await subtitle(page, 'Step 4 - ดูแลสินค้าและสต็อก');
    await pan(page, [
      [page.getByRole('heading', { name: 'Products' }), 'Products heading'],
      [page.getByText(/Low Stock/i).first(), 'Low stock indicator']
    ]);
    await openAdminPage(page, 'Users');
    await checkVisible(page, page.getByRole('heading', { name: 'Users' }), 'Users page');
    await subtitle(page, 'Step 5 - จัดการผู้ใช้');
    await pan(page, [
      [page.getByRole('heading', { name: 'Users' }), 'Users heading'],
      [page.locator('table').first(), 'Users table']
    ]);
    await page.waitForTimeout(1800);
    await subtitle(page, 'Admin: ตรวจสอบข้อมูลโดยไม่แก้ไขรายการ');
    await page.waitForTimeout(1500);
  } finally {
    await finishBrowser(browser, context, page, 'demo-admin.webm');
  }
}

const mode = process.argv[2];
const actions = {
  '--rehearse-checkout': rehearseCheckout,
  '--record-checkout': recordCheckout,
  '--rehearse-admin': rehearseAdmin,
  '--record-admin': recordAdmin
};

if (!actions[mode]) {
  console.error('Usage: node demo-checkout-admin.cjs --rehearse-checkout|--record-checkout|--rehearse-admin|--record-admin');
  process.exitCode = 2;
} else {
  actions[mode]().catch(error => {
    console.error('DEMO ERROR:', error.stack || error.message);
    process.exitCode = 1;
  });
}
