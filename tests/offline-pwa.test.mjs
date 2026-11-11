import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';

const BASE_URL = process.env.PANINI_BASE_URL || 'http://127.0.0.1:4174';
const KEY = 'panini-world-cup-2026-collection-v1';

test('PAN-PWA01: primeiro uso online instala JS/CSS; offline abre álbum e conserva progresso', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  t.after(() => context.close());
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'load' });

  const first = page.locator('.sticker-card[data-sticker-id]').first();
  await first.waitFor({ timeout: 20000 });
  const id = await first.getAttribute('data-sticker-id');
  assert.ok(id);
  await first.locator('.sticker-code').click();
  await page.waitForFunction(({ key, sticker }) => {
    return JSON.parse(localStorage.getItem(key) || '{}')[sticker] === 1;
  }, { key: KEY, sticker: id });

  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) throw new Error('Service worker não ativado');
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  const shell = await page.evaluate(async () => {
    const keys = await caches.keys();
    const cacheName = keys.find((key) => key === 'panini-album-check-2026-v2');
    if (!cacheName) return { ok: false, js: 0, css: 0 };
    const entries = await (await caches.open(cacheName)).keys();
    const urls = entries.map((entry) => new URL(entry.url).pathname);
    return {
      ok: urls.includes('/') && urls.includes('/data/panini_world_cup_2026.json'),
      js: urls.filter((path) => /^\/assets\/.+\.js$/.test(path)).length,
      css: urls.filter((path) => /^\/assets\/.+\.css$/.test(path)).length,
    };
  });
  assert.ok(shell.ok, 'app shell deveria estar precacheado');
  assert.ok(shell.js >= 1, 'entrypoint JS do Vite não estava no cache');
  assert.ok(shell.css >= 1, 'CSS do Vite não estava no cache');

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  const saved = page.locator(`.sticker-card[data-sticker-id="${id}"]`);
  await saved.waitFor({ timeout: 15000 });
  assert.equal(await saved.getAttribute('aria-pressed'), 'true');

  await context.setOffline(false);
});

test('PAN-PWA02: cache do app não sequestra respostas cross-origin', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  t.after(() => context.close());
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  const keys = await page.evaluate(async () => {
    const cache = await caches.open('panini-album-check-2026-v2');
    const keys = await cache.keys();
    return keys.map((x) => new URL(x.url).origin);
  });
  assert.ok(keys.every((origin) => origin === new URL(BASE_URL).origin));
});
