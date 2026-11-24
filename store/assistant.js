// =====================================================================
// SHOPEASY SHOPPING ASSISTANT
// A chat window customers open from the "Ask ShopEasy" button. They can type or speak
// (English or Hinglish) to: ask about products, search, add/remove items, see the cart,
// apply coupons, check out, track orders, ask about delivery/COD/returns, and reach a person
// on WhatsApp. It runs entirely in the browser using the store's own search, cart and order
// code: no server and no AI service, so it's free and instant.
// =====================================================================
(() => {
  const el = (id) => document.getElementById(id);
  const panel = el("assistant"), log = el("asLog"), form = el("asForm"), input = el("asText");
  const launcher = el("chatBtn");
  const STORE_KEY = "shopeasy-chat";
  const MAX_SAVED = 50;

  // Extra icons for the chat window
  Object.assign(ICON_PATHS, {
    send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  });
  el("asSend").innerHTML = icon("send");
  el("asMic").innerHTML = icon("mic");
  el("asSpeak").innerHTML = icon("volume");
  el("asReset").innerHTML = icon("refresh");
  el("asClose").innerHTML = icon("close");

  // ---------------------------------------------------------------
  // Words the assistant understands (English + Hinglish)
  // ---------------------------------------------------------------
  const has = (t, re) => re.test(t);
  const RE = {
    greet: /^(hi+|hello|hey|hlo|namaste|namaskar|hola|good (morning|afternoon|evening)|sat sri akal|salaam)\b/,
    thanks: /\b(thanks?|thank you|thx|shukriya|dhanyavaad|dhanyawad)\b/,
    bye: /^(bye|goodbye|ok bye|alvida|see you)\b/,
    help: /\b(help|what can you do|madad|kya kar sakte|how (do|does) (this|it) work)\b/,
    human: /\b(human|real person|person|agent|insaan|customer care|support team|talk to (someone|team|you)|call (me|you)|baat kar\w*|whatsapp)\b/,
    apply: /\bapply\s+([a-z0-9]{3,})\b/i,
    cancel: /\bcancel\w*\b/,
    track: /\b(track\w*|order status|status of my order|where is my order|mera order|my orders?|kab aayega|kahan hai|delivery status)\b/,
    remove: /\b(remove|hata\w*|delete|nikal\w*)\b/,
    compare: /\b(compare|vs\.?|versus|difference between|better between)\b/,
    add: /\b(add|daal\w*|dal do|dalo|buy|order|chahiye|chaiye|lena|le lo|lelo|kharid\w*|put|want|need)\b/,
    question: /\b(how much|price|prices|kitne|kitna|kitni|cost|costs|rate|daam|detail|details|about|tell|batao|bataiye|info|rating|ratings|review|reviews|good|accha|acha|achha|worth|deliver\w*|kab|arrive|aayega|warranty|guarantee|return|returnable|discount|offer|available|stock|size|colou?r)\b/,
    checkout: /\b(checkout|check out|place (my |the )?order|order (karo|kar do|place|now)|pay now|payment|confirm (my |the )?order|buy now)\b/,
    cart: /\b(cart|basket|bag)\b/,
    festival: /\b(festival|festive|diwali|holi|eid|navratri|dussehra|rakhi|raksha|christmas|guru nanak|gurpurab|lohri|sankranti|pongal|onam|ganesh|janmashtami|karwa)\b/,
    deal: /\b(deal|deals|aaj ka offer)\b/,
    coupons: /\b(coupons?|offers?|discounts?|promo|codes?|sale)\b/,
    delivery: /\b(deliver\w*|shipping|ship|kab tak|how long)\b/,
    cod: /\b(cod|cash on delivery|cash)\b/,
    returns: /\b(return\w*|refund\w*|exchange|replace\w*)\b/,
    payment: /\b(pay|payment|upi|card|netbanking)\b/,
  };
  // Words that are about the request, not the product, so they're removed before searching
  const STOP = new Set(("add daal daalo dalo daldo buy order chahiye chaiye lena le lo lelo kharid kharido kharidna put want need " +
    "remove hata hatao delete nikal nikalo compare vs versus difference between better " +
    "price prices kitne kitna kitni cost costs rate daam detail details about tell batao bataiye info rating ratings review reviews " +
    "good accha acha achha worth delivery deliver delivered kab tak arrive aayega warranty guarantee return returnable discount offer " +
    "available stock size color colour is are was the a an of for on in into to my me mujhe please pls plz can could you u i " +
    "show dikhao dikha do de dena kar karo kardo karna it its this that what whats how much many any some hai h kya ka ki ke " +
    "and aur or ya with also cart basket bag item items piece pieces pcs qty quantity " +
    // question and filler words
    "does do did have has had will would should could there get got give which who when where why much " +
    "hain milega milegi mil sakta sakti sakte din days time long kab tak se " +
    // units, so "2 kilo aam" means mangoes
    "kilo kilos kg kgs gram grams gm litre litres liter liters ltr ml packet packets pack packs dozen box boxes " +
    // policy words (otherwise "policy" can be mistaken for "polish")
    "policy policies rule rules terms help shipping").split(" "));
  const NUM_WORDS = { one: 1, ek: 1, two: 2, teen: 3, three: 3, char: 4, chaar: 4, four: 4, paanch: 5, panch: 5, five: 5,
    chhe: 6, six: 6, saat: 7, seven: 7, aath: 8, eight: 8, nau: 9, nine: 9, das: 10, ten: 10 };
  const PRICE_PHRASE = /(under|below|less than|within|upto|up to|above|over|more than|neeche)\s*₹?\s*\d+k?|₹?\s*\d+k?\s*(ke andar|ke neeche|se kam|se upar|se zyada|tak|rs|rupees|rupaye)/g;

  // Pull out a quantity like "2", "two" or "do" (only numbers 1–10, never a price)
  function takeQty(text) {
    const noPrice = text.replace(PRICE_PHRASE, " ");
    const m = noPrice.match(/(?:^|\s)(?:x\s?)?(\d{1,2})(?:\s?x)?(?=\s|$)/);
    if (m && +m[1] >= 1 && +m[1] <= 10) return { qty: +m[1], rest: text.replace(m[0], " ") };
    for (const w of noPrice.split(/\s+/)) if (NUM_WORDS[w]) return { qty: NUM_WORDS[w], rest: text.replace(new RegExp(`\\b${w}\\b`), " ") };
    return { qty: 1, rest: text };
  }
  // What's left after removing request words, e.g. "add 2 mangoes please" → "mangoes"
  function productQuery(text) {
    const keepPrice = (text.match(PRICE_PHRASE) || []).join(" ");
    const core = text.replace(PRICE_PHRASE, " ").split(/[^a-z0-9₹-]+/).filter((w) => w && !STOP.has(w)).join(" ");
    return (core + " " + keepPrice).trim();
  }
  // Find products for a query; returns { list, one } where one is set when it's clearly a single product
  function findProducts(q, within) {
    if (!q || !words(q).length) return { list: [], one: null };
    let { list } = smartSearch(q);
    // Nothing for the whole phrase? Try word by word and keep the products matching the most words
    if (!list.length) {
      const score = new Map();
      words(q).filter((w) => w.length >= 3 && !STOP.has(w))
        .forEach((w) => smartSearch(w).list.forEach((p) => score.set(p.id, (score.get(p.id) || 0) + 1)));
      const best = Math.max(0, ...score.values());
      if (best) list = PRODUCTS.filter((p) => score.get(p.id) === best);
    }
    if (within) list = list.filter((p) => within.includes(p.id));
    if (list.length === 1) return { list, one: list[0] };
    const qn = words(q).join(" ");
    const exact = list.find((p) => words(p.name).join(" ") === qn) || list.find((p) => words(p.name).join(" ").startsWith(qn) && qn.length > 3);
    return { list, one: exact || null };
  }

  // ---------------------------------------------------------------
  // Building replies
  // ---------------------------------------------------------------
  const chip = (label, say) => ({ label, say });
  const chipAction = (label, action) => ({ label, action });
  const MAIN_CHIPS = [chip("🔥 Deal of the day", "deal of the day"), chip("🛒 My cart", "show my cart"), chip("🏷️ Offers", "offers"),
    chip("📦 Track order", "track my order"), chip("🚚 Delivery info", "delivery info"), chipAction("👤 Talk to a person", "human")];

  const off = (p) => discountPct(p);
  const daysLabel = (p) => { const d = (CATEGORY_INFO[p.cat] || {}).deliveryDays || [3, 5]; return `${d[0]}–${d[1]} days`; };
  function deliveryDate(p) {
    const days = ((CATEGORY_INFO[p.cat] || {}).deliveryDays || [3, 5])[1];
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }
  const priceLine = (p) => `${rupees(effectivePrice(p))}${off(p) > 0 ? ` <s>${rupees(p.mrp)}</s> <span class="as-off">${off(p)}% off</span>` : ""}`;

  function cardHTMLFor(p) {
    return `<div class="as-prod" data-as-prod="${p.id}">
      <a class="as-pic" href="#p/${p.id}" aria-label="View ${escapeHTML(p.name)}">${pic(p)}</a>
      <div class="as-info"><a class="as-name" href="#p/${p.id}">${escapeHTML(p.name)}</a>
        <span class="as-price">${priceLine(p)}</span><span class="as-meta">★ ${p.rating.toFixed(1)} · ${catName(p.cat)}</span></div>
      <button type="button" class="as-add" data-as-add="${p.id}">${addLabel(p.id)}</button>
    </div>`;
  }
  const addLabel = (id) => (cart[id] ? `In cart (${cart[id]})` : "Add");

  function detailsHTML(p) {
    const info = CATEGORY_INFO[p.cat] || { highlights: [] };
    const free = p.price >= FREE_DELIVERY_ABOVE;
    return `<div class="as-detail">
      <div class="as-detail-top"><span class="as-pic big">${pic(p)}</span>
        <div><b>${escapeHTML(p.name)}</b><span class="as-price">${priceLine(p)}</span><span class="as-meta">★ ${p.rating.toFixed(1)} rating · ${catName(p.cat)}</span></div></div>
      <ul>${info.highlights.map((h) => `<li>${escapeHTML(h)}</li>`).join("")}
        <li>${free ? "FREE delivery" : `Delivery ${rupees(DELIVERY_FEE)} (free above ${rupees(FREE_DELIVERY_ABOVE)})`} by ${deliveryDate(p)}</li></ul>
      <div class="as-detail-btns"><button type="button" class="as-add" data-as-add="${p.id}">${addLabel(p.id)}</button>
        <a class="as-link-btn" href="#p/${p.id}">View details</a></div>
    </div>`;
  }

  function cartSummary() {
    const entries = Object.entries(cart).filter(([id]) => findProduct(+id));
    if (!entries.length) return { text: "Your cart is empty. Tell me what you'd like, for example <b>“add earbuds”</b> or <b>“show me sarees”</b>.", say: "Your cart is empty.", chips: MAIN_CHIPS.slice(0, 3) };
    const t = cartTotals();
    const lines = entries.map(([id, q]) => { const p = findProduct(+id); return `<li>${escapeHTML(p.name)} × ${q}<span>${rupees(effectivePrice(p) * q)}</span></li>`; }).join("");
    return {
      text: `Here's your cart:<ul class="as-lines">${lines}
        ${t.couponDiscount ? `<li class="as-save">Coupon ${coupon}<span>− ${rupees(t.couponDiscount)}</span></li>` : ""}
        <li>Delivery<span>${t.delivery ? rupees(t.delivery) : "FREE"}</span></li>
        <li class="as-total">Total<span>${rupees(t.total)}</span></li></ul>
        ${t.delivery ? `Add ${rupees(FREE_DELIVERY_ABOVE - t.subtotal)} more for free delivery.` : ""}`,
      say: `You have ${t.count} items. Total ${t.total} rupees.`,
      chips: [chipAction("✅ Checkout", "checkout"), chipAction("🛒 Open cart", "cart"), chip("🏷️ Offers", "offers")],
    };
  }

  function whatsappHref(note) {
    const n = String(STORE_WHATSAPP || "").replace(/\D/g, "");
    return n ? `https://wa.me/${n}?text=${encodeURIComponent("Hi ShopEasy! " + (note || "I need some help."))}` : "";
  }

  let lastUserText = "";

  // ---------------------------------------------------------------
  // Understanding a message → a reply { text, say, cards, chips }
  // ---------------------------------------------------------------
  function respond(raw) {
    const t = raw.toLowerCase().replace(/[?!.,]+/g, " ").replace(/\s+/g, " ").trim();
    if (!t) return null;

    if (RE.greet.test(t) && t.split(" ").length <= 4) return {
      text: "Namaste! 🙏 What can I help you with today? You can ask about a product, search, or order right here.",
      say: "Namaste! What can I help you with today?", chips: MAIN_CHIPS };
    if (RE.bye.test(t)) return { text: "Thank you for visiting ShopEasy! Come back anytime. 🙏", say: "Thank you for visiting ShopEasy!" };
    if (RE.thanks.test(t) && t.split(" ").length <= 5) return { text: "You're welcome! Anything else I can help with?", say: "You're welcome!", chips: MAIN_CHIPS.slice(0, 4) };
    if (RE.help.test(t)) return helpReply();
    if (RE.human.test(t)) return humanReply();

    // apply a coupon: "apply FIRST10"
    const ap = raw.match(RE.apply);
    if (ap) return applyCouponReply(ap[1].toUpperCase());

    if (RE.cancel.test(t) && /order/.test(t)) return {
      text: "To cancel an order, please message our team with your order ID. Orders can be cancelled free of charge before they're shipped.",
      say: "To cancel an order, please message our team on WhatsApp.", chips: [chipAction("👤 Talk to a person", "human"), chip("📦 Track order", "track my order")] };
    if (RE.track.test(t) && !RE.add.test(t.replace(/my orders?|mera order/g, ""))) return trackReply();

    // remove from cart: "remove mangoes"
    if (RE.remove.test(t)) {
      const ids = Object.keys(cart).map(Number);
      const { list, one } = findProducts(productQuery(t), ids);
      const p = one || (list.length === 1 ? list[0] : null);
      if (!ids.length) return { text: "Your cart is already empty.", say: "Your cart is already empty." };
      if (!p) return { text: list.length ? "Which one should I remove?" : "I couldn't find that in your cart. Here's what's in it:", cards: list.length ? list.slice(0, 4).map((x) => x.id) : ids.slice(0, 6), say: "Which item should I remove?" };
      const q = cart[p.id];
      changeQty(p.id, -q);
      return { text: `Removed <b>${escapeHTML(p.name)}</b> from your cart.`, say: `Removed ${p.name} from your cart.`, chips: [chip("🛒 My cart", "show my cart"), chip(`↩️ Add it back`, `add ${q} ${p.name}`)] };
    }

    // compare two products: "compare earbuds and speaker" / "earbuds vs speaker"
    if (RE.compare.test(t)) {
      const parts = t.replace(/\b(compare|difference between|better between)\b/g, " ").split(/\s(?:vs\.?|versus|and|aur|or|ya|with)\s/);
      const picks = parts.map((s) => findProducts(productQuery(s))).map((r) => r.one || r.list[0]).filter(Boolean);
      if (picks.length >= 2 && picks[0].id !== picks[1].id) return compareReply(picks[0], picks[1]);
      return { text: "Tell me the two products to compare, for example <b>“compare earbuds vs speaker”</b>.", say: "Which two products should I compare?" };
    }

    // add to cart: "add 2 mangoes", "mujhe earbuds chahiye"
    if (RE.add.test(t)) {
      const { qty, rest } = takeQty(t);
      const q = productQuery(rest);
      if (q) {
        const { list, one } = findProducts(q);
        const p = one || (list.length === 1 ? list[0] : null);
        if (p) return addReply(p, qty);
        if (list.length) return { text: `I found a few options. Which one would you like${qty > 1 ? ` (${qty} pieces)` : ""}?`, say: "I found a few options. Which one would you like?", cards: list.slice(0, 5).map((x) => x.id), qty };
        return notFound(q);
      }
      if (RE.checkout.test(t) || /\border\b/.test(t)) return checkoutReply();
    }

    // questions about a product: price, rating, delivery, warranty…
    if (RE.question.test(t)) {
      const q = productQuery(t);
      if (q) {
        const { list, one } = findProducts(q);
        const p = one || (list.length === 1 ? list[0] : null);
        if (p) return productAnswer(p, t);
        if (list.length > 1) return { text: "Which product do you mean?", say: "Which product do you mean?", cards: list.slice(0, 5).map((x) => x.id) };
      }
    }

    if (RE.checkout.test(t)) return checkoutReply();
    if (RE.cart.test(t)) return cartSummary();
    if (RE.festival.test(t)) return festivalReply(t);
    if (RE.deal.test(t)) return dealReply();
    if (RE.coupons.test(t)) return couponsReply();
    if (RE.cod.test(t)) return { text: `Yes, <b>Cash on Delivery</b> is available on all orders. You can also pay by UPI or card at checkout.`, say: "Yes, Cash on Delivery is available." };
    if (RE.returns.test(t)) return { text: `Most items can be returned within <b>7 days</b> of delivery, and fashion within <b>10 days</b>. Opened groceries can't be returned unless they arrived damaged. Refunds take 5–7 working days. <a href="returns.html">Full returns policy</a>`, say: "Most items can be returned within 7 days of delivery.", chips: [chipAction("👤 Start a return", "human")] };
    if (RE.delivery.test(t)) return { text: `🚚 <b>Free delivery</b> on orders above ${rupees(FREE_DELIVERY_ABOVE)} (otherwise ${rupees(DELIVERY_FEE)}).<br>Groceries arrive in 1–2 days, most other items in 3–5 days. Every product shows its delivery date before you buy.`, say: `Free delivery on orders above ${FREE_DELIVERY_ABOVE} rupees. Groceries arrive in 1 to 2 days, other items in 3 to 5 days.` };
    if (RE.payment.test(t)) return { text: "You can pay by <b>UPI</b>, <b>card</b> or <b>Cash on Delivery</b> at checkout.", say: "You can pay by UPI, card or Cash on Delivery." };

    // anything else: treat it as a product search
    const q = productQuery(t) || t;
    const { corrected } = smartSearch(q);
    const { list } = findProducts(q);
    if (list.length) return {
      text: `${corrected ? `Showing results for <b>${escapeHTML(corrected)}</b>. ` : ""}Here's what I found${list.length > 5 ? ` (top 5 of ${list.length})` : ""}:`,
      say: `I found ${list.length} products.`, cards: list.slice(0, 5).map((x) => x.id),
      chips: list.length > 5 ? [chipAction(`See all ${list.length}`, "search:" + q)] : null };
    return notFound(q);
  }

  function helpReply() {
    return {
      text: `I can help you shop by text or voice 🎤. Try:<ul class="as-tips">
        <li><b>“tell me about the silk saree”</b></li><li><b>“earbuds ka price kitna hai?”</b></li>
        <li><b>“500 ke andar t-shirt”</b></li><li><b>“add 2 mangoes”</b></li>
        <li><b>“compare earbuds vs speaker”</b></li><li><b>“show my cart”</b> or <b>“checkout”</b></li>
        <li><b>“track my order”</b></li></ul>`,
      say: "I can help you find products, answer questions, and place your order.", chips: MAIN_CHIPS };
  }
  function humanReply() {
    const href = whatsappHref(lastUserText && !RE.human.test(lastUserText.toLowerCase()) ? `I need help with: ${lastUserText}` : "");
    const n = String(STORE_WHATSAPP || "").replace(/\D/g, "");
    return {
      text: href ? `Our team is happy to help on WhatsApp${STORE_INFO.hours ? ` (${escapeHTML(STORE_INFO.hours)})` : ""}.<br><a class="as-wa" href="${href}" target="_blank" rel="noopener">${icon("chat")} Chat on WhatsApp</a><span class="as-meta">or message ${prettyPhone(n)}</span>`
        : "Our team's WhatsApp isn't set up yet. Please use the Contact page.",
      say: "Our team is happy to help you on WhatsApp." };
  }
  function addReply(p, qty) {
    const before = cart[p.id] || 0;
    if (before >= 10) return { text: `You already have the maximum (10) of <b>${escapeHTML(p.name)}</b> in your cart.`, say: "You already have the maximum of that item." };
    const add = Math.min(qty, 10 - before);
    for (let i = 0; i < add; i++) changeQty(p.id, 1);
    const tot = cartTotals();
    return {
      text: `✅ Added <b>${add} × ${escapeHTML(p.name)}</b> to your cart (${rupees(effectivePrice(p) * add)}).<br>Cart total: <b>${rupees(tot.total)}</b>${tot.delivery ? ` · add ${rupees(FREE_DELIVERY_ABOVE - tot.subtotal)} more for free delivery` : " · free delivery 🎉"}.`,
      say: `Added ${add} ${p.name} to your cart. Cart total ${tot.total} rupees.`,
      chips: [chipAction("✅ Checkout", "checkout"), chip("🛒 My cart", "show my cart"), chip(`➖ Remove`, `remove ${p.name}`)] };
  }
  function productAnswer(p, t) {
    const price = rupees(effectivePrice(p));
    let lead;
    if (/\b(warranty|guarantee)\b/.test(t)) {
      const w = (CATEGORY_INFO[p.cat] || { highlights: [] }).highlights.find((h) => /warranty|replacement/i.test(h));
      lead = w ? `<b>${escapeHTML(p.name)}</b>: ${escapeHTML(w)}.` : `<b>${escapeHTML(p.name)}</b> doesn't list a warranty. It's covered by our returns policy.`;
    } else if (/\b(return|returnable)\b/.test(t)) {
      const r = (CATEGORY_INFO[p.cat] || { highlights: [] }).highlights.find((h) => /return|exchange/i.test(h));
      lead = `<b>${escapeHTML(p.name)}</b>: ${escapeHTML(r || "returnable within 7 days of delivery, unused and in original packaging")}.`;
    } else if (/\b(deliver\w*|kab|arrive|aayega)\b/.test(t)) {
      lead = `<b>${escapeHTML(p.name)}</b> usually arrives in ${daysLabel(p)}. Order now and it should reach you by <b>${deliveryDate(p)}</b>.`;
    } else if (/\b(rating|ratings|review|reviews|good|accha|acha|achha|worth)\b/.test(t)) {
      lead = `<b>${escapeHTML(p.name)}</b> is rated <b>★ ${p.rating.toFixed(1)}</b> by customers${p.rating >= 4.5 ? ", one of our top-rated products" : p.rating >= 4 ? ", which is a good rating" : ""}.`;
    } else if (/\b(discount|offer)\b/.test(t)) {
      lead = `<b>${escapeHTML(p.name)}</b> is <b>${off(p)}% off</b> right now: ${price} instead of ${rupees(p.mrp)}. You can also use coupon <b>FIRST10</b> for 10% off your order.`;
    } else if (/\b(stock|available|size|colou?r)\b/.test(t)) {
      lead = `<b>${escapeHTML(p.name)}</b> is available to order. Size and colour options aren't listed online yet, so our team can confirm those for you on WhatsApp.`;
    } else if (/\b(how much|price|prices|kitne|kitna|kitni|cost|costs|rate|daam)\b/.test(t)) {
      lead = `<b>${escapeHTML(p.name)}</b> costs <b>${price}</b>${off(p) > 0 ? ` (${off(p)}% off the MRP of ${rupees(p.mrp)})` : ""}.`;
    } else {
      lead = `Here are the details for <b>${escapeHTML(p.name)}</b>:`;
    }
    const plain = lead.replace(/<[^>]+>/g, "");
    return { text: lead + detailsHTML(p), say: plain.replace(/₹/g, "rupees "), chips: [chip(`➕ Add ${p.name.split(" ")[0]}`, `add ${p.name}`), chip("🔍 Similar items", catName(p.cat))] };
  }
  function compareReply(a, b) {
    const row = (label, fa, fb) => `<tr><th>${label}</th><td>${fa}</td><td>${fb}</td></tr>`;
    const cheaper = effectivePrice(a) <= effectivePrice(b) ? a : b;
    const better = a.rating >= b.rating ? a : b;
    return {
      text: `<table class="as-compare"><thead><tr><th></th><th>${escapeHTML(a.name)}</th><th>${escapeHTML(b.name)}</th></tr></thead><tbody>
        ${row("Price", rupees(effectivePrice(a)), rupees(effectivePrice(b)))}
        ${row("Discount", off(a) + "%", off(b) + "%")}
        ${row("Rating", "★ " + a.rating.toFixed(1), "★ " + b.rating.toFixed(1))}
        ${row("Delivery", daysLabel(a), daysLabel(b))}</tbody></table>
        <b>${escapeHTML(cheaper.name)}</b> is cheaper${better.id === cheaper.id ? " and also better rated" : `, while <b>${escapeHTML(better.name)}</b> is better rated`}.`,
      say: `${cheaper.name} is cheaper. ${better.name} has the higher rating.`, cards: [a.id, b.id] };
  }
  function checkoutReply() {
    const entries = Object.keys(cart).filter((id) => findProduct(+id));
    if (!entries.length) return { text: "Your cart is empty, so there's nothing to check out yet. What would you like to buy?", say: "Your cart is empty.", chips: MAIN_CHIPS.slice(0, 3) };
    const s = cartSummary();
    return { text: s.text + "<br>Ready? Tap <b>Checkout</b> to enter your address and payment.", say: s.say + " Tap checkout to continue.", chips: [chipAction("✅ Checkout", "checkout"), chip("🏷️ Offers", "offers")] };
  }
  function trackReply() {
    const list = (typeof orders !== "undefined" ? orders : []).filter((o) => o && o.items && o.items.length);
    if (!list.length) return { text: "I can't find any orders placed from this device yet. If you ordered on another phone, please check there, or talk to our team.", say: "I can't find any orders on this device.", chips: [chipAction("👤 Talk to a person", "human")] };
    const o = list[0];
    const tl = orderTimeline(o);
    const done = tl.step === ORDER_STEPS.length - 1;
    return {
      text: `Your latest order <b>${escapeHTML(o.id)}</b> (${rupees(o.total)}) is <b>${ORDER_STEPS[tl.step]}</b>. ${done ? `It was delivered on ${fmtDay(tl.deliveryDay)}.` : `It should arrive by <b>${fmtDay(tl.deliveryDay)}</b>.`}${list.length > 1 ? `<br>You have ${list.length} orders in total.` : ""}`,
      say: `Your latest order is ${ORDER_STEPS[tl.step]}. ${done ? "" : "It should arrive by " + fmtDay(tl.deliveryDay)}`,
      chips: [chipAction("📦 Open My Orders", "orders"), chipAction("👤 Talk to a person", "human")] };
  }
  function couponsReply() {
    return {
      text: `Here are today's coupons:<ul class="as-tips">${COUPONS.map((c) => `<li><b>${c.code}</b>: ${escapeHTML(c.text)}</li>`).join("")}</ul>${coupon ? `You're using <b>${coupon}</b> right now.` : "Tap one to apply it."}`,
      say: "Here are today's coupons.", chips: COUPONS.map((c) => chip(`Apply ${c.code}`, `apply ${c.code}`)) };
  }
  function applyCouponReply(code) {
    const c = COUPONS.find((x) => x.code === code);
    if (!c) return { text: `“${escapeHTML(code)}” isn't a valid coupon.`, say: "That isn't a valid coupon.", chips: [chip("🏷️ See offers", "offers")] };
    applyCoupon(code);
    if (coupon === code) return { text: `🎉 <b>${code}</b> is applied: ${escapeHTML(c.text)}.`, say: `${code} is applied.`, chips: [chip("🛒 My cart", "show my cart"), chipAction("✅ Checkout", "checkout")] };
    const short = c.min - cartTotals(cart, null).subtotal;
    return { text: short > 0 ? `<b>${code}</b> needs a cart of ${rupees(c.min)}. Add ${rupees(short)} more to use it.` : `I couldn't apply <b>${code}</b>.`, say: `Add ${short} rupees more to use ${code}.` };
  }
  function dealReply() {
    const p = typeof dealProduct === "function" ? dealProduct() : null;
    if (!p) return couponsReply();
    return { text: `🔥 Today's deal: <b>${escapeHTML(p.name)}</b> at <b>${rupees(effectivePrice(p))}</b> (${off(p)}% off). Ends at midnight!`, say: `Today's deal is ${p.name}, ${off(p)} percent off.`, cards: [p.id] };
  }
  function festivalReply(t) {
    const now = typeof activeFestival === "function" ? activeFestival() : null;
    const today = new Date(todayKey());
    const asked = FESTIVALS.filter((f) => new Date(f.date) >= new Date(+today - 86400000))
      .find((f) => t.includes(f.name.toLowerCase().split(/[ &,(]/)[0]) || t.includes(f.id.split("-")[0]));
    const f = asked || now || FESTIVALS.filter((x) => new Date(x.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    if (!f) return couponsReply();
    const when = new Date(f.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const live = now && now.id === f.id;
    return {
      text: `${f.icon} <b>${escapeHTML(f.name)}</b> ${live ? "is on now!" : `is on ${when}.`} Here are our gift picks. Use coupon <b>FIRST10</b> for 10% off.`,
      say: `${f.name} ${live ? "is on now" : "is on " + when}. Here are our gift picks.`, cards: f.picks.slice(0, 5) };
  }
  function notFound(q) {
    return { text: `I couldn't find “${escapeHTML(q)}”. Try another word, like <b>“shoes”</b> or <b>“gift for mummy”</b>, or ask our team.`, say: "Sorry, I couldn't find that.", chips: [chip("🔥 Deal of the day", "deal of the day"), chipAction("👤 Talk to a person", "human")] };
  }

  // ---------------------------------------------------------------
  // Chat window: rendering, history, events
  // ---------------------------------------------------------------
  let history = [];
  try { history = JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { history = []; }
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-MAX_SAVED))); } catch (e) {} };

  function msgHTML(m) {
    if (m.who === "me") return `<div class="as-msg me"><div class="as-bubble">${escapeHTML(m.text)}</div></div>`;
    const cards = m.cards && m.cards.length ? `<div class="as-products">${m.cards.map(findProduct).filter(Boolean).map(cardHTMLFor).join("")}</div>` : "";
    const chips = m.chips && m.chips.length ? `<div class="as-chips">${m.chips.map((c) => c.action
      ? `<button type="button" class="as-chip" data-as-action="${c.action}">${escapeHTML(c.label)}</button>`
      : `<button type="button" class="as-chip" data-as-say="${escapeHTML(c.say)}">${escapeHTML(c.label)}</button>`).join("")}</div>` : "";
    return `<div class="as-msg bot"><span class="as-mini" aria-hidden="true">SE</span><div class="as-col"><div class="as-bubble">${m.text}</div>${cards}${chips}</div></div>`;
  }
  function render() {
    log.innerHTML = history.map(msgHTML).join("");
    log.scrollTop = log.scrollHeight;
  }
  function push(m) {
    history.push(m);
    save();
    log.insertAdjacentHTML("beforeend", msgHTML(m));
    log.scrollTop = log.scrollHeight;
  }
  function welcome() {
    push({ who: "bot", text: "Namaste! 🙏 I'm the <b>ShopEasy assistant</b>. Ask me about any product, or tell me what to add to your cart. You can type or tap 🎤 to speak.", chips: MAIN_CHIPS,
      say: "Namaste! I'm the ShopEasy assistant. Ask me about any product, or tell me what to add to your cart." });
  }

  let typingTimer = null;
  function send(text) {
    const clean = String(text || "").trim().slice(0, 200);
    if (!clean) return;
    push({ who: "me", text: clean });
    input.value = "";
    log.insertAdjacentHTML("beforeend", `<div class="as-msg bot as-typing-row"><span class="as-mini" aria-hidden="true">SE</span><div class="as-bubble as-typing"><i></i><i></i><i></i></div></div>`);
    log.scrollTop = log.scrollHeight;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      const row = log.querySelector(".as-typing-row");
      if (row) row.remove();
      let reply;
      try { reply = respond(clean); } catch (e) { console.error(e); reply = { text: "Sorry, something went wrong. Please try again or talk to our team.", chips: [chipAction("👤 Talk to a person", "human")] }; }
      lastUserText = clean;
      if (reply) { push({ who: "bot", text: reply.text, cards: reply.cards, chips: reply.chips }); speak(reply.say || reply.text); }
    }, 420);
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });

  log.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-as-add]");
    if (addBtn) {
      const p = findProduct(+addBtn.dataset.asAdd);
      if (p) { const r = addReply(p, 1); lastUserText = `add ${p.name}`; push({ who: "bot", text: r.text, chips: r.chips }); speak(r.say); }
      return;
    }
    const sayBtn = e.target.closest("[data-as-say]");
    if (sayBtn) { send(sayBtn.dataset.asSay); return; }
    const act = e.target.closest("[data-as-action]");
    if (act) {
      const a = act.dataset.asAction;
      if (a === "checkout") {
        if (!Object.keys(cart).length) { send("checkout"); return; }
        closePanel(); openCheckout();
      } else if (a === "cart") { openCart(); }
      else if (a === "orders") { openOrders(); }
      else if (a === "human") { const r = humanReply(); push({ who: "bot", text: r.text }); speak(r.say); }
      else if (a.startsWith("search:")) {
        closePanel();
        query = a.slice(7); el("search").value = query; renderProducts();
        const top = el("allProductsHead").getBoundingClientRect().top + scrollY - 90;
        scrollTo({ top, behavior: "smooth" });
      }
      return;
    }
    // product links open the product page above the chat
  });

  // keep "Add" / "In cart (n)" labels current
  document.addEventListener("cart:updated", () => {
    log.querySelectorAll("[data-as-add]").forEach((b) => { b.textContent = addLabel(+b.dataset.asAdd); b.classList.toggle("in", !!cart[+b.dataset.asAdd]); });
  });

  // ----- open / close -----
  function openPanel() {
    panel.hidden = false;
    document.body.classList.add("as-open");
    launcher.setAttribute("aria-expanded", "true");
    hideHint(true);
    if (!history.length) welcome(); else render();
    setTimeout(() => input.focus(), 60);
  }
  function closePanel() {
    panel.hidden = true;
    document.body.classList.remove("as-open");
    launcher.setAttribute("aria-expanded", "false");
    stopListening();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
  launcher.addEventListener("click", () => (panel.hidden ? openPanel() : closePanel()));
  el("asClose").addEventListener("click", () => { closePanel(); launcher.focus(); });
  el("asReset").addEventListener("click", () => { history = []; save(); log.innerHTML = ""; welcome(); input.focus(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || panel.hidden) return;
    const overlayOpen = document.querySelector(".modal.open, .drawer.open");
    if (overlayOpen) return; // let the store close the window on top first
    e.stopImmediatePropagation();
    closePanel(); launcher.focus();
  }, true);

  // ----- first-visit hint -----
  const hint = el("asHint");
  let hintSeen = false;
  try { hintSeen = localStorage.getItem("shopeasy-chat-hint") === "1"; } catch (e) {}
  function hideHint(remember) {
    hint.hidden = true;
    if (remember) { try { localStorage.setItem("shopeasy-chat-hint", "1"); } catch (e) {} }
  }
  el("asHintClose").addEventListener("click", () => hideHint(true));
  if (!hintSeen) setTimeout(() => { if (panel.hidden) hint.hidden = false; }, 5000);

  // ---------------------------------------------------------------
  // Voice: speak to type, and optional spoken replies
  // ---------------------------------------------------------------
  const mic = el("asMic");
  let rec = null;
  function stopListening() {
    if (rec) { try { rec.stop(); } catch (e) {} }
    rec = null;
    mic.classList.remove("listening");
    input.placeholder = "Ask about a product, or say “add 2 mangoes”";
  }
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  mic.hidden = !Speech;
  mic.addEventListener("click", () => {
    if (rec) { stopListening(); return; }
    const S = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!S) { toast("Voice isn't supported in this browser. Please type instead."); return; }
    rec = new S();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.onresult = (e) => {
      const said = [...e.results].map((r) => r[0].transcript).join(" ").replace(/[.?!,]+$/g, "").trim();
      input.value = said;
      if (e.results[e.results.length - 1].isFinal) { stopListening(); send(said); }
    };
    rec.onerror = (e) => {
      const msg = { "not-allowed": "Microphone access was blocked. Allow it in your browser to speak.", "service-not-allowed": "Microphone access was blocked. Allow it in your browser to speak.",
        "no-speech": "I didn't hear anything. Tap 🎤 and try again.", network: "Voice needs an internet connection.", "audio-capture": "No microphone found." }[e.error];
      if (e.error !== "aborted") toast(msg || "Voice stopped. Please try again.");
    };
    rec.onend = () => { if (rec) stopListening(); };
    try { rec.start(); mic.classList.add("listening"); input.placeholder = "Listening… speak now"; }
    catch (err) { stopListening(); toast("Couldn't start the microphone. Please try again."); }
  });

  let speakOn = false;
  try { speakOn = localStorage.getItem("shopeasy-chat-speak") === "1"; } catch (e) {}
  const speakBtn = el("asSpeak");
  const syncSpeakBtn = () => { speakBtn.setAttribute("aria-pressed", speakOn); speakBtn.classList.toggle("on", speakOn); speakBtn.title = speakOn ? "Spoken replies on" : "Read replies aloud"; };
  syncSpeakBtn();
  speakBtn.addEventListener("click", () => {
    speakOn = !speakOn;
    try { localStorage.setItem("shopeasy-chat-speak", speakOn ? "1" : "0"); } catch (e) {}
    syncSpeakBtn();
    if (!speakOn && "speechSynthesis" in window) speechSynthesis.cancel();
    toast(speakOn ? "🔊 I'll read my replies aloud" : "Spoken replies off");
  });
  function speak(text) {
    if (!speakOn || !("speechSynthesis" in window) || !text) return;
    const plain = String(text).replace(/<[^>]+>/g, " ").replace(/₹\s?/g, "rupees ").replace(/\s+/g, " ").trim();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plain);
    u.lang = "en-IN"; u.rate = 1;
    speechSynthesis.speak(u);
  }

  // for testing in the browser console
  window.ShopEasyAssistant = { respond, open: openPanel, close: closePanel, send };
})();
