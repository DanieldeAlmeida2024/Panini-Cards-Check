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
