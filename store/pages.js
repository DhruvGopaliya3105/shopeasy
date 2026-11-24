// =====================================================================
// SHARED SCRIPT FOR THE INFO PAGES (About, Contact, Privacy, Terms,
// Returns, Shipping). Adds the header and footer, fills in your business
// details from STORE_INFO in products.js, and follows the dark mode setting.
// =====================================================================

const rupeesP = (n) => "₹" + Number(n).toLocaleString("en-IN");
const waDigits = String(typeof STORE_WHATSAPP !== "undefined" ? STORE_WHATSAPP : "").replace(/\D/g, "");
const waDisplay = waDigits.length === 12 && waDigits.startsWith("91")
  ? `+91 ${waDigits.slice(2, 7)} ${waDigits.slice(7)}` : (waDigits ? "+" + waDigits : "");
const days = (cat) => { const d = (CATEGORY_INFO[cat] || {}).deliveryDays || [3, 5]; return `${d[0]}–${d[1]} days`; };

// Values the pages can show with <span data-info="…"></span>
const INFO = {
  brand: "ShopEasy",
  ...STORE_INFO,
  whatsapp: waDisplay,
  freeAbove: rupeesP(FREE_DELIVERY_ABOVE),
  deliveryFee: rupeesP(DELIVERY_FEE),
  daysGrocery: days("grocery"),
  daysBeauty: days("beauty"),
  daysHome: days("home"),
  daysOther: days("electronics"),
  year: String(new Date().getFullYear()),
};
const MISSING_LABEL = {
  legalName: "your registered business name", address: "your business address", email: "your support email",
  gstin: "your GSTIN", grievanceOfficer: "the grievance officer's name", grievanceEmail: "the grievance officer's email",
  jurisdiction: "your city", whatsapp: "your WhatsApp number", hours: "your support hours",
};

document.querySelectorAll("[data-info]").forEach((el) => {
  const key = el.dataset.info;
  const value = INFO[key];
  if (value) {
    if (el.tagName === "A" && key === "email") el.href = `mailto:${value}`;
    el.textContent = value;
  } else {
    el.innerHTML = `<mark class="todo">[Add ${MISSING_LABEL[key] || key}]</mark>`;
  }
});
// Hide optional rows (like GSTIN) when there's nothing to show
document.querySelectorAll("[data-if]").forEach((el) => { if (!INFO[el.dataset.if]) el.hidden = true; });

// ---------- Theme (same choice as the shop) ----------
let theme = null;
try { theme = localStorage.getItem("shopeasy-theme"); } catch (e) {}
document.documentElement.setAttribute("data-theme", theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

// ---------- Favicon ----------
const fav = document.createElement("link");
fav.rel = "icon";
fav.href = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0f1b2d"/><text x="32" y="42" font-family="Georgia,serif" font-size="28" font-weight="700" text-anchor="middle" fill="#c9a050">SE</text></svg>');
document.head.appendChild(fav);

// ---------- Header ----------
const here = location.pathname.split("/").pop();
document.getElementById("siteTop").innerHTML = `
  <header class="header page-header">
    <div class="container header-inner">
      <a href="index.html" class="logo" aria-label="ShopEasy home">
        <span class="logo-mark" aria-hidden="true">SE</span><span class="logo-word">Shop<span>Easy</span></span>
      </a>
      <a class="btn hero-cta back-shop" href="index.html">← Back to shop</a>
    </div>
  </header>`;

// ---------- Footer (also used on the shop page) ----------
function footerLinksHTML(onShop) {
  const shop = onShop ? "" : "index.html";
  const link = (href, text) => `<a href="${href}" ${href === here ? 'aria-current="page"' : ""}>${text}</a>`;
  return `
    <div class="footer-cols">
      <div><h4>Shop</h4>${link(shop + "#faq", "FAQ")}${link(onShop ? "#" : "index.html?open=orders", "My Orders")}${link("about.html", "About us")}</div>
      <div><h4>Help</h4>${link("contact.html", "Contact us")}${link("shipping.html", "Shipping policy")}${link("returns.html", "Returns &amp; refunds")}</div>
      <div><h4>Legal</h4>${link("privacy.html", "Privacy policy")}${link("terms.html", "Terms of use")}</div>
      <div><h4>Talk to us</h4>
        ${INFO.whatsapp ? `<a href="https://wa.me/${waDigits}" target="_blank" rel="noopener">WhatsApp ${INFO.whatsapp}</a>` : ""}
        ${INFO.email ? `<a href="mailto:${INFO.email}">${INFO.email}</a>` : ""}
        <span>${INFO.hours || ""}</span>
      </div>
    </div>
    <p class="footer-legal">© ${INFO.year} ShopEasy${INFO.legalName ? " · " + INFO.legalName : ""}${INFO.gstin ? " · GSTIN " + INFO.gstin : ""}. All rights reserved.</p>`;
}
const footerSlot = document.getElementById("siteFooter");
if (footerSlot) footerSlot.innerHTML = `<footer class="footer"><div class="container">${footerLinksHTML(false)}</div></footer>`;

// ---------- Contact form: sends the message on WhatsApp ----------
const form = document.getElementById("contactForm");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.cName.value.trim(), order = form.cOrder.value.trim(), msg = form.cMsg.value.trim();
    const err = document.getElementById("cError");
    if (!name || !msg) { err.textContent = "Please add your name and message."; (name ? form.cMsg : form.cName).focus(); return; }
    err.textContent = "";
    if (!waDigits) { err.textContent = "WhatsApp isn't set up yet. Please email us instead."; return; }
    const text = `Hi ShopEasy! I'm ${name}.${order ? ` Order ID: ${order}.` : ""}\n\n${msg}`;
    window.open(`https://wa.me/${waDigits}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  });
}
