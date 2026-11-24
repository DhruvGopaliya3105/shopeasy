// ===== HELPERS =====
const $ = (id) => document.getElementById(id);
const rupees = (n) => "₹" + n.toLocaleString("en-IN");
const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
const catName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || "";

// ===== LINE ICONS (used in the header, menus and buttons) =====
const ICON_PATHS = {
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>',
  home: '<path d="M3 9.5 12 2l9 7.5V20a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/>',
  truck: '<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  returns: '<path d="M1 4v6h6"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
};
const icon = (name) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON_PATHS[name] || ""}</svg>`;
// ===== PRODUCT PICTURES =====
// Shows the product's photo if it has  image: "earbuds.jpg"  (from the images/ folder, or a full https:// link),
// otherwise its emoji. If a photo is missing or broken, it falls back to the emoji automatically.
function pic(p) {
  if (!p || !p.image) return p ? p.icon : "";
  const src = /^https?:\/\//.test(p.image) ? p.image : `images/${encodeURI(p.image)}`;
  return `<img class="pic" src="${src}" alt="" loading="lazy" decoding="async" onerror="this.outerHTML='${p.icon}'">`;
}

// Fill every element marked data-icon="…" with its icon
document.querySelectorAll("[data-icon]").forEach((el) => el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)));

// ===== STATE =====
let activeCat = "all";
let query = "";
let sortBy = "featured";
let cart = loadStore("shopeasy-cart");   // { productId: quantity }
let saved = loadStore("shopeasy-saved"); // items moved out of the cart with "Save for later"
let checkoutItems = null;  // null = checking out the cart; otherwise a Buy Now item { productId: 1 }
let lastRemoved = null;    // what Undo puts back: { from: "cart" | "saved", id, qty }
let wishlist = loadList("shopeasy-wishlist"); // [productId, ...]
let recent = loadList("shopeasy-recent");     // recently viewed, newest first
let coupon = loadValue("shopeasy-coupon");    // applied coupon code, or null
let priceFilter = "any";
let minRating = 0;

function loadStore(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; }
  catch (e) { return {}; }
}
function loadList(key) {
  try { const v = JSON.parse(localStorage.getItem(key)); return Array.isArray(v) ? v : []; }
  catch (e) { return []; }
}
function loadValue(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function store(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  } catch (e) {}
}
function saveCart() {
  store("shopeasy-cart", cart);
  store("shopeasy-saved", saved);
  store("shopeasy-coupon", coupon);
}
const discountPct = (p) => Math.round((1 - p.price / p.mrp) * 100);

// ===== MOL-BHAV PRICES =====
// Bargained prices last for today only (they reset at midnight)
const todayKey = () => new Date().toLocaleDateString("en-CA"); // e.g. 2026-11-23
function loadBargains() {
  const b = loadStore("shopeasy-bargains");
  return b.date === todayKey() ? { deals: {}, tries: {}, last: {}, ...b } : { date: todayKey(), deals: {}, tries: {}, last: {} };
}
let bargains = loadBargains();
function saveBargains() { store("shopeasy-bargains", bargains); }
// The price the customer actually pays for one piece today
function effectivePrice(p) {
  const d = bargains.date === todayKey() ? bargains.deals[p.id] : null;
  return d && d < p.price ? d : p.price;
}

// ===== EASY MODE LABELS =====
const isEasy = () => document.documentElement.classList.contains("easy");
// Hindi label with the English underneath in Easy mode, plain English otherwise
const L = (en, hi) => (isEasy() ? `${hi}<span class="en-sub">${en}</span>` : en);

// ===== THEME =====
const root = document.documentElement;
function setTheme(t) {
  root.setAttribute("data-theme", t);
  $("themeToggle").innerHTML = icon(t === "dark" ? "sun" : "moon");
  try { localStorage.setItem("shopeasy-theme", t); } catch (e) {}
}
let savedTheme = null;
try { savedTheme = localStorage.getItem("shopeasy-theme"); } catch (e) {}
setTheme(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("themeToggle").addEventListener("click", () =>
  setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));

// ===== CATEGORIES =====
function renderCategories() {
  $("categories").innerHTML = CATEGORIES.map((c) => `
    <button class="cat ${c.id === activeCat ? "active" : ""}" data-cat="${c.id}" role="tab"
      aria-selected="${c.id === activeCat}"><span class="cat-art" aria-hidden="true">${c.icon}</span><span class="cat-name">${c.name}</span></button>`).join("");
}
$("categories").addEventListener("click", (e) => {
  const btn = e.target.closest(".cat");
  if (!btn) return;
  activeCat = btn.dataset.cat;
  renderCategories();
  renderProducts();
});

// ===== SEARCH (typo-tolerant) =====
const words = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

// Each product is searchable by the words in its name and category,
// plus its name with spaces/dashes squeezed out (so "tshirt" finds "T-Shirt").
const SEARCH_INDEX = PRODUCTS.map((p) => {
  const w = [...words(p.name), ...words(catName(p.cat))];
  return { p, words: w, compact: words(p.name).join("") };
});
const VOCAB = [...new Set(SEARCH_INDEX.flatMap((e) => e.words))].filter((w) => w.length > 1);

// Number of single-letter edits (insert, delete, change, swap) to turn a into b
function editDistance(a, b) {
  const d = [];
  for (let i = 0; i <= a.length; i++) d[i] = [i];
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}
// Short words must be exact; longer words may have 1–2 typos
const typosAllowed = (len) => (len <= 3 ? 0 : len <= 5 ? 1 : 2);

// How far a typed word is from a real word (also compares against the start of
// the real word, so a half-typed "erbu" still finds "earbuds")
function closeness(typed, real) {
  let best = editDistance(typed, real);
  for (let n = typed.length - 1; n <= typed.length + 1; n++)
    if (n > 0 && n < real.length) best = Math.min(best, editDistance(typed, real.slice(0, n)) + 0.5);
  return best;
}

// A typed word matches a product if a word starts with it ("sho" → "Shoes"),
// or, from 4 letters, appears anywhere in the name ("phone" → "Smartphone")
const wordMatches = (qw, e) =>
  e.words.some((w) => w.startsWith(qw)) || (qw.length >= 4 && e.compact.includes(qw));

// Replace each typed word that matches nothing with the closest real word
function correctQuery(qWords) {
  let changed = false;
  const fixed = qWords.map((qw) => {
    if (SEARCH_INDEX.some((e) => wordMatches(qw, e))) return qw;
    let best = null, bestScore = Infinity;
    for (const v of VOCAB) {
      const s = closeness(qw, v);
      if (s < bestScore) { best = v; bestScore = s; }
    }
    if (best && bestScore <= typosAllowed(qw.length)) { changed = true; return best; }
    return qw;
  });
  return { words: fixed, changed };
}

// Returns matching products (ignoring the category filter) and the corrected text, if any
function searchProducts(text) {
  const qWords = words(text);
  if (!qWords.length) return { list: PRODUCTS, corrected: null };
  const { words: fixed, changed } = correctQuery(qWords);
  const list = SEARCH_INDEX.filter((e) => fixed.every((qw) => wordMatches(qw, e))).map((e) => e.p);
  return { list, corrected: changed && list.length ? fixed.join(" ") : null };
}

// ===== HINGLISH SMART SEARCH =====
// Understands searches like "500 ke andar t-shirt", "sasta phone", "accha wala earbuds", "gift for mummy"

// Hindi / everyday words → words in our product names
const HINGLISH_WORDS = {
  joota: "shoes", joote: "shoes", jute: "shoes", chappal: "shoes", chashma: "sunglasses", chasma: "sunglasses",
  kitab: "books", kitaab: "books", kitabein: "books", khilona: "toys", khilone: "toys", kapde: "fashion", kapda: "fashion",
  chawal: "rice", anda: "eggs", ande: "eggs", aam: "mangoes", kela: "bananas", kele: "bananas", seb: "apples",
  chai: "tea", ghadi: "watch", patang: "kite", chadar: "bedsheet", tel: "oil", sari: "saree", batua: "wallet",
  basta: "backpack", bag: "backpack", mobile: "smartphone", earphone: "earbuds", earphones: "earbuds",
  headphone: "earbuds", headphones: "earbuds", balla: "bat", scent: "perfume", attar: "perfume", itar: "perfume",
  cream: "moisturiser", sabun: "wash", soap: "wash", bartan: "pan", diya: "candles", mombatti: "candles",
  tv: "tv", television: "tv", phone: "smartphone",
};
// "gift for …" → good gift ideas (product ids)
const GIFT_IDEAS = {
  mummy: { label: "mummy", ids: [38, 21, 46, 13, 14, 19, 58] },
  papa: { label: "papa", ids: [39, 37, 3, 44, 59, 18] },
  bhai: { label: "your brother", ids: [1, 27, 41, 8, 32, 4] },
  behen: { label: "your sister", ids: [21, 20, 56, 9, 19, 10] },
  wife: { label: "your wife", ids: [38, 21, 20, 9, 46, 3] },
  husband: { label: "your husband", ids: [3, 39, 37, 1, 34, 21] },
  kids: { label: "kids", ids: [29, 31, 30, 67, 68, 69, 24, 70, 71] },
  friend: { label: "a friend", ids: [4, 1, 13, 67, 68, 3] },
};
const GIFT_ALIASES = {
  mummy: "mummy", mumma: "mummy", maa: "mummy", mom: "mummy", mother: "mummy", mammi: "mummy",
  papa: "papa", dad: "papa", father: "papa", pitaji: "papa",
  bhai: "bhai", brother: "bhai", bhaiya: "bhai", behen: "behen", bahen: "behen", didi: "behen", sister: "behen",
  wife: "wife", biwi: "wife", patni: "wife", husband: "husband", pati: "husband",
  kids: "kids", kid: "kids", bacche: "kids", baccha: "kids", bachche: "kids", child: "kids", children: "kids", beta: "kids", beti: "kids",
  friend: "friend", dost: "friend", yaar: "friend",
};
const CHEAP_WORDS = ["sasta", "sasti", "saste", "cheap", "cheapest", "budget", "affordable", "kam"];
const BEST_WORDS = ["accha", "acha", "achha", "achcha", "best", "badhiya", "badiya", "top", "good", "premium", "mast"];
const FILLER_WORDS = ["wala", "wali", "wale", "ka", "ki", "ke", "ko", "mein", "me", "chahiye", "dikhao", "dikha", "do",
  "please", "pls", "for", "a", "an", "the", "some", "koi", "kuch", "mujhe", "hai", "show", "find", "want", "i", "need",
  "liye", "tohfa", "gift", "gifts", "present", "rs", "rupees", "rupaye", "rupay"];

const toNumber = (s) => { const m = /^(\d+(?:\.\d+)?)(k)?$/.exec(s); return m ? Math.round(+m[1] * (m[2] ? 1000 : 1)) : NaN; };

// Pulls price limits, "cheap"/"best" and "gift for…" out of the search text
function parseSmartQuery(raw) {
  let t = " " + raw.toLowerCase().replace(/₹/g, " ").replace(/,(?=\d{3})/g, "").replace(/\s+/g, " ") + " ";
  let maxPrice = null, minPrice = null;
  const N = "(\\d+(?:\\.\\d+)?k?)";
  const maxPatterns = [
    new RegExp(`(?:under|below|less than|within|upto|up to|max|maximum|neeche)\\s*${N}`),
    new RegExp(`${N}\\s*(?:ke andar|ke andr|ke neeche|ke niche|se kam|ke under|tak|ke bhitar|or less|and below|mein|me)\\b`),
  ];
  const minPatterns = [
    new RegExp(`(?:above|over|more than|starting|from|min|minimum)\\s*${N}`),
    new RegExp(`${N}\\s*(?:se upar|se zyada|se jyada|se adhik|and above|or more|plus|\\+)`),
  ];
  for (const re of maxPatterns) { const m = re.exec(t); if (m) { maxPrice = toNumber(m[1]); t = t.replace(m[0], " "); break; } }
  for (const re of minPatterns) { const m = re.exec(t); if (m) { minPrice = toNumber(m[1]); t = t.replace(m[0], " "); break; } }

  let sort = null, gift = null;
  const kept = [];
  for (const w of words(t)) {
    if (CHEAP_WORDS.includes(w)) { sort = "low"; continue; }
    if (BEST_WORDS.includes(w)) { sort = sort || "rating"; continue; }
    if (GIFT_ALIASES[w]) { gift = GIFT_ALIASES[w]; continue; }
    if (FILLER_WORDS.includes(w)) continue;
    kept.push(HINGLISH_WORDS[w] || w);
  }
  return {
    text: kept.join(" "),
    maxPrice: isNaN(maxPrice) ? null : maxPrice,
    minPrice: isNaN(minPrice) ? null : minPrice,
    sort, gift,
  };
}

// Search that understands Hinglish, prices and gift ideas, built on the typo-tolerant search
function smartSearch(raw) {
  const intent = parseSmartQuery(raw || "");
  let { list, corrected } = searchProducts(intent.text);
  if (intent.gift) {
    const ids = GIFT_IDEAS[intent.gift].ids;
    list = (intent.text ? list : PRODUCTS).filter((p) => ids.includes(p.id));
    if (!list.length) list = ids.map(findProduct).filter(Boolean); // gift words win if nothing else matches
  }
  if (intent.maxPrice !== null) list = list.filter((p) => effectivePrice(p) <= intent.maxPrice);
  if (intent.minPrice !== null) list = list.filter((p) => effectivePrice(p) >= intent.minPrice);
  const understood = intent.maxPrice !== null || intent.minPrice !== null || intent.sort || intent.gift
    || intent.text !== words(raw || "").join(" ");
  return { list, corrected, intent, understood };
}

// A friendly sentence describing what we understood, e.g. "T-shirts under ₹500, cheapest first"
function describeIntent(intent, corrected) {
  const parts = [];
  const what = corrected || intent.text;
  if (intent.gift) parts.push(`gift ideas for ${GIFT_IDEAS[intent.gift].label}`);
  if (what) parts.push(intent.gift ? `matching “${what}”` : `“${what}”`);
  if (intent.maxPrice !== null) parts.push(`under ${rupees(intent.maxPrice)}`);
  if (intent.minPrice !== null) parts.push(`above ${rupees(intent.minPrice)}`);
  if (intent.sort === "low") parts.push("cheapest first");
  if (intent.sort === "rating") parts.push("best rated first");
  return parts.join(", ");
}

// ===== PRODUCTS =====
let lastCorrection = null;
let lastIntent = null;
function visibleProducts() {
  const { list: found, corrected, intent, understood } = smartSearch(query);
  lastCorrection = corrected;
  lastIntent = understood ? intent : null;
  const [lo, hi] = priceFilter === "any" ? [0, Infinity]
    : priceFilter.split("-").map((n, i) => (n === "" ? (i ? Infinity : 0) : +n));
  let list = found.filter((p) =>
    (activeCat === "all" || p.cat === activeCat) &&
    p.price >= lo && p.price < hi &&
    p.rating >= minRating);
  // "sasta" / "accha" in the search sorts the results, unless the customer picked a sort themselves
  const sortNow = sortBy === "featured" && intent.sort ? intent.sort : sortBy;
  if (sortNow === "low") list = [...list].sort((a, b) => effectivePrice(a) - effectivePrice(b));
  if (sortNow === "high") list = [...list].sort((a, b) => effectivePrice(b) - effectivePrice(a));
  if (sortNow === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
  if (sortBy === "discount") list = [...list].sort((a, b) => discountPct(b) - discountPct(a));
  return list;
}

const isWished = (id) => wishlist.includes(id);
function heartHTML(p) {
  const on = isWished(p.id);
  return `<button class="heart ${on ? "on" : ""}" data-wish="${p.id}" aria-pressed="${on}"
    aria-label="${on ? "Remove from" : "Add to"} wishlist: ${escapeHTML(p.name)}"
    title="${on ? "Remove from wishlist" : "Add to wishlist"}">${icon("heart")}</button>`;
}

// Small card used in "Recently viewed" and "You may also like"
function miniCardHTML(p) {
  return `<a class="mini-card" href="#p/${p.id}">
    <span class="mini-tile">${pic(p)}</span>
    <span class="mini-body">
      <span class="mini-name">${escapeHTML(p.name)}</span>
      <span class="mini-price">${rupees(p.price)}<s>${rupees(p.mrp)}</s></span>
    </span>
  </a>`;
}

function actionHTML(p) {
  const qty = cart[p.id] || 0;
  const buy = `<button class="btn btn-outline full" data-buy="${p.id}">⚡ ${L("Buy now", "अभी खरीदें")}</button>`;
  if (!qty) return `<button class="btn btn-primary full" data-add="${p.id}">${L("Add to cart", "कार्ट में डालें")}</button>${buy}`;
  return `<div class="stepper">
      <button data-dec="${p.id}" aria-label="Remove one ${p.name}">−</button>
      <span>${isEasy() ? `कार्ट में ${qty}` : `${qty} in cart`}</span>
      <button data-inc="${p.id}" aria-label="Add one more ${p.name}">+</button>
    </div>${buy}`;
}

const escapeHTML = (s) => s.replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Honest badges, worked out from real product data (no made-up "bestseller" claims)
const NEWEST_ORIGINAL_ID = 31; // products added after the first 31 count as "New"
function badgeFor(p) {
  if (p.rating >= 4.6) return `<span class="card-badge b-top">★ Top rated</span>`;
  if (discountPct(p) >= 45) return `<span class="card-badge b-value">Great value</span>`;
  if (p.id > NEWEST_ORIGINAL_ID) return `<span class="card-badge b-new">New</span>`;
  return "";
}

// One product card (used in the grid and in the homepage rows)
function cardHTML(p) {
  const off = discountPct(p);
  const pay = effectivePrice(p);
  return `<article class="card">
    ${heartHTML(p)}
    <button class="speak" data-speak="${p.id}" aria-label="Read aloud: ${escapeHTML(p.name)}" title="सुनें / Listen">🔊</button>
    <a class="tile" href="#p/${p.id}" tabindex="-1" aria-hidden="true">${pic(p)}${off > 0 ? `<span class="off">${off}% OFF</span>` : ""}</a>
    <div class="card-body">
      <div class="card-meta"><span class="card-cat">${catName(p.cat)}</span>${badgeFor(p)}</div>
      <h3><a href="#p/${p.id}">${escapeHTML(p.name)}</a></h3>
      <span class="rating"><b>★</b> ${p.rating.toFixed(1)}</span>
      <div class="price"><strong>${rupees(pay)}</strong><s>${rupees(p.mrp)}</s>${pay < p.price ? `<span class="bargain-tag">🤝 bargained</span>` : ""}</div>
      <div class="card-action" data-action-slot="${p.id}">${actionHTML(p)}</div>
    </div>
  </article>`;
}

// ===== HOMEPAGE ROWS + "SHOW MORE" =====
const PAGE_SIZE = 12;
let shownCount = PAGE_SIZE;
let lastListKey = "";
const isHomeView = () => !query.trim() && activeCat === "all" && priceFilter === "any" && !minRating && sortBy === "featured";

const HOME_ROWS = [
  { title: "New arrivals", pick: () => PRODUCTS.filter((p) => p.id > NEWEST_ORIGINAL_ID).slice().reverse().slice(0, 10) },
  { title: "Top rated", view: "toprated", pick: () => PRODUCTS.slice().sort((a, b) => b.rating - a.rating).slice(0, 10) },
  { title: "Biggest discounts", view: "discount", pick: () => PRODUCTS.slice().sort((a, b) => discountPct(b) - discountPct(a)).slice(0, 10) },
  { title: "Under ₹499", view: "under499", pick: () => PRODUCTS.filter((p) => effectivePrice(p) < 500).sort((a, b) => b.rating - a.rating).slice(0, 10) },
];
function renderHomeSections() {
  const home = isHomeView();
  $("homeSections").hidden = !home;
  document.querySelectorAll(".home-only").forEach((el) => { el.hidden = !home; });
  if (!home) { $("homeSections").innerHTML = ""; return; }
  $("homeSections").innerHTML = HOME_ROWS.map((row) => `
    <section class="home-row" aria-label="${row.title}">
      <div class="section-head"><h2>${row.title}</h2>
        ${row.view ? `<button class="link-btn" data-view="${row.view}">View all →</button>` : ""}</div>
      <div class="row-strip">${row.pick().map(cardHTML).join("")}</div>
    </section>`).join("");
}

// Promo banners, price tiles and "View all" links all jump to a filtered product list
function applyView(view) {
  resetFilters(false);
  if (view === "discount") { sortBy = "discount"; $("sort").value = "discount"; }
  if (view === "toprated") { sortBy = "rating"; $("sort").value = "rating"; minRating = 4; $("ratingFilter").checked = true; }
  if (view === "grocery") { activeCat = "grocery"; renderCategories(); }
  if (view === "under499") { priceFilter = "0-500"; $("priceFilter").value = "0-500"; }
  if (/^\d*-\d*$/.test(view)) { priceFilter = view; $("priceFilter").value = view; }
  renderProducts();
  const top = $("allProductsHead").getBoundingClientRect().top + scrollY - 90;
  scrollTo({ top, behavior: "smooth" });
}
document.addEventListener("click", (e) => {
  const v = e.target.closest("[data-view],[data-promo],[data-price]");
  if (v) applyView(v.dataset.view || v.dataset.promo || v.dataset.price);
});
$("loadMore").addEventListener("click", () => {
  shownCount += PAGE_SIZE;
  renderProducts();
});

// ===== HERO COLLAGE =====
const HERO_PICKS = [38, 1, 29, 3, 51, 21]; // product ids shown floating in the hero
function renderHeroCollage() {
  $("heroCollage").innerHTML = HERO_PICKS.map(findProduct).filter(Boolean).map((p, i) => `
    <a class="collage-card c${i + 1}" href="#p/${p.id}" aria-label="${escapeHTML(p.name)}, ${rupees(effectivePrice(p))}">
      <span class="collage-art">${pic(p)}</span>
      <span class="collage-name">${escapeHTML(p.name)}</span>
      <span class="collage-price">${rupees(effectivePrice(p))}${discountPct(p) > 0 ? ` <em>${discountPct(p)}% off</em>` : ""}</span>
    </a>`).join("");
}

// Heading above the product list, e.g. "Groceries · Under ₹500" or "Top rated"
function listTitle(home) {
  if (home) return "All products";
  if (query.trim()) return "Search results";
  const sortLabel = { discount: "Biggest discounts", rating: "Top rated", low: "Lowest price first", high: "Highest price first" }[sortBy];
  const base = activeCat !== "all" ? catName(activeCat) : sortLabel || (minRating ? "Rated 4★ & up" : "");
  const priceLabel = priceFilter !== "any" ? $("priceFilter").selectedOptions[0].textContent : "";
  return [base, priceLabel].filter(Boolean).join(" · ") || "All products";
}

function renderProducts() {
  const all = visibleProducts();
  // Start again from the first page whenever the search, filters or sort change
  const key = [query, activeCat, priceFilter, minRating, sortBy].join("|");
  if (key !== lastListKey) { shownCount = PAGE_SIZE; lastListKey = key; }
  const list = all.slice(0, shownCount);
  renderHomeSections();
  const home = isHomeView();
  $("allProductsTitle").textContent = listTitle(home);
  const left = all.length - list.length;
  $("loadMoreRow").hidden = left <= 0;
  $("loadMoreInfo").textContent = `Showing ${list.length} of ${all.length}`;
  $("loadMore").textContent = `Show ${Math.min(PAGE_SIZE, left)} more`;
  const count = `${all.length} product${all.length === 1 ? "" : "s"}` +
    (activeCat === "all" ? "" : ` in ${catName(activeCat)}`);
  $("resultCount").innerHTML = lastIntent
    ? `<span class="did-you-mean">${count}: <b>${escapeHTML(describeIntent(lastIntent, lastCorrection))}</b></span>`
    : lastCorrection
      ? `<span class="did-you-mean">${count} for <b>${escapeHTML(lastCorrection)}</b> (you typed “${escapeHTML(query.trim())}”)</span>`
      : count;
  $("noResults").hidden = list.length > 0;
  $("noResults").hidden = all.length > 0;
  $("productGrid").innerHTML = list.map(cardHTML).join("");
  renderRecent();
  document.dispatchEvent(new CustomEvent("products:rendered"));
}

function resetFilters(render = true) {
  activeCat = "all"; query = ""; $("search").value = "";
  priceFilter = "any"; $("priceFilter").value = "any";
  minRating = 0; $("ratingFilter").checked = false;
  sortBy = "featured"; $("sort").value = "featured";
  hideSuggestions();
  renderCategories();
  if (render) renderProducts();
}

$("sort").addEventListener("change", (e) => { sortBy = e.target.value; renderProducts(); });
$("priceFilter").addEventListener("change", (e) => { priceFilter = e.target.value; renderProducts(); });
$("ratingFilter").addEventListener("change", (e) => { minRating = e.target.checked ? 4 : 0; renderProducts(); });
$("clearFilters").addEventListener("click", () => resetFilters());
$("heroShop").addEventListener("click", () => {
  const top = $("categories").getBoundingClientRect().top + scrollY - 80;
  scrollTo({ top, behavior: "smooth" });
});
$("logo").addEventListener("click", (e) => {
  e.preventDefault();
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  productDepth = 0; landedOnProduct = false;
  closeProductView();
  resetFilters();
  scrollTo({ top: 0, behavior: "smooth" });
});

// ===== RECENTLY VIEWED =====
function renderRecent() {
  const items = recent.map(findProduct).filter(Boolean);
  // Only on the main listing, so it doesn't push search results down
  const browsing = !query.trim() && activeCat === "all" && priceFilter === "any" && !minRating;
  $("recentSection").hidden = !items.length || !browsing;
  $("recentStrip").innerHTML = items.map(miniCardHTML).join("");
}
function addRecent(id) {
  recent = [id, ...recent.filter((x) => x !== id)].slice(0, 10);
  store("shopeasy-recent", recent);
}
$("clearRecent").addEventListener("click", () => {
  recent = [];
  store("shopeasy-recent", recent);
  renderRecent();
});

// ===== DEAL OF THE DAY =====
// Picks one big-discount product per day (same for everyone that day), with a countdown to midnight
function dealProduct() {
  const pool = PRODUCTS.filter((p) => discountPct(p) >= 40);
  const d = new Date();
  const dayNumber = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
  return pool[dayNumber % pool.length];
}
function renderDeal() {
  const p = dealProduct();
  if (!p) return;
  $("deal").href = `#p/${p.id}`;
  $("deal").setAttribute("aria-label", `Deal of the Day: ${p.name}, ${rupees(p.price)}`);
  $("deal").innerHTML = `
    <span class="deal-icon">${pic(p)}</span>
    <span class="deal-info">
      <span class="deal-tag">⚡ Deal of the Day</span>
      <strong>${escapeHTML(p.name)}</strong>
      <span><b>${rupees(p.price)}</b> <s>${rupees(p.mrp)}</s><span class="save">${discountPct(p)}% OFF</span></span>
    </span>
    <span class="deal-timer"><small>Ends in</small><b id="dealTimer">--:--:--</b></span>
    <span class="btn btn-primary deal-cta">View deal</span>`;
  tickDeal();
}
function tickDeal() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const s = Math.max(0, Math.floor((midnight - now) / 1000));
  const pad = (n) => String(n).padStart(2, "0");
  const el = $("dealTimer");
  if (el) el.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  if (s === 0) setTimeout(renderDeal, 1000); // new day, new deal
}
setInterval(tickDeal, 1000);

// ===== PRODUCT PAGE =====
// Each product has its own link (#p/12), so it can be shared and the Back button closes it.
let productOpen = null;
let productDepth = 0;      // how many product pages deep the customer has clicked from the list
let landedOnProduct = false; // true when the site was opened straight from a shared product link

function deliveryText(p) {
  const days = (CATEGORY_INFO[p.cat] || {}).deliveryDays || [3, 5];
  const by = new Date();
  by.setDate(by.getDate() + days[1]);
  const date = by.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const free = p.price >= FREE_DELIVERY_ABOVE;
  return `🚚 <b>${free ? "FREE delivery" : "Delivery"}</b> by <b>${date}</b>
    <small>${free ? "This item ships free." : `₹${DELIVERY_FEE} delivery, or FREE on orders above ${rupees(FREE_DELIVERY_ABOVE)}.`} Cash on Delivery available.</small>`;
}

function renderProductView(p) {
  const info = CATEGORY_INFO[p.cat] || { highlights: [] };
  const off = discountPct(p);
  const similar = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id)
    .sort((a, b) => b.rating - a.rating).slice(0, 6);
  const shareText = `Check out ${p.name} for just ${rupees(p.price)} (${off}% off) on ShopEasy! ${location.href}`;
  $("pdCrumb").textContent = `${catName(p.cat)} › ${p.name}`;
  $("pdBody").innerHTML = `
    <div class="pd-grid">
      <div class="pd-tile">${pic(p)}${off > 0 ? `<span class="off">${off}% OFF</span>` : ""}${heartHTML(p)}
        <button class="speak" data-speak="${p.id}" aria-label="Read aloud: ${escapeHTML(p.name)}" title="सुनें / Listen">🔊</button></div>
      <div class="pd-info">
        <span class="card-cat">${catName(p.cat)}</span>
        <h2 id="pdName">${escapeHTML(p.name)}</h2>
        <span class="rating"><b>★</b> ${p.rating.toFixed(1)} rating</span>
        <div class="pd-price">
          <strong id="pdPrice">${rupees(effectivePrice(p))}</strong><s>${rupees(p.mrp)}</s>
          <span class="save" id="pdSave">You save ${rupees(p.mrp - effectivePrice(p))} (${Math.round((1 - effectivePrice(p) / p.mrp) * 100)}%)</span>
        </div>
        <p class="hint">Inclusive of all taxes</p>
        <p class="pd-desc">${escapeHTML(p.desc || info.desc || "")}</p>
        <ul class="pd-highlights">${info.highlights.map((h) => `<li>${escapeHTML(h)}</li>`).join("")}</ul>
        <div class="pd-delivery">${deliveryText(p)}</div>
        <div class="card-action" data-action-slot="${p.id}">${actionHTML(p)}</div>
        <div id="bargainSlot"></div>
        <div class="pd-extra">
          <button class="btn btn-ghost ${isWished(p.id) ? "on" : ""}" data-wish="${p.id}" data-wish-label>${icon("heart")} ${isWished(p.id) ? "Wishlisted" : "Add to wishlist"}</button>
          <a class="btn btn-ghost" href="https://wa.me/?text=${encodeURIComponent(shareText)}" target="_blank" rel="noopener">${icon("chat")} Share on WhatsApp</a>
        </div>
      </div>
    </div>
    ${similar.length ? `<section class="pd-similar"><h3>You may also like</h3>
      <div class="strip">${similar.map(miniCardHTML).join("")}</div></section>` : ""}
    <div class="pd-sticky">
      <div class="pd-sticky-price"><b id="pdStickyPrice">${rupees(effectivePrice(p))}</b><s>${rupees(p.mrp)}</s></div>
      <div class="card-action" data-action-slot="${p.id}">${actionHTML(p)}</div>
    </div>`;
}

function openProductView(id) {
  const p = findProduct(id);
  if (!p) return closeProductView();
  productOpen = id;
  renderProductView(p);
  document.dispatchEvent(new CustomEvent("product:view", { detail: p }));
  addRecent(id);
  closeDrawers();
  $("productModal").classList.add("open");
  $("productModal").scrollTop = 0;
  document.body.style.overflow = "hidden";
  document.title = `${p.name} — ShopEasy`;
  $("closeProduct").focus();
}

function closeProductView() {
  if (productOpen === null) return;
  productOpen = null;
  $("productModal").classList.remove("open");
  if (!$("checkoutModal").classList.contains("open")) document.body.style.overflow = "";
  document.title = "ShopEasy — Quality you can trust. Prices you’ll love.";
  renderRecent();
}

// Close button / Escape / clicking outside: step back to the product list
function leaveProductView() {
  if (productDepth > 0 && !landedOnProduct) history.go(-productDepth);
  else {
    history.replaceState(null, "", location.pathname + location.search);
    landedOnProduct = false;
    productDepth = 0;
    closeProductView();
  }
}

const productIdInHash = () => { const m = /^#p\/(\d+)$/.exec(location.hash); return m ? +m[1] : null; };
function route() {
  const id = productIdInHash();
  if (id !== null) openProductView(id);
  else closeProductView();
}
addEventListener("hashchange", () => {
  if (productIdInHash() !== null) {
    // Back/Forward brings its saved depth; a fresh click goes one level deeper
    if (history.state && typeof history.state.pd === "number") productDepth = history.state.pd;
    else { productDepth += 1; history.replaceState({ pd: productDepth }, ""); }
  } else {
    productDepth = 0;
    landedOnProduct = false;
  }
  route();
});
$("closeProduct").addEventListener("click", leaveProductView);
$("productModal").addEventListener("click", (e) => { if (e.target.id === "productModal") leaveProductView(); });

// ===== SEARCH SUGGESTIONS =====
let suggestionIndex = -1;

// Bold the part of the name that matches what was typed
function highlight(name, qWords) {
  let html = escapeHTML(name);
  qWords.forEach((w) => {
    if (w.length < 2) return;
    html = html.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"), "<mark>$1</mark>");
  });
  return html;
}

function showSuggestions() {
  const text = query.trim();
  const box = $("suggestions");
  if (!text) return hideSuggestions();
  const { list: rawList, corrected, intent, understood } = smartSearch(text);
  const list = intent.sort === "low" ? [...rawList].sort((a, b) => effectivePrice(a) - effectivePrice(b))
    : intent.sort === "rating" ? [...rawList].sort((a, b) => b.rating - a.rating) : rawList;
  const qWords = words(corrected || intent.text);
  const cats = qWords.length && !intent.gift ? CATEGORIES.filter((c) => c.id !== "all" &&
    qWords.every((w) => words(c.name).some((cw) => cw.startsWith(w)))) : [];
  let html = "";
  if (understood) html += `<li class="s-note">Showing <b>${escapeHTML(describeIntent(intent, corrected))}</b></li>`;
  else if (corrected) html += `<li class="s-note">Showing results for <b>${escapeHTML(corrected)}</b></li>`;
  if (cats.length) {
    html += `<li class="s-head">Categories</li>`;
    html += cats.map((c) => `<li role="option" data-sugg-cat="${c.id}">
      <span class="s-icon">${c.icon}</span><span class="s-name">${highlight(c.name, qWords)}</span>
      <span class="s-meta">Category</span></li>`).join("");
  }
  if (list.length) {
    html += `<li class="s-head">Products</li>`;
    html += list.slice(0, 6).map((p) => `<li role="option" data-sugg-product="${p.id}">
      <span class="s-icon">${pic(p)}</span><span class="s-name">${highlight(p.name, qWords)}</span>
      <span class="s-price">${rupees(effectivePrice(p))}</span></li>`).join("");
  }
  if (!html) html = `<li class="s-note">No matches for <b>${escapeHTML(text)}</b></li>`;
  box.innerHTML = html;
  box.hidden = false;
  suggestionIndex = -1;
  $("search").setAttribute("aria-expanded", "true");
}

function hideSuggestions() {
  $("suggestions").hidden = true;
  $("search").setAttribute("aria-expanded", "false");
  suggestionIndex = -1;
}

function pickSuggestion(li) {
  if (li.dataset.suggCat) {
    activeCat = li.dataset.suggCat;
    query = ""; $("search").value = "";
    renderCategories();
  } else if (li.dataset.suggProduct) {
    query = findProduct(+li.dataset.suggProduct).name;
    $("search").value = query;
  }
  hideSuggestions();
  renderProducts();
  $("categories").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("search").addEventListener("input", (e) => {
  query = e.target.value;
  renderProducts();
  showSuggestions();
});
$("search").addEventListener("focus", showSuggestions);
$("search").addEventListener("blur", () => setTimeout(hideSuggestions, 150));
$("search").addEventListener("keydown", (e) => {
  const options = [...$("suggestions").querySelectorAll('[role="option"]')];
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    if ($("suggestions").hidden) showSuggestions();
    if (!options.length) return;
    e.preventDefault();
    suggestionIndex = (suggestionIndex + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options.forEach((o, i) => o.classList.toggle("active", i === suggestionIndex));
    options[suggestionIndex].scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (suggestionIndex >= 0 && options[suggestionIndex]) pickSuggestion(options[suggestionIndex]);
    else hideSuggestions();
  } else if (e.key === "Escape") {
    hideSuggestions();
  }
});
$("suggestions").addEventListener("mousedown", (e) => e.preventDefault()); // keep focus in the box
$("suggestions").addEventListener("click", (e) => {
  const li = e.target.closest('[role="option"]');
  if (li) pickSuggestion(li);
});

// ===== VOICE SEARCH (browser's built-in speech recognition) =====
const speechSupported = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
let recognition = null;

function stopListening() {
  $("micBtn").classList.remove("listening");
  $("micBtn").setAttribute("aria-label", "Search by voice");
  $("search").placeholder = "Search products...";
  recognition = null;
}

$("micBtn").hidden = !speechSupported();
$("micBtn").addEventListener("click", () => {
  if (recognition) { recognition.stop(); return; }
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Speech) return toast("Voice search isn't supported in this browser");
  recognition = new Speech();
  recognition.lang = "en-IN";
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (e) => {
    const said = [...e.results].map((r) => r[0].transcript).join(" ")
      .replace(/[.?!,]+$/g, "").trim();
    $("search").value = query = said;
    renderProducts();
    if (e.results[e.results.length - 1].isFinal) {
      $("search").focus();
      showSuggestions();
    }
  };
  recognition.onerror = (e) => {
    const messages = {
      "not-allowed": "Microphone access was blocked. Allow it in your browser to use voice search.",
      "service-not-allowed": "Microphone access was blocked. Allow it in your browser to use voice search.",
      "no-speech": "Didn't hear anything. Tap 🎤 and try again.",
      "network": "Voice search needs an internet connection.",
      "audio-capture": "No microphone found.",
    };
    if (e.error !== "aborted") toast(messages[e.error] || "Voice search stopped. Please try again.");
  };
  recognition.onend = stopListening;

  try {
    recognition.start();
    $("micBtn").classList.add("listening");
    $("micBtn").setAttribute("aria-label", "Stop listening");
    $("search").placeholder = "Listening… say a product name";
  } catch (err) {
    stopListening();
    toast("Couldn't start voice search. Please try again.");
  }
});

// ===== CART LOGIC =====
function changeQty(id, delta) {
  const p = findProduct(id);
  const before = cart[id] || 0;
  const next = before + delta;
  if (next <= 0) delete cart[id];
  else cart[id] = Math.min(next, 10); // max 10 of one item
  if (delta > 0 && next > 10) toast("Maximum 10 of one item");
  else if (delta > 0 && next === 1) toast(`${p.name} added to cart`);
  else if (next <= 0 && before > 0) {
    lastRemoved = { from: "cart", id, qty: before };
    toast(`${p.name} removed from cart`, { label: "Undo", fn: undoRemove });
  }
  saveCart();
  updateCartUI();
}

function saveForLater(id) {
  if (!cart[id]) return;
  saved[id] = cart[id];
  delete cart[id];
  toast(`${findProduct(id).name} saved for later`);
  saveCart();
  updateCartUI();
}

function moveToCart(id) {
  if (!saved[id]) return;
  cart[id] = Math.min((cart[id] || 0) + saved[id], 10);
  delete saved[id];
  toast(`${findProduct(id).name} moved to cart`);
  saveCart();
  updateCartUI();
}

function removeSaved(id) {
  if (!saved[id]) return;
  lastRemoved = { from: "saved", id, qty: saved[id] };
  delete saved[id];
  toast(`${findProduct(id).name} removed from saved items`, { label: "Undo", fn: undoRemove });
  saveCart();
  updateCartUI();
}

function undoRemove() {
  if (!lastRemoved) return;
  const { from, id, qty } = lastRemoved;
  if (from === "cart") cart[id] = Math.min((cart[id] || 0) + qty, 10);
  else saved[id] = qty;
  lastRemoved = null;
  toast(`${findProduct(id).name} is back in your ${from === "cart" ? "cart" : "saved items"}`);
  saveCart();
  updateCartUI();
}

// ===== COUPONS =====
const findCoupon = (code) => COUPONS.find((c) => c.code === String(code || "").trim().toUpperCase());

// What a coupon is worth on a given subtotal: { discount, freeShip, shortBy }
function couponValue(c, subtotal) {
  if (!c) return { discount: 0, freeShip: false, shortBy: 0 };
  if (subtotal < c.min) return { discount: 0, freeShip: false, shortBy: c.min - subtotal };
  if (c.type === "percent") return { discount: Math.min(Math.round(subtotal * c.value / 100), c.max || Infinity), freeShip: false, shortBy: 0 };
  if (c.type === "flat") return { discount: Math.min(c.value, subtotal), freeShip: false, shortBy: 0 };
  return { discount: 0, freeShip: true, shortBy: 0 };
}

function applyCoupon(code) {
  const c = findCoupon(code);
  $("couponMsg").textContent = "";
  if (!String(code || "").trim()) { $("couponMsg").textContent = "Please enter a coupon code."; return; }
  if (!c) { $("couponMsg").textContent = `“${String(code).trim().toUpperCase()}” isn't a valid coupon.`; return; }
  const v = couponValue(c, cartTotals(cart, null).subtotal);
  if (v.shortBy) { $("couponMsg").textContent = `Add ${rupees(v.shortBy)} more to use ${c.code}.`; return; }
  coupon = c.code;
  $("couponInput").value = "";
  toast(`🎉 ${c.code} applied!`);
  saveCart();
  updateCartUI();
}
function removeCoupon() {
  coupon = null;
  $("couponMsg").textContent = "";
  saveCart();
  updateCartUI();
}
$("couponForm").addEventListener("submit", (e) => { e.preventDefault(); applyCoupon($("couponInput").value); });

function renderCoupons(t) {
  const c = findCoupon(coupon);
  $("couponApplied").hidden = !c;
  $("couponForm").hidden = !!c;
  if (c) {
    const saving = t.couponDiscount ? `You save ${rupees(t.couponDiscount)}` : t.couponFreeShip ? "Free delivery" : "";
    $("couponApplied").innerHTML = `🏷️ <b>${c.code}</b> applied <span>${saving}</span>
      <button class="link-btn" data-remove-coupon>Remove</button>
      ${t.couponShortBy ? `<span class="warn">Add ${rupees(t.couponShortBy)} more for this coupon to work.</span>` : ""}`;
  }
  $("couponList").innerHTML = COUPONS.filter((x) => x.code !== coupon).map((x) => `
    <div class="coupon-chip"><code>${x.code}</code><span>${escapeHTML(x.text)}</span>
      <button class="link-btn" data-apply-coupon="${x.code}">Apply</button></div>`).join("");
}

// ===== WISHLIST =====
function toggleWish(id) {
  const p = findProduct(id);
  if (!p) return;
  if (isWished(id)) {
    wishlist = wishlist.filter((x) => x !== id);
    toast(`${p.name} removed from wishlist`);
  } else {
    wishlist = [id, ...wishlist];
    toast(`❤️ ${p.name} added to wishlist`);
  }
  store("shopeasy-wishlist", wishlist);
  updateWishUI();
}
function wishToCart(id) {
  wishlist = wishlist.filter((x) => x !== id);
  store("shopeasy-wishlist", wishlist);
  if (!cart[id]) changeQty(id, 1); // shows "added to cart"
  else toast(`${findProduct(id).name} is already in your cart`);
  updateWishUI();
}
function updateWishUI() {
  const items = wishlist.map(findProduct).filter(Boolean);
  $("wishCount").hidden = !items.length;
  $("wishCount").textContent = items.length;
  $("wishBtn").classList.toggle("has-items", items.length > 0);
  $("navWish").classList.toggle("has-items", items.length > 0);
  setNavBadge("navWishCount", items.length);
  // refresh every heart on the page
  document.querySelectorAll("[data-wish]").forEach((b) => {
    const id = +b.dataset.wish, on = isWished(id), name = findProduct(id).name;
    if (b.hasAttribute("data-wish-label")) { b.classList.toggle("on", on); b.innerHTML = `${icon("heart")} ${on ? "Wishlisted" : "Add to wishlist"}`; return; }
    if (b.hasAttribute("data-wish-remove")) return;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
    b.setAttribute("aria-label", `${on ? "Remove from" : "Add to"} wishlist: ${name}`);
    b.title = on ? "Remove from wishlist" : "Add to wishlist";
  });
  $("wishEmpty").style.display = items.length ? "none" : "grid";
  $("wishItems").style.display = items.length ? "block" : "none";
  $("wishItems").innerHTML = items.map((p) => `<div class="cart-item">
      <a class="thumb" href="#p/${p.id}" style="text-decoration:none">${pic(p)}</a>
      <div>
        <h4>${escapeHTML(p.name)}</h4>
        <div class="unit">${rupees(p.price)} <s>${rupees(p.mrp)}</s> · <span class="save">${discountPct(p)}% OFF</span></div>
        <div class="controls">
          ${cart[p.id] ? `<span class="save">In cart ✓</span>` : `<button class="link-btn" data-wish-cart="${p.id}">Move to cart</button>`}
          <button class="remove" data-wish="${p.id}" data-wish-remove>Remove</button>
        </div>
      </div>
      <div class="line-total">${rupees(p.price)}</div>
    </div>`).join("");
}

function cartTotals(items = cart, code = coupon) {
  let subtotal = 0, mrpTotal = 0, count = 0;
  for (const [id, qty] of Object.entries(items)) {
    const p = findProduct(+id);
    if (!p) continue;
    subtotal += effectivePrice(p) * qty;
    mrpTotal += p.mrp * qty;
    count += qty;
  }
  const baseDelivery = subtotal === 0 || subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const cv = couponValue(findCoupon(code), subtotal);
  const delivery = cv.freeShip ? 0 : baseDelivery;
  return {
    subtotal, savings: mrpTotal - subtotal, delivery, count,
    couponDiscount: cv.discount, couponFreeShip: cv.freeShip && baseDelivery > 0, couponShortBy: cv.shortBy,
    total: subtotal - cv.discount + delivery,
  };
}

function updateCartUI() {
  const t = cartTotals();

  // header badge
  const badge = $("cartCount");
  if (badge.textContent !== String(t.count)) {
    badge.textContent = t.count;
    badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump");
  }
  setNavBadge("navCartCount", t.count);

  // Add-to-cart buttons on product cards and the product page
  document.querySelectorAll("[data-action-slot]").forEach((slot) => {
    slot.innerHTML = actionHTML(findProduct(+slot.dataset.actionSlot));
  });

  // drawer list
  const entries = Object.entries(cart).filter(([id]) => findProduct(+id));
  $("cartItems").innerHTML = entries.map(([id, qty]) => {
    const p = findProduct(+id);
    return `<div class="cart-item">
      <div class="thumb">${pic(p)}</div>
      <div>
        <h4>${p.name}</h4>
        <div class="unit">${rupees(effectivePrice(p))} each${effectivePrice(p) < p.price ? ` <span class="bargain-tag">🤝 bargained</span>` : ""}</div>
        <div class="controls">
          <div class="stepper small">
            <button data-dec="${p.id}" aria-label="Remove one ${p.name}">−</button>
            <span>${qty}</span>
            <button data-inc="${p.id}" aria-label="Add one more ${p.name}">+</button>
          </div>
          <button class="link-btn" data-save="${p.id}">Save for later</button>
          <button class="remove" data-remove="${p.id}">Remove</button>
        </div>
      </div>
      <div class="line-total">${rupees(effectivePrice(p) * qty)}</div>
    </div>`;
  }).join("");

  // saved for later list
  const savedEntries = Object.entries(saved).filter(([id]) => findProduct(+id));
  $("savedSection").hidden = savedEntries.length === 0;
  $("savedCount").textContent = savedEntries.length;
  $("savedItems").innerHTML = savedEntries.map(([id, qty]) => {
    const p = findProduct(+id);
    return `<div class="cart-item">
      <div class="thumb">${pic(p)}</div>
      <div>
        <h4>${p.name}</h4>
        <div class="unit">${rupees(p.price)} each · Qty ${qty}</div>
        <div class="controls">
          <button class="link-btn" data-move="${p.id}">Move to cart</button>
          <button class="remove" data-unsave="${p.id}">Remove</button>
        </div>
      </div>
      <div class="line-total">${rupees(p.price * qty)}</div>
    </div>`;
  }).join("");

  const empty = entries.length === 0;
  $("cartEmpty").style.display = empty ? "grid" : "none";
  $("cartItems").style.display = empty ? "none" : "block";
  $("cartSummary").style.display = empty ? "none" : "grid";
  $("couponSection").hidden = empty;

  $("subtotal").textContent = rupees(t.subtotal);
  $("savings").textContent = "− " + rupees(t.savings);
  $("discountLine").hidden = !t.couponDiscount;
  $("discountLabel").textContent = `Coupon (${coupon || ""})`;
  $("discount").textContent = "− " + rupees(t.couponDiscount);
  $("delivery").textContent = t.delivery ? rupees(t.delivery) : "FREE";
  $("total").textContent = rupees(t.total);
  if (!checkoutItems) renderCheckoutSummary();
  const freeAnyway = !t.delivery;
  $("deliveryHint").textContent = freeAnyway
    ? "🎉 You get FREE delivery!"
    : `Add ${rupees(FREE_DELIVERY_ABOVE - t.subtotal)} more for FREE delivery.`;
  $("deliveryBar").style.width = (freeAnyway ? 100 : Math.min(100, t.subtotal / FREE_DELIVERY_ABOVE * 100)) + "%";
  renderCoupons(t);
  updateWishUI(); // "Move to cart" / "In cart ✓" labels
  $("shareCartRow").hidden = empty;
  document.dispatchEvent(new CustomEvent("cart:updated"));
}

// ===== FLY-TO-CART ANIMATION =====
// A little copy of the product picture flies from the card into the cart button
function flyToCart(fromEl, id) {
  const p = findProduct(id);
  if (!p || matchMedia("(prefers-reduced-motion: reduce)").matches || !Element.prototype.animate) return;
  const source = fromEl.closest(".card, .pd-box, .pd-sticky");
  const pic = source && (source.querySelector(".tile, .pd-tile") || source);
  const navCart = $("navCart");
  const target = navCart && getComputedStyle(navCart.parentElement).display !== "none" ? navCart : $("cartBtn");
  if (!pic || !target) return;
  const a = (pic.closest(".pd-sticky") ? fromEl : pic).getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const fly = document.createElement("span");
  fly.className = "fly-item";
  fly.textContent = p.icon;
  fly.style.left = `${a.left + a.width / 2 - 24}px`;
  fly.style.top = `${a.top + a.height / 2 - 24}px`;
  document.body.appendChild(fly);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  fly.animate([
    { transform: "translate(0, 0) scale(1)", opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(.8)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0.2 },
  ], { duration: 700, easing: "cubic-bezier(.5, 0, .3, 1)" }).onfinish = () => {
    fly.remove();
    target.classList.remove("cart-pulse"); void target.offsetWidth; target.classList.add("cart-pulse");
  };
}

// One click handler for every cart-related button on the page
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-add],[data-inc],[data-dec],[data-remove],[data-buy],[data-save],[data-move],[data-unsave]," +
    "[data-wish],[data-wish-cart],[data-apply-coupon],[data-remove-coupon]");
  if (!b) return;
  const d = b.dataset;
  if (d.add) flyToCart(b, +d.add);
  if (d.wish) toggleWish(+d.wish);
  if (d.wishCart) wishToCart(+d.wishCart);
  if (d.applyCoupon) applyCoupon(d.applyCoupon);
  if (b.hasAttribute("data-remove-coupon")) removeCoupon();
  if (d.add) changeQty(+d.add, 1);
  if (d.inc) changeQty(+d.inc, 1);
  if (d.dec) changeQty(+d.dec, -1);
  if (d.remove) changeQty(+d.remove, -(cart[d.remove] || 0));
  if (d.buy) openCheckout({ [d.buy]: 1 });
  if (d.save) saveForLater(+d.save);
  if (d.move) moveToCart(+d.move);
  if (d.unsave) removeSaved(+d.unsave);
});

// ===== DRAWER OPEN / CLOSE =====
// Only one drawer (cart, wishlist, orders) is open at a time
function openDrawer(id) {
  closeDrawers();
  $(id).classList.add("open");
  $("overlay").classList.add("show");
  syncBottomNav();
}
function closeDrawers() {
  document.querySelectorAll(".drawer.open").forEach((d) => d.classList.remove("open"));
  $("overlay").classList.remove("show");
  syncBottomNav();
}
const openCart = () => openDrawer("cartDrawer");
const openWish = () => openDrawer("wishDrawer");
const openOrders = () => { renderOrders(); openDrawer("ordersDrawer"); };
const closeCart = closeDrawers, closeWish = closeDrawers;
$("cartBtn").addEventListener("click", openCart);
$("closeCart").addEventListener("click", closeDrawers);
$("wishBtn").addEventListener("click", openWish);
$("closeWish").addEventListener("click", closeDrawers);
$("ordersBtn").addEventListener("click", openOrders);
$("closeOrders").addEventListener("click", closeDrawers);
$("footerOrders").addEventListener("click", openOrders);
$("ordersShop").addEventListener("click", closeDrawers);
$("overlay").addEventListener("click", closeDrawers);
$("continueShopping").addEventListener("click", closeDrawers);

// ===== PHONE BOTTOM MENU =====
function syncBottomNav() {
  const openId = (document.querySelector(".drawer.open") || {}).id;
  const active = { cartDrawer: "navCart", wishDrawer: "navWish", ordersDrawer: "navOrders" }[openId] || "navHome";
  ["navHome", "navSearch", "navOrders", "navWish", "navCart"].forEach((id) =>
    $(id).classList.toggle("active", id === active));
}
function setNavBadge(id, n) {
  $(id).hidden = !n;
  $(id).textContent = n;
}
$("navHome").addEventListener("click", () => {
  closeDrawers();
  if (productOpen !== null) leaveProductView();
  scrollTo({ top: 0, behavior: "smooth" });
});
$("navSearch").addEventListener("click", () => {
  closeDrawers();
  if (productOpen !== null) leaveProductView();
  scrollTo({ top: 0 });
  $("search").focus();
});
$("navOrders").addEventListener("click", openOrders);
$("navWish").addEventListener("click", openWish);
$("navCart").addEventListener("click", openCart);

// ===== BACK TO TOP =====
addEventListener("scroll", () => { $("toTop").hidden = scrollY < 700; }, { passive: true });
$("toTop").addEventListener("click", () => {
  scrollTo({ top: 0, behavior: "smooth" });
  $("logo").focus({ preventScroll: true });
});

// ===== WHATSAPP CHAT =====
function openChat() {
  const number = String(STORE_WHATSAPP || "").replace(/\D/g, "");
  if (!number) {
    toast("Chat isn't set up yet. Add your WhatsApp number in products.js.");
    return;
  }
  // If they're looking at a product, start the chat about it
  const p = productOpen !== null ? findProduct(productOpen) : null;
  const text = p ? `Hi ShopEasy! I have a question about ${p.name} (${rupees(p.price)}).`
                 : "Hi ShopEasy! I have a question.";
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}
// (the floating chat button opens the shopping assistant: see assistant.js)
$("footerChat").addEventListener("click", openChat);
// Opening a product from the wishlist closes the drawer
$("wishItems").addEventListener("click", (e) => { if (e.target.closest("a")) closeWish(); });

// ===== CHECKOUT =====
// Lists what is being bought: the whole cart, or just the Buy Now item
function renderCheckoutSummary() {
  const items = checkoutItems || cart;
  const t = cartTotals(items);
  const rows = Object.entries(items).filter(([id]) => findProduct(+id)).map(([id, qty]) => {
    const p = findProduct(+id);
    return `<div class="line"><span>${p.icon} ${escapeHTML(p.name)} × ${qty}</span><span>${rupees(effectivePrice(p) * qty)}</span></div>`;
  });
  if (t.couponDiscount) rows.push(`<div class="line"><span>🏷️ Coupon ${coupon}</span><span class="save">− ${rupees(t.couponDiscount)}</span></div>`);
  rows.push(`<div class="line"><span>Delivery</span><span>${t.delivery ? rupees(t.delivery) : "FREE"}</span></div>`);
  $("checkoutList").innerHTML = rows.join("");
  $("payTotal").textContent = rupees(t.total);
}

// ===== SAVED ADDRESS (kept only in this browser, and only if the customer ticks the box) =====
const ADDRESS_FIELDS = ["fullName", "phone", "address", "city", "pin"]; // required
const CONTACT_FIELDS = [...ADDRESS_FIELDS, "email"];                    // plus optional email
function loadAddress() {
  try { return JSON.parse(localStorage.getItem("shopeasy-address")); } catch (e) { return null; }
}
function fillSavedAddress() {
  const a = loadAddress();
  const usable = a && ADDRESS_FIELDS.every((f) => typeof a[f] === "string");
  $("savedAddressNote").hidden = !usable;
  if (!usable) return false;
  CONTACT_FIELDS.forEach((f) => { if (!$(f).value && typeof a[f] === "string") $(f).value = a[f]; });
  $("rememberAddress").checked = true; // keep it saved unless they untick
  return true;
}
$("forgetAddress").addEventListener("click", () => {
  store("shopeasy-address", null);
  CONTACT_FIELDS.forEach((f) => { $(f).value = ""; });
  $("savedAddressNote").hidden = true;
  $("rememberAddress").checked = false;
  toast("Saved address removed from this device");
  $("fullName").focus();
});

function openCheckout(items = null) {
  checkoutItems = items;
  renderCheckoutSummary();
  closeDrawers();
  $("checkoutForm").hidden = false;
  $("orderSuccess").hidden = true;
  $("checkoutModal").classList.add("open");
  document.body.style.overflow = "hidden";
  const filled = fillSavedAddress();
  // With a saved address, jump straight to payment; otherwise start at the name
  (filled ? document.querySelector('input[name="pay"]:checked') : $("fullName")).focus();
}

// ===== MY ORDERS =====
// Orders are saved in this browser. Tracking steps are estimated from the order time and
// delivery days; connect a courier (e.g. Shiprocket) later for real tracking.
const ORDER_STEPS = ["Ordered", "Packed", "Shipped", "Out for delivery", "Delivered"];
const PAY_LABELS = { upi: "UPI", card: "Card", cod: "Cash on Delivery" };
let orders = loadList("shopeasy-orders");

function orderTimeline(o) {
  const placed = new Date(o.date);
  const deliveryDay = new Date(placed);
  deliveryDay.setDate(deliveryDay.getDate() + o.deliveryDays);
  const at = (hour) => { const d = new Date(deliveryDay); d.setHours(hour, 0, 0, 0); return d; };
  const times = [
    placed,
    new Date(+placed + 4 * 3600e3),                                   // packed after ~4 hours
    new Date(+placed + (o.deliveryDays > 1 ? 24 : 8) * 3600e3),       // shipped next day
    at(9),                                                            // out for delivery that morning
    at(18),                                                           // delivered by evening
  ];
  for (let i = 1; i < times.length; i++) if (times[i] < times[i - 1]) times[i] = new Date(+times[i - 1] + 3600e3);
  const step = Math.max(0, times.filter((t) => t <= Date.now()).length - 1);
  return { step, times, deliveryDay };
}

const fmtDay = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const fmtDateTime = (d) => d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

function renderOrders() {
  const list = orders.filter((o) => o && o.items && o.items.length);
  $("ordersEmpty").style.display = list.length ? "none" : "grid";
  $("ordersList").style.display = list.length ? "grid" : "none";
  $("ordersList").innerHTML = list.map((o, i) => {
    const { step, times, deliveryDay } = orderTimeline(o);
    const delivered = step === ORDER_STEPS.length - 1;
    const items = o.items.map((it) => {
      const p = findProduct(it.id);
      return `<span>${p ? p.icon : "📦"} ${escapeHTML(it.name)} × ${it.qty}</span>`;
    }).join("");
    const track = ORDER_STEPS.map((s, n) => `<li class="${n <= step ? "reached" : ""} ${n === step ? "current" : ""}"
      title="${n <= step ? fmtDateTime(times[n]) : "Expected " + fmtDateTime(times[n])}">${s}</li>`).join("");
    return `<article class="order" aria-label="Order ${o.id}">
      <div class="order-head">
        <div><b>Order ${o.id}</b><small>Placed ${fmtDateTime(new Date(o.date))} · ${PAY_LABELS[o.method] || ""}</small></div>
        <span class="order-status ${delivered ? "done" : ""}">${ORDER_STEPS[step]}</span>
      </div>
      <div class="order-items">${items}</div>
      <ol class="track" aria-label="Order progress: ${ORDER_STEPS[step]}">${track}</ol>
      <div class="order-eta">🚚 ${delivered ? `Delivered on <b>${fmtDay(deliveryDay)}</b>` : `Arriving by <b>${fmtDay(deliveryDay)}</b>`}
        <small>Delivering to ${escapeHTML(o.city || "your address")} · Tracking times are estimates</small></div>
      ${o.giftMessage ? `<div class="order-eta">🎁 Gift message: <i>“${escapeHTML(o.giftMessage)}”</i></div>` : ""}
      <div class="order-foot">
        <span>Total <b>${rupees(o.total)}</b>${o.coupon ? ` <small class="save">(${o.coupon} applied)</small>` : ""}</span>
        <span class="order-btns">
          ${o.address ? `<a class="btn btn-ghost" href="${orderWhatsAppLink(o)}" target="_blank" rel="noopener" title="Send this order to ShopEasy on WhatsApp">${icon("chat")} WhatsApp</a>
            <a class="btn btn-ghost" href="${orderSmsLink(o)}" title="Send this order to ShopEasy by SMS">SMS</a>` : ""}
          <button class="btn btn-outline" data-buy-again="${i}">🔁 Buy again</button>
        </span>
      </div>
    </article>`;
  }).join("");
  document.dispatchEvent(new CustomEvent("orders:rendered"));
}

function buyAgain(index) {
  const o = orders[index];
  if (!o) return;
  let added = 0;
  o.items.forEach((it) => {
    if (!findProduct(it.id)) return;
    cart[it.id] = Math.min((cart[it.id] || 0) + it.qty, 10);
    added++;
  });
  if (!added) return toast("These items are no longer available");
  saveCart();
  updateCartUI();
  toast(`${added} item${added === 1 ? "" : "s"} added to your cart`);
  openCart();
}
$("ordersList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-buy-again]");
  if (b) buyAgain(+b.dataset.buyAgain);
});
$("viewOrdersBtn").addEventListener("click", () => { closeCheckout(); openOrders(); });

// ===== SEND THE ORDER TO THE STORE ON WHATSAPP =====
// Until there's an order database, this is how orders reach you: the customer taps the button
// and WhatsApp opens with the full order ready to send to STORE_WHATSAPP.
function orderWhatsAppText(o) {
  const a = o.address || {};
  const lines = [
    `🛍️ New ShopEasy order: ${o.id}`,
    "",
    ...o.items.map((it) => `• ${it.name} × ${it.qty} = ${rupees(it.price * it.qty)}`),
    "",
    o.couponDiscount ? `Coupon ${o.coupon}: − ${rupees(o.couponDiscount)}` : null,
    `Delivery: ${o.delivery ? rupees(o.delivery) : "FREE"}`,
    `Total: ${rupees(o.total)}`,
    `Payment: ${PAY_LABELS[o.method] || o.method}`,
    "",
    `Name: ${a.fullName || ""}`,
    `Phone: ${a.phone || ""}`,
    `Address: ${[a.address, a.city].filter(Boolean).join(", ")}${a.pin ? " - " + a.pin : ""}`,
    o.giftMessage ? `Gift message: ${o.giftMessage}` : null,
    customerWhatsAppNumber(o) ? "" : null,
    // One tap for the shop owner: opens a chat with THIS customer's number, confirmation already written
    customerWhatsAppNumber(o) ? `👉 Tap to send the confirmation to the customer:\n${customerReceiptLink(o, "confirm")}` : null,
  ];
  return lines.filter((l) => l !== null).join("\n");
}
function orderWhatsAppLink(o) {
  const number = String(STORE_WHATSAPP || "").replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(orderWhatsAppText(o))}`;
}

// ===== ORDER DETAILS ON THE CUSTOMER'S OWN NUMBER =====
// Uses the mobile number the customer typed at checkout (different for every order).
function customerWhatsAppNumber(o) {
  const digits = String((o.address || {}).phone || "").replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(digits) ? "91" + digits : "";
}
const prettyPhone = (n) => (n.length === 12 ? `+91 ${n.slice(2, 7)} ${n.slice(7)}` : "+" + n);

// The receipt the customer receives: items, payment, delivery date and address
function customerReceiptText(o, mode) {
  const a = o.address || {};
  const eta = fmtDay(orderTimeline(o).deliveryDay);
  const paid = o.method !== "cod";
  const lines = [
    mode === "confirm"
      ? `Hi ${a.fullName || "there"}! 🙏 Your ShopEasy order ${o.id} is confirmed ✅`
      : `🧾 My ShopEasy order ${o.id}`,
    "",
    ...o.items.map((it) => `• ${it.name} × ${it.qty} = ${rupees(it.price * it.qty)}`),
    o.couponDiscount ? `Coupon ${o.coupon}: − ${rupees(o.couponDiscount)}` : null,
    `Delivery: ${o.delivery ? rupees(o.delivery) : "FREE"}`,
    `Total: ${rupees(o.total)}`,
    "",
    paid ? `Payment: ${PAY_LABELS[o.method]}, successful ✅` : `Payment: Cash on Delivery. Please keep ${rupees(o.total)} ready.`,
    `Arriving by: ${eta}`,
    `Deliver to: ${a.fullName || ""}, ${[a.address, a.city].filter(Boolean).join(", ")}${a.pin ? " - " + a.pin : ""}`,
    "",
    mode === "confirm" ? "Thank you for shopping with ShopEasy!"
      : `Questions? Contact ShopEasy on ${prettyPhone(String(STORE_WHATSAPP || "").replace(/\D/g, ""))}.`,
  ];
  return lines.filter((l) => l !== null).join("\n");
}
function customerReceiptLink(o, mode) {
  return `https://wa.me/${customerWhatsAppNumber(o)}?text=${encodeURIComponent(customerReceiptText(o, mode))}`;
}

// ===== AUTOMATIC EMAIL RECEIPT + GOOGLE SHEET (via your Google Apps Script) =====
// Sends the finished order to ORDER_EMAIL_URL (products.js). Google then emails the receipt to the
// customer, emails the order to you, and adds a row to your order sheet. Returns true / false.
function orderEmailPayload(o) {
  const a = o.address || {};
  return {
    key: typeof ORDER_EMAIL_KEY === "string" ? ORDER_EMAIL_KEY : "",
    order: {
      id: o.id, date: o.date, method: PAY_LABELS[o.method] || o.method, paid: o.method !== "cod",
      items: o.items.map((it) => ({ name: it.name, qty: it.qty, price: it.price })),
      coupon: o.coupon || "", couponDiscount: o.couponDiscount || 0, delivery: o.delivery || 0, total: o.total,
      eta: fmtDay(orderTimeline(o).deliveryDay), giftMessage: o.giftMessage || "",
    },
    customer: { name: a.fullName || "", phone: a.phone || "", email: a.email || "", address: a.address || "", city: a.city || "", pin: a.pin || "" },
    store: { name: "ShopEasy", whatsapp: prettyPhone(storeNumber()), url: location.origin + location.pathname },
  };
}
async function sendOrderEmail(o) {
  const url = typeof ORDER_EMAIL_URL === "string" ? ORDER_EMAIL_URL.trim() : "";
  if (!url) return null; // not set up yet
  try {
    // text/plain keeps this a "simple" request, which Google Apps Script accepts from any website
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(orderEmailPayload(o)) });
    const data = await res.json();
    return !!(data && data.ok);
  } catch (e) {
    return false;
  }
}

// ===== SMS (for customers without WhatsApp) =====
// Opens the phone's normal Messages app with the text ready. Works on any phone with a SIM.
// Plain characters only (no emoji, "Rs." instead of ₹) so each SMS part holds more text and costs less.
function toSmsText(s) {
  return s
    .replace(/\n?👉 Tap to send the confirmation to the customer:\nhttps:\/\/wa\.me\/\S+/, "") // WhatsApp-only link
    .replace(/₹/g, "Rs.").replace(/×/g, "x").replace(/[−–—]/g, "-").replace(/•/g, "-")
    .replace(/✅/g, "(done)").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .replace(/[ \t]+\n/g, "\n").replace(/^[ \t]+/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}
function smsLink(number, text) {
  // iPhones use "&body=", Android uses "?body="
  const sep = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document ? "&" : "?";
  return `sms:+${number}${sep}body=${encodeURIComponent(toSmsText(text))}`;
}
const storeNumber = () => String(STORE_WHATSAPP || "").replace(/\D/g, "");
const orderSmsLink = (o) => smsLink(storeNumber(), orderWhatsAppText(o));
const customerReceiptSmsLink = (o) => smsLink(customerWhatsAppNumber(o), customerReceiptText(o, "copy"));
$("waOrderBtn").addEventListener("click", (e) => {
  if (!String(STORE_WHATSAPP || "").replace(/\D/g, "")) { e.preventDefault(); toast("Add the store's WhatsApp number in products.js first"); }
});
function closeCheckout() {
  $("checkoutModal").classList.remove("open");
  document.body.style.overflow = productOpen !== null ? "hidden" : "";
  checkoutItems = null;
}
$("checkoutBtn").addEventListener("click", () => openCheckout());
$("closeCheckout").addEventListener("click", closeCheckout);
$("doneBtn").addEventListener("click", closeCheckout);
$("checkoutModal").addEventListener("click", (e) => { if (e.target.id === "checkoutModal") closeCheckout(); });
// Escape closes the top-most thing that is open
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if ($("checkoutModal").classList.contains("open")) closeCheckout();
  else if (document.querySelector(".drawer.open")) closeDrawers();
  else if (productOpen !== null) leaveProductView();
});

// Default payment choice: UPI normally; Cash on Delivery only when ONLINE_PAYMENTS is false (products.js)
function applyPaymentDefaults() {
  const online = typeof ONLINE_PAYMENTS === "undefined" || ONLINE_PAYMENTS;
  const def = online ? "upi" : "cod";
  document.querySelectorAll('input[name="pay"]').forEach((r) => {
    r.closest(".pay-option").hidden = !online && r.value !== "cod";
    r.checked = r.value === def;
  });
  document.querySelectorAll(".pay-panel").forEach((p) => { p.hidden = p.dataset.pay !== def; });
  document.querySelector(".demo-note").hidden = !online;
}

// Show the right fields for the chosen payment method
const payMethod = () => document.querySelector('input[name="pay"]:checked').value;
document.querySelectorAll('input[name="pay"]').forEach((r) =>
  r.addEventListener("change", () => {
    document.querySelectorAll(".pay-panel").forEach((panel) => {
      panel.hidden = panel.dataset.pay !== payMethod();
    });
  }));

// Auto-format card number and expiry as the customer types
$("cardNumber").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})(?=.)/g, "$1 ");
});
$("cardExpiry").addEventListener("input", (e) => {
  const d = e.target.value.replace(/\D/g, "").slice(0, 4);
  e.target.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
});
["phone", "pin", "cardCvv"].forEach((id) =>
  $(id).addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, ""); }));

function validExpiry(v) {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m || +m[1] < 1 || +m[1] > 12) return false;
  const now = new Date();
  const end = new Date(2000 + +m[2], +m[1], 1); // first day after the expiry month
  return end > now;
}

$("checkoutForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const method = payMethod();
  const checks = [
    ["fullName", (v) => v.trim().length >= 2, "Please enter your name."],
    ["phone", (v) => /^[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number."],
    ["email", (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), "Enter a valid email, or leave it empty."],    ["address", (v) => v.trim().length >= 5, "Please enter your full address."],
    ["city", (v) => v.trim().length >= 2, "Please enter your city."],
    ["pin", (v) => /^\d{6}$/.test(v), "Enter a valid 6-digit PIN code."],
  ];
  if (method === "upi") checks.push(["upiId", (v) => /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(v.trim()), "Enter a valid UPI ID, e.g. name@bank."]);
  if (method === "card") checks.push(
    ["cardNumber", (v) => v.replace(/\s/g, "").length === 16, "Enter a 16-digit card number."],
    ["cardExpiry", validExpiry, "Enter a valid future expiry date."],
    ["cardCvv", (v) => /^\d{3,4}$/.test(v), "Enter the 3 or 4 digit CVV."]);

  // clear old errors on every field first
  document.querySelectorAll("#checkoutForm .field").forEach((f) => {
    f.classList.remove("invalid");
    const s = f.querySelector("small"); if (s) s.textContent = "";
  });

  let firstBad = null;
  checks.forEach(([id, test, msg]) => {
    const input = $(id);
    if (test(input.value)) return;
    const field = input.closest(".field");
    field.classList.add("invalid");
    field.querySelector("small").textContent = msg;
    firstBad = firstBad || input;
  });
  if (firstBad) { firstBad.focus(); return; }

  // Demo payment: pretend to process, then confirm the order
  const btn = $("placeOrder");
  const buyingNow = checkoutItems; // remember: Buy Now orders leave the cart alone
  const orderItems = { ...(buyingNow || cart) };
  const totals = cartTotals(orderItems);
  const total = totals.total;
  const city = $("city").value.trim();
  const address = Object.fromEntries(CONTACT_FIELDS.map((f) => [f, $(f).value.trim()]));
  const remember = $("rememberAddress").checked;
  const giftMessage = $("giftMessage").value.trim().slice(0, 200);
  btn.disabled = true;
  btn.textContent = method === "cod" ? "Placing order..." : "Processing payment...";
  setTimeout(() => {
    const orderId = "SE" + Date.now().toString().slice(-8);
    $("orderId").textContent = orderId;

    // Save the order for "My Orders"
    const lines = Object.entries(orderItems).map(([id, qty]) => ({ id: +id, qty, p: findProduct(+id) })).filter((l) => l.p);
    orders = [{
      id: orderId,
      date: new Date().toISOString(),
      items: lines.map((l) => ({ id: l.id, qty: l.qty, name: l.p.name, price: effectivePrice(l.p), mrp: l.p.mrp })),
      total, method, city, giftMessage, address,
      couponDiscount: totals.couponDiscount, delivery: totals.delivery,
      // everything saved on this order: MRP vs price paid (incl. bargains), coupon, free delivery
      saved: lines.reduce((s, l) => s + (l.p.mrp - effectivePrice(l.p)) * l.qty, 0)
        + totals.couponDiscount + (totals.couponFreeShip ? DELIVERY_FEE : 0),
      coupon: totals.couponDiscount || totals.couponFreeShip ? coupon : null,
      deliveryDays: Math.max(...lines.map((l) => ((CATEGORY_INFO[l.p.cat] || {}).deliveryDays || [3, 5])[1])),
    }, ...orders].slice(0, 30);
    store("shopeasy-orders", orders);

    // Remember (or forget) the address, never the payment details
    store("shopeasy-address", remember ? address : null);
    $("orderSaved").hidden = !orders[0].saved;
    $("orderSaved").textContent = `🐷 You saved ${rupees(orders[0].saved)} on this order!`;
    document.dispatchEvent(new CustomEvent("order:placed", { detail: orders[0] }));
    // Success screen: "Payment successful" for UPI / card, "Order confirmed" for Cash on Delivery
    const eta = fmtDay(orderTimeline(orders[0]).deliveryDay);
    const cod = method === "cod";
    $("successTitle").textContent = cod ? "Order confirmed" : "Payment successful";
    $("orderMsg").textContent = cod
      ? `Please keep ${rupees(total)} ready when your order arrives in ${city}.`
      : `Thank you! Your order is confirmed and will be delivered to ${city}.`;
    $("receiptAmountLabel").textContent = cod ? "Amount to pay on delivery" : "Amount paid";
    $("receiptAmount").textContent = rupees(total);
    $("receiptMethod").textContent = PAY_LABELS[method];
    $("receiptEta").textContent = eta;
    $("waOrderBtn").href = orderWhatsAppLink(orders[0]);

    // Automatic: email the receipt to the customer, email the order to you, add it to your Google Sheet
    const placed = orders[0];
    const emailTo = (placed.address || {}).email;
    const status = $("emailStatus");
    status.hidden = true;
    if (typeof ORDER_EMAIL_URL === "string" && ORDER_EMAIL_URL.trim()) {
      status.hidden = false;
      status.className = "email-status";
      status.textContent = emailTo ? `📧 Sending your receipt to ${emailTo}…` : "Sending your order to ShopEasy…";
      sendOrderEmail(placed).then((ok) => {
        placed.emailed = ok;
        store("shopeasy-orders", orders);
        status.className = `email-status ${ok ? "ok" : "fail"}`;
        status.textContent = ok
          ? (emailTo ? `📧 Receipt sent to ${emailTo}` : "✓ Your order has reached ShopEasy")
          : "We couldn't send your order automatically. Please use WhatsApp or SMS below so it reaches us.";
      });
    }
    // A copy of the receipt for the customer, on the mobile number they just entered
    const custNo = customerWhatsAppNumber(orders[0]);
    $("myCopyBtn").hidden = !custNo;
    $("myCopyHint").hidden = !custNo;
    $("myCopySms").hidden = !custNo;
    $("orderSmsBtn").hidden = !storeNumber();
    $("orderSmsBtn").href = orderSmsLink(orders[0]);
    if (custNo) $("myCopySms").href = customerReceiptSmsLink(orders[0]);
    if (custNo) {
      $("myCopyBtn").href = customerReceiptLink(orders[0], "copy");
      $("myCopyBtn").lastChild.textContent = ` Get order details on my WhatsApp (${prettyPhone(custNo)})`;
      $("myCopyHint").textContent = `Opens WhatsApp on ${prettyPhone(custNo)} with your full receipt: items, payment and delivery date.`;
    }
    $("checkoutForm").hidden = true;
    $("orderSuccess").hidden = false;
    btn.disabled = false;
    btn.textContent = "Place Order";
    $("checkoutForm").reset();
    applyPaymentDefaults();
    if (!buyingNow) cart = {};
    coupon = null; // a coupon is used up once an order is placed with it
    saveCart();
    updateCartUI();
  }, 1200);
});

// ===== TOAST =====
let toastTimer;
// toast("Saved") or toast("Removed", { label: "Undo", fn: undoRemove })
function toast(msg, action) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.toggle("has-action", !!action);
  if (action) {
    const btn = document.createElement("button");
    btn.className = "toast-action";
    btn.textContent = action.label;
    btn.addEventListener("click", () => { t.classList.remove("show"); action.fn(); });
    t.appendChild(btn);
  }
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), action ? 7000 : 1800);
}

// ===== START =====
$("year").textContent = new Date().getFullYear();
applyPaymentDefaults();
$("footerHours").textContent = STORE_INFO.hours || "";
$("footerLegal").textContent = (STORE_INFO.legalName ? " · " + STORE_INFO.legalName : "") + (STORE_INFO.gstin ? " · GSTIN " + STORE_INFO.gstin : "");
// Links from the info pages can open My Orders directly: index.html?open=orders
if (new URLSearchParams(location.search).get("open") === "orders") {
  history.replaceState(null, "", location.pathname + location.hash);
  setTimeout(openOrders, 0);
}
renderCategories();
renderProducts();
renderHeroCollage();
renderDeal();
updateCartUI();
// Opened from a shared product link? Show that product straight away.
if (productIdInHash() !== null) { landedOnProduct = true; route(); }
