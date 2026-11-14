/** Regras de coleção isoladas do DOM e testáveis sem navegador. */
export type CollectionState = Record<string, number>;

/** Limite defensivo: números imprecisos não podem contaminar o progresso. */
const MAX_QUANTITY = Number.MAX_SAFE_INTEGER;
const STICKER_ID = /^[1-9]\d*$/;

/**
 * Importa formato legado {id: qtd} ou exportado {collection: {id: qtd}}.
 * Exclui chaves especiais e IDs alheios ao catálogo; não confia no localStorage.
 */
export function normalizeCollection(
  value: unknown,
  allowedStickerIds?: ReadonlySet<string>,
): CollectionState {
  const output: CollectionState = Object.create(null);
  if (value === null || typeof value !== "object" || Array.isArray(value)) return output;

  const root = value as Record<string, unknown>;
  const source = Object.prototype.hasOwnProperty.call(root, "collection")
    ? root.collection
    : value;
  if (source === null || typeof source !== "object" || Array.isArray(source)) return output;

  for (const [id, quantityRaw] of Object.entries(source as Record<string, unknown>)) {
    if (!STICKER_ID.test(id) || (allowedStickerIds && !allowedStickerIds.has(id))) continue;
    if (typeof quantityRaw !== "number" && typeof quantityRaw !== "string") continue;
    if (typeof quantityRaw === "string" && !quantityRaw.trim()) continue;

    const quantity = Number(quantityRaw);
    if (!Number.isSafeInteger(Math.floor(quantity)) || !Number.isFinite(quantity) ||
        quantity <= 0 || quantity > MAX_QUANTITY) continue;
    const whole = Math.floor(quantity);
    if (whole > 0) output[id] = whole;
  }
  return output;
}

/** Limite do arquivo importado: o catálogo é local e não requer backups gigantes. */
export const MAX_IMPORT_BYTES = 512 * 1024;

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Valida a identidade do backup antes de normalizar os itens.
 * Um JSON de outro aplicativo ou uma coleção malformada não pode apagar o progresso.
 * Mantém compatibilidade com o formato legado plano {id: quantidade}.
 */
export function parseCollectionImport(
  rawText: string,
  allowedStickerIds: ReadonlySet<string>,
): CollectionState {
  if (new TextEncoder().encode(rawText).byteLength > MAX_IMPORT_BYTES) {
    throw new Error("O arquivo JSON ultrapassa o limite de 512 KiB.");
  }
  let payload: unknown;
  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new Error("O arquivo selecionado não contém JSON válido.");
  }
  if (!isObjectRecord(payload)) {
    throw new Error("O backup precisa conter um objeto JSON.");
  }
  if (Object.prototype.hasOwnProperty.call(payload, "app") &&
      payload.app !== "panini-world-cup-2026-album") {
    throw new Error("O backup pertence a outro aplicativo.");
  }
  if (Object.prototype.hasOwnProperty.call(payload, "version") &&
      payload.version !== 1) {
    throw new Error("A versão do backup não é compatível com este álbum.");
  }

  const hasCollection = Object.prototype.hasOwnProperty.call(payload, "collection");
  const source = hasCollection ? payload.collection : payload;
  if (!isObjectRecord(source)) {
    throw new Error("O campo collection precisa ser um objeto.");
  }

  const imported = normalizeCollection(payload, allowedStickerIds);
  // Coleção explicitamente vazia é permitida apenas em um backup identificado.
  const identifiedBackup = hasCollection && payload.app === "panini-world-cup-2026-album"
    && payload.version === 1;
  if (Object.keys(imported).length === 0 && !identifiedBackup) {
    throw new Error("O arquivo não contém figurinhas válidas deste álbum.");
  }
  return imported;
}
