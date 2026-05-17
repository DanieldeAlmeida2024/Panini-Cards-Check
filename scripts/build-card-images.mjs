import { mkdir, readdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "images-cards");
const publicDir = path.join(root, "public", "images-cards");
const manifestPath = path.join(publicDir, "manifest.json");
const albumPath = path.join(root, "public", "data", "panini_world_cup_2026.json");

const normalize = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "")
    .toUpperCase();

const levenshtein = (a, b) => {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return matrix[a.length][b.length];
};

const album = JSON.parse(await readFileCompat(albumPath));
const countriesByCode = new Map(album.countries.map((country) => [country.code, country]));
const playersByCountry = new Map();
for (const player of album.players) {
  const list = playersByCountry.get(player.countryId) ?? [];
  list.push(player);
  playersByCountry.set(player.countryId, list);
}

await mkdir(publicDir, { recursive: true });

const files = (await readdir(sourceDir)).filter((file) => /\.(png|jpe?g|webp|avif)$/i.test(file));
const manifest = {};
const misses = [];

for (const file of files) {
  const ext = path.extname(file);
  const base = path.basename(file, ext);
  const [code, ...nameParts] = base.split("-");
  const country = countriesByCode.get(code?.toUpperCase());
  const requestedName = nameParts.join("-");

  if (!country || !requestedName) {
    misses.push({ file, reason: "nome fora do padrao SIGLA-NOME" });
    continue;
  }

  const targetName = `${code.toUpperCase()}-${normalize(requestedName)}${ext.toLowerCase()}`;
  const targetPath = path.join(publicDir, targetName);
  await copyFile(path.join(sourceDir, file), targetPath);

  if (normalize(requestedName) === "ESCUDO") {
    manifest[`${code.toUpperCase()}-1`] = `/images-cards/${targetName}`;
    continue;
  }

  if (["TIME", "SELECAO", "EQUIPE", "SQUAD"].includes(normalize(requestedName))) {
    manifest[`${code.toUpperCase()}-13`] = `/images-cards/${targetName}`;
    continue;
  }

  const players = playersByCountry.get(country.id) ?? [];
  const normalizedRequested = normalize(requestedName);
  const ranked = players
    .map((player) => ({ player, distance: levenshtein(normalizedRequested, normalize(player.name)) }))
    .sort((a, b) => a.distance - b.distance);
  const match = ranked[0];

  if (!match || match.distance > 3) {
    misses.push({ file, reason: "jogador nao encontrado", closest: match?.player.name, distance: match?.distance });
    continue;
  }

  const sticker = album.stickers.find((item) => item.countryId === country.id && item.playerId === match.player.id);
  if (!sticker) {
    misses.push({ file, reason: "figurinha nao encontrada", player: match.player.name });
    continue;
  }

  manifest[sticker.code] = `/images-cards/${targetName}`;
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`[IMAGES] ${Object.keys(manifest).length} imagens mapeadas`);
if (misses.length) {
  console.log(JSON.stringify({ misses }, null, 2));
}

async function readFileCompat(filePath) {
  const { readFile } = await import("node:fs/promises");
  return readFile(filePath, "utf8");
}
