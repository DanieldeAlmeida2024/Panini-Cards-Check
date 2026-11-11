import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCollection } from "../src/collection-state.ts";

const allowed = new Set(["10", "11", "12"]);
const plain = (value: unknown) => ({ ...normalizeCollection(value, allowed) });

test("PAN-05 formato legado e exportado continuam compatíveis", () => {
  assert.deepEqual(plain({ "10": 2, "11": 1 }), { "10": 2, "11": 1 });
  assert.deepEqual(plain({ collection: { "10": 4, "12": 3 }, version: 1 }),
    { "10": 4, "12": 3 });
});

test("PAN-06 quantidades inválidas, zero, booleano e decimal menor que 1 são ignorados", () => {
  const input = { "10": -3, "11": "Infinity", "12": 0.3, "13": "2",
    "14": true, "15": 5, "16": NaN };
  assert.deepEqual(plain(input), {});
});

test("PAN-06 trunca decimal positivo válido e preserva quantidade inteira", () => {
  assert.deepEqual(plain({ "10": 2.9, "11": "3", "12": 1 }), { "10": 2, "11": 3, "12": 1 });
});

test("PAN-05 estado malformado não contamina a coleção", () => {
  for (const data of [null, 1, "abc", [], { collection: null },
    { collection: [] }, { collection: "broken" }]) {
    assert.deepEqual(plain(data), {});
  }
});

test("PAN-14 só aceita IDs positivos canônicos presentes no catálogo", () => {
  assert.deepEqual(plain({ "10": 1, "010": 3, "-1": 8, "abc": 4, "999": 2 }), { "10": 1 });
});

test("PAN-14 não permite chave de protótipo nem poluição de estado", () => {
  const input = JSON.parse('{"collection":{"__proto__":{"polluted":true},"constructor":3,"10":2}}');
  const result = normalizeCollection(input, allowed);
  assert.deepEqual({ ...result }, { "10": 2 });
  assert.equal(({} as { polluted?: unknown }).polluted, undefined);
});

test("PAN-04 normalização de estado persistido elimina itens removidos do álbum", () => {
  const state = JSON.parse('{"10":2,"11":"3","9999":100}');
  assert.deepEqual(plain(state), { "10": 2, "11": 3 });
});
