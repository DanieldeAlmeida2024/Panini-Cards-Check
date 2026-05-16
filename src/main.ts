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
  if (!value || value === "UNKNOWN") return "Data indisponivel";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[0]}/${parts[1]}/${parts[2]}`;
};

const formatHeight = (heightCm: number) => {
  if (!heightCm) return "Altura indisponivel";
  return `${(heightCm / 100).toFixed(2).replace(".", ",")} m`;
};

const formatClub = (club?: Club) => {
  if (!club || club.name === "UNKNOWN") return "Clube indisponivel";
  return club.name;
};

const flagUrl = (code: string) => `https://flagcdn.com/${FLAG_CODES[code] ?? code.toLowerCase()}.svg`;

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
      ? `${formatDate(player.birthDate)} | ${formatHeight(player.heightCm)} | ${formatClub(club)}`
      : sticker.type === "BADGE"
        ? "Escudo oficial da selecao"
        : "Foto da selecao completa";

  const initials = country.code.slice(0, 3);
  const visualLabel = sticker.type === "BADGE" ? country.code : sticker.type === "SQUAD" ? "XI" : initials;
  const title = sticker.type === "PLAYER" && player ? player.name : sticker.title;

  card.innerHTML = `
    <div class="card-topline">
      <span class="owned-dot" aria-hidden="true"></span>
    </div>
    <div class="player-area" aria-hidden="true">
      <div class="background-number">${String(sticker.slot).padStart(2, "0")}</div>
      <div class="portrait-placeholder">${escapeHtml(visualLabel)}</div>
      <div class="country-chip">${escapeHtml(country.code)}</div>
    </div>
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
      ? `${formatDate(player.birthDate)} | ${formatHeight(player.heightCm)} | ${formatClub(club)}`
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
  countryCards.innerHTML = data.countries
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
    .join("");
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
          <small>${escapeHtml(country?.namePt ?? "Selecao indisponivel")} | ${escapeHtml(details)}</small>
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
        <div class="country-cards" id="countryCards"></div>
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
    </main>
  `;

  const data = await loadAlbum();
  const collection = readCollection();
  const searchInput = document.querySelector<HTMLInputElement>("#searchInput");
  const grid = document.querySelector<HTMLDivElement>("#stickerGrid");
  const shell = document.querySelector<HTMLElement>(".shell");
  const countryCards = document.querySelector<HTMLDivElement>("#countryCards");

  if (!searchInput || !grid || !shell || !countryCards) return;

  shell.dataset.countryId = String(data.countries[0]?.id ?? 1);
  searchInput.addEventListener("input", () => render(data, collection));
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
