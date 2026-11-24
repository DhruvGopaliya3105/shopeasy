// ===== DARK MODE =====
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;
function setTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  try { localStorage.setItem("theme", theme); } catch (e) {}
}
let savedTheme = null;
try { savedTheme = localStorage.getItem("theme"); } catch (e) {}
setTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
themeToggle.addEventListener("click", () => {
  setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

// ===== MOBILE MENU =====
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
menuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("open");
  menuBtn.textContent = navLinks.classList.contains("open") ? "✕" : "☰";
});
navLinks.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuBtn.textContent = "☰";
  })
);

// ===== NAVBAR SHADOW, ACTIVE LINK & BACK-TO-TOP =====
const navbar = document.getElementById("navbar");
const toTop = document.getElementById("toTop");
const sections = document.querySelectorAll("section[id]");
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  navbar.classList.toggle("scrolled", y > 20);
  toTop.classList.toggle("show", y > 500);
  let current = "";
  sections.forEach((s) => { if (y >= s.offsetTop - 120) current = s.id; });
  navLinks.querySelectorAll("a").forEach((a) =>
    a.classList.toggle("active", a.getAttribute("href") === "#" + current)
  );
});
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// ===== SCROLL REVEAL ANIMATIONS =====
const observer = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ===== ANIMATED COUNTERS =====
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = +el.dataset.target;
    let n = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const tick = setInterval(() => {
      n = Math.min(target, n + step);
      el.textContent = n + (n === target ? "+" : "");
      if (n === target) clearInterval(tick);
    }, 25);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll(".counter").forEach((c) => counterObserver.observe(c));

// ===== GALLERY FILTER =====
const filterBtns = document.querySelectorAll(".filter");
const items = document.querySelectorAll(".g-item");
filterBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const f = btn.dataset.filter;
    items.forEach((item) => item.classList.toggle("hide", f !== "all" && item.dataset.cat !== f));
  })
);

// ===== LIGHTBOX =====
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
items.forEach((item) =>
  item.addEventListener("click", () => {
    const img = item.querySelector("img");
    lightboxImg.src = img.src.replace("600/400", "1200/800");
    lightboxImg.alt = img.alt;
    lightbox.classList.add("open");
  })
);
lightbox.addEventListener("click", (e) => {
  if (e.target !== lightboxImg) lightbox.classList.remove("open");
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") lightbox.classList.remove("open"); });

// ===== TESTIMONIAL SLIDER =====
const slides = document.querySelectorAll(".slide");
const dotsWrap = document.getElementById("dots");
let current = 0;
slides.forEach((_, i) => {
  const dot = document.createElement("button");
  dot.setAttribute("aria-label", "Show testimonial " + (i + 1));
  dot.addEventListener("click", () => { showSlide(i); restart(); });
  dotsWrap.appendChild(dot);
});
const dots = dotsWrap.querySelectorAll("button");
function showSlide(i) {
  slides[current].classList.remove("active");
  dots[current].classList.remove("active");
  current = i;
  slides[current].classList.add("active");
  dots[current].classList.add("active");
}
dots[0].classList.add("active");
let timer = setInterval(() => showSlide((current + 1) % slides.length), 4500);
function restart() {
  clearInterval(timer);
  timer = setInterval(() => showSlide((current + 1) % slides.length), 4500);
}

// ===== PRICING TOGGLE =====
const billingSwitch = document.getElementById("billingSwitch");
billingSwitch.addEventListener("change", () => {
  const yearly = billingSwitch.checked;
  document.querySelectorAll(".amount").forEach((a) => {
    a.textContent = yearly ? a.dataset.yearly : a.dataset.monthly;
  });
});

// ===== FAQ ACCORDION =====
document.querySelectorAll(".faq-item").forEach((item) => {
  const q = item.querySelector(".faq-q");
  const a = item.querySelector(".faq-a");
  q.addEventListener("click", () => {
    const open = item.classList.toggle("open");
    a.style.maxHeight = open ? a.scrollHeight + "px" : null;
  });
});

// ===== CONTACT FORM VALIDATION =====
const form = document.getElementById("contactForm");
const success = document.getElementById("formSuccess");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  let valid = true;
  const checks = [
    ["name", (v) => v.trim().length >= 2, "Please enter your name."],
    ["email", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Please enter a valid email."],
    ["message", (v) => v.trim().length >= 10, "Message should be at least 10 characters."],
  ];
  checks.forEach(([id, test, msg]) => {
    const input = document.getElementById(id);
    const field = input.closest(".field");
    const ok = test(input.value);
    field.classList.toggle("invalid", !ok);
    field.querySelector(".error").textContent = ok ? "" : msg;
    if (!ok) valid = false;
  });
  success.classList.toggle("show", valid);
  if (valid) form.reset();
});

// ===== FOOTER YEAR =====
document.getElementById("year").textContent = new Date().getFullYear();
