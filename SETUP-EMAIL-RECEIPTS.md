# Switch on automatic email receipts (about 10 minutes, free)

When this is set up, every order on ShopEasy automatically:

- ✉️ **emails a receipt to that customer**, at the email they typed at checkout (a different email for every customer)
- ✉️ **emails the order to you**, every time, even if the customer never taps WhatsApp
- 📋 **adds the order to a Google Sheet**, your order list

You only need a Gmail / Google account. No coding.

---

## Step 1: Create the order sheet
1. On your computer, open **https://sheets.new** (signed in to your Google account).
2. Click **"Untitled spreadsheet"** at the top left and rename it **ShopEasy Orders**.

## Step 2: Add the script
1. In the sheet's top menu, click **Extensions → Apps Script**. A new tab opens.
2. Delete everything in the code box.
3. Open the file **`google-apps-script/Code.gs`** (in this project folder), copy **all** of it, and paste it into the code box.
4. Click the **💾 Save** icon.

## Step 3: Give permission and send a test
1. At the top, next to **Run**, choose **testSetup** from the dropdown.
2. Click **▶ Run**.
3. Google asks for permission:
   - Click **Review permissions** and choose your Google account.
   - You'll see **"Google hasn't verified this app"**. This is normal for your own scripts. Click **Advanced → Go to ShopEasy (unsafe)**.
   - Click **Allow**.
4. Check your Gmail. You should get **two test emails** (a receipt and an order alert), and your sheet should have a new **Orders** tab with one test row.

## Step 4: Turn it into a link the store can use
1. At the top right, click **Deploy → New deployment**.
2. Click the ⚙️ gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** (allow permission again if asked).
5. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy…/exec`.

## Step 5: Connect it to the store
Send the link to Claude, or do it yourself:
1. Open **`store/products.js`**.
2. Find `const ORDER_EMAIL_URL = "";` and paste your link between the quotes.
3. Save, reload the store, and place a test order with **your own email**. You should see **"📧 Receipt sent to your@email.com"** on the success screen.

---

## Good to know
- **Free limit:** a normal Gmail account can send about **100 emails a day**. Each order uses 1–2, so roughly 50 orders a day.
- **Email is optional at checkout.** Customers without email still order normally. You still get the order email and the sheet row, and they can use the WhatsApp/SMS buttons for their receipt.
- **Check before shipping:** if an order's prices don't add up, your order email shows a **⚠️ warning**.
- **Changed the script later?** Use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. The link stays the same.

## If something doesn't work
| Problem | Fix |
|---|---|
| Success screen says "We couldn't send your order automatically" | Check the link ends with `/exec`, and **Who has access** is **Anyone**. |
| No test emails after Step 3 | Look in Spam. In Apps Script, open **Executions** (left menu) to see errors. |
| "Wrong store key" in Executions | `STORE_KEY` in the script must match `ORDER_EMAIL_KEY` in products.js exactly. |
