import "./styles.css";

type Country = {
  id: number;
  group: string;
  code: string;
  namePt: string;
  nameEn: string;
};

type Club = {
  id: number;
  name: string;
  country: string;
};

type Player = {
  id: number;
  name: string;
  countryId: number;
  clubId: number;
  birthDate: string;
  heightCm: number;
  position: string;
  media?: {
    found: boolean;
    imageUrl: string;
    thumbnailUrl: string;
    provider: string;
    source: string;
    title: string;
    attributionUrl: string;
    searchQuery: string;
    nationalTeamPreferred: boolean;
  };
};

type Sticker = {
  id: number;
  code: string;
  countryId: number;
  playerId: number;
  slot: number;
  type: "BADGE" | "PLAYER" | "SQUAD" | "SPECIAL";
  title: string;
};

type AlbumData = {
  countries: Country[];
  clubs: Club[];
  players: Player[];
  stickers: Sticker[];
};

type CollectionState = Record<string, number>;
type ExportPayload = {
  app: "panini-world-cup-2026-album";
  version: 1;
  exportedAt: string;
  collection: CollectionState;
};

const STORAGE_KEY = "panini-world-cup-2026-collection-v1";
const app = document.querySelector<HTMLDivElement>("#app");
const FLAG_CODES: Record<string, string> = {
  MEX: "mx",
  RSA: "za",
  KOR: "kr",
  CZE: "cz",
  CAN: "ca",
  BIH: "ba",
  QAT: "qa",
  SUI: "ch",
  BRA: "br",
  MAR: "ma",
  HAI: "ht",
  SCO: "gb-sct",
  USA: "us",
  PAR: "py",
  AUS: "au",
  TUR: "tr",
  GER: "de",
  CUW: "cw",
  CIV: "ci",
  ECU: "ec",
  NED: "nl",
  JPN: "jp",
  SWE: "se",
  TUN: "tn",
  BEL: "be",
  EGY: "eg",
  IRN: "ir",
  NZL: "nz",
  ESP: "es",
  CPV: "cv",
  KSA: "sa",
  URU: "uy",
  FRA: "fr",
  SEN: "sn",
  IRQ: "iq",
  NOR: "no",
  ARG: "ar",
  ALG: "dz",
  AUT: "at",
  JOR: "jo",
  POR: "pt",
  COD: "cd",
  UZB: "uz",
  COL: "co",
  ENG: "gb-eng",
  CRO: "hr",
  GHA: "gh",
  PAN: "pa",
};

if (!app) {
  throw new Error("Elemento #app nao encontrado.");
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const escapeHtml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDate = (value: string) => {
  if (!value || value === "UNKNOWN") return "";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[0]}/${parts[1]}/${parts[2]}`;
};

const formatHeight = (heightCm: number) => {
  if (!heightCm) return "";
  return `${(heightCm / 100).toFixed(2).replace(".", ",")} m`;
};

const formatClub = (club?: Club) => {
  if (!club || club.name === "UNKNOWN") return "";
  return club.name;
};

const flagUrl = (code: string) => `https://flagcdn.com/${FLAG_CODES[code] ?? code.toLowerCase()}.svg`;

const playerMeta = (player?: Player, club?: Club) => {
  if (!player) return "";
  return [formatDate(player.birthDate), formatHeight(player.heightCm), formatClub(club)].filter(Boolean).join(" | ");
};

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const colorFromText = (text: string, offset = 0) => {
  let hash = offset;
  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 76% 46%)`;
};

const stickerSvg = (sticker: Sticker, country: Country, title: string) => {
  const uid = `svg-${sticker.id}`;
  const primary = colorFromText(`${title}-${country.code}`);
  const secondary = colorFromText(`${country.namePt}-${sticker.slot}`, 180);
  const initials = sticker.type === "PLAYER" ? initialsFor(title) : sticker.type === "SQUAD" ? "XI" : country.code;
  const body =
    sticker.type === "SQUAD"
      ? `
        <g fill="rgba(255,255,255,.88)">
          <circle cx="42" cy="54" r="7"/><circle cx="64" cy="47" r="7"/><circle cx="86" cy="54" r="7"/>
          <circle cx="52" cy="76" r="7"/><circle cx="76" cy="74" r="7"/>
          <rect x="26" y="88" width="76" height="30" rx="10"/>
        </g>`
      : sticker.type === "BADGE"
        ? `
        <path d="M64 17l35 13v27c0 27-15 47-35 57-20-10-35-30-35-57V30l35-13z" fill="rgba(255,255,255,.9)"/>
        <path d="M64 29l22 8v18c0 18-9 31-22 39-13-8-22-21-22-39V37l22-8z" fill="url(#${uid}-g)"/>`
        : `
        <circle cx="64" cy="43" r="24" fill="rgba(255,255,255,.86)"/>
        <path d="M25 118c4-29 19-47 39-47s35 18 39 47H25z" fill="rgba(255,255,255,.78)"/>
        <path d="M42 45c8-23 35-29 47-8 0 0-12-8-28-2-11 4-19 10-19 10z" fill="rgba(16,36,33,.28)"/>`;

  return `
    <svg class="player-svg" viewBox="0 0 128 128" role="img" aria-label="${escapeHtml(title)}">
      <defs>
        <linearGradient id="${uid}-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${primary}"/>
          <stop offset="1" stop-color="${secondary}"/>
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="url(#${uid}-g)"/>
      <circle cx="103" cy="26" r="34" fill="rgba(255,255,255,.2)"/>
      <circle cx="20" cy="108" r="44" fill="rgba(255,255,255,.12)"/>
      ${body}
      <text x="64" y="112" text-anchor="middle" font-size="25" font-weight="900" fill="rgba(16,36,33,.72)">${escapeHtml(initials)}</text>
    </svg>
  `;
};

const readCollection = (): CollectionState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeCollection = (state: CollectionState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const normalizeCollection = (value: unknown): CollectionState => {
  if (!value || typeof value !== "object") return {};
  const source =
    "collection" in value && typeof (value as { collection?: unknown }).collection === "object"
      ? (value as { collection: unknown }).collection
      : value;
  const output: CollectionState = {};

  for (const [key, rawQuantity] of Object.entries(source as Record<string, unknown>)) {
    const quantity = Number(rawQuantity);
    if (Number.isFinite(quantity) && quantity > 0) {
      output[String(key)] = Math.floor(quantity);
    }
  }

  return output;
};

const loadAlbum = async (): Promise<AlbumData> => {
  const response = await fetch("/data/panini_world_cup_2026.json");
  if (!response.ok) {
    throw new Error("Nao foi possivel carregar a base do album.");
  }
  return response.json();
};

const buildCard = ({
  sticker,
  country,
  player,
  club,
  quantity,
}: {
  sticker: Sticker;
  country: Country;
  player?: Player;
  club?: Club;
  quantity: number;
}) => {
  const owned = quantity > 0;
  const repeatCount = Math.max(quantity - 1, 0);
  const card = document.createElement("article");
  card.className = `sticker-card ${owned ? "is-owned" : ""} ${sticker.type.toLowerCase()}`;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-pressed", String(owned));
  card.dataset.stickerId = String(sticker.id);

  const meta =
    sticker.type === "PLAYER" && player
      ? playerMeta(player, club)
      : sticker.type === "BADGE"
        ? "Escudo oficial da selecao"
        : "Foto da selecao completa";

  const title = sticker.type === "PLAYER" && player ? player.name : sticker.title;

  card.innerHTML = `
    <div class="card-art ${player?.media?.found ? "has-photo" : ""}" aria-hidden="true">
      ${player?.media?.found ? `<img class="player-photo" src="${escapeHtml(player.media.thumbnailUrl || player.media.imageUrl)}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.remove()" />` : ""}
      ${stickerSvg(sticker, country, title)}
    </div>
    <div class="card-topline">
      <span class="owned-dot" aria-hidden="true"></span>
    </div>
    <div class="background-number" aria-hidden="true">${String(sticker.slot).padStart(2, "0")}</div>
    <div class="country-chip">${escapeHtml(country.code)}</div>
    <div class="card-copy">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(meta)}</p>
    </div>
    <div class="repeat-controls" aria-label="Controle de repetidas">
      <button class="repeat-btn minus" type="button" title="Remover repetida" ${quantity <= 1 ? "disabled" : ""}>-</button>
      <span class="repeat-count">${repeatCount}</span>
      <button class="repeat-btn plus" type="button" title="Adicionar repetida">+</button>
    </div>
  `;

  return card;
};

const exportCollection = (collection: CollectionState) => {
  const payload: ExportPayload = {
    app: "panini-world-cup-2026-album",
    version: 1,
    exportedAt: new Date().toISOString(),
    collection,
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `album-panini-2026-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const openCompareModal = (items: Array<{ sticker: Sticker; country?: Country; title: string; details: string }>) => {
  const modal = document.querySelector<HTMLDialogElement>("#compareModal");
  const modalList = document.querySelector<HTMLDivElement>("#compareList");
  const modalCount = document.querySelector<HTMLSpanElement>("#compareCount");
  if (!modal || !modalList || !modalCount) return;

  modalCount.textContent = String(items.length);
  modalList.innerHTML = items.length
    ? items
        .map(
          ({ sticker, country, title, details }) => `
            <article class="compare-row">
              <strong>${escapeHtml(sticker.code)}</strong>
              <span>${escapeHtml(title)}</span>
              <small>${escapeHtml([country?.namePt, details].filter(Boolean).join(" | "))}</small>
            </article>
          `,
        )
        .join("")
    : `<p class="modal-empty">Nenhuma sobra do arquivo importado cobre uma figurinha que falta no seu album.</p>`;

  modal.showModal();
};

const getStickerDetails = (
  sticker: Sticker,
  countriesById: Map<number, Country>,
  playersById: Map<number, Player>,
  clubsById: Map<number, Club>,
) => {
  const country = countriesById.get(sticker.countryId);
  const player = sticker.playerId ? playersById.get(sticker.playerId) : undefined;
  const club = player ? clubsById.get(player.clubId) : undefined;
  const title = sticker.type === "PLAYER" && player ? player.name : sticker.title;
  const details =
    sticker.type === "PLAYER" && player
      ? playerMeta(player, club)
      : sticker.type === "BADGE"
        ? "Escudo oficial da selecao"
        : "Foto da selecao completa";

  return { country, player, club, title, details };
};

const render = (data: AlbumData, collection: CollectionState) => {
  const countriesById = new Map(data.countries.map((country) => [country.id, country]));
  const playersById = new Map(data.players.map((player) => [player.id, player]));
  const clubsById = new Map(data.clubs.map((club) => [club.id, club]));
  const shell = document.querySelector<HTMLElement>(".shell");
  const countryCards = document.querySelector<HTMLDivElement>("#countryCards");
  const countrySearch = document.querySelector<HTMLInputElement>("#countrySearch");
  const countryToggle = document.querySelector<HTMLButtonElement>("#countryToggle");
  const searchInput = document.querySelector<HTMLInputElement>("#searchInput");
  const grid = document.querySelector<HTMLDivElement>("#stickerGrid");
  const empty = document.querySelector<HTMLParagraphElement>("#emptyState");
  const progress = document.querySelector<HTMLDivElement>("#progressText");
  const totalOwned = document.querySelector<HTMLDivElement>("#totalOwned");
  const totalMissing = document.querySelector<HTMLDivElement>("#totalMissing");
  const totalRepeats = document.querySelector<HTMLDivElement>("#totalRepeats");
  const missingList = document.querySelector<HTMLDivElement>("#missingList");
  const missingCount = document.querySelector<HTMLSpanElement>("#missingCount");
  const selectedCountryId = Number(shell?.dataset.countryId || data.countries[0]?.id);
  const query = normalize(searchInput?.value ?? "");
  const countryQuery = normalize(countrySearch?.value ?? "");
  const countriesForPicker = data.countries.filter((country) => {
    const haystack = normalize(`${country.namePt} ${country.nameEn} ${country.code} grupo ${country.group}`);
    return !countryQuery || haystack.includes(countryQuery);
  });
  const selectedCountry = countriesById.get(selectedCountryId) ?? data.countries[0];

  if (!grid || !empty || !progress || !selectedCountry || !missingList || !missingCount || !countryCards) return;

  const countryStickers = data.stickers
    .filter((sticker) => sticker.countryId === selectedCountry.id)
    .sort((a, b) => a.slot - b.slot);

  const visibleStickers = countryStickers.filter((sticker) => {
    const player = sticker.playerId ? playersById.get(sticker.playerId) : undefined;
    const haystack = normalize(`${sticker.code} ${sticker.slot} ${sticker.title} ${player?.name ?? ""}`);
    return !query || haystack.includes(query);
  });

  const ownedInCountry = countryStickers.filter((sticker) => collection[String(sticker.id)] > 0).length;
  const repeatsInCountry = countryStickers.reduce(
    (total, sticker) => total + Math.max((collection[String(sticker.id)] ?? 0) - 1, 0),
    0,
  );
  const baseStickers = data.stickers.filter((sticker) => sticker.countryId > 0);
  const ownedTotal = baseStickers.filter((sticker) => collection[String(sticker.id)] > 0).length;
  const repeatsTotal = baseStickers.reduce(
    (total, sticker) => total + Math.max((collection[String(sticker.id)] ?? 0) - 1, 0),
    0,
  );
  const missingStickers = baseStickers.filter((sticker) => !collection[String(sticker.id)]);

  progress.textContent = `${selectedCountry.namePt}: ${ownedInCountry}/20 no album | ${repeatsInCountry} repetidas`;
  if (totalOwned) totalOwned.textContent = `${ownedTotal}/960`;
  if (totalMissing) totalMissing.textContent = String(missingStickers.length);
  if (totalRepeats) totalRepeats.textContent = String(repeatsTotal);
  grid.innerHTML = "";
  const isExpanded = shell.dataset.countryPickerExpanded === "true";
  const groups = [...new Set(countriesForPicker.map((country) => country.group))];
  const visibleGroups = countryQuery || isExpanded ? groups : groups.slice(0, 3);
  countryCards.innerHTML = groups
    .filter((group) => visibleGroups.includes(group))
    .map((group) => {
      const countries = countriesForPicker.filter((country) => country.group === group);
      return `
        <div class="country-group-row">
          <div class="group-row-title">Grupo ${escapeHtml(group)}</div>
          <div class="country-row-scroll">
            ${countries
              .map((country) => {
                const selected = country.id === selectedCountry.id;
                return `
                  <button
                    class="country-card ${selected ? "is-active" : ""}"
                    type="button"
                    data-country-id="${country.id}"
                    style="--flag-url: url('${flagUrl(country.code)}')"
                    aria-pressed="${selected}"
                  >
                    <span class="country-group">Grupo ${escapeHtml(country.group)}</span>
                    <span class="country-name">${escapeHtml(country.namePt)}</span>
                    <strong>${escapeHtml(country.code)}</strong>
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");

  if (countryToggle) {
    const hiddenGroups = Math.max(groups.length - visibleGroups.length, 0);
    countryToggle.hidden = Boolean(countryQuery) || groups.length <= 3;
    countryToggle.textContent = isExpanded ? "Mostrar menos" : `Mostrar mais ${hiddenGroups} grupos`;
    countryToggle.setAttribute("aria-expanded", String(isExpanded));
  }
  empty.hidden = visibleStickers.length > 0;
  missingCount.textContent = String(missingStickers.length);

  for (const sticker of visibleStickers) {
    const country = countriesById.get(sticker.countryId);
    const player = sticker.playerId ? playersById.get(sticker.playerId) : undefined;
    const club = player ? clubsById.get(player.clubId) : undefined;
    if (!country) continue;

    grid.appendChild(
      buildCard({
        sticker,
        country,
        player,
        club,
        quantity: collection[String(sticker.id)] ?? 0,
      }),
    );
  }

  missingList.innerHTML = missingStickers
    .map((sticker) => {
      const { country, title, details } = getStickerDetails(sticker, countriesById, playersById, clubsById);
      return `
        <article class="missing-row">
          <strong>${escapeHtml(sticker.code)}</strong>
          <span>${escapeHtml(title)}</span>
          <small>${escapeHtml([country?.namePt, details].filter(Boolean).join(" | "))}</small>
        </article>
      `;
    })
    .join("");
};

const changeQuantity = (collection: CollectionState, stickerId: string, nextQuantity: number) => {
  if (nextQuantity <= 0) {
    delete collection[stickerId];
  } else {
    collection[stickerId] = nextQuantity;
  }
  writeCollection(collection);
};

const init = async () => {
  app.innerHTML = `
    <main class="shell">
      <header class="app-header">
        <div>
          <p class="eyebrow">Panini World Cup 2026</p>
          <h1>Album Copa do Mundo - 2026</h1>
        </div>
        <div class="summary-pill" id="progressText">Carregando...</div>
      </header>

      <section class="stats-panel" aria-label="Resumo da colecao">
        <div>
          <span id="totalOwned">0/960</span>
          <small>Selecionadas</small>
        </div>
        <div>
          <span id="totalMissing">960</span>
          <small>Faltando</small>
        </div>
        <div>
          <span id="totalRepeats">0</span>
          <small>Repetidas</small>
        </div>
      </section>

      <section class="share-panel" aria-label="Compartilhar album por arquivo">
        <div>
          <p class="eyebrow">Compartilhar album</p>
          <h2>Exportar ou importar JSON</h2>
        </div>
        <div class="share-actions">
          <button id="exportAlbum" type="button">Exportar</button>
          <button id="replaceAlbum" type="button">Importar tudo</button>
          <button id="compareAlbum" type="button">Comparar sobras</button>
        </div>
        <input id="albumImportFile" type="file" accept="application/json,.json" hidden />
      </section>

      <section class="controls" aria-label="Filtros do album">
        <label>
          <span>Buscar</span>
          <input id="searchInput" type="search" placeholder="Jogador ou numero" autocomplete="off" />
        </label>
      </section>

      <section class="country-picker" aria-label="Selecao por grupo e pais">
        <div class="section-heading compact">
          <div>
            <p class="eyebrow">Grupo - pais - sigla</p>
            <h2>Selecoes</h2>
          </div>
        </div>
        <label class="country-search">
          <span>Buscar selecao</span>
          <input id="countrySearch" type="search" placeholder="Pais ou sigla" autocomplete="off" />
        </label>
        <div class="country-cards" id="countryCards"></div>
        <button class="country-toggle" id="countryToggle" type="button" aria-expanded="false">Mostrar mais</button>
      </section>

      <section class="sticker-grid" id="stickerGrid" aria-live="polite"></section>
      <p class="empty-state" id="emptyState" hidden>Nenhuma figurinha encontrada.</p>

      <section class="missing-section" aria-label="Cartas faltantes">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Checklist completo</p>
            <h2>Cartas nao selecionadas</h2>
          </div>
          <span><b id="missingCount">960</b> faltando</span>
        </div>
        <div class="missing-list" id="missingList"></div>
      </section>

      <dialog class="compare-modal" id="compareModal">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Comparacao</p>
            <h2><span id="compareCount">0</span> figurinhas uteis</h2>
          </div>
          <button class="modal-close" id="compareClose" type="button">Fechar</button>
        </div>
        <div class="compare-list" id="compareList"></div>
      </dialog>
    </main>
  `;

  const data = await loadAlbum();
  const collection = readCollection();
  const searchInput = document.querySelector<HTMLInputElement>("#searchInput");
  const grid = document.querySelector<HTMLDivElement>("#stickerGrid");
  const shell = document.querySelector<HTMLElement>(".shell");
  const countryCards = document.querySelector<HTMLDivElement>("#countryCards");
  const countrySearch = document.querySelector<HTMLInputElement>("#countrySearch");
  const countryToggle = document.querySelector<HTMLButtonElement>("#countryToggle");
  const exportButton = document.querySelector<HTMLButtonElement>("#exportAlbum");
  const replaceButton = document.querySelector<HTMLButtonElement>("#replaceAlbum");
  const compareButton = document.querySelector<HTMLButtonElement>("#compareAlbum");
  const importFile = document.querySelector<HTMLInputElement>("#albumImportFile");
  const compareClose = document.querySelector<HTMLButtonElement>("#compareClose");
  const compareModal = document.querySelector<HTMLDialogElement>("#compareModal");
  let importMode: "replace" | "compare" = "replace";

  if (
    !searchInput ||
    !grid ||
    !shell ||
    !countryCards ||
    !countrySearch ||
    !countryToggle ||
    !exportButton ||
    !replaceButton ||
    !compareButton ||
    !importFile ||
    !compareClose ||
    !compareModal
  )
    return;

  shell.dataset.countryId = String(data.countries[0]?.id ?? 1);
  shell.dataset.countryPickerExpanded = "false";
  exportButton.addEventListener("click", () => exportCollection(collection));
  replaceButton.addEventListener("click", () => {
    importMode = "replace";
    importFile.click();
  });
  compareButton.addEventListener("click", () => {
    importMode = "compare";
    importFile.click();
  });
  compareClose.addEventListener("click", () => compareModal.close());
  importFile.addEventListener("change", async () => {
    const file = importFile.files?.[0];
    importFile.value = "";
    if (!file) return;

    try {
      const imported = normalizeCollection(JSON.parse(await file.text()));

      if (importMode === "replace") {
        for (const key of Object.keys(collection)) delete collection[key];
        Object.assign(collection, imported);
        writeCollection(collection);
        render(data, collection);
        return;
      }

      const countriesById = new Map(data.countries.map((country) => [country.id, country]));
      const playersById = new Map(data.players.map((player) => [player.id, player]));
      const clubsById = new Map(data.clubs.map((club) => [club.id, club]));
      const usefulExtras = data.stickers
        .filter((sticker) => sticker.countryId > 0)
        .filter((sticker) => (imported[String(sticker.id)] ?? 0) > 1 && !collection[String(sticker.id)])
        .map((sticker) => {
          const { country, title, details } = getStickerDetails(sticker, countriesById, playersById, clubsById);
          return { sticker, country, title, details };
        });

      openCompareModal(usefulExtras);
    } catch {
      window.alert("Nao foi possivel ler esse JSON.");
    }
  });
  searchInput.addEventListener("input", () => render(data, collection));
  countrySearch.addEventListener("input", () => render(data, collection));
  countryToggle.addEventListener("click", () => {
    shell.dataset.countryPickerExpanded = shell.dataset.countryPickerExpanded === "true" ? "false" : "true";
    render(data, collection);
  });
  countryCards.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".country-card");
    if (!button?.dataset.countryId) return;
    shell.dataset.countryId = button.dataset.countryId;
    render(data, collection);
    button.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  });

  grid.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const card = target.closest<HTMLElement>(".sticker-card");
    if (!card?.dataset.stickerId) return;

    const stickerId = card.dataset.stickerId;
    const current = collection[stickerId] ?? 0;

    if (target.matches(".plus")) {
      changeQuantity(collection, stickerId, Math.max(current, 1) + 1);
    } else if (target.matches(".minus")) {
      changeQuantity(collection, stickerId, current - 1);
    } else {
      changeQuantity(collection, stickerId, current > 0 ? 0 : 1);
    }

    render(data, collection);
  });

  grid.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = (event.target as HTMLElement).closest<HTMLElement>(".sticker-card");
    if (!card?.dataset.stickerId) return;
    event.preventDefault();
    const stickerId = card.dataset.stickerId;
    const current = collection[stickerId] ?? 0;
    changeQuantity(collection, stickerId, current > 0 ? 0 : 1);
    render(data, collection);
  });

  render(data, collection);
};

init().catch((error: unknown) => {
  app.innerHTML = `<main class="shell"><p class="empty-state">${error instanceof Error ? error.message : "Erro ao abrir o album."}</p></main>`;
});
