# ShopEasy: go-live checklist

Everything the store needs before real customers use it. Tick each item as you go.

## 1. Fill in your business details (10 minutes)
Open `store/products.js` and fill in `STORE_INFO`:

- [ ] `legalName`: your registered business name
- [ ] `address`: full business address
- [ ] `email`: customer support email
- [ ] `gstin`: GST number (if registered)
- [ ] `grievanceOfficer` and `grievanceEmail`: who handles complaints
- [ ] `jurisdiction`: your city (for the Terms page)
- [ ] `hours`: your support hours

Until these are filled, the info pages show highlighted **[Add …]** notes, so open each page and check that none are left.

## 2. Check the policy pages
The About, Contact, Privacy, Terms, Returns & refunds and Shipping pages are **drafts** written to match how the store works today.

- [ ] Read each page and change anything that doesn't match how you actually work (return windows, refund times, delivery areas).
- [ ] Have them checked by a lawyer or CA before launch.
- [ ] Update `lastUpdated` in `STORE_INFO` whenever you change them.

## 3. Payments: decide before launch
Online payments are in **test mode**: UPI and Card orders show "Payment successful" but **no money is collected**.

- [ ] **Before real customers arrive**, set `ONLINE_PAYMENTS = false` in `store/products.js`. Checkout then offers Cash on Delivery only.
- [ ] Later, sign up with Razorpay (needs business KYC) and connect real UPI and card payments. Then switch `ONLINE_PAYMENTS` back to `true`.

## 4. How orders reach you
After every order, the customer sees **"Send order to ShopEasy on WhatsApp"**, which opens WhatsApp with the full order (items, total, name, phone, address) addressed to your number in `STORE_WHATSAPP`.

- [ ] Place a test order on your phone and check the message arrives on your WhatsApp.
- [ ] Remember: if a customer doesn't tap the button, you won't get the order. A proper order database (for example, free Firebase) fixes this later.

## 5. Product photos
- [ ] Add photos to `store/images/` and add `image: "file.jpg"` to each product in `store/products.js` (see `store/images/README.txt`).
- [ ] Replace the sample prices, ratings and descriptions with your real ones.

## 6. Other settings to review (in `store/products.js`)
- [ ] `COUPONS`: the codes and discounts you want to offer
- [ ] `BARGAIN`: the most a customer can bargain off (currently 3%)
- [ ] `FESTIVALS`: festival dates change every year, so check them
- [ ] `CATEGORY_INFO`: delivery days and product highlights per category
- [ ] The FAQ answers in `store/index.html`

## 7. Put it online (free)
The `store` folder is ready to upload as-is, with no build step.

**Easiest: Netlify Drop**
1. Go to app.netlify.com/drop and sign up (free).
2. Drag the whole `store` folder onto the page.
3. You get a live link like `your-name.netlify.app` in seconds.
4. Optional: buy a domain (like `shopeasy.in`) and connect it in Netlify's settings.

**Alternative:** GitHub Pages or Vercel work just as well.

## 8. After it's live
- [ ] Open the store on your phone and place a test order end to end.
- [ ] Share the link on WhatsApp and check the preview shows "ShopEasy — Quality you can trust. Prices you'll love."
- [ ] Try a shared cart link and a product link on another phone.
