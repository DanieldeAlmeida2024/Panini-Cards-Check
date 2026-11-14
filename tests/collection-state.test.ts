import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCollection, parseCollectionImport, MAX_IMPORT_BYTES } from "../src/collection-state.ts";

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

test("PAN-16 importa backup do aplicativo e mantém compatibilidade legada", () => {
  assert.deepEqual({ ...parseCollectionImport(
    JSON.stringify({ app: "panini-world-cup-2026-album", version: 1,
      collection: { "10": 2, "11": 1, "999": 5 } }), allowed,
  ) }, { "10": 2, "11": 1 });
  assert.deepEqual({ ...parseCollectionImport('{"10":2,"12":3}', allowed) },
    { "10": 2, "12": 3 });
});

test("PAN-16 arquivos de outros apps, versões e formatos inválidos não são importados", () => {
  for (const raw of [
    '[]', 'null', '42', '{"app":"outro-app","version":1,"collection":{"10":2}}',
    '{"app":"panini-world-cup-2026-album","version":9,"collection":{"10":1}}',
    '{"collection":null}', '{"collection":"dados"}', '{"nada":"util"}',
    '{"99999":1}', '{"collection":{"99999":2}}', '{}', '{',
  ]) {
    assert.throws(() => parseCollectionImport(raw, allowed), undefined, raw);
  }
});

test("PAN-16 backup vazio requer identificador e versão, para evitar exclusão acidental", () => {
  assert.deepEqual({ ...parseCollectionImport(
    '{"app":"panini-world-cup-2026-album","version":1,"collection":{}}', allowed
  ) }, {});
  assert.throws(() => parseCollectionImport('{"collection":{}}', allowed));
});

test("PAN-16 importação limita bytes e protege contra arquivos grandes", () => {
  assert.throws(() => parseCollectionImport(" ".repeat(MAX_IMPORT_BYTES + 1), allowed),
    /512 KiB/);
});
