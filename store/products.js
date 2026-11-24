// ===== PRODUCT CATALOG =====
// Add, remove or edit products here. Prices are in rupees (₹).
// "mrp" is the original price (shown crossed out). "icon" is the emoji shown when there's no photo.
// To show a real photo, put it in the images/ folder and add  image: "your-photo.jpg"  to the product
// (see images/README.txt).

const CATEGORIES = [
  { id: "all",         name: "All",            icon: "🛍️" },
  { id: "electronics", name: "Electronics",    icon: "📱" },
  { id: "fashion",     name: "Fashion",        icon: "👕" },
  { id: "home",        name: "Home & Kitchen", icon: "🏠" },
  { id: "grocery",     name: "Groceries",      icon: "🥦" },
  { id: "beauty",      name: "Beauty",         icon: "💄" },
  { id: "books",       name: "Books",          icon: "📚" },
  { id: "sports",      name: "Sports",         icon: "⚽" },
  { id: "toys",        name: "Toys",           icon: "🧸" },
];

const PRODUCTS = [
  // Electronics
  { id: 1,  cat: "electronics", name: "Wireless Earbuds",        price: 1499, mrp: 2999, rating: 4.3, icon: "🎧" },
  { id: 2,  cat: "electronics", name: "Smartphone 5G (128 GB)",  price: 15999, mrp: 19999, rating: 4.5, icon: "📱" },
  { id: 3,  cat: "electronics", name: "Smart Watch",             price: 2499, mrp: 4999, rating: 4.1, icon: "⌚" },
  { id: 4,  cat: "electronics", name: "Bluetooth Speaker",       price: 1299, mrp: 1999, rating: 4.4, icon: "🔊" },
  { id: 5,  cat: "electronics", name: "Laptop 14\" (16 GB RAM)", price: 54990, mrp: 64990, rating: 4.6, icon: "💻" },
  { id: 32, cat: "electronics", name: "Power Bank (10000 mAh)",  price: 999,  mrp: 1999, rating: 4.3, icon: "🔋" },
  { id: 33, cat: "electronics", name: "Wireless Mouse",          price: 499,  mrp: 999,  rating: 4.2, icon: "🖱️" },
  { id: 34, cat: "electronics", name: "Mechanical Keyboard",     price: 2499, mrp: 3999, rating: 4.5, icon: "⌨️" },
  { id: 35, cat: "electronics", name: "Digital Camera",          price: 24999, mrp: 29999, rating: 4.4, icon: "📷" },
  { id: 36, cat: "electronics", name: "Smart LED TV 43\"",       price: 22999, mrp: 34999, rating: 4.4, icon: "📺" },
  // Fashion
  { id: 6,  cat: "fashion", name: "Cotton T-Shirt",       price: 399,  mrp: 799,  rating: 4.2, icon: "👕" },
  { id: 7,  cat: "fashion", name: "Slim Fit Jeans",       price: 1199, mrp: 2199, rating: 4.0, icon: "👖" },
  { id: 8,  cat: "fashion", name: "Running Shoes",        price: 1899, mrp: 3499, rating: 4.4, icon: "👟" },
  { id: 9,  cat: "fashion", name: "Summer Dress",         price: 999,  mrp: 1799, rating: 4.3, icon: "👗" },
  { id: 10, cat: "fashion", name: "Sunglasses",           price: 599,  mrp: 1299, rating: 3.9, icon: "🕶️" },
  { id: 37, cat: "fashion", name: "Formal Shirt",         price: 899,  mrp: 1599, rating: 4.2, icon: "👔" },
  { id: 38, cat: "fashion", name: "Silk Saree",           price: 2499, mrp: 4499, rating: 4.6, icon: "🥻" },
  { id: 39, cat: "fashion", name: "Leather Wallet",       price: 449,  mrp: 899,  rating: 4.1, icon: "👛" },
  { id: 40, cat: "fashion", name: "College Backpack",     price: 1099, mrp: 1999, rating: 4.4, icon: "🎒" },
  { id: 41, cat: "fashion", name: "Baseball Cap",         price: 299,  mrp: 599,  rating: 4.0, icon: "🧢" },
  // Home & Kitchen
  { id: 11, cat: "home", name: "Non-stick Frying Pan",  price: 749,  mrp: 1199, rating: 4.2, icon: "🍳" },
  { id: 12, cat: "home", name: "Table Lamp",            price: 899,  mrp: 1499, rating: 4.1, icon: "💡" },
  { id: 13, cat: "home", name: "Coffee Mug Set (4)",    price: 449,  mrp: 699,  rating: 4.5, icon: "☕" },
  { id: 14, cat: "home", name: "Indoor Plant",          price: 349,  mrp: 499,  rating: 4.6, icon: "🪴" },
  { id: 42, cat: "home", name: "Pressure Cooker (3 L)", price: 1499, mrp: 2299, rating: 4.5, icon: "🍲" },
  { id: 43, cat: "home", name: "Double Bedsheet Set",   price: 799,  mrp: 1499, rating: 4.3, icon: "🛏️" },
  { id: 44, cat: "home", name: "Wall Clock",            price: 599,  mrp: 999,  rating: 4.2, icon: "🕰️" },
  { id: 45, cat: "home", name: "Kitchen Knife Set",     price: 549,  mrp: 999,  rating: 4.1, icon: "🔪" },
  { id: 46, cat: "home", name: "Scented Candles (3)",   price: 349,  mrp: 599,  rating: 4.4, icon: "🕯️" },
  // Groceries
  { id: 15, cat: "grocery", name: "Fresh Apples (1 kg)",   price: 180, mrp: 220, rating: 4.3, icon: "🍎" },
  { id: 16, cat: "grocery", name: "Basmati Rice (5 kg)",   price: 549, mrp: 699, rating: 4.5, icon: "🍚" },
  { id: 17, cat: "grocery", name: "Bananas (1 dozen)",     price: 60,  mrp: 80,  rating: 4.2, icon: "🍌" },
  { id: 18, cat: "grocery", name: "Green Tea (100 bags)",  price: 299, mrp: 450, rating: 4.4, icon: "🍵" },
  { id: 47, cat: "grocery", name: "Toor Dal (1 kg)",         price: 165, mrp: 199, rating: 4.4, icon: "🫘" },
  { id: 48, cat: "grocery", name: "Sunflower Oil (1 L)",     price: 175, mrp: 210, rating: 4.2, icon: "🫗" },
  { id: 49, cat: "grocery", name: "Cow Ghee (500 ml)",       price: 349, mrp: 420, rating: 4.6, icon: "🧈" },
  { id: 50, cat: "grocery", name: "Farm Eggs (12)",          price: 84,  mrp: 96,  rating: 4.5, icon: "🥚" },
  { id: 51, cat: "grocery", name: "Alphonso Mangoes (1 kg)", price: 199, mrp: 249, rating: 4.6, icon: "🥭" },
  { id: 52, cat: "grocery", name: "Mixed Dry Fruits (500 g)", price: 599, mrp: 799, rating: 4.5, icon: "🥜" },
  // Beauty
  { id: 19, cat: "beauty", name: "Face Moisturiser",  price: 349, mrp: 499, rating: 4.2, icon: "🧴" },
  { id: 20, cat: "beauty", name: "Matte Lipstick",    price: 299, mrp: 599, rating: 4.0, icon: "💄" },
  { id: 21, cat: "beauty", name: "Perfume (100 ml)",  price: 899, mrp: 1599, rating: 4.3, icon: "🌸" },
  { id: 53, cat: "beauty", name: "Neem Face Wash",    price: 199, mrp: 299, rating: 4.3, icon: "🧼" },
  { id: 54, cat: "beauty", name: "Herbal Shampoo",    price: 279, mrp: 399, rating: 4.2, icon: "🫧" },
  { id: 55, cat: "beauty", name: "Sunscreen SPF 50",  price: 399, mrp: 599, rating: 4.4, icon: "☀️" },
  { id: 56, cat: "beauty", name: "Nail Polish Set",   price: 249, mrp: 449, rating: 4.1, icon: "💅" },
  { id: 57, cat: "beauty", name: "Hair Dryer",        price: 899, mrp: 1499, rating: 4.2, icon: "💨" },
  // Books
  { id: 22, cat: "books", name: "Learn JavaScript",     price: 499, mrp: 799, rating: 4.7, icon: "📘" },
  { id: 23, cat: "books", name: "Mystery Novel",        price: 299, mrp: 399, rating: 4.4, icon: "📕" },
  { id: 24, cat: "books", name: "Kids Story Collection", price: 249, mrp: 350, rating: 4.6, icon: "📗" },
  { id: 58, cat: "books", name: "Indian Home Cookbook",  price: 399, mrp: 599, rating: 4.5, icon: "📙" },
  { id: 59, cat: "books", name: "Habits for Success",    price: 349, mrp: 499, rating: 4.3, icon: "📒" },
  { id: 60, cat: "books", name: "Space Adventure Novel", price: 299, mrp: 449, rating: 4.2, icon: "📓" },
  { id: 61, cat: "books", name: "World Atlas",           price: 699, mrp: 999, rating: 4.6, icon: "🗺️" },
  { id: 62, cat: "books", name: "Hindi Short Stories",   price: 199, mrp: 299, rating: 4.4, icon: "📔" },
  // Sports
  { id: 25, cat: "sports", name: "Football",          price: 599,  mrp: 999,  rating: 4.3, icon: "⚽" },
  { id: 26, cat: "sports", name: "Yoga Mat",          price: 499,  mrp: 899,  rating: 4.5, icon: "🧘" },
  { id: 27, cat: "sports", name: "Cricket Bat",       price: 1299, mrp: 1999, rating: 4.2, icon: "🏏" },
  { id: 28, cat: "sports", name: "Dumbbells (2×5 kg)", price: 1099, mrp: 1599, rating: 4.4, icon: "🏋️" },
  { id: 63, cat: "sports", name: "Badminton Racket",    price: 799,  mrp: 1299, rating: 4.3, icon: "🏸" },
  { id: 64, cat: "sports", name: "Table Tennis Bats (2)", price: 549, mrp: 899, rating: 4.2, icon: "🏓" },
  { id: 65, cat: "sports", name: "Boxing Gloves",       price: 899,  mrp: 1499, rating: 4.4, icon: "🥊" },
  { id: 66, cat: "sports", name: "Skipping Rope",       price: 199,  mrp: 349,  rating: 4.1, icon: "🪢" },
  // Toys
  { id: 29, cat: "toys", name: "Teddy Bear",        price: 449, mrp: 799,  rating: 4.7, icon: "🧸" },
  { id: 30, cat: "toys", name: "Remote Control Car", price: 999, mrp: 1699, rating: 4.1, icon: "🏎️" },
  { id: 31, cat: "toys", name: "Building Blocks",    price: 699, mrp: 1199, rating: 4.5, icon: "🧱" },
  { id: 67, cat: "toys", name: "Jigsaw Puzzle (500 pcs)", price: 399, mrp: 699, rating: 4.4, icon: "🧩" },
  { id: 68, cat: "toys", name: "Ludo Board Game",    price: 249, mrp: 399,  rating: 4.5, icon: "🎲" },
  { id: 69, cat: "toys", name: "Toy Train Set",      price: 799, mrp: 1299, rating: 4.3, icon: "🚂" },
  { id: 70, cat: "toys", name: "Paper Kite",         price: 99,  mrp: 149,  rating: 4.2, icon: "🪁" },
  { id: 71, cat: "toys", name: "Light-up Yo-yo",     price: 149, mrp: 249,  rating: 3.9, icon: "🪀" },
];

// Delivery rules
const FREE_DELIVERY_ABOVE = 999;
const DELIVERY_FEE = 49;

// ===== MOL-BHAV (BARGAINING) =====
// maxPercent: the most a customer can bargain off (3 = 3%). maxTries: offers allowed per product per day.
const BARGAIN = { enabled: true, maxPercent: 3, maxTries: 3 };

// ===== "I'M GOING TO…" KITS =====
// Ready-made bundles. "items" are product ids from the PRODUCTS list above.
const KITS = [
  { id: "wedding",  icon: "💍", name: "Wedding",        items: [38, 37, 21, 20, 56, 39] },
  { id: "trek",     icon: "⛰️", name: "Trek",           items: [8, 40, 41, 55, 32, 52, 10] },
  { id: "exams",    icon: "📚", name: "Exam week",      items: [12, 13, 18, 52, 59] },
  { id: "newflat",  icon: "🏠", name: "New flat",       items: [11, 42, 43, 44, 45, 14, 46] },
  { id: "firstjob", icon: "💼", name: "First job",      items: [37, 39, 3, 40, 33, 59] },
  { id: "hostel",   icon: "🎒", name: "Hostel move-in", items: [43, 13, 12, 32, 40, 33, 26, 18] },
  { id: "cricket",  icon: "🏏", name: "Cricket match",  items: [27, 41, 55, 10, 4] },
  { id: "party",    icon: "🎉", name: "House party",    items: [4, 68, 46, 52, 13] },
];

// ===== FESTIVAL MODE =====
// The store changes its look from `daysBefore` days before each date until the day after.
// If two festivals overlap, the one coming up soonest is shown.
// Preview any festival with ?festival=<id>, e.g. ?festival=diwali or ?festival=eid-fitr
// Dates checked for Nov 2026 – Dec 2027. Lunar festivals move every year, and Eid dates depend on
// the moon sighting, so confirm dates (e.g. on drikpanchang.com) and add next year's before they run out.
// "picks" are product ids from the PRODUCTS list. "greeting" is the suggested gift-message start (optional).
const FESTIVALS = [
  // ---------------- 2026 ----------------
  { id: "guru-nanak", name: "Guru Nanak Jayanti", icon: "🙏", date: "2026-11-24", daysBefore: 3, colors: ["#e65100", "#f9a825"],
    greeting: "Gurpurab di lakh lakh vadhaiyan!",
    headline: "Gurpurab di lakh lakh vadhaiyan! Celebrate with your loved ones.", picks: [52, 49, 46, 16, 18, 13] },
  { id: "christmas", name: "Christmas", icon: "🎄", date: "2026-12-25", daysBefore: 10, colors: ["#c62828", "#2e7d32"],
    greeting: "Merry Christmas!",
    headline: "Merry Christmas! Gifts for everyone you love.", picks: [29, 69, 46, 67, 13, 21] },

  // ---------------- 2027 ----------------
  { id: "newyear", name: "New Year", icon: "🎆", date: "2027-01-01", daysBefore: 5, colors: ["#283593", "#8e24aa"],
    greeting: "Happy New Year!",
    headline: "New year, new you! Start 2027 fresh.", picks: [26, 59, 3, 4, 46, 28] },
  { id: "sankranti", name: "Lohri, Sankranti & Pongal", icon: "🪁", date: "2027-01-15", daysBefore: 5, colors: ["#f57c00", "#fbc02d"],
    greeting: "Happy Lohri and Sankranti!",
    headline: "Patang, til-gud and bonfires! Happy Lohri, Makar Sankranti and Pongal.", picks: [70, 52, 49, 16, 42, 10] },
  { id: "republic-day", name: "Republic Day", icon: "🎖️", date: "2027-01-26", daysBefore: 3, colors: ["#ff9933", "#138808"],
    greeting: "Happy Republic Day!",
    headline: "Celebrate Republic Day with great deals on everyday essentials.", picks: [6, 27, 25, 61, 41, 22] },
  { id: "valentine", name: "Valentine's Day", icon: "❤️", date: "2027-02-14", daysBefore: 7, colors: ["#c2185b", "#f06292"],
    greeting: "Happy Valentine's Day!",
    headline: "Gifts that say “I love you”, for every budget.", picks: [21, 29, 3, 20, 46, 39] },
  { id: "shivratri", name: "Maha Shivratri", icon: "🔱", date: "2027-03-06", daysBefore: 3, colors: ["#283593", "#5c6bc0"],
    greeting: "Har Har Mahadev!",
    headline: "Har Har Mahadev! Fasting essentials and puja needs, delivered.", picks: [52, 15, 17, 49, 46, 18] },
  { id: "eid-fitr", name: "Eid al-Fitr", icon: "🌙", date: "2027-03-10", daysBefore: 7, colors: ["#00695c", "#26a69a"],
    greeting: "Eid Mubarak!",
    headline: "Eid Mubarak! Gifts, sweets and festive outfits for the whole family.", picks: [52, 21, 37, 9, 13, 3] },
  { id: "holi", name: "Holi", icon: "🎨", date: "2027-03-22", daysBefore: 10, colors: ["#e91e63", "#ff9800"],
    greeting: "Happy Holi!",
    headline: "Rang barse! Holi essentials are here.", picks: [55, 54, 6, 41, 4, 52] },
  { id: "ugadi", name: "Ugadi & Gudi Padwa", icon: "🌼", date: "2027-04-07", daysBefore: 4, colors: ["#2e7d32", "#fbc02d"],
    greeting: "Happy New Year!",
    headline: "A new year begins! Fresh starts for your home and kitchen.", picks: [43, 42, 14, 44, 11, 38] },
  { id: "baisakhi", name: "Baisakhi", icon: "🌾", date: "2027-04-14", daysBefore: 4, colors: ["#f9a825", "#ef6c00"],
    greeting: "Baisakhi diyan vadhaiyan!",
    headline: "Fasal di khushiyan! Celebrate Baisakhi with family.", picks: [16, 47, 49, 52, 4, 6] },
  { id: "ram-navami", name: "Ram Navami", icon: "🏹", date: "2027-04-15", daysBefore: 2, colors: ["#e65100", "#ffb300"],
    greeting: "Jai Shri Ram!",
    headline: "Jai Shri Ram! Puja essentials delivered to your door.", picks: [46, 49, 52, 51, 16, 18] },
  { id: "mothers-day", name: "Mother's Day", icon: "💐", date: "2027-05-09", daysBefore: 7, colors: ["#ad1457", "#f48fb1"],
    greeting: "Happy Mother's Day!",
    headline: "For the one who does it all. Gifts for Maa.", picks: [38, 21, 19, 14, 13, 58] },
  { id: "eid-adha", name: "Eid al-Adha (Bakrid)", icon: "🌙", date: "2027-05-17", daysBefore: 5, colors: ["#004d40", "#4db6ac"],
    greeting: "Eid Mubarak!",
    headline: "Eid Mubarak! Festive essentials and gifts for your family.", picks: [16, 49, 52, 37, 21, 42] },
  { id: "fathers-day", name: "Father's Day", icon: "👔", date: "2027-06-20", daysBefore: 7, colors: ["#1565c0", "#42a5f5"],
    greeting: "Happy Father's Day!",
    headline: "Gifts for Papa, from smart watches to wallets.", picks: [3, 39, 37, 1, 34, 59] },
  { id: "independence-day", name: "Independence Day", icon: "🎖️", date: "2027-08-15", daysBefore: 2, colors: ["#ff9933", "#138808"],
    greeting: "Happy Independence Day!",
    headline: "Freedom to shop smarter. Happy Independence Day!", picks: [6, 27, 25, 61, 41, 4] },
  { id: "rakhi", name: "Raksha Bandhan", icon: "🪢", date: "2027-08-17", daysBefore: 12, colors: ["#d81b60", "#ffb300"],
    greeting: "Happy Raksha Bandhan!",
    headline: "Gifts for your sister or brother, under ₹999.", picks: [21, 20, 56, 39, 52, 10] },
  { id: "janmashtami", name: "Janmashtami", icon: "🦚", date: "2027-08-25", daysBefore: 4, colors: ["#1a237e", "#ffb300"],
    greeting: "Jai Shri Krishna!",
    headline: "Jai Shri Krishna! Celebrate Janmashtami with sweets and decorations.", picks: [52, 49, 46, 13, 31, 16] },
  { id: "ganesh-chaturthi", name: "Ganesh Chaturthi", icon: "🌺", date: "2027-09-04", daysBefore: 7, colors: ["#e65100", "#ffca28"],
    greeting: "Ganpati Bappa Morya!",
    headline: "Ganpati Bappa Morya! Everything for the festival at home.", picks: [52, 49, 46, 14, 4, 16] },
  { id: "onam", name: "Onam", icon: "🛶", date: "2027-09-12", daysBefore: 5, colors: ["#f9a825", "#2e7d32"],
    greeting: "Happy Onam!",
    headline: "Happy Onam! Sadya essentials and festive picks.", picks: [16, 47, 48, 51, 38, 42] },
  { id: "navratri", name: "Navratri & Dussehra", icon: "💃", date: "2027-10-09", daysBefore: 10, colors: ["#c62828", "#ff8f00"],
    greeting: "Happy Navratri and Dussehra!",
    headline: "Garba nights and Dussehra joy! Festive wear and more.", picks: [9, 38, 20, 21, 8, 56] },
  { id: "karwa-chauth", name: "Karwa Chauth", icon: "🌕", date: "2027-10-18", daysBefore: 4, colors: ["#b71c1c", "#ff7043"],
    greeting: "Happy Karwa Chauth!",
    headline: "Karwa Chauth gifts, made with love.", picks: [38, 20, 56, 21, 3, 46] },
  { id: "diwali", name: "Diwali", icon: "🪔", date: "2027-10-29", daysBefore: 14, colors: ["#e65100", "#ffc107"],
    greeting: "Happy Diwali!",
    headline: "Shubh Deepavali! From Dhanteras to Diwali, light up your home and gift with love.", picks: [46, 52, 38, 49, 21, 44, 37] },
  { id: "bhai-dooj", name: "Bhai Dooj", icon: "🎁", date: "2027-10-31", daysBefore: 1, colors: ["#6a1b9a", "#ffb300"],
    greeting: "Happy Bhai Dooj!",
    headline: "Happy Bhai Dooj! Gifts for your brother or sister.", picks: [1, 3, 39, 21, 20, 52] },
  { id: "guru-nanak-2027", name: "Guru Nanak Jayanti", icon: "🙏", date: "2027-11-14", daysBefore: 3, colors: ["#e65100", "#f9a825"],
    greeting: "Gurpurab di lakh lakh vadhaiyan!",
    headline: "Gurpurab di lakh lakh vadhaiyan! Celebrate with your loved ones.", picks: [52, 49, 46, 16, 18, 13] },
  { id: "christmas-2027", name: "Christmas", icon: "🎄", date: "2027-12-25", daysBefore: 10, colors: ["#c62828", "#2e7d32"],
    greeting: "Merry Christmas!",
    headline: "Merry Christmas! Gifts for everyone you love.", picks: [29, 69, 46, 67, 13, 21] },
];

// ===== MONTHLY RATION REMINDER =====
// Days after a grocery order before the store offers to reorder the "usual basket".
const RESTOCK_REMINDER_DAYS = 25;

// ===== ONLINE PAYMENTS =====
// true  = show UPI and Card at checkout (test mode: shows "Payment successful" but no money is taken).
// false = Cash on Delivery only. Set this to false when real customers start using the store,
//         until a payment provider like Razorpay is connected.
const ONLINE_PAYMENTS = true;

// ===== AUTOMATIC EMAIL RECEIPTS + GOOGLE SHEET ORDER LIST =====
// After you set up the Google Apps Script (see SETUP-EMAIL-RECEIPTS.md), paste its Web app URL here.
// Every order is then sent to your Google account: the customer gets an emailed receipt, you get an
// email for every order, and the order is added to your Google Sheet. Leave empty to switch this off.
const ORDER_EMAIL_URL = "";
// Must match STORE_KEY in the Apps Script. Stops random bots from sending fake orders to it.
const ORDER_EMAIL_KEY = "se_76845dcaff37fe0e06da6bb8871acc87e8bc";

// ===== YOUR BUSINESS DETAILS =====
// Shown on the Contact, About, Privacy, Terms, Returns and Shipping pages and in the footer.
// Anything left empty shows as a highlighted "[Add …]" note on those pages until you fill it in.
// Indian e-commerce rules expect your legal name, address, contact details and a grievance officer.
const STORE_INFO = {
  legalName: "",                         // registered business name, e.g. "ShopEasy Retail Pvt. Ltd."
  address: "",                           // full business address
  email: "",                             // customer support email
  hours: "Monday to Saturday, 10 am – 7 pm",
  gstin: "",                             // GST number (if registered)
  grievanceOfficer: "",                  // name of the person who handles complaints
  grievanceEmail: "",                    // their email
  jurisdiction: "",                      // city whose courts handle disputes, e.g. "Jaipur"
  lastUpdated: "23 November 2026",       // date you last changed the policies
};

// ===== WHATSAPP CHAT =====
// Your store's WhatsApp number with country code, digits only. Example: "919876543210"
// Leave empty until you have one: the Chat button will then say chat isn't set up yet.
const STORE_WHATSAPP = "919950199227";

// ===== PRODUCT PAGE DETAILS =====
// Shown on every product's page, per category. Edit these to match your real policies.
// To give one product its own text, add  desc: "..."  to that product above.
const CATEGORY_INFO = {
  electronics: {
    desc: "Reliable everyday tech, tested for quality and backed by the brand's warranty.",
    highlights: ["1 year brand warranty", "7-day replacement if faulty", "GST invoice included"],
    deliveryDays: [3, 5],
  },
  fashion: {
    desc: "Comfortable, good-quality fashion for everyday wear and special days.",
    highlights: ["Easy 10-day returns & exchange", "Quality checked before dispatch", "Cash on Delivery available"],
    deliveryDays: [3, 5],
  },
  home: {
    desc: "Useful, long-lasting things that make your home and kitchen better.",
    highlights: ["Built for daily use", "7-day returns", "Safely packed to avoid damage"],
    deliveryDays: [3, 6],
  },
  grocery: {
    desc: "Fresh, quality-checked groceries delivered to your door.",
    highlights: ["Fresh stock, sealed packs", "Quick delivery", "Best before date printed on pack"],
    deliveryDays: [1, 2],
  },
  beauty: {
    desc: "Skin, hair and self-care essentials you can use every day.",
    highlights: ["100% genuine products", "Dermatologically tested", "Sealed for hygiene"],
    deliveryDays: [2, 4],
  },
  books: {
    desc: "A great read for curious minds of every age.",
    highlights: ["Brand new copy", "Paperback edition", "Safely packed"],
    deliveryDays: [3, 5],
  },
  sports: {
    desc: "Gear to help you play, train and stay fit.",
    highlights: ["Durable, sports-grade build", "7-day returns", "Suitable for beginners and regulars"],
    deliveryDays: [3, 5],
  },
  toys: {
    desc: "Fun, safe toys and games for kids and families.",
    highlights: ["Child-safe materials", "Great for gifting", "7-day returns"],
    deliveryDays: [3, 5],
  },
};

// ===== COUPONS =====
// type: "percent" (value % off, capped at max), "flat" (₹value off) or "ship" (free delivery)
// min: smallest cart subtotal the coupon works on
const COUPONS = [
  { code: "FIRST10",  type: "percent", value: 10, max: 200, min: 0,    text: "10% off your order, up to ₹200" },
  { code: "SAVE100",  type: "flat",    value: 100,          min: 1499, text: "₹100 off on orders above ₹1,499" },
  { code: "FREESHIP", type: "ship",                         min: 0,    text: "Free delivery on any order" },
];
