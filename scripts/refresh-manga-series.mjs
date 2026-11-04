// Refreshes volume counts and status in lib/content/manga-series.json from
// MangaDex. Run with `pnpm content:refresh-manga`, then review the diff before
// committing: MangaDex is community-maintained and its numbers can be wrong.
//
// Rules, which keep public pages from overstating what the data supports:
// - A completed series with a set lastVolume gets an exact count.
// - Anything else gets the highest numbered volume, shown as "at least N". A
//   lower number never replaces a higher one, because aggregate data has gaps.
//
// Running series can be ahead of or behind reality here, so check any raised
// count against Wikipedia or the publisher. Witch Hat Atelier and Vagabond were
// left out of the list because MangaDex's count looked too high and couldn't be
// confirmed.
//
// Don't add AniList as a source: its terms prohibit use in manga tracker services.

import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("../lib/content/manga-series.json", import.meta.url);
const API = "https://api.mangadex.org";
const HEADERS = { "User-Agent": "ReadLedger-content-refresh/1.0", Accept: "application/json" };
// MangaDex allows about 5 requests per second per IP.
const DELAY_MS = 350;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(path) {
  await sleep(DELAY_MS);
  const res = await fetch(`${API}${path}`, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

const data = JSON.parse(readFileSync(FILE, "utf8"));
let changes = 0;

for (const series of data.series) {
  const { data: manga } = await get(`/manga/${series.mangadexId}`);
  const { volumes: aggregate } = await get(`/manga/${series.mangadexId}/aggregate`);

  const numbered = Object.keys(aggregate).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const highest = numbered.length ? Math.max(...numbered) : 0;
  const { status } = manga.attributes;
  const lastVolume = parseInt(manga.attributes.lastVolume, 10);

  const exact = status === "completed" && lastVolume > 0;
  const volumes = exact ? lastVolume : Math.max(series.volumes, highest);

  if (status !== series.status || volumes !== series.volumes || exact !== series.exact) {
    console.log(
      `${series.slug}: ${series.status} ${series.volumes}${series.exact ? "" : "+"} -> ${status} ${volumes}${exact ? "" : "+"}`,
    );
    Object.assign(series, { status, volumes, exact });
    changes += 1;
  }
}

data.checkedOn = new Date().toISOString().slice(0, 10);
writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`);
console.log(`${changes} series changed. Review the diff before committing.`);
