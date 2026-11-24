// =====================================================================
// SHOPEASY EXTRAS: festival mode, Budget Basket, "I'm going to…" kits,
// swipe to discover, mol-bhav bargaining, ration reminder, savings
// piggy bank, Easy mode (bigger text, Hindi, read aloud) and shared carts.
// Loaded after app.js and uses its helpers ($, rupees, cart, toast…).
// =====================================================================

// ---------- Small helpers ----------
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const productsFrom = (ids) => ids.map(findProduct).filter(Boolean);

function addItemsToCart(items) { // items: [{ id, qty }]
  let added = 0;
  items.forEach(({ id, qty }) => {
    if (!findProduct(id)) return;
    cart[id] = Math.min((cart[id] || 0) + qty, 10);
    added++;
  });
  saveCart();
  updateCartUI();
  return added;
}

function pickRowHTML(p, { check = null, actions = "" } = {}) {
  return `<div class="pick ${check === false ? "off" : ""}" data-row="${p.id}">
    ${check === null ? "<span></span>" : `<input type="checkbox" data-check="${p.id}" ${check ? "checked" : ""} aria-label="Include ${escapeHTML(p.name)}">`}
    <span class="p-icon">${pic(p)}</span>
    <span class="p-name">${escapeHTML(p.name)}<small>${catName(p.cat)} · ★ ${p.rating.toFixed(1)}</small></span>
    <span class="p-price">${rupees(effectivePrice(p))}</span>
    ${actions}
  </div>`;
}

// ---------- Tool window (shared by Budget Basket, kits, swipe, share) ----------
let toolCleanup = null;
function openTool(title, html) {
  if (toolCleanup) { toolCleanup(); toolCleanup = null; }
  const body = $("toolBody");
  body.onclick = body.onchange = body.oninput = body.onsubmit = null;
  $("toolTitle").textContent = title;
  body.innerHTML = html;
  closeDrawers();
  $("toolModal").classList.add("open");
  document.body.style.overflow = "hidden";
  $("closeTool").focus();
}
function closeTool() {
  if (!$("toolModal").classList.contains("open")) return;
  $("toolModal").classList.remove("open");
  if (toolCleanup) { toolCleanup(); toolCleanup = null; }
  if (productOpen === null && !$("checkoutModal").classList.contains("open")) document.body.style.overflow = "";
}
$("closeTool").addEventListener("click", closeTool);
$("toolModal").addEventListener("click", (e) => { if (e.target.id === "toolModal") closeTool(); });
// Escape closes the tool window first (before the store's own Escape handling)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("toolModal").classList.contains("open")) { e.stopImmediatePropagation(); closeTool(); }
}, true);

// =====================================================================
// "I'M GOING TO…" KITS
// =====================================================================
$("kitChips").innerHTML = KITS.map((k) =>
  `<button class="kit-chip" data-kit="${k.id}">${k.icon} ${escapeHTML(k.name)}</button>`).join("");
$("kitChips").addEventListener("click", (e) => {
  const b = e.target.closest("[data-kit]");
  if (b) openKit(b.dataset.kit);
});

function openKit(kitId) {
  const kit = KITS.find((k) => k.id === kitId);
  if (!kit) return;
  const items = productsFrom(kit.items);
  const chosen = new Set(items.map((p) => p.id));
  const render = () => {
    const sel = items.filter((p) => chosen.has(p.id));
    const total = sel.reduce((s, p) => s + effectivePrice(p), 0);
    $("toolBody").innerHTML = `<div class="tool-pad">
      <p class="hint">Everything you need for: <b>${kit.icon} ${escapeHTML(kit.name)}</b>. Untick anything you already have.</p>
      <div class="pick-list">${items.map((p) => pickRowHTML(p, { check: chosen.has(p.id) })).join("")}</div>
      <div class="tool-total">
        <div><b>${rupees(total)}</b><small>${sel.length} of ${items.length} items</small></div>
        <button class="btn btn-primary" data-add-kit ${sel.length ? "" : "disabled"}>Add ${sel.length} item${sel.length === 1 ? "" : "s"} to cart</button>
      </div>
      <button class="link-btn" data-kit-budget>🧺 Fit this kit into a budget instead</button>
    </div>`;
  };
  openTool(`${kit.icon} ${kit.name} kit`, "");
  render();
  $("toolBody").onchange = (e) => {
    const c = e.target.closest("[data-check]");
    if (!c) return;
    if (c.checked) chosen.add(+c.dataset.check); else chosen.delete(+c.dataset.check);
    render();
  };
  $("toolBody").onclick = (e) => {
    if (e.target.closest("[data-add-kit]")) {
      const n = addItemsToCart([...chosen].map((id) => ({ id, qty: 1 })));
      closeTool();
      toast(`${kit.icon} ${n} item${n === 1 ? "" : "s"} from the ${kit.name} kit added to cart`);
      openCart();
    }
    if (e.target.closest("[data-kit-budget]")) openBudget(kit.id);
  };
}

// =====================================================================
// BUDGET BASKET: fills a cart with the best-value items that fit a budget
// =====================================================================
const valueScore = (p) => p.rating * 20 + discountPct(p); // high rating + big discount = good value

function fillBasket(budget, kitId) {
  const kit = KITS.find((k) => k.id === kitId);
  const pool = (kit ? productsFrom(kit.items) : PRODUCTS).slice().sort((a, b) => valueScore(b) - valueScore(a));
  const basket = [], perCat = {};
  let left = budget;
  // Pass 1: no single item takes more than half the budget (so you get several things);
  // pass 2: fill whatever money is left with the best remaining value.
  for (const cap of [budget / 2, Infinity]) {
    for (const p of pool) {
      const price = effectivePrice(p);
      if (basket.includes(p.id) || price > left || price > cap) continue;
      if (!kit && (perCat[p.cat] || 0) >= 2) continue; // keep "Anything" baskets varied
      basket.push(p.id);
      perCat[p.cat] = (perCat[p.cat] || 0) + 1;
      left -= price;
    }
  }
  return { basket, pool: pool.map((p) => p.id) };
}

function openBudget(kitId = "", budget = "") {
  openTool("🧺 Budget Basket", `<form class="tool-pad" id="budgetForm">
    <p class="hint">Tell us your budget and what it's for. We'll fill a cart with the best-rated, best-value items that fit.</p>
    <div class="tool-row">
      <div class="field"><label for="bbAmount">My budget (₹)</label>
        <input id="bbAmount" type="number" inputmode="numeric" min="1" step="1" placeholder="e.g. 2000" value="${budget}" required></div>
      <div class="field"><label for="bbKit">It's for</label>
        <select id="bbKit"><option value="">Anything (best value)</option>
          ${KITS.map((k) => `<option value="${k.id}" ${k.id === kitId ? "selected" : ""}>${k.icon} ${escapeHTML(k.name)}</option>`).join("")}
        </select></div>
      <button class="btn btn-primary" type="submit">Fill my basket</button>
    </div>
    <div id="bbResult"></div>
  </form>`);

  let state = null; // { budget, kitId, basket: [ids], pool: [ids] }
  const render = () => {
    const out = $("bbResult");
    if (!state) { out.innerHTML = ""; return; }
    const items = productsFrom(state.basket);
    const total = items.reduce((s, p) => s + effectivePrice(p), 0);
    if (!items.length) {
      const cheapest = Math.min(...productsFrom(state.pool).map(effectivePrice));
      out.innerHTML = `<p class="hint">Nothing fits in ${rupees(state.budget)}. The cheapest item here is ${rupees(cheapest)}, so try a bigger budget.</p>`;
      return;
    }
    out.innerHTML = `<div class="pick-list">${items.map((p) => pickRowHTML(p, {
      actions: `<button type="button" class="mini-btn" data-swap="${p.id}" title="Swap for something else">🔄 Swap</button>`
        + `<button type="button" class="mini-btn" data-drop="${p.id}" aria-label="Remove ${escapeHTML(p.name)}">✕</button>`,
    })).join("")}</div>
    <div class="tool-total">
      <div><b>${rupees(total)}</b><small>of ${rupees(state.budget)} · ${rupees(state.budget - total)} left</small></div>
      <button type="button" class="btn btn-primary" data-add-basket>Add all ${items.length} to cart</button>
    </div>`;
  };

  $("toolBody").onsubmit = (e) => {
    e.preventDefault();
    const budgetNow = Math.round(+$("bbAmount").value);
    if (!budgetNow || budgetNow < 1) { $("bbAmount").focus(); return; }
    const k = $("bbKit").value;
    state = { budget: budgetNow, kitId: k, ...fillBasket(budgetNow, k) };
    render();
  };
  $("toolBody").onclick = (e) => {
    if (!state) return;
    const used = () => productsFrom(state.basket).reduce((s, p) => s + effectivePrice(p), 0);
    const swap = e.target.closest("[data-swap]"), drop = e.target.closest("[data-drop]");
    if (swap) {
      const id = +swap.dataset.swap, cur = findProduct(id);
      const room = state.budget - used() + effectivePrice(cur);
      const options = productsFrom(state.pool).filter((p) => !state.basket.includes(p.id) && effectivePrice(p) <= room);
      // prefer something from the same category
      const next = options.find((p) => p.cat === cur.cat) || options[0];
      if (!next) { toast("No other item fits in the budget"); return; }
      state.basket = state.basket.map((x) => (x === id ? next.id : x));
      state.pool = [...state.pool.filter((x) => x !== id), id]; // swapped-out item goes to the back of the line
      render();
    }
    if (drop) { state.basket = state.basket.filter((x) => x !== +drop.dataset.drop); render(); }
    if (e.target.closest("[data-add-basket]")) {
      const n = addItemsToCart(state.basket.map((id) => ({ id, qty: 1 })));
      closeTool();
      toast(`🧺 ${n} items added to your cart`);
      openCart();
    }
  };
  if (budget) $("toolBody").onsubmit(new Event("submit"));
  setTimeout(() => $("bbAmount").focus(), 50);
}
$("budgetBtn").addEventListener("click", () => openBudget());

// =====================================================================
// SWIPE TO DISCOVER
// =====================================================================
function openSwipe() {
  let deck = visibleProducts().filter((p) => !isWished(p.id) && !cart[p.id]);
  if (!deck.length) deck = PRODUCTS.filter((p) => !isWished(p.id));
  let i = 0, liked = 0, added = 0;

  openTool("👆 Swipe to discover", `<div class="tool-pad">
    <p class="hint">Swipe right (or ❤️) to save to your wishlist, left (or ✕) to skip. 🛒 adds to cart.</p>
    <div class="swipe-area" id="swipeArea"></div>
    <div class="swipe-actions" id="swipeActions">
      <button data-swipe="skip" class="sw-skip" aria-label="Skip" title="Skip (←)">✕</button>
      <button data-swipe="info" class="sw-info" aria-label="See details" title="Details">i</button>
      <button data-swipe="cart" class="sw-cart" aria-label="Add to cart" title="Add to cart (↑)">${icon("cart")}</button>
      <button data-swipe="like" class="sw-like" aria-label="Add to wishlist" title="Wishlist (→)">${icon("heart")}</button>
    </div>
    <p class="swipe-count" id="swipeCount"></p>
  </div>`);

  const cardHTML = (p, behind) => `<div class="swipe-card ${behind ? "behind" : ""}" ${behind ? 'aria-hidden="true"' : ""}>
    <div class="s-tile">${pic(p)}<span class="swipe-stamp like">LOVE IT</span><span class="swipe-stamp nope">SKIP</span>
      ${discountPct(p) > 0 ? `<span class="off">${discountPct(p)}% OFF</span>` : ""}</div>
    <div class="s-info"><span class="card-cat">${catName(p.cat)}</span><h3>${escapeHTML(p.name)}</h3>
      <div class="price"><strong>${rupees(effectivePrice(p))}</strong><s>${rupees(p.mrp)}</s>
      <span class="rating"><b>★</b> ${p.rating.toFixed(1)}</span></div></div>
  </div>`;

  const render = () => {
    const area = $("swipeArea");
    if (!area) return;
    if (i >= deck.length) {
      $("swipeActions").hidden = true;
      $("swipeCount").textContent = "";
      area.outerHTML = `<div class="swipe-done"><div class="big">🎉</div><b>You've seen them all!</b>
        <p class="hint">❤️ ${liked} saved to wishlist · 🛒 ${added} added to cart</p>
        <div class="success-actions"><button class="btn btn-outline" data-swipe="again">Start over</button>
        <button class="btn btn-primary" data-swipe="wishlist">Open wishlist</button></div></div>`;
      return;
    }
    area.innerHTML = (deck[i + 1] ? cardHTML(deck[i + 1], true) : "") + cardHTML(deck[i], false);
    $("swipeCount").textContent = `${deck.length - i} to go`;
    attachDrag(area.querySelector(".swipe-card:not(.behind)"));
  };

  const decide = (action) => {
    const p = deck[i];
    if (!p) return;
    const card = $("swipeArea") && $("swipeArea").querySelector(".swipe-card:not(.behind)");
    if (action === "like" && !isWished(p.id)) { toggleWish(p.id); liked++; }
    if (action === "cart") { if (!cart[p.id]) changeQty(p.id, 1); added++; }
    const dir = action === "skip" ? -1 : 1;
    if (card) {
      card.style.transform = action === "cart" ? "translateY(-500px)" : `translateX(${dir * 600}px) rotate(${dir * 25}deg)`;
      card.style.opacity = "0";
    }
    i++;
    setTimeout(render, 220);
  };

  function attachDrag(card) {
    if (!card) return;
    let startX = 0, dx = 0, dragging = false;
    const like = card.querySelector(".swipe-stamp.like"), nope = card.querySelector(".swipe-stamp.nope");
    card.addEventListener("pointerdown", (e) => {
      dragging = true; startX = e.clientX; dx = 0;
      card.setPointerCapture(e.pointerId);
      card.classList.add("dragging");
    });
    card.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
      like.style.opacity = Math.max(0, Math.min(1, dx / 100));
      nope.style.opacity = Math.max(0, Math.min(1, -dx / 100));
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      card.classList.remove("dragging");
      if (dx > 100) decide("like");
      else if (dx < -100) decide("skip");
      else { card.style.transform = ""; like.style.opacity = nope.style.opacity = 0; }
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
  }

  $("toolBody").onclick = (e) => {
    const b = e.target.closest("[data-swipe]");
    if (!b) return;
    const a = b.dataset.swipe;
    if (a === "info") { const p = deck[i]; closeTool(); if (p) location.hash = `#p/${p.id}`; return; }
    if (a === "again") { openSwipe(); return; }
    if (a === "wishlist") { closeTool(); openWish(); return; }
    decide(a);
  };
  const keys = (e) => {
    if (!$("swipeArea")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); decide("like"); }
    if (e.key === "ArrowLeft") { e.preventDefault(); decide("skip"); }
    if (e.key === "ArrowUp") { e.preventDefault(); decide("cart"); }
  };
  document.addEventListener("keydown", keys);
  toolCleanup = () => document.removeEventListener("keydown", keys);
  render();
}
$("swipeBtn").addEventListener("click", openSwipe);

// =====================================================================
// MOL-BHAV: bargain with the shopkeeper on a product page
// =====================================================================
const bargainChats = {}; // product id → chat lines for this visit
const bargainFloor = (p) => Math.max(1, Math.ceil(p.price * (1 - BARGAIN.maxPercent / 100)));

function renderBargain(p, expanded = false) {
  const slot = $("bargainSlot");
  if (!slot || !BARGAIN.enabled) return;
  const floor = bargainFloor(p);
  if (floor >= p.price) { slot.innerHTML = ""; return; } // too cheap to bargain on
  const deal = bargains.deals[p.id];
  const tries = bargains.tries[p.id] || 0;
  const triesLeft = Math.max(0, BARGAIN.maxTries - tries);
  const last = bargains.last[p.id];

  if (deal) {
    slot.innerHTML = `<div class="bargain"><span class="deal-done">🤝 Deal done! ${rupees(deal)} for you today (extra ${rupees(p.price - deal)} off)</span>
      <small class="hint">Bargained price is valid till midnight.</small></div>`;
    return;
  }
  if (!expanded && !bargainChats[p.id]) {
    slot.innerHTML = `<button class="btn btn-ghost full" data-bargain-open title="Bargain with the shopkeeper">🤝 Mol-bhav karo · Make an offer</button>`;
    return;
  }
  const chat = bargainChats[p.id] || (bargainChats[p.id] = [{ who: "shop", text: "Namaste! 🙏 Bataiye, kitne mein chahiye?" }]);
  slot.innerHTML = `<div class="bargain">
    <div class="bargain-head"><b>🤝 Mol-bhav</b><small>${triesLeft ? `${triesLeft} offer${triesLeft === 1 ? "" : "s"} left today` : "No offers left today"}</small></div>
    <div class="chat-log" id="chatLog" aria-live="polite">${chat.map((c) => `<div class="bubble ${c.who}">${escapeHTML(c.text)}</div>`).join("")}</div>
    ${triesLeft ? `<form class="bargain-form" id="bargainForm">
      <input id="offerInput" type="number" inputmode="numeric" min="1" placeholder="Your offer in ₹" aria-label="Your offer in rupees">
      <button class="btn btn-primary" type="submit">Offer</button></form>` : ""}
    ${last ? `<button class="btn btn-outline" data-bargain-accept="${last}">✅ Accept ${rupees(last)}</button>` : ""}
  </div>`;
  const log = $("chatLog");
  log.scrollTop = log.scrollHeight;
}

function bargainOffer(p, offer) {
  const chat = bargainChats[p.id];
  const floor = bargainFloor(p);
  const say = (who, text) => chat.push({ who, text });
  if (!offer || offer < 1) { say("shop", "Kitne mein chahiye? Number likhiye 🙂"); return; }
  say("me", `${rupees(offer)}?`);
  if (offer >= p.price) { say("shop", `Arre, ${rupees(p.price)} hi toh hai! Itna zyada kyun? 😄`); return; }
  bargains.tries[p.id] = (bargains.tries[p.id] || 0) + 1;
  const round = bargains.tries[p.id];
  if (offer >= floor) { saveBargains(); acceptDeal(p, offer, `Chalo theek hai, aapke liye ${rupees(offer)}! 🤝 Deal pakki.`); return; }
  const counter = round >= BARGAIN.maxTries ? floor
    : Math.max(floor, Math.round(p.price - (p.price - floor) * round / BARGAIN.maxTries));
  bargains.last[p.id] = counter;
  saveBargains();
  if (offer < p.price * 0.6) say("shop", `Arre bhai, ${rupees(offer)} mein toh dabba bhi nahi milega! 😅 ${rupees(counter)} final karo.`);
  else if (round >= BARGAIN.maxTries) say("shop", `Last price ${rupees(counter)}. Isse kam nahi hoga, sach mein! 🙏`);
  else say("shop", pick([
    `${rupees(offer)}? Thoda aur badhao ji… ${rupees(counter)} chalega?`,
    `Itne mein mera nuksaan ho jayega! ${rupees(counter)} de do.`,
    `Aap apne customer ho, ${rupees(counter)} laga deta hoon.`,
  ]));
}

function acceptDeal(p, price, line) {
  bargains.deals[p.id] = price;
  saveBargains();
  (bargainChats[p.id] = bargainChats[p.id] || []).push({ who: "shop", text: line || `Pakka! ${rupees(price)} mein aapka. 🤝` });
  if (!cart[p.id]) changeQty(p.id, 1); else updateCartUI();
  toast(`🤝 Deal! ${p.name} for ${rupees(price)} today`);
  // refresh prices shown on the page
  if ($("pdPrice")) {
    $("pdPrice").textContent = rupees(price);
    $("pdSave").textContent = `You save ${rupees(p.mrp - price)} (${Math.round((1 - price / p.mrp) * 100)}%)`;
  }
  if ($("pdStickyPrice")) $("pdStickyPrice").textContent = rupees(price);
  renderHeroCollage();
  renderProducts();
  renderBargain(p, true);
}

document.addEventListener("product:view", (e) => renderBargain(e.detail));
$("productModal").addEventListener("click", (e) => {
  const p = productOpen !== null ? findProduct(productOpen) : null;
  if (!p) return;
  if (e.target.closest("[data-bargain-open]")) { renderBargain(p, true); setTimeout(() => $("offerInput") && $("offerInput").focus(), 30); }
  const acc = e.target.closest("[data-bargain-accept]");
  if (acc) acceptDeal(p, +acc.dataset.bargainAccept);
});
$("productModal").addEventListener("submit", (e) => {
  if (e.target.id !== "bargainForm") return;
  e.preventDefault();
  const p = findProduct(productOpen);
  if (!p) return;
  bargainOffer(p, Math.round(+$("offerInput").value));
  if (!bargains.deals[p.id]) {
    renderBargain(p, true);
    if ($("offerInput")) $("offerInput").focus();
  }
});

// =====================================================================
// MONTHLY RATION AUTOPILOT
// =====================================================================
function checkRestock() {
  const box = $("restock");
  const groceryOrder = orders.find((o) => o && o.items && o.items.some((it) => (findProduct(it.id) || {}).cat === "grocery"));
  let snoozeUntil = null, doneFor = null;
  try { snoozeUntil = localStorage.getItem("shopeasy-restock-snooze"); doneFor = localStorage.getItem("shopeasy-restock-done"); } catch (e) {}
  if (!groceryOrder || doneFor === groceryOrder.id || (snoozeUntil && new Date(snoozeUntil) > new Date())) { box.hidden = true; return; }
  const days = Math.floor((Date.now() - new Date(groceryOrder.date)) / 86400000);
  if (days < RESTOCK_REMINDER_DAYS) { box.hidden = true; return; }
  const items = groceryOrder.items.filter((it) => (findProduct(it.id) || {}).cat === "grocery");
  const names = items.map((it) => it.name.replace(/\s*\(.*\)$/, ""));
  const nameText = names.length > 2 ? `${names.slice(0, 2).join(", ")} and ${names.length - 2} more` : names.join(" and ");
  const total = items.reduce((s, it) => s + effectivePrice(findProduct(it.id)) * it.qty, 0);
  box.innerHTML = `<span class="r-icon">🧺</span>
    <div class="r-text"><b>Time to restock?</b> It's been ${days} days since you ordered ${escapeHTML(nameText)}.
      <small>Reorder your usual groceries in one tap.</small></div>
    <div class="r-actions">
      <button class="btn btn-primary" data-restock="reorder">Reorder usual basket (${rupees(total)})</button>
      <button class="btn btn-outline" data-restock="later">Remind me in 3 days</button>
      <button class="link-btn" data-restock="dismiss">Dismiss</button>
    </div>`;
  box.hidden = false;
  box.onclick = (e) => {
    const a = (e.target.closest("[data-restock]") || {}).dataset;
    if (!a || !a.restock) return;
    if (a.restock === "reorder") {
      addItemsToCart(items.map((it) => ({ id: it.id, qty: it.qty })));
      toast("🧺 Your usual groceries are in the cart");
      openCart();
    }
    if (a.restock === "later") store("shopeasy-restock-snooze", new Date(Date.now() + 3 * 86400000).toISOString());
    if (a.restock !== "later") store("shopeasy-restock-done", groceryOrder.id);
    box.hidden = true;
  };
}
document.addEventListener("order:placed", checkRestock);

// =====================================================================
// SAVINGS PIGGY BANK (shown at the top of My Orders)
// =====================================================================
const SAVINGS_BADGES = [
  { at: 500, icon: "🥉", name: "Smart Saver" },
  { at: 1000, icon: "🥈", name: "Super Saver" },
  { at: 2500, icon: "🥇", name: "Savings Star" },
  { at: 5000, icon: "🏆", name: "Bachat Champion" },
  { at: 10000, icon: "👑", name: "Bachat Legend" },
];
function totalSaved() {
  return orders.reduce((sum, o) => {
    if (!o || !o.items) return sum;
    if (typeof o.saved === "number") return sum + o.saved;
    return sum + o.items.reduce((s, it) => s + Math.max(0, ((it.mrp || (findProduct(it.id) || {}).mrp || it.price) - it.price) * it.qty), 0);
  }, 0);
}
document.addEventListener("orders:rendered", () => {
  const list = $("ordersList");
  if (!orders.length) return;
  const saved = totalSaved();
  const next = SAVINGS_BADGES.find((b) => saved < b.at);
  const prevAt = [...SAVINGS_BADGES].reverse().find((b) => saved >= b.at);
  const from = prevAt ? prevAt.at : 0;
  const pct = next ? Math.round(((saved - from) / (next.at - from)) * 100) : 100;
  list.insertAdjacentHTML("afterbegin", `<div class="piggy">
    <div class="piggy-top"><span class="pig">🐷</span>
      <div><small>You've saved at ShopEasy</small><b>${rupees(saved)}</b></div></div>
    <div class="badges">${SAVINGS_BADGES.map((b) => `<span class="badge-pill ${saved >= b.at ? "" : "locked"}" title="Save ${rupees(b.at)}">${b.icon} ${b.name}</span>`).join("")}</div>
    ${next ? `<div class="progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
      <small class="next">${rupees(next.at - saved)} more to unlock ${next.icon} ${next.name}</small>`
      : `<small class="next">👑 You've unlocked every badge. Bachat Legend!</small>`}
  </div>`);
});

// =====================================================================
// EASY MODE: bigger text, Hindi labels, read aloud
// =====================================================================
function applyEasyLabels() {
  const easy = isEasy();
  document.querySelectorAll("[data-hi]").forEach((el) => {
    if (!el.dataset.en) el.dataset.en = el.textContent;
    const short = el.closest(".bottom-nav") || el.classList.contains("cart-label");
    el.innerHTML = easy ? (short ? el.dataset.hi : `${el.dataset.hi}<span class="en-sub">${escapeHTML(el.dataset.en)}</span>`) : escapeHTML(el.dataset.en);
  });
  $("search").placeholder = easy ? "सामान खोजें… (Search)" : "Search products...";
  $("easyToggle").setAttribute("aria-pressed", easy);
}
function setEasy(on, announce) {
  document.documentElement.classList.toggle("easy", on);
  store("shopeasy-easy", on ? "1" : null);
  applyEasyLabels();
  renderProducts();
  updateCartUI();
  if (productOpen !== null) { renderProductView(findProduct(productOpen)); renderBargain(findProduct(productOpen)); }
  if (announce) toast(on ? "आसान मोड चालू · Easy mode on. Tap 🔊 to hear any product." : "Easy mode off");
}
$("easyToggle").addEventListener("click", () => setEasy(!isEasy(), true));

function speakProduct(p) {
  if (!("speechSynthesis" in window)) { toast("Read aloud isn't supported in this browser"); return; }
  speechSynthesis.cancel();
  const hindi = speechSynthesis.getVoices().find((v) => /^hi/i.test(v.lang));
  const price = effectivePrice(p);
  const u = new SpeechSynthesisUtterance(hindi
    ? `${p.name}. कीमत ${price} रुपये। रेटिंग ${p.rating} स्टार।`
    : `${p.name}. Price ${price} rupees. Rated ${p.rating} stars.`);
  u.lang = hindi ? hindi.lang : "en-IN";
  if (hindi) u.voice = hindi;
  u.rate = 0.9;
  speechSynthesis.speak(u);
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-speak]");
  if (b) { e.preventDefault(); speakProduct(findProduct(+b.dataset.speak)); }
});
if ("speechSynthesis" in window) speechSynthesis.getVoices(); // starts loading voices early

// =====================================================================
// SHARED CART LINKS
// =====================================================================
function cartShareLink() {
  const code = Object.entries(cart).filter(([id]) => findProduct(+id)).map(([id, q]) => `${id}-${q}`).join(".");
  return `${location.origin}${location.pathname}#cart=${code}`;
}
$("shareCartBtn").addEventListener("click", () => {
  const t = cartTotals(cart, null);
  const link = cartShareLink();
  const text = `Here's my ShopEasy cart (${t.count} items, ${rupees(t.subtotal)}). Add anything you want: ${link}`;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  openTool("🔗 Share this cart", `<div class="tool-pad">
    <p class="hint">Anyone who opens this link sees these ${t.count} items (${rupees(t.subtotal)}) and can add them to their own cart. Great for flatmates and family.</p>
    <div class="share-link"><input id="shareLink" readonly value="${escapeHTML(link)}" aria-label="Cart link">
      <button class="btn btn-outline" data-share="copy">Copy</button></div>
    <div class="success-actions">
      <a class="btn btn-primary" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">💬 Send on WhatsApp</a>
      ${navigator.share ? `<button class="btn btn-ghost" data-share="native">📤 More ways to share</button>` : ""}
    </div>
    ${local ? `<p class="hint">Note: you're running the store on this computer, so the link will only work for others once the store is online.</p>` : ""}
  </div>`);
  $("toolBody").onclick = async (e) => {
    const b = e.target.closest("[data-share]");
    if (!b) return;
    if (b.dataset.share === "copy") {
      try { await navigator.clipboard.writeText(link); }
      catch (err) { $("shareLink").select(); document.execCommand && document.execCommand("copy"); }
      toast("🔗 Link copied");
    }
    if (b.dataset.share === "native") { try { await navigator.share({ title: "My ShopEasy cart", text, url: link }); } catch (err) {} }
  };
});

// Someone opened a shared cart link (#cart=1-2.4-1)
function checkSharedCart() {
  const m = /^#cart=([\d.\-]+)$/.exec(location.hash);
  if (!m) return;
  history.replaceState(null, "", location.pathname + location.search);
  const items = m[1].split(".").slice(0, 40).map((pair) => {
    const [id, qty] = pair.split("-").map(Number);
    return { id, qty: Math.min(Math.max(qty || 1, 1), 10) };
  }).filter((it) => findProduct(it.id));
  if (!items.length) { toast("That cart link doesn't have any items we sell"); return; }
  const total = items.reduce((s, it) => s + effectivePrice(findProduct(it.id)) * it.qty, 0);
  openTool("🛒 A cart was shared with you", `<div class="tool-pad">
    <p class="hint">Someone shared these items with you. Add them to your cart and change anything you like.</p>
    <div class="pick-list">${items.map((it) => pickRowHTML(findProduct(it.id), {
      actions: `<span class="hint">× ${it.qty}</span>`,
    })).join("")}</div>
    <div class="tool-total"><div><b>${rupees(total)}</b><small>${items.reduce((s, it) => s + it.qty, 0)} items</small></div>
      <div class="success-actions"><button class="btn btn-outline" data-shared="no">No thanks</button>
      <button class="btn btn-primary" data-shared="add">Add all to my cart</button></div></div>
  </div>`);
  $("toolBody").onclick = (e) => {
    const b = e.target.closest("[data-shared]");
    if (!b) return;
    closeTool();
    if (b.dataset.shared === "add") { addItemsToCart(items); toast("🛒 Shared items added to your cart"); openCart(); }
  };
}
addEventListener("hashchange", checkSharedCart);

// =====================================================================
// FESTIVAL MODE
// =====================================================================
function activeFestival() {
  const preview = new URLSearchParams(location.search).get("festival");
  if (preview) return FESTIVALS.find((f) => f.id === preview.toLowerCase()) || null;
  return festivalsOn(todayKey())[0] || null;
}
// Festivals whose window (daysBefore … the day after) includes the given day, best match first:
// the soonest festival still to come, then (on the day after) the one that just passed.
function festivalsOn(dayKey) {
  const today = new Date(dayKey);
  const DAY = 86400000;
  return FESTIVALS.filter((f) => {
    const day = new Date(f.date);
    return today >= new Date(+day - f.daysBefore * DAY) && today <= new Date(+day + DAY);
  }).sort((a, b) => {
    const da = new Date(a.date) - today, db = new Date(b.date) - today;
    if ((da >= 0) !== (db >= 0)) return da >= 0 ? -1 : 1; // upcoming beats already-passed
    return Math.abs(da) - Math.abs(db);                   // then the nearest
  });
}
function applyFestival() {
  const f = activeFestival();
  if (!f) return;
  const daysTo = Math.round((new Date(f.date) - new Date(todayKey())) / 86400000);
  const when = daysTo > 1 ? `${daysTo} days to go` : daysTo === 1 ? "Tomorrow!" : daysTo === 0 ? "Today!" : "Celebrations continue";
  document.body.classList.add("festival");
  document.body.style.setProperty("--fest-a", f.colors[0]);
  document.body.style.setProperty("--fest-b", f.colors[1]);
  $("festivalTag").hidden = false;
  $("festivalTag").textContent = `${f.icon} ${f.name} Special · ${when}`;
  $("heroTitle").textContent = f.headline;
  $("heroText").textContent = `Festive gifts and essentials, delivered fast. Free delivery on orders above ${rupees(FREE_DELIVERY_ABOVE)}.`;
  $("festivalPicksTitle").textContent = `${f.icon} ${f.name} gift picks`;
  $("festivalStrip").innerHTML = productsFrom(f.picks).map(miniCardHTML).join("");
  $("festivalPicks").hidden = false;
  $("giftBox").open = true;
  $("giftMessage").placeholder = `${f.greeting || `Happy ${f.name}!`} Lots of love…`;
}

// ---------- Show the tools only while browsing (not while searching) ----------
document.addEventListener("products:rendered", () => {
  const browsing = isHomeView();
  $("tools").hidden = !browsing;
  if (document.body.classList.contains("festival")) $("festivalPicks").hidden = !browsing;
});

// ---------- Start ----------
if (loadValue("shopeasy-easy") === "1") setEasy(true, false);
applyFestival();
// A product page opened straight from a link was shown before this file loaded
if (productOpen !== null) renderBargain(findProduct(productOpen));
checkRestock();
checkSharedCart();
document.dispatchEvent(new CustomEvent("products:rendered"));
