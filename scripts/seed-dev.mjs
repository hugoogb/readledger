// Seeds the local development database (docker-compose.dev.yml) with a
// representative collection, so every screen has something to show:
// manga runs with gaps, single books, missing covers, a very long title,
// prices, stores, reading dates, a goal and a wishlist.
//
//   pnpm db:seed:dev
//
// Creates two accounts: dev@readledger.local (seeded) and
// empty@readledger.local (no books, for empty states). Sign in with either;
// without BREVO_API_KEY the login code is printed to the dev server log.
//
// Idempotent: if the dev account already has series, nothing is changed.
// Writes through `docker exec ... psql`, so it needs no extra dependencies,
// and it only ever writes to the local dev container.

import { execFileSync } from "node:child_process";

const CONTAINER = "readledger-dev-db";

// Writes go through `docker exec` into this container and nowhere else, so
// the safety check is that the local dev container exists and is running.
function containerRunning() {
  try {
    return (
      execFileSync("docker", ["inspect", "-f", "{{.State.Running}}", CONTAINER], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() === "true"
    );
  } catch {
    return false;
  }
}

if (!containerRunning()) {
  console.error(
    `Refusing to seed: the ${CONTAINER} container isn't running. Start it with\n` +
      "  docker compose -f docker-compose.dev.yml up -d",
  );
  process.exit(1);
}

function psql(sql) {
  return execFileSync(
    "docker",
    ["exec", "-i", CONTAINER, "psql", "-U", "readledger", "-d", "readledger", "-v", "ON_ERROR_STOP=1", "-tA"],
    { input: sql, encoding: "utf8" },
  ).trim();
}

const q = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const md = (id, file) => `https://uploads.mangadex.org/covers/${id}/${file}.512.jpg`;
const ol = (coverId) => `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;

const DEV = "dev@readledger.local";
const EMPTY = "empty@readledger.local";

psql(`
INSERT INTO users (id, email, name, currency, "updatedAt")
VALUES (gen_random_uuid(), ${q(DEV)}, 'Dev Reader', 'EUR', now())
ON CONFLICT (email) DO NOTHING;
INSERT INTO users (id, email, name, currency, "updatedAt")
VALUES (gen_random_uuid(), ${q(EMPTY)}, NULL, 'USD', now())
ON CONFLICT (email) DO NOTHING;
`);

const existing = Number(
  psql(`SELECT count(*) FROM series s JOIN users u ON u.id = s."userId" WHERE u.email = ${q(DEV)};`),
);
if (existing > 0) {
  console.log(`Dev account already has ${existing} series; nothing to do.`);
  process.exit(0);
}

const year = new Date().getUTCFullYear();
const stores = ["Kinokuniya", "Second-hand market"];
const publishers = ["Viz Media", "Penguin"];
const conditions = ["NEW", "LIKE_NEW", "VERY_GOOD", "GOOD"];

// owned: volume numbers owned; read: how many of the owned are read.
const manga = [
  { title: "Berserk", author: "Kentaro Miura", status: "READING", total: 42, owned: 30, read: 24, id: "801513ba-a712-498c-8f57-cae55b38cc92", file: "88b10820-0309-44c5-9a40-c799865ad968.jpg", gaps: [7, 19] },
  { title: "Vinland Saga", author: "Makoto Yukimura", status: "READING", total: 14, owned: 14, read: 11, id: "5d1fc77e-706a-4fc5-bea8-486c9be0145d", file: "47e19a12-b0fb-4b52-b105-c202c555b966.jpg", publishing: true },
  { title: "Monster", author: "Naoki Urasawa", status: "COMPLETED", total: 18, owned: 18, read: 18, id: "d9e30523-9d65-469e-92a2-302995770950", file: "93d166ed-bac0-42ad-89e6-6f0be4ce9d9d.jpg" },
  { title: "20th Century Boys", author: "Naoki Urasawa", status: "ON_HOLD", total: 22, owned: 9, read: 6, id: "ad06790a-01e3-400c-a449-0ec152d6756a", file: "79258e5e-8fd9-49c3-95f6-4def26018a95.jpg" },
  { title: "Chainsaw Man", author: "Tatsuki Fujimoto", status: "READING", total: 21, owned: 12, read: 12, id: "a77742b1-befd-49a4-bff5-1ad4e6b0ef7b", file: "07b6e139-194a-4438-b07a-57db2f4f22f8.jpg", publishing: true },
  { title: "Jujutsu Kaisen", author: "Gege Akutami", status: "DROPPED", total: 30, owned: 5, read: 3, id: "c52b2ce3-7f95-469c-96b0-479524fb7a1a", file: "258999da-cbcf-4dd9-8786-91f5eaa968b8.png" },
  { title: "Naruto", author: "Masashi Kishimoto", status: "PLAN_TO_READ", total: 72, owned: 3, read: 0, id: "6b1eb93e-473a-4ab3-9922-1a66d2a29a4a", file: "c5a3090c-4ca0-40a2-9102-e0ee0c6dac15.jpg" },
  { title: "One Piece", author: "Eiichiro Oda", status: "READING", total: 110, owned: 60, read: 52, id: "a1c7c817-4e59-43b7-9365-09675a149a6f", file: "2f4aca53-64c7-46ac-ae85-3bc9b3169890.png", publishing: true },
  // No cover, no author, very long title: placeholder and truncation cases.
  { title: "The Extraordinarily Long and Winding Chronicle of a Small Bookshop at the Edge of the Map", author: null, status: "READING", total: 6, owned: 4, read: 2, noCover: true, format: "LIGHT_NOVEL" },
  { title: "Hand-bound Zine Collection", author: "Various", status: "COMPLETED", total: 3, owned: 3, read: 3, noCover: true, format: "COMIC" },
];

const books = [
  { title: "Dune", author: "Frank Herbert", format: "NOVEL", cover: 11481354, read: true, price: 12.9, retail: 14.9 },
  { title: "Piranesi", author: "Susanna Clarke", format: "NOVEL", cover: 10226290, read: true, price: 6.5, retail: 18.0, store: 1 },
  { title: "Middlemarch", author: "George Eliot", format: "NOVEL", cover: 252882, read: false, price: 4.0, retail: 11.0, store: 1 },
  { title: "Sapiens", author: "Yuval Noah Harari", format: "NONFICTION", cover: 8634250, read: true, price: 15.0 },
  { title: "Saga, Volume One", author: "Brian K. Vaughan", format: "COMIC", cover: null, read: true, price: 9.99 },
  { title: "Untitled Notebook of Recipes", author: null, format: "OTHER", cover: null, read: false, price: null },
];

const wishlist = [
  { title: "The Name of the Wind", author: "Patrick Rothfuss", format: "NOVEL" },
  { title: "Pluto", author: "Naoki Urasawa", format: "MANGA" },
  { title: "Gödel, Escher, Bach", author: "Douglas Hofstadter", format: "NONFICTION" },
];

// Spread purchase dates over this year and last, deterministically, never in
// the future. A read lands 3 to 40 days after its purchase, capped at today.
const today = new Date();
const thisMonth = today.getUTCMonth(); // 0-based
const day = (i, y) => {
  const months = y < year ? 12 : Math.max(1, thisMonth);
  const date = `${y}-${String((i % months) + 1).padStart(2, "0")}-${String(((i * 7) % 27) + 1).padStart(2, "0")}`;
  return new Date(`${date}T00:00:00Z`) > today ? today.toISOString().slice(0, 10) : date;
};
const readAfter = (purchase, i) => {
  const read = new Date(`${purchase}T00:00:00Z`);
  read.setUTCDate(read.getUTCDate() + 3 + (i % 38));
  return (read > today ? today : read).toISOString().slice(0, 10);
};

let sql = `
DO $$
DECLARE u text; s text; st0 text; st1 text; p0 text; p1 text;
BEGIN
SELECT id INTO u FROM users WHERE email = ${q(DEV)};
INSERT INTO user_stores (id, "userId", name) VALUES (gen_random_uuid(), u, ${q(stores[0])}) RETURNING id INTO st0;
INSERT INTO user_stores (id, "userId", name) VALUES (gen_random_uuid(), u, ${q(stores[1])}) RETURNING id INTO st1;
INSERT INTO publishers (id, "userId", name) VALUES (gen_random_uuid(), u, ${q(publishers[0])}) RETURNING id INTO p0;
INSERT INTO publishers (id, "userId", name) VALUES (gen_random_uuid(), u, ${q(publishers[1])}) RETURNING id INTO p1;
INSERT INTO reading_goals (id, "userId", year, target, "updatedAt") VALUES (gen_random_uuid(), u, ${year}, 50, now());
`;

let n = 0;
for (const m of manga) {
  sql += `
INSERT INTO series (id, "userId", title, author, status, format, "totalVolumes", "coverImage", "mangadexId", publishing, "publisherId", "retailPrice", "updatedAt")
VALUES (gen_random_uuid(), u, ${q(m.title)}, ${q(m.author)}, '${m.status}', '${m.format ?? "MANGA"}', ${m.total},
  ${m.noCover ? "NULL" : q(md(m.id, m.file))}, ${m.noCover ? "NULL" : q(m.id)}, ${m.publishing ? "true" : "false"},
  ${m.noCover ? "NULL" : "p0"}, 9.99, now() - interval '${n} hours')
RETURNING id INTO s;
`;
  let readLeft = m.read;
  for (let v = 1, owned = 0; v <= m.total && owned < m.owned; v++) {
    if (m.gaps?.includes(v)) continue;
    owned++;
    const read = readLeft-- > 0;
    const i = n * 31 + v;
    const y = i % 3 === 0 ? year - 1 : year;
    const used = i % 4 === 0;
    sql += `INSERT INTO volumes (id, "seriesId", "volumeNumber", owned, read, "pricePaid", condition, "purchaseDate", "readDate", "storeId", "updatedAt")
VALUES (gen_random_uuid(), s, ${v}, true, ${read}, ${used ? 5.5 : 9.99}, '${used ? conditions[(i % 3) + 1] : "NEW"}', '${day(i, y)}', ${read ? `'${readAfter(day(i, y), i)}'` : "NULL"}, ${used ? "st1" : "st0"}, now());
`;
  }
  n++;
}

for (const b of books) {
  const i = n * 13;
  sql += `
INSERT INTO series (id, "userId", title, author, status, format, "totalVolumes", "coverImage", "publisherId", "retailPrice", "updatedAt")
VALUES (gen_random_uuid(), u, ${q(b.title)}, ${q(b.author)}, '${b.read ? "COMPLETED" : "PLAN_TO_READ"}', '${b.format}', 1,
  ${b.cover ? q(ol(b.cover)) : "NULL"}, p1, ${b.retail ?? "NULL"}, now() - interval '${n} hours')
RETURNING id INTO s;
INSERT INTO volumes (id, "seriesId", "volumeNumber", owned, read, "pricePaid", condition, "purchaseDate", "readDate", "storeId", "updatedAt")
VALUES (gen_random_uuid(), s, 1, true, ${b.read}, ${b.price ?? "NULL"}, '${b.store ? "GOOD" : "NEW"}', '${day(i, year)}', ${b.read ? `'${readAfter(day(i, year), i)}'` : "NULL"}, ${b.store ? "st1" : "st0"}, now());
`;
  n++;
}

for (const w of wishlist) {
  sql += `
INSERT INTO series (id, "userId", title, author, status, format, "totalVolumes", "updatedAt")
VALUES (gen_random_uuid(), u, ${q(w.title)}, ${q(w.author)}, 'PLAN_TO_READ', '${w.format}', 1, now() - interval '${n} days')
RETURNING id INTO s;
INSERT INTO volumes (id, "seriesId", "volumeNumber", owned, read, wishlist, "updatedAt")
VALUES (gen_random_uuid(), s, 1, false, false, true, now());
`;
  n++;
}

sql += `END $$;`;
psql(sql);

console.log(
  psql(`
SELECT format('Seeded %s: %s series, %s owned volumes, %s read, %s wishlist.',
  ${q(DEV)},
  (SELECT count(*) FROM series s JOIN users u ON u.id = s."userId" WHERE u.email = ${q(DEV)}),
  (SELECT count(*) FROM volumes v JOIN series s ON s.id = v."seriesId" JOIN users u ON u.id = s."userId" WHERE u.email = ${q(DEV)} AND v.owned),
  (SELECT count(*) FROM volumes v JOIN series s ON s.id = v."seriesId" JOIN users u ON u.id = s."userId" WHERE u.email = ${q(DEV)} AND v.read),
  (SELECT count(*) FROM volumes v JOIN series s ON s.id = v."seriesId" JOIN users u ON u.id = s."userId" WHERE u.email = ${q(DEV)} AND v.wishlist));
`),
);
