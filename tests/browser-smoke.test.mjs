import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright";

const ORIGIN = process.env.PANINI_BASE_URL || "http://127.0.0.1:4173";
const STORAGE_KEY = "panini-world-cup-2026-collection-v1";

async function pageFixture(t) {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ acceptDownloads: true, serviceWorkers: "block" });
  t.after(() => page.close());
  await page.goto(ORIGIN, { waitUntil: "domcontentloaded" });
  await page.locator(".sticker-card[data-sticker-id]").first().waitFor({ timeout: 20000 });
  return page;
}

async function firstSticker(page) {
  const card = page.locator(".sticker-card[data-sticker-id]").first();
  return { card, id: await card.getAttribute("data-sticker-id") };
}

async function persisted(page, id, expected) {
  await page.waitForFunction(({ key, sticker, quantity }) => {
    const raw = window.localStorage.getItem(key);
    return raw !== null && JSON.parse(raw)[sticker] === quantity;
  }, { key: STORAGE_KEY, sticker: id, quantity: expected });
}

test("PAN-01/PAN-02/PAN-04: carrega cards, seleciona figurinha e persiste após reload", async (t) => {
  const page = await pageFixture(t);
  const { card, id } = await firstSticker(page);
  assert.ok(id);
  assert.equal(await card.getAttribute("aria-pressed"), "false");
  await card.locator(".sticker-code").click();
  await persisted(page, id, 1);
  await page.reload({ waitUntil: "domcontentloaded" });
  const after = page.locator('.sticker-card[data-sticker-id="' + id + '"]');
  await after.waitFor();
  assert.equal(await after.getAttribute("aria-pressed"), "true");
});

test("PAN-03: quantidade repetida é persistida como 2 e badge apresenta 1", async (t) => {
  const page = await pageFixture(t);
  const { card, id } = await firstSticker(page);
  assert.ok(id);
  await card.locator(".sticker-code").click();
  await persisted(page, id, 1);
  const updated = page.locator('.sticker-card[data-sticker-id="' + id + '"]');
  await updated.locator(".repeat-btn.plus").click();
  await persisted(page, id, 2);
  assert.equal((await updated.locator(".repeat-count").textContent())?.trim(), "1");
});

test("PAN-05/PAN-06: importa JSON e descarta ID inválido e quantidade negativa", async (t) => {
  const page = await pageFixture(t);
  const { id } = await firstSticker(page);
  assert.ok(id);
  const chooserPromise = page.waitForEvent("filechooser");
  await page.locator("#replaceAlbum").click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "colecao-sintetica.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({
      app: "panini-world-cup-2026-album",
      version: 1,
      collection: { [id]: 3, "999999999": 100, "0": -12, "__proto__": 3 },
    })),
  });
  await persisted(page, id, 3);
  const content = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}"), STORAGE_KEY);
  assert.deepEqual({ ...content }, { [id]: 3 });
});

test("PAN-12: exporta JSON com quantidade, formato e versão 1", async (t) => {
  const page = await pageFixture(t);
  const { card, id } = await firstSticker(page);
  assert.ok(id);
  await card.locator(".sticker-code").click();
  await persisted(page, id, 1);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportAlbum").click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /^album-panini-2026-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await download.path();
  assert.ok(path);
  const payload = JSON.parse(await readFile(path, "utf-8"));
  assert.equal(payload.app, "panini-world-cup-2026-album");
  assert.equal(payload.version, 1);
  assert.equal(payload.collection[id], 1);
  assert.ok(!Number.isNaN(Date.parse(payload.exportedAt)));
});
