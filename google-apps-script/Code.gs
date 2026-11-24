/**
 * SHOPEASY ORDER SERVICE (Google Apps Script)
 * ===========================================
 * Every time a customer places an order on the store, this script:
 *   1. emails a receipt to THAT customer, at the email they typed at checkout,
 *   2. emails the full order to you,
 *   3. adds the order as a new row in this Google Sheet (tab "Orders").
 *
 * Setup steps are in SETUP-EMAIL-RECEIPTS.md. You don't need to change anything below
 * except, optionally, the settings at the top.
 */

// ---------------- SETTINGS ----------------
const STORE_KEY = "se_76845dcaff37fe0e06da6bb8871acc87e8bc"; // must match ORDER_EMAIL_KEY in store/products.js
const OWNER_EMAIL = "";            // where order emails go. Empty = the Google account that owns this script
const STORE_NAME = "ShopEasy";
const SHEET_NAME = "Orders";

// Simple protection against spam (fake orders sent straight to this script)
const MAX_ORDERS_PER_10_MIN = 30;
const MAX_RECEIPTS_PER_EMAIL_PER_HOUR = 5;
// ------------------------------------------

const HEADERS = ["Date", "Order ID", "Status", "Name", "Phone", "Email", "Address", "City", "PIN",
  "Items", "Total (₹)", "Payment", "Paid online?", "Coupon", "Arriving by", "Gift message", "Customer emailed?"];

/** Receives orders from the store. */
function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (data.key !== STORE_KEY) return reply_({ ok: false, error: "Wrong store key" });
    const o = clean_(data);
    if (!o) return reply_({ ok: false, error: "Order details are missing or invalid" });
    if (!allow_("all-orders", MAX_ORDERS_PER_10_MIN, 600)) return reply_({ ok: false, error: "Too many orders right now" });

    const owner = OWNER_EMAIL || Session.getEffectiveUser().getEmail();

    // 1. Receipt to the customer, at their own email
    let customerEmailed = false;
    if (o.customer.email && allow_("receipt:" + o.customer.email.toLowerCase(), MAX_RECEIPTS_PER_EMAIL_PER_HOUR, 3600)) {
      MailApp.sendEmail({
        to: o.customer.email,
        subject: `Your ${STORE_NAME} order ${o.order.id}: receipt`,
        htmlBody: receiptHtml_(o),
        body: receiptText_(o),
        name: STORE_NAME,
        replyTo: owner,
      });
      customerEmailed = true;
    }

    // 3. Row in the sheet (locked so two orders at once don't clash)
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try { addRow_(o, customerEmailed); } finally { lock.releaseLock(); }

    // 2. Order email to you
    const ownerMail = {
      to: owner,
      subject: `🛍️ New order ${o.order.id} · ₹${money_(o.order.total)} · ${o.customer.name}`,
      htmlBody: ownerHtml_(o, customerEmailed),
      body: receiptText_(o),
      name: STORE_NAME + " orders",
    };
    if (o.customer.email) ownerMail.replyTo = o.customer.email;
    MailApp.sendEmail(ownerMail);

    return reply_({ ok: true, customerEmailed: customerEmailed });
  } catch (err) {
    console.error(err);
    return reply_({ ok: false, error: String(err) });
  }
}

/** Opening the Web app link in a browser just shows that it's running. */
function doGet() {
  return ContentService.createTextOutput(STORE_NAME + " order service is running.");
}

/**
 * RUN THIS ONCE from the Apps Script editor (select "testSetup" and click Run).
 * It asks for permission, creates the "Orders" sheet and emails YOU a sample order and receipt.
 */
function testSetup() {
  const owner = OWNER_EMAIL || Session.getEffectiveUser().getEmail();
  const sample = clean_({
    key: STORE_KEY,
    order: { id: "SE-TEST-0001", date: new Date().toISOString(), method: "Cash on Delivery", paid: false,
      items: [{ name: "Wireless Earbuds", qty: 1, price: 1499 }, { name: "Alphonso Mangoes (1 kg)", qty: 2, price: 199 }],
      coupon: "FIRST10", couponDiscount: 190, delivery: 0, total: 1707, eta: "in 3–5 days", giftMessage: "" },
    customer: { name: "Test Customer", phone: "9876543210", email: owner, address: "12 MG Road", city: "Pune", pin: "411001" },
    store: { name: STORE_NAME, whatsapp: "", url: "" },
  });
  addRow_(sample, true);
  MailApp.sendEmail({ to: owner, subject: `[TEST] Your ${STORE_NAME} order ${sample.order.id}: receipt`, htmlBody: receiptHtml_(sample), body: receiptText_(sample), name: STORE_NAME });
  MailApp.sendEmail({ to: owner, subject: `[TEST] 🛍️ New order ${sample.order.id}`, htmlBody: ownerHtml_(sample, true), body: receiptText_(sample), name: STORE_NAME + " orders" });
  Logger.log("Done! Check your email (" + owner + ") and the Orders sheet. Emails left today: " + MailApp.getRemainingDailyQuota());
}

// =====================================================================
// Helpers
// =====================================================================

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Checks and tidies everything the store sent. Returns null if it isn't a sensible order. */
function clean_(d) {
  const str = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
  const num = (v) => { const n = Number(v); return isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0; };
  const o = d.order || {}, c = d.customer || {}, s = d.store || {};
  const items = (Array.isArray(o.items) ? o.items : []).slice(0, 50).map((it) => ({
    name: str(it.name, 120), qty: Math.min(Math.max(parseInt(it.qty, 10) || 1, 1), 99), price: num(it.price),
  })).filter((it) => it.name);
  const email = str(c.email, 120);
  const phone = str(c.phone, 15).replace(/\D/g, "");
  const out = {
    order: {
      id: str(o.id, 30), date: str(o.date, 40), method: str(o.method, 40), paid: !!o.paid, items: items,
      coupon: str(o.coupon, 30), couponDiscount: num(o.couponDiscount), delivery: num(o.delivery), total: num(o.total),
      eta: str(o.eta, 40), giftMessage: str(o.giftMessage, 200),
    },
    customer: {
      name: str(c.name, 80), phone: phone, email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : "",
      address: str(c.address, 200), city: str(c.city, 60), pin: str(c.pin, 10).replace(/\D/g, ""),
    },
    store: { name: str(s.name, 40) || STORE_NAME, whatsapp: str(s.whatsapp, 25), url: str(s.url, 200) },
  };
  if (!out.order.id || !items.length || !out.customer.name || !/^[6-9]\d{9}$/.test(phone)) return null;
  // The store works out prices in the customer's browser, so double-check they add up
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  out.order.subtotal = subtotal;
  out.order.totalsMatch = Math.abs(subtotal - out.order.couponDiscount + out.order.delivery - out.order.total) < 1;
  return out;
}

/** Allows at most `max` uses of `key` per `seconds`. */
function allow_(key, max, seconds) {
  const cache = CacheService.getScriptCache();
  const k = "rl:" + key.slice(0, 200);
  const n = Number(cache.get(k) || 0);
  if (n >= max) return false;
  cache.put(k, String(n + 1), seconds);
  return true;
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#0f1b2d").setFontColor("#ffffff");
    sh.setFrozenRows(1);
  }
  return sh;
}

function addRow_(o, customerEmailed) {
  const sh = sheet_();
  const items = o.order.items.map((it) => `${it.name} × ${it.qty}`).join(", ");
  // a leading ' keeps phone numbers and PIN codes as text (no lost zeros, no scientific notation)
  sh.appendRow([
    new Date(), o.order.id, "New", o.customer.name, "'" + o.customer.phone, o.customer.email,
    o.customer.address, o.customer.city, "'" + o.customer.pin, items, o.order.total, o.order.method,
    o.order.paid ? "Yes" : "No (pay on delivery)", o.order.coupon, o.order.eta, o.order.giftMessage,
    customerEmailed ? "Yes" : "No",
  ]);
}

const money_ = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const esc_ = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

function linesHtml_(o) {
  const row = (l, r, bold) => `<tr><td style="padding:6px 0;color:#5c6577">${l}</td><td style="padding:6px 0;text-align:right;${bold ? "font-weight:700;font-size:17px;color:#13203a" : ""}">${r}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
    ${o.order.items.map((it) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc_(it.name)} × ${it.qty}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">₹${money_(it.price * it.qty)}</td></tr>`).join("")}
    ${o.order.couponDiscount ? row(`Coupon ${esc_(o.order.coupon)}`, `− ₹${money_(o.order.couponDiscount)}`) : ""}
    ${row("Delivery", o.order.delivery ? "₹" + money_(o.order.delivery) : "FREE")}
    ${row("Total", "₹" + money_(o.order.total), true)}
  </table>`;
}

function receiptHtml_(o) {
  const c = o.customer, ord = o.order;
  const payLine = ord.paid ? `Paid by ${esc_(ord.method)} ✅` : `Cash on Delivery: please keep ₹${money_(ord.total)} ready`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#f6f5f1;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e3dc">
    <div style="background:#0f1b2d;color:#ffffff;padding:20px 24px">
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:bold">Shop<span style="color:#c9a050">Easy</span></div>
      <div style="color:#c9d1de;font-size:13px;margin-top:4px">Order receipt</div>
    </div>
    <div style="padding:24px;color:#13203a">
      <p style="margin:0 0 6px;font-size:16px">Hi ${esc_(c.name)},</p>
      <p style="margin:0 0 18px;color:#5c6577">Thank you for your order! Here are your details.</p>
      <table style="width:100%;font-size:14px;margin-bottom:16px;background:#f6f5f1;border-radius:8px">
        <tr><td style="padding:8px 12px;color:#5c6577">Order ID</td><td style="padding:8px 12px;text-align:right;font-weight:bold">${esc_(ord.id)}</td></tr>
        <tr><td style="padding:8px 12px;color:#5c6577">Payment</td><td style="padding:8px 12px;text-align:right">${payLine}</td></tr>
        <tr><td style="padding:8px 12px;color:#5c6577">Arriving by</td><td style="padding:8px 12px;text-align:right">${esc_(ord.eta)}</td></tr>
      </table>
      ${linesHtml_(o)}
      <p style="margin:18px 0 4px;font-weight:bold">Delivering to</p>
      <p style="margin:0;color:#5c6577">${esc_(c.name)}<br>${esc_(c.address)}, ${esc_(c.city)} - ${esc_(c.pin)}<br>Phone: ${esc_(c.phone)}</p>
      ${ord.giftMessage ? `<p style="margin:14px 0 0;color:#5c6577">🎁 Gift message: <i>${esc_(ord.giftMessage)}</i></p>` : ""}
      <p style="margin:22px 0 0;font-size:13px;color:#5c6577">Questions? Reply to this email${o.store.whatsapp ? ` or message us on WhatsApp at ${esc_(o.store.whatsapp)}` : ""}.</p>
    </div>
  </div></div>`;
}

function receiptText_(o) {
  const c = o.customer, ord = o.order;
  return [
    `${STORE_NAME}: order ${ord.id}`, "",
    ...ord.items.map((it) => `- ${it.name} x ${it.qty} = Rs.${money_(it.price * it.qty)}`),
    ord.couponDiscount ? `Coupon ${ord.coupon}: - Rs.${money_(ord.couponDiscount)}` : "",
    `Delivery: ${ord.delivery ? "Rs." + money_(ord.delivery) : "FREE"}`,
    `Total: Rs.${money_(ord.total)}`,
    `Payment: ${ord.paid ? "Paid by " + ord.method : "Cash on Delivery"}`,
    `Arriving by: ${ord.eta}`, "",
    `Deliver to: ${c.name}, ${c.address}, ${c.city} - ${c.pin}. Phone ${c.phone}`,
  ].filter((l) => l !== "").join("\n");
}

function ownerHtml_(o, customerEmailed) {
  const c = o.customer, ord = o.order;
  const wa = "https://wa.me/91" + c.phone;
  const warn = ord.totalsMatch ? "" : `<p style="background:#fff3cd;color:#7a5a00;padding:10px 12px;border-radius:8px">⚠️ The prices in this order don't add up. Please check it before shipping.</p>`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#13203a">
    <h2 style="margin:0 0 4px">New order ${esc_(ord.id)}</h2>
    <p style="margin:0 0 14px;color:#5c6577">${esc_(ord.method)} · ${ord.paid ? "paid online" : "collect on delivery"} · arriving by ${esc_(ord.eta)}</p>
    ${warn}
    ${linesHtml_(o)}
    <h3 style="margin:18px 0 6px">Customer</h3>
    <p style="margin:0;line-height:1.6">${esc_(c.name)}<br>📞 ${esc_(c.phone)} · <a href="${wa}">WhatsApp</a> · <a href="tel:+91${esc_(c.phone)}">Call</a><br>
      ${c.email ? `📧 ${esc_(c.email)} (receipt ${customerEmailed ? "sent" : "not sent"})<br>` : "No email given<br>"}
      ${esc_(c.address)}, ${esc_(c.city)} - ${esc_(c.pin)}</p>
    ${ord.giftMessage ? `<p>🎁 Gift message: <i>${esc_(ord.giftMessage)}</i></p>` : ""}
    <p style="font-size:13px;color:#5c6577;margin-top:18px">This order has also been added to your Google Sheet. Change its Status there as you pack and ship it.</p>
  </div>`;
}
