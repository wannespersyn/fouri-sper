export const WEEKDAG_KORT = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
export const WEEKDAG_LANG = [
  "zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag",
];
export const MAAND_KORT = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

// Dates are handled as plain 'YYYY-MM-DD' strings throughout (matches
// Postgres `date` columns) to avoid timezone drift from the JS Date object.

export function getDagenBereik(startIso: string, eindIso: string): string[] {
  const dagen: string[] = [];
  let cursor = startIso;
  while (cursor <= eindIso) {
    dagen.push(cursor);
    cursor = voegDagenToe(cursor, 1);
  }
  return dagen;
}

export function voegDagenToe(iso: string, aantal: number): string {
  const [j, m, d] = iso.split("-").map(Number);
  const utc = Date.UTC(j, m - 1, d) + aantal * 86_400_000;
  return new Date(utc).toISOString().slice(0, 10);
}

export function weekdagVan(iso: string): number {
  const [j, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(j, m - 1, d)).getUTCDay();
}

export function dagVanMaand(iso: string): number {
  return Number(iso.split("-")[2]);
}

export function formatDagKort(iso: string) {
  return { weekday: WEEKDAG_KORT[weekdagVan(iso)], dayNum: dagVanMaand(iso) };
}

export function formatDatumLang(iso: string) {
  const [j, m, d] = iso.split("-").map(Number);
  return `${WEEKDAG_LANG[weekdagVan(iso)]} ${d} ${MAAND_KORT[m - 1]} ${j}`;
}
