#!/usr/bin/env node
/**
 * MissedMe lead scraper — pulls real local-service businesses from the Google
 * Places API (New), scores each one "most dire → least dire" by how weak its
 * online presence is, and writes a CSV you can call down.
 *
 * WHY THIS EXISTS: directory sites (Yelp, Expertise, HomeGuide, Angi) block
 * automated fetching, so a licensed API is the only reliable way to get real
 * names, phones, websites, and review counts at scale.
 *
 * SETUP (one time):
 *   1. Create a Google Cloud project: https://console.cloud.google.com/
 *   2. Enable "Places API (New)" and add a billing card.
 *      (Google gives a large free monthly credit; a 500–1,000 row pull is a
 *       few dollars at most. Text Search returns rating + review count +
 *       website + phone in ONE call, so there are no extra Details charges.)
 *   3. Create an API key (APIs & Services → Credentials). Restrict it to
 *      "Places API (New)" so it can't be abused.
 *   4. export GOOGLE_PLACES_API_KEY="your_key_here"
 *
 * RUN:
 *   node scrape-leads.mjs                       # defaults: pool service, Phoenix metro
 *   NICHES="pest control,garage door repair" node scrape-leads.mjs
 *   CITIES="Phoenix AZ,Scottsdale AZ" node scrape-leads.mjs
 *   OUT=leads-poolservice.csv node scrape-leads.mjs
 *
 * OUTPUT: a CSV sorted most-dire-first with these columns:
 *   dire_score, name, phone, website, has_website, rating, review_count,
 *   review_gap_flag, city, address, google_maps_url, place_id, notes
 */

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("ERROR: set GOOGLE_PLACES_API_KEY first. See setup notes at the top of this file.");
  process.exit(1);
}

// ---- What to pull (override via env vars) ----------------------------------
const NICHES = (process.env.NICHES || "pool service").split(",").map(s => s.trim()).filter(Boolean);

// Phoenix metro. Add/remove cities as you like. More cities = more rows.
const CITIES = (process.env.CITIES ||
  "Phoenix AZ,Scottsdale AZ,Mesa AZ,Tempe AZ,Chandler AZ,Gilbert AZ,Glendale AZ,Peoria AZ,Surprise AZ,Goodyear AZ,Avondale AZ,Queen Creek AZ,Paradise Valley AZ,Cave Creek AZ,Buckeye AZ"
).split(",").map(s => s.trim()).filter(Boolean);

const OUT = process.env.OUT || "leads.csv";
const MAX_PER_QUERY = 60; // Places API caps at 60 (3 pages of 20) per text query

// ---- Places API (New) text search ------------------------------------------
const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.googleMapsUri",
  "nextPageToken",
].join(",");

async function searchPage(textQuery, pageToken) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({ textQuery, pageSize: 20, ...(pageToken ? { pageToken } : {}) }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API ${res.status}: ${body}`);
  }
  return res.json();
}

async function searchAll(textQuery) {
  const out = [];
  let pageToken;
  do {
    const data = await searchPage(textQuery, pageToken);
    for (const p of data.places || []) out.push(p);
    pageToken = data.nextPageToken;
    if (pageToken) await new Promise(r => setTimeout(r, 2500)); // token needs a moment to activate
  } while (pageToken && out.length < MAX_PER_QUERY);
  return out;
}

// ---- Dire score: higher = weaker online presence = call them first ---------
// Logic: the best prospect is a real, operating business that is hard to find
// online — no website and/or very few reviews. A polished company with 400
// reviews and a clean site needs you least.
function scoreReviewGap(count) {
  if (count == null) return 30;
  if (count < 10) return 30;
  if (count < 25) return 24;
  if (count < 50) return 16;
  if (count < 100) return 9;
  if (count < 200) return 4;
  return 0;
}
function direScore(p) {
  const hasWebsite = !!p.websiteUri;
  const reviews = p.userRatingCount ?? 0;
  const rating = p.rating ?? null;

  let score = 0;
  const notes = [];

  if (!hasWebsite) { score += 40; notes.push("NO WEBSITE"); }        // biggest signal
  const gap = scoreReviewGap(reviews);
  score += gap;
  if (reviews < 25) notes.push(`only ${reviews} reviews`);

  // Reputation problem: enough reviews to be real, but rating is hurting them.
  if (rating != null && reviews >= 10 && rating < 4.0) { score += 12; notes.push(`low rating ${rating}`); }

  // Very few reviews + no website = classic "invisible" operator.
  if (!hasWebsite && reviews < 15) notes.push("nearly invisible online");

  return { score, notes };
}

// ---- Run --------------------------------------------------------------------
const byId = new Map();
for (const niche of NICHES) {
  for (const city of CITIES) {
    const q = `${niche} in ${city}`;
    process.stderr.write(`Searching: ${q} ... `);
    try {
      const places = await searchAll(q);
      let added = 0;
      for (const p of places) {
        if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
        if (!byId.has(p.id)) { byId.set(p.id, { p, niche, city }); added++; }
      }
      process.stderr.write(`${places.length} found, ${added} new (total ${byId.size})\n`);
    } catch (e) {
      process.stderr.write(`FAILED: ${e.message}\n`);
    }
  }
}

const rows = [...byId.values()].map(({ p, niche, city }) => {
  const { score, notes } = direScore(p);
  return {
    dire_score: score,
    name: p.displayName?.text || "",
    phone: p.nationalPhoneNumber || "",
    website: p.websiteUri || "",
    has_website: p.websiteUri ? "yes" : "NO",
    rating: p.rating ?? "",
    review_count: p.userRatingCount ?? 0,
    review_gap_flag: (p.userRatingCount ?? 0) < 25 ? "LOW" : "",
    niche,
    city,
    address: p.formattedAddress || "",
    google_maps_url: p.googleMapsUri || "",
    place_id: p.id,
    notes: notes.join("; "),
  };
}).sort((a, b) => b.dire_score - a.dire_score);

// ---- Write CSV --------------------------------------------------------------
const cols = ["dire_score","name","phone","website","has_website","rating","review_count","review_gap_flag","niche","city","address","google_maps_url","place_id","notes"];
const esc = v => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = [cols.join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");

const fs = await import("node:fs");
fs.writeFileSync(OUT, csv);
console.error(`\nDone. ${rows.length} unique businesses → ${OUT}`);
console.error(`Most dire ${Math.min(5, rows.length)}:`);
for (const r of rows.slice(0, 5)) console.error(`  [${r.dire_score}] ${r.name} — ${r.has_website === "NO" ? "no site" : "has site"}, ${r.review_count} reviews — ${r.phone || "no phone listed"}`);
