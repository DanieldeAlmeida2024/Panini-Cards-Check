import { readFile, writeFile } from "node:fs/promises";

const DATA_PATH = new URL("../output/panini_world_cup_2026.json", import.meta.url);
const PUBLIC_DATA_PATH = new URL("../public/data/panini_world_cup_2026.json", import.meta.url);
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const USER_AGENT = "PaniniCardsCheck/1.0 (local enrichment)";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chunks = (items, size) => {
  const output = [];
  for (let i = 0; i < items.length; i += size) {
    output.push(items.slice(i, i + size));
  }
  return output;
};

const filePathUrl = (filename, width = 360) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;

const emptyMedia = (searchQuery = "") => ({
  found: false,
  imageUrl: "",
  thumbnailUrl: "",
  provider: "Wikimedia Commons",
  source: "",
  title: "",
  attributionUrl: "",
  searchQuery,
  nationalTeamPreferred: true,
});

const requestJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
};

const loadWikidataImages = async (players) => {
  const byPlayerId = new Map();
  const playersWithWikidata = players.filter((player) => player.externalIds?.wikidata);

  for (const group of chunks(playersWithWikidata, 50)) {
    const ids = group.map((player) => player.externalIds.wikidata).join("|");
    const params = new URLSearchParams({
      action: "wbgetentities",
      ids,
      props: "claims",
      format: "json",
      origin: "*",
    });

    const data = await requestJson(`${WIKIDATA_API}?${params.toString()}`);

    for (const player of group) {
      const entity = data.entities?.[player.externalIds.wikidata];
      const imageClaim = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (!imageClaim) continue;

      byPlayerId.set(player.id, {
        found: true,
        imageUrl: filePathUrl(imageClaim, 720),
        thumbnailUrl: filePathUrl(imageClaim, 360),
        provider: "Wikimedia Commons",
        source: "wikidata_p18",
        title: imageClaim,
        attributionUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(imageClaim.replaceAll(" ", "_"))}`,
        searchQuery: player.name,
        nationalTeamPreferred: false,
      });
    }

    await sleep(120);
  }

  return byPlayerId;
};

const searchCommonsImage = async (player, country) => {
  const queries = [
    `${player.name} ${country.nameEn} national football team`,
    `${player.name} ${country.namePt} selecao`,
    `${player.name} footballer`,
  ];

  for (const query of queries) {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrnamespace: "6",
      gsrlimit: "1",
      gsrsearch: query,
      prop: "imageinfo",
      iiprop: "url|mime",
      iiurlwidth: "360",
      format: "json",
      origin: "*",
    });

    try {
      const data = await requestJson(`${COMMONS_API}?${params.toString()}`);
      const page = Object.values(data.query?.pages ?? {})[0];
      const imageInfo = page?.imageinfo?.[0];

      if (!page?.title || !imageInfo?.url || imageInfo.mime?.startsWith("image/svg")) continue;

      return {
        found: true,
        imageUrl: imageInfo.url,
        thumbnailUrl: imageInfo.thumburl || imageInfo.url,
        provider: "Wikimedia Commons",
        source: "commons_search",
        title: page.title.replace(/^File:/, ""),
        attributionUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`,
        searchQuery: query,
        nationalTeamPreferred: query.includes("national football team") || query.includes("selecao"),
      };
    } catch {
      await sleep(250);
    }
  }

  return emptyMedia(queries[0]);
};

const enrich = async () => {
  const album = JSON.parse(await readFile(DATA_PATH, "utf8"));
  const countriesById = new Map(album.countries.map((country) => [country.id, country]));
  const wikidataImages = await loadWikidataImages(album.players);

  let found = 0;

  for (let index = 0; index < album.players.length; index += 1) {
    const player = album.players[index];
    const country = countriesById.get(player.countryId);
    const existing = wikidataImages.get(player.id);

    if (existing) {
      player.media = existing;
      found += 1;
    } else if (country) {
      player.media = await searchCommonsImage(player, country);
      if (player.media.found) found += 1;
      await sleep(180);
    } else {
      player.media = emptyMedia(player.name);
    }

    if ((index + 1) % 25 === 0) {
      console.log(`[MEDIA] ${index + 1}/${album.players.length} jogadores processados (${found} imagens)`);
    }
  }

  album.metadata = {
    ...album.metadata,
    mediaEnrichment: {
      provider: "Wikimedia Commons/Wikidata",
      foundPlayerImages: found,
      totalPlayers: album.players.length,
      updatedAt: new Date().toISOString(),
      note: "Busca prioriza termos de selecao nacional, mas a fonte publica pode retornar fotos de clube ou retratos gerais.",
    },
  };

  const serialized = `${JSON.stringify(album, null, 2)}\n`;
  await writeFile(DATA_PATH, serialized, "utf8");
  await writeFile(PUBLIC_DATA_PATH, serialized, "utf8");

  console.log(`[MEDIA] concluido: ${found}/${album.players.length} jogadores com imagem`);
};

enrich().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
