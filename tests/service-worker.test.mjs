import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const origin = "https://panini.example";
const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

function requestFromWorker(path, { status, mode = "cors", cached = {} }) {
  const handlers = new Map();
  runInNewContext(source, {
    URL, Response,
    self: {
      location: { origin },
      addEventListener: (event, handler) => handlers.set(event, handler),
    },
    caches: {
      open: async () => ({
        match: async (request) => cached[typeof request === "string" ? request : request.url],
        put: async () => assert.fail("Uma resposta de erro não deve entrar no cache"),
      }),
    },
    fetch: async () => new Response("resposta da rede", { status }),
  });
  let response;
  handlers.get("fetch")({
    request: { url: origin + path, method: "GET", mode },
    respondWith: (pending) => { response = pending; },
  });
  return response;
}

test("PAN-PWA03 HTTP 503 usa catálogo armazenado e shell em navegação com parâmetros", async () => {
  const path = "/data/panini_world_cup_2026.json";
  const data = await requestFromWorker(path, {
    status: 503, cached: { [origin + path]: new Response("catálogo armazenado") },
  });
  assert.equal(data.status, 200);
  assert.equal(await data.text(), "catálogo armazenado");
  const shell = await requestFromWorker("/?modo=album", {
    status: 503, mode: "navigate", cached: { "/": new Response("shell armazenado") },
  });
  assert.equal(shell.status, 200);
  assert.equal(await shell.text(), "shell armazenado");
});

test("PAN-PWA03 conserva HTTP 404 mesmo com cache e HTTP 503 quando falta cache", async () => {
  const path = "/data/panini_world_cup_2026.json";
  const notFound = await requestFromWorker(path, {
    status: 404, cached: { [origin + path]: new Response("catálogo armazenado") },
  });
  assert.equal(notFound.status, 404);
  const unavailable = await requestFromWorker(path, { status: 503 });
  assert.equal(unavailable.status, 503);
  assert.equal(await unavailable.text(), "resposta da rede");
});
