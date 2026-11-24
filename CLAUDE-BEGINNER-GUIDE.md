# Using Claude in VS Code: a beginner's guide

Follow these steps in order. Each step says what to do and what you should see.

---

## Part 1: Get your project ready in VS Code

### Step 1: Check the right folder is open
- Look at the **left side** of VS Code (the "Explorer"). You should see:
  - a folder called **store**
  - files like **GO-LIVE-CHECKLIST.md** and this guide
- **Don't see them?** Click **File → Open Folder…**, choose **"claude demo website"** on your Desktop, and click **Select Folder**.
- If VS Code asks **"Do you trust the authors of the files in this folder?"**, click **Yes, I trust the authors**.

### Step 2: Reload VS Code once (first time only)
This makes the newly installed Claude extension appear.
1. Press **Ctrl + Shift + P**. A search box opens at the top.
2. Type **Reload Window** and press **Enter**.

---

## Part 2: Open Claude and sign in

### Step 3: Open the Claude panel
- Look at the **top-right corner** of VS Code (or the left sidebar) for the **Claude icon**, a small spark/star shape. **Click it.**
- **Can't find it?** Press **Ctrl + Shift + P**, type **Claude**, and choose **Claude Code: Open**.
- A chat panel opens with a typing box at the bottom.

### Step 4: Sign in (first time only)
1. Click **Sign in** (or follow the message in the panel).
2. Your web browser opens. Log in with the **same Claude account** you use in the Claude app.
3. Click **Allow / Authorize**, then go back to VS Code.
4. You're connected when you can type in the chat box.

---

## Part 3: Your first conversation

### Step 5: Ask Claude to understand your project
Type this in the chat box and press **Enter**:

```
/init
```

Claude reads all your files and creates a short guide called **CLAUDE.md** that explains your project. It may ask permission to create the file: click **Yes**.

### Step 6: Ask simple questions
Type any of these (one at a time) and press **Enter**:

```
Explain what each file in the store folder does, in simple words.
```
```
Don't change anything. Just explain what happens when a customer clicks "Place Order".
```
```
How do I add a new product with a photo?
```
```
Where do I change the WhatsApp number and the coupon codes?
```

**Tip:** start with **"Don't change anything, just explain…"** whenever you only want to learn.

### Step 7: Ask about a specific file
- **Option A:** click a file on the left (for example **store/products.js**) to open it, then ask: `Explain this file`
- **Option B:** type **@** followed by the file name, for example:
  ```
  Explain @store/products.js line by line
  ```

### Step 8: Ask about a small piece of code
1. In an open file, **select some lines** with your mouse.
2. Ask: `What does this code do?`

---

## Part 4: When Claude wants to change something

Claude **always asks before** it edits a file or runs a command. You'll see what it wants to do, with buttons like **Yes** / **No**.

- **Read it first.** If you're not sure, click **No** and ask: `Explain what this change does before doing it.`
- To undo a change you don't like, ask: `Please undo the last change.`

**Example of asking for a change:**
```
Change the free delivery limit from ₹999 to ₹799.
```
Claude will show you the edit in **store/products.js** and ask before saving.

---

## Part 5: Handy commands

Type these in the chat box. Commands start with **/**.

| Type this | What it does |
|---|---|
| `/help` | Shows all commands and help |
| `/init` | Claude studies the project and writes CLAUDE.md |
| `/clear` | Starts a fresh conversation (forgets the current chat) |
| `/model` | Choose which Claude model to use |
| `/resume` | Go back to an earlier conversation |
| `@filename` | Point Claude at a file, e.g. `@store/app.js` |
| **Esc** key | Stop Claude in the middle of an answer |

Type `/help` anytime to see the full, up-to-date list.

### More features, explained simply
**"Context" = Claude's short-term memory for the current chat** (your messages, files it read, its answers).

| Feature | How to use it | What you'll see |
|---|---|---|
| **Plan mode** (think first, change nothing) | Terminal: **Shift + Tab** until it says *plan mode on* (if that doesn't work on Windows: **Alt + M**), or type `/plan`. VS Code panel: click the **mode** at the bottom of the chat box and pick **Plan** | A step-by-step plan. Then choose **Yes** (Claude starts editing) or **No, keep planning** |
| **Esc** (stop) | Press **Esc** once while Claude works | Claude stops. Work done so far is kept |
| **Rewind** (go back in time) | Terminal: **Esc Esc** with an *empty* chat box, or type `/rewind`. VS Code panel: **hover over a message → click the rewind button** | Choose to restore the **code**, the **conversation**, or **both**. Doesn't undo commands that were run (only file edits) |
| `/context` | Type it | A coloured grid showing how full Claude's memory is |
| `/compact` | Type it (optionally `/compact keep the WhatsApp details`) | The long chat is replaced by a short summary. Also happens automatically |
| `/clear` | Type it (same as `/new`) | A fresh, empty chat. Your files are untouched |
| `/usage` | Type it | How much of your plan's allowance you've used |
| `/model` | Type it (terminal shortcut: **Alt + P**) | Pick a different Claude model |
| **@ mentions** | Type **@** and pick a file or folder (folders end with `/`, e.g. `@store/`). VS Code: select lines and press **Alt + K** to add them to the chat | Claude reads exactly that file, folder or those lines |
| **Ctrl + N** | VS Code: makes a **new file** (not a new chat, unless you turn on the `enableNewConversationShortcut` setting). Terminal: shows your next message from history | For a new chat, use `/clear` or click the **spark icon** |
| **Ctrl + Esc** | Press in VS Code | Jumps between your code and the Claude panel |
| **Ctrl + C** | Press in the terminal | Stops Claude. When idle: press twice to quit |

---

## Part 6: See your store while you work

1. Ask Claude:
   ```
   Start a local web server for this folder on port 8090.
   ```
   (Or, in the terminal, run: `python -m http.server 8090`)
2. Open your browser at: **http://localhost:8090/store/**
3. After Claude changes something, press **Ctrl + F5** in the browser to see the update.

---

## Other way: using the terminal instead of the panel

1. In VS Code, click **View → Terminal** (or press **Ctrl + `**, the key below Esc).
2. Type `claude` and press **Enter**.
3. Chat exactly the same way. All the commands above work here too.
4. To quit: type `/exit` (or press **Ctrl + C** twice).

---

## Quick map of the important files

| File | What's inside |
|---|---|
| **store/products.js** | ⭐ Your settings: products, prices, coupons, WhatsApp number, business details |
| **store/index.html** | The structure of the main shop page |
| **store/style.css** | The look: colours, fonts, mobile layout, dark mode |
| **store/app.js** | The main brain: search, cart, checkout, orders, WhatsApp/SMS |
| **store/extras.js** | Fun features: bargaining, Budget Basket, kits, swipe, Easy mode, festivals |
| **store/about.html, contact.html, …** | The policy and contact pages |
| **GO-LIVE-CHECKLIST.md** | Steps before real customers use the store |
