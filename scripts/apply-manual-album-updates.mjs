import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPaths = [
  path.join(root, "output", "panini_world_cup_2026.json"),
  path.join(root, "public", "data", "panini_world_cup_2026.json"),
];
const missingInfoPath = path.join(root, "output", "jogadores_com_info_faltando.json");
const reportPath = path.join(root, "output", "report.json");

const manualInfo = [
  ["México", "Diego Lainez", "07/06/2000", 166, "Sporting CP", "Ponta Esquerda"],
  ["México", "Marcel Ruiz", "20/01/2000", 169, "Toluca", "Meia"],
  ["África do Sul", "Sipho Chaine", "23/01/1996", 185, "Wydad Casablanca", "Goleiro"],
  ["África do Sul", "Bathuisi Aubaas", "08/04/1997", 180, "Mamelodi Sundowns", "Zagueiro"],
  ["África do Sul", "Ioraam Rayners", "06/09/1996", 178, "Mamelodi Sundowns", "Atacante"],
  ["África do Sul", "Oswin Appolis", "14/03/1998", 172, "Mamelodi Sundowns", "Ponta Esquerda"],
  ["Coreia do Sul", "Hyeon-woo Jo", "25/09/2001", 191, "Ulsan HD", "Goleiro"],
  ["Coreia do Sul", "Seung-Gyu Kim", "30/09/1990", 189, "Vissel Kobe", "Goleiro"],
  ["Coreia do Sul", "Min-jae Kim", "15/05/1996", 190, "Bayern München", "Zagueiro"],
  ["Coreia do Sul", "Yu-min Cho", "17/02/2003", 175, "Freiburg", "Lateral Esquerdo"],
  ["Coreia do Sul", "Young-woo Seol", "27/03/1999", 187, "Jeju United", "Lateral Direito"],
  ["Coreia do Sul", "Han-beom Lee", "28/09/1996", 178, "Jeonbuk Hyundai", "Meia"],
  ["Coreia do Sul", "Tae-seok Lee", "24/02/1992", 183, "Jeonbuk Hyundai", "Volante"],
  ["Coreia do Sul", "Myung-jae Lee", "20/04/1990", 183, "Ulsan HD", "Zagueiro"],
  ["Coreia do Sul", "Jae-sung Lee", "10/08/1992", 179, "Mainz 05", "Meia-atacante"],
  ["Coreia do Sul", "In-beom Hwang", "20/09/1996", 177, "Hellas Verona", "Volante"],
  ["Coreia do Sul", "Seung-ho Paik", "17/04/1997", 180, "Jeonbuk Hyundai", "Meia"],
  ["Coreia do Sul", "Dong-gyeong Lee", "20/09/1997", 175, "Ulsan HD", "Meia-atacante"],
  ["Coreia do Sul", "Gue-sung Cho", "25/01/1998", 185, "Celtic", "Centroavante"],
  ["Coreia do Sul", "Hyeon-Gyu Oh", "12/04/2001", 183, "Ipswich Town", "Centroavante"],
  ["República Tcheca", "Václav Černý", "17/10/1997", 178, "Wolfsburg", "Ponta Esquerda"],
  ["Catar", "Sultan Albrake", "06/05/1993", 188, "Al-Sadd", "Goleiro"],
  ["Catar", "Akram Hassan Afif", "18/11/1996", 175, "Al-Sadd", "Ponta Esquerda"],
  ["Catar", "Ahmed Al Ganehi", "14/03/1996", 172, "Al-Gharafa", "Meia"],
  ["Suíça", "Ricardo Rodriguez", "25/08/1992", 182, "Torino", "Lateral Esquerdo"],
  ["Brasil", "Bento", "04/03/2000", 193, "Al-Qadsiah", "Goleiro"],
  ["Brasil", "Danilo", "15/07/1991", 184, "Flamengo", "Lateral Direito"],
  ["Brasil", "Wesley", "26/11/2003", 182, "Flamengo", "Ponta Direita"],
  ["Brasil", "Luiz Henrique", "13/02/2001", 174, "Botafogo", "Ponta Esquerda"],
  ["Brasil", "João Pedro", "09/09/2001", 181, "Brighton", "Centroavante"],
  ["Brasil", "Estêvão", "24/04/2007", 178, "Chelsea", "Ponta Direita"],
  ["Marrocos", "Munir El Kajoui", "01/09/1994", 188, "Villarreal", "Goleiro"],
  ["Marrocos", "Adam Masina", "02/01/1994", 188, "Watford", "Lateral Esquerdo"],
  ["Escócia", "Jack Hendry", "07/05/1995", 188, "Club Brugge", "Zagueiro"],
  ["Estados Unidos", "Math Freese", "17/03/1997", 191, "Philadelphia Union", "Goleiro"],
  ["Estados Unidos", "Chris Richards", "28/03/2000", 187, "Crystal Palace", "Zagueiro"],
  ["Estados Unidos", "Mark McKenzie", "11/10/1999", 188, "Genk", "Zagueiro"],
  ["Estados Unidos", "Weston McKenny", "28/08/1998", 181, "Juventus", "Meia"],
  ["Estados Unidos", "Christian Roldan", "20/07/1995", 178, "Seattle Sounders", "Volante"],
  ["Estados Unidos", "Diego Luna", "06/05/2003", 176, "Real Salt Lake", "Meia-atacante"],
  ["Estados Unidos", "Malim Tillman", "30/08/2002", 182, "PSV Eindhoven", "Meia-atacante"],
  ["Paraguai", "Roberto Fernández", "16/05/1997", 183, "Olimpia", "Lateral Direito"],
  ["Paraguai", "Matías Villasanti", "22/07/1997", 178, "Grêmio", "Volante"],
  ["Paraguai", "Diego Gómez", "21/02/2002", 175, "Inter Miami", "Meia"],
  ["Austrália", "Lewis Miller", "10/10/2000", 175, "Hibernian", "Lateral Direito"],
  ["Austrália", "Aiden O'Neill", "04/07/1998", 178, "Stoke City", "Volante"],
  ["Austrália", "Mohamed Touré", "10/10/2002", 186, "Central Coast Mariners", "Atacante"],
  ["Turquia", "Caglar Soyunku", "23/05/1996", 188, "Trabzonspor", "Zagueiro"],
  ["Turquia", "Irfan Can Kahvecu", "15/07/1999", 183, "Fenerbahçe", "Meia"],
  ["Turquia", "Baris Alper Yilmaz", "26/07/2000", 178, "Galatasaray", "Ponta Esquerda"],
  ["Costa do Marfim", "Ibrahim Sangaré", "02/12/1997", 188, "Nottingham Forest", "Volante"],
  ["Equador", "Alan Franco", "22/08/1997", 183, "Talleres", "Volante"],
  ["Equador", "John Veboah", "01/01/2002", 176, "Independiente del Valle", "Meia"],
  ["Equador", "Kevin Rodríguez", "29/10/2001", 172, "Independiente del Valle", "Lateral Direito"],
  ["Japão", "Koki Ogawa", "05/11/1998", 185, "Como 1907", "Centroavante"],
  ["Suécia", "Victor Johansson", "07/07/1998", 188, "Rotherham United", "Goleiro"],
  ["Suécia", "Emil Holm", "25/04/2000", 184, "Atalanta", "Lateral Direito"],
  ["Suécia", "Hugo Larsson", "06/06/2004", 182, "Eintracht Frankfurt", "Meia"],
  ["Suécia", "Daniel Svensson", "05/11/1999", 182, "Elfsborg", "Lateral Esquerdo"],
  ["Tunísia", "Van Valery", "20/05/1999", 174, "Stade Rennais", "Lateral Direito"],
  ["Tunísia", "Ali Abdi", "20/08/1996", 175, "Valenciennes", "Lateral Esquerdo"],
  ["Egito", "Mohamed Hamdy", "15/11/1997", 175, "Pyramids FC", "Ponta Direita"],
  ["Egito", "Zizo", "30/08/1993", 170, "Zamalek", "Meia-atacante"],
  ["Egito", "Mohamed Lasheen", "02/01/1997", 186, "Al Ittihad", "Centroavante"],
  ["Egito", "Mostafa Mohamed", "28/11/1997", 189, "Galatasaray", "Centroavante"],
  ["Egito", "Trezeguet", "01/10/1994", 184, "Trabzonspor", "Ponta Esquerda"],
  ["Irã", "Saeed Ezatolahi", "01/10/1996", 185, "Vejle BK", "Volante"],
  ["Nova Zelândia", "Max Crocombe-Payne", "30/06/1993", 191, "Sabadell", "Goleiro"],
  ["Nova Zelândia", "Tim Payne", "12/02/1994", 183, "Auckland City", "Lateral Direito"],
  ["Nova Zelândia", "Joe Bell", "29/04/2000", 183, "Charlotte FC", "Volante"],
  ["Nova Zelândia", "Ryan Thomas", "31/07/1994", 183, "PEC Zwolle", "Meia"],
  ["Nova Zelândia", "Chris Wood", "07/12/1991", 190, "Nottingham Forest", "Centroavante"],
  ["Espanha", "Rodri", "22/06/1996", 191, "Manchester City", "Volante"],
  ["Cabo Verde", "Pico", "01/06/2000", 182, "Rio Ave", "Lateral Esquerdo"],
  ["Cabo Verde", "Diney", "21/04/1998", 185, "Marítimo", "Zagueiro"],
  ["Cabo Verde", "João Paulo", "01/01/1995", 180, "FC Porto B", "Meia"],
  ["Cabo Verde", "Kevin Pina", "05/11/2001", 176, "Belenenses", "Ponta Direita"],
  ["Arábia Saudita", "Nawaf Alaqidi", "07/05/1993", 192, "Al-Hilal", "Goleiro"],
  ["Arábia Saudita", "Jihad Thakri", "01/02/2000", 179, "Al-Hilal", "Lateral Esquerdo"],
  ["Arábia Saudita", "Hassan Altambakti", "04/01/1998", 182, "Al-Hilal", "Lateral Direito"],
  ["Arábia Saudita", "Ziyad Aljohani", "15/06/1999", 178, "Al-Ahli", "Ponta Esquerda"],
  ["Arábia Saudita", "Abdullah Alkhaibari", "25/12/1994", 175, "Al-Hilal", "Lateral Esquerdo"],
  ["Arábia Saudita", "Nasser Aldawsari", "10/09/1990", 172, "Al-Hilal", "Ponta Esquerda"],
  ["Arábia Saudita", "Saleh Abu Alshamat", "11/01/1997", 174, "Al-Qadsiah", "Atacante"],
  ["Arábia Saudita", "Marwan Alsahafi", "10/02/1994", 177, "Al-Hilal", "Meia"],
  ["Arábia Saudita", "Salem Aldawsari", "19/08/1991", 179, "Al-Hilal", "Ponta Esquerda"],
  ["Uruguai", "Sebastian Caceres", "07/04/1997", 185, "América (MEX)", "Zagueiro"],
  ["Uruguai", "Mathias Olivera", "31/10/1997", 181, "Napoli", "Lateral Esquerdo"],
  ["Uruguai", "Manuel Ugarte", "11/04/2001", 181, "Manchester United", "Volante"],
  ["Uruguai", "Maxi Araujo", "06/12/2000", 180, "Atlético de Madrid", "Lateral Esquerdo"],
  ["Senegal", "Eduardo Mendy", "01/03/1992", 197, "Al-Ahli", "Goleiro"],
  ["Senegal", "Abdoulaye Seck", "09/08/1992", 186, "Angers", "Zagueiro"],
  ["Iraque", "Hussein Ali", "15/02/1994", 179, "Al-Zawraa", "Atacante"],
  ["Iraque", "Akam Hashem", "20/03/1997", 178, "Al-Shorta", "Meia"],
  ["Argentina", "Nico González", "06/04/2001", 180, "Juventus", "Ponta Esquerda"],
  ["Argélia", "Farés Chaibi", "26/04/2002", 184, "Eintracht Frankfurt", "Meia-atacante"],
  ["Argélia", "Mohammed Amoura", "24/01/2000", 180, "VfB Stuttgart", "Atacante"],
  ["Jordânia", "Saleem Obaid", "05/07/1992", 183, "Al-Faisaly", "Goleiro"],
  ["Jordânia", "Ibrahim Saadeh", "01/01/1997", 178, "Al-Wehdat", "Meia"],
  ["Portugal", "Nuno Mendes", "19/06/2002", 182, "Paris Saint-Germain", "Lateral Esquerdo"],
  ["Portugal", "Vitinha", "13/02/2000", 172, "Paris Saint-Germain", "Meia"],
  ["RD Congo", "Ngal'ayel Mukau", "20/10/2004", 182, "Wolfsburg", "Atacante"],
  ["Uzbequistão", "Farrukh Savfiev", "01/06/2001", 178, "Pakhtakor", "Meia"],
  ["Colômbia", "Daniel Muñoz", "02/07/1996", 182, "Crystal Palace", "Lateral Direito"],
  ["Colômbia", "James Rodríguez", "12/07/1991", 181, "Rayo Vallecano", "Meia-atacante"],
  ["Colômbia", "Jhon Arias", "04/12/1997", 175, "Fluminense", "Ponta Direita"],
  ["Colômbia", "Luis Díaz", "13/01/1997", 180, "Liverpool", "Ponta Esquerda"],
  ["Inglaterra", "Anthony Gordon", "24/02/2001", 180, "Newcastle United", "Ponta Esquerda"],
  ["Gana", "Gideon Mensah", "22/07/1998", 177, "Red Bull Salzburg", "Lateral Esquerdo"],
  ["Panamá", "Andrés Andrade", "01/08/1986", 172, "Independiente", "Volante"],
  ["Panamá", "Eric Davis", "25/12/1991", 183, "Millwall", "Zagueiro"],
  ["Panamá", "Cristian Martínez", "25/07/1998", 176, "Columbus Crew", "Lateral Direito"],
  ["Panamá", "Édgar Bárcenas", "14/09/1990", 170, "Vitória de Guimarães", "Ponta Direita"],
  ["Panamá", "Ismael Díaz", "14/01/2000", 180, "Standard Liège", "Atacante"],
  ["Panamá", "José Fajardo", "30/09/1997", 175, "Panathinaikos", "Ponta Direita"],
  ["Panamá", "José Luis Rodríguez", "12/10/2001", 177, "Plaza Amador", "Meia"],
  ["Panamá", "Alberto Quintero", "26/11/1987", 163, "Tauro FC", "Ponta Esquerda"],
];

const cocaPlayers = [
  ["Lamine Yamal", "Espanha"],
  ["Joshua Kimmich", "Alemanha"],
  ["Harry Kane", "Inglaterra"],
  ["Santiago Giménez", "México"],
  ["Joško Gvardiol", "Croácia"],
  ["Federico Valverde", "Uruguai"],
  ["Jefferson Lerma", "Colômbia"],
  ["Enner Valencia", "Equador"],
  ["Gabriel Magalhães", "Brasil"],
  ["Virgil van Dijk", "Países Baixos"],
  ["Alphonso Davies", "Canadá"],
  ["Emiliano Martínez", "Argentina"],
  ["Raúl Jiménez", "México"],
  ["Lautaro Martínez", "Argentina"],
];

const normalize = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();

const dateToAlbum = (date) => date.split("/").join("-");

for (const dataPath of dataPaths) {
  const data = JSON.parse(await readFile(dataPath, "utf8"));
  const countryByName = new Map(data.countries.map((country) => [normalize(country.namePt), country]));
  const clubsByName = new Map(data.clubs.map((club) => [normalize(club.name), club]));

  const ensureClub = (name) => {
    const key = normalize(name);
    const existing = clubsByName.get(key);
    if (existing) return existing.id;
    const club = { id: Math.max(...data.clubs.map((item) => item.id)) + 1, name, country: "UNKNOWN" };
    data.clubs.push(club);
    clubsByName.set(key, club);
    return club.id;
  };

  let filled = 0;
  for (const [countryName, playerName, birthDate, heightCm, clubName, position] of manualInfo) {
    const country = countryByName.get(normalize(countryName));
    const player = data.players.find((item) => item.countryId === country?.id && normalize(item.name) === normalize(playerName));
    if (!player) {
      console.warn(`[WARN] jogador nao encontrado: ${countryName} - ${playerName}`);
      continue;
    }
    player.birthDate = dateToAlbum(birthDate);
    player.heightCm = heightCm;
    player.position = position;
    player.clubId = ensureClub(clubName);
    filled += 1;
  }

  data.countries = data.countries.filter((country) => country.code !== "COCA");
  data.players = data.players.filter((player) => player.countryId !== 49);
  data.stickers = data.stickers.filter((sticker) => sticker.countryId !== 49);

  const cocaCountry = { id: 49, group: "Coca-Cola", code: "COCA", namePt: "Coca-Cola", nameEn: "Coca-Cola" };
  data.countries.push(cocaCountry);

  const nextPlayerId = Math.max(...data.players.map((player) => player.id)) + 1;
  const nextStickerId = Math.max(...data.stickers.map((sticker) => sticker.id)) + 1;
  data.stickers.push({
    id: nextStickerId,
    code: "COCA-1",
    albumPageId: 50,
    countryId: cocaCountry.id,
    playerId: 0,
    slot: 1,
    type: "SPECIAL",
    title: "Coca-Cola",
    scope: "COCA_COLA",
  });

  cocaPlayers.forEach(([name, selection], index) => {
    const playerId = nextPlayerId + index;
    data.players.push({
      id: playerId,
      name,
      normalizedName: normalize(name),
      countryId: cocaCountry.id,
      clubId: 1,
      position: "",
      birthDate: "",
      heightCm: 0,
      weightKg: 0,
      externalIds: {},
      dataQuality: { source: "manual_coca_cola_group", isPlaceholder: false, validatedBy: [] },
      selection,
    });
    data.stickers.push({
      id: nextStickerId + index + 1,
      code: `COCA-${index + 2}`,
      albumPageId: 50,
      countryId: cocaCountry.id,
      playerId,
      slot: index + 2,
      type: "PLAYER",
      title: name,
      scope: "COCA_COLA",
    });
  });

  data.metadata = {
    ...data.metadata,
    manualAlbumUpdates: {
      appliedAt: new Date().toISOString(),
      filledPlayerInfo: filled,
      cocaColaCards: 15,
    },
  };

  await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`[ALBUM] ${path.relative(root, dataPath)} preenchidos=${filled} coca=15`);
}

const publicData = JSON.parse(await readFile(dataPaths[1], "utf8"));
const countries = new Map(publicData.countries.map((country) => [country.id, country.namePt]));
const clubs = new Map(publicData.clubs.map((club) => [club.id, club.name]));
const missing = publicData.players
  .filter((player) => {
    if (player.countryId === 49) return false;
    const club = clubs.get(player.clubId);
    return !player.birthDate || player.birthDate === "UNKNOWN" || !player.heightCm || !player.position || player.position === "UNKNOWN" || !club || club === "UNKNOWN";
  })
  .map((player) => ({ selecao: countries.get(player.countryId) || "UNKNOWN", nome: player.name }));

await writeFile(missingInfoPath, `${JSON.stringify(missing, null, 2)}\n`, "utf8");
console.log(`[ALBUM] faltantes=${missing.length}`);

const stickerTypeCounts = publicData.stickers.reduce((counts, sticker) => {
  counts[sticker.type] = (counts[sticker.type] ?? 0) + 1;
  return counts;
}, {});
const playersByCountry = publicData.countries
  .filter((country) => country.code !== "COCA")
  .map((country) => publicData.players.filter((player) => player.countryId === country.id).length);
const report = {
  summary: {
    countries: publicData.countries.length,
    clubs: publicData.clubs.length,
    players: publicData.players.length,
    albumPages: 50,
    stickers: publicData.stickers.length,
    conflicts: publicData.report?.summary?.conflicts ?? 0,
    stickersByType: stickerTypeCounts,
    playersPerCountryMin: Math.min(...playersByCountry),
    playersPerCountryMax: Math.max(...playersByCountry),
  },
  conflictsBySeverity: {},
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("[ALBUM] report atualizado");
