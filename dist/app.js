/* ======================================================================
   WIKI BEHAVIOUR — content lives in content.js; appearance in styles.css.
   Every reusable component below is marked TEMPLATE.
   This is a static site. It never reads or writes your Godot save files.
   ====================================================================== */
"use strict";

// TEMPLATE: PIXEL ICON. Rectilinear SVG paths stay crisp at whole-pixel sizes.
const ICONS = {
  home: "M2 7h2V5h2V3h4v2h2v2h2v7H9v-4H7v4H2z",
  book: "M1 2h6v1h2V2h6v12H9v1H7v-1H1zm2 2v8h4V4zm6 0v8h4V4z",
  gear: "M6 1h4v2h2v2h3v5h-3v2h-2v3H6v-3H4v-2H1V5h3V3h2zm0 5v4h4V6z",
  flag: "M2 1h2v2h9v6H4v6H2zm2 4v2h7V5z",
  pen: "M10 1h3v2h2v3L6 15H1v-5zm-6 9v3h2l6-6-3-3z",
  list: "M1 2h3v3H1zm5 0h9v2H6zM1 7h3v3H1zm5 0h9v2H6zM1 12h3v3H1zm5 0h9v2H6z",
  person: "M5 1h6v2h2v5h-2v2H5V8H3V3h2zm0 11h6v1h3v3H2v-3h3z",
  people: "M2 1h4v6H2zm8 0h4v6h-4zM0 9h8v6H0zm9-1h7v6H9z",
  world: "M4 1h8v2h2v2h1v6h-2v3h-2v1H4v-2H2v-2H1V5h1V3h2zm0 4H3v5h3v3h4v-3h3V7h-3V3H6v2z",
  clock: "M4 1h8v2h2v2h1v6h-2v3h-2v1H4v-2H2v-2H1V5h1V3h2zm1 2v2H3v5h2v3h6v-3h2V5h-2V3zm2 2h2v3h3v2H7z",
  base: "M2 3h11v2h2v7h-2v3h-3v-3H5v3H2v-3H0V5h2zm1 2v4h3V5zm5 0v4h4V5z",
  search: "M2 1h7v2h2v7H9v2H2v-2H0V3h2zm1 2v2H2v3h1v2h5V8h1V5H8V3zm8 8h2v2h2v3h-3v-3h-1z",
  box: "M1 3h14v11H1zm2 2v7h10V5zm3-4h4v2H6zm0 5h4v2H6z"
};
const icon = name => `<svg viewBox="0 0 16 16" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path fill-rule="evenodd" d="${ICONS[name] || ICONS.book}"/></svg>`;
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const main = document.querySelector("main");
const articleDialog = document.querySelector("#article-dialog");
const searchDialog = document.querySelector("#search-dialog");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileLayout = window.matchMedia("(max-width: 650px)");
let currentPage = "";
let motionPaused = false;
let stopScene = () => {};

// TEMPLATE: NAVIGATION ITEM. Separate groups share the same link structure.
function renderNavigation() {
  const navigation = document.querySelector("#navigation");
  navigation.innerHTML = WIKI.navigation.map((item, index) => `${index === 4 ? '<p class="micro-label nav-group-label">THE DEVELOPMENT</p>' : ""}<a href="#${item.id}" class="nav-link" data-page="${item.id}"><span class="nav-icon">${icon(item.icon)}</span>${escapeHTML(item.label)}</a>`).join("");
}

// TEMPLATE: PAGE HEADING. Use for every inner page.
function pageHeading(page) {
  const content = WIKI.pages[page];
  return `<header class="page-header"><div class="eyebrow">${escapeHTML(content.label)}</div><h1>${escapeHTML(content.title)}</h1><p>${escapeHTML(content.intro)}</p></header>`;
}

// TEMPLATE: SECTION HEADING. Optional right-hand metadata.
function sectionHeading(title, metadata = "") {
  return `<div class="section-heading"><h2>${escapeHTML(title)}</h2><span class="micro-label">${escapeHTML(metadata)}</span></div>`;
}

// TEMPLATE: ARTICLE PARAGRAPH & TUTORIAL STEPS. All editable text is escaped.
function articleBody(entry) {
  const paragraphs = entry.body.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join("");
  const steps = entry.steps ? `<h3>Step by step</h3><ol>${entry.steps.map(step => `<li>${escapeHTML(step)}</li>`).join("")}</ol>` : "";
  return paragraphs + steps;
}

// TEMPLATE: ENTRY CARD FACTORY. Uses the actual HTML template in index.html.
function appendCards(target, entries, page) {
  entries.forEach((entry, index) => {
    const card = document.querySelector("#entry-card-template").content.cloneNode(true);
    card.querySelector(".card-number").textContent = String(index + 1).padStart(2, "0");
    card.querySelector(".badge").textContent = entry.status;
    card.querySelector(".card-icon").innerHTML = icon(entry.icon);
    card.querySelector(".card-title").textContent = entry.title;
    card.querySelector(".card-description").textContent = entry.summary;
    card.querySelector("button").addEventListener("click", () => { location.hash = `${page}/${entry.id}`; });
    target.append(card);
  });
}

// TEMPLATE: HOME SECTION LINK. Variations use the same HTML structure.
function archiveTile(page, description, number) {
  const item = WIKI.navigation.find(item => item.id === page);
  return `<a class="archive-tile" href="#${page}"><div class="archive-tile-header">${icon(item.icon)}<span class="micro-label">${number} ↗</span></div><h3>${escapeHTML(item.label)}</h3><p>${escapeHTML(description)}</p></a>`;
}

function renderHome() {
  main.innerHTML = `<section class="hero panel" aria-labelledby="home-title">
    <div class="hero-art" aria-hidden="true"><canvas id="landscape" width="320" height="140"></canvas></div><div class="cracks" aria-hidden="true"></div>
    <div class="hero-copy"><div class="eyebrow">THE OFFICIAL WORK-IN-PROGRESS WIKI</div><h1 id="home-title">${WIKI.home.heading.map(line => escapeHTML(line)).join("<br>")}</h1><p class="hero-summary">${escapeHTML(WIKI.home.summary)}</p><div class="hero-actions"><a class="pixel-button primary" href="#lore">EXPLORE THE WORLD <span aria-hidden="true">→</span></a><a class="pixel-button" href="#guides">GET STARTED <span aria-hidden="true">↗</span></a></div></div><span class="scene-caption">ARCHIVE ILLUSTRATION / NOT GAME FOOTAGE</span>
    </section>
    <section class="home-status panel"><div><h2><span class="signal-dot" style="display:inline-block;margin-right:10px"></span>A SMALL BEGINNING. A LONG ROAD AHEAD.</h2><p>${escapeHTML(WIKI.home.note)}</p></div><div class="date-hud" aria-label="Decorative year and day values from the reference image"><div><label>YEAR</label><strong>${escapeHTML(WIKI.home.displayYear)}</strong></div><div><label>DAY</label><strong>${escapeHTML(WIKI.home.displayDay)}</strong></div></div></section>
    ${sectionHeading("Inside the archive", "06 SECTIONS / ONE GROWING WORLD")}
    <div class="archive-grid">${archiveTile("lore", "The setting, its past, and places yet to be named.", "01")}${archiveTile("mechanics", "The systems behind the journey.", "02")}${archiveTile("guides", "Your first steps. Tutorials will live here.", "03")}${archiveTile("devblog", "Notes and ideas from behind the scenes.", "04")}${archiveTile("state", "Follow what is planned and in development.", "05")}${archiveTile("author", "Meet the person building the game.", "06")}</div>
    ${sectionHeading("From the development desk", "THE LATEST CHAPTER")}
    <div class="home-bottom"><section class="journal-preview"><span class="micro-label">AUTHOR NOTES / UNWRITTEN</span><h3>The journal starts here.</h3><p>A place for the initial idea, experiments, and future updates.</p><a class="text-link" href="#devblog">OPEN THE JOURNAL ↗</a></section><section class="progress-preview"><span class="micro-label">PROJECT STATUS</span><h3>Early development</h3><p>Foundations first. The rest will follow.</p><a class="text-link" href="#state">VIEW THE CHECKLIST →</a></section></div>`;
  startLandscape();
}

function renderLore() {
  main.innerHTML = pageHeading("lore") + '<div class="card-grid" id="lore-cards"></div>' + sectionHeading("Biomes & locations", "TO BE DOCUMENTED") + '<p class="section-description">Reserved entries for your future environments. Names and details are placeholders.</p><div class="card-grid" id="biome-cards"></div>';
  appendCards(document.querySelector("#lore-cards"), WIKI.lore, "lore");
  appendCards(document.querySelector("#biome-cards"), WIKI.biomes, "lore");
}

function renderMechanics() {
  main.innerHTML = pageHeading("mechanics") + '<div class="notice">Based on earlier Godot design discussions. Implementation and final rules may change.</div><div class="card-grid" id="mechanic-cards"></div>';
  appendCards(document.querySelector("#mechanic-cards"), WIKI.mechanics, "mechanics");
}

function renderGuides() {
  main.innerHTML = pageHeading("guides") + '<div class="notice">Tutorials have not been written yet. Each entry is ready for your instructions.</div>' + sectionHeading("Tutorial library", "START HERE") + '<div class="card-grid" id="guide-cards"></div>';
  appendCards(document.querySelector("#guide-cards"), WIKI.guides, "guides");
}

// TEMPLATE: JOURNAL POST. Duplicate posts in content.js, not this layout.
function renderJournal() {
  main.innerHTML = pageHeading("devblog") + `<div class="journal-list">${WIKI.posts.map(post => `<details class="journal-post panel"><summary><div class="journal-meta"><span class="badge">${escapeHTML(post.tag)}</span><span>${escapeHTML(post.date || "UNDATED")}</span></div><h2>${escapeHTML(post.title)}</h2><span class="micro-label">READ NOTE ↓</span></summary><div class="prose">${articleBody(post)}</div></details>`).join("")}</div>`;
}

const TASK_LABELS = { done: "DONE", progress: "IN DEVELOPMENT", planned: "PLANNED", unverified: "TO VERIFY" };
function renderState() {
  const counts = Object.fromEntries(Object.keys(TASK_LABELS).map(status => [status, WIKI.tasks.filter(task => task.status === status).length]));
  main.innerHTML = pageHeading("state") + `<div class="metrics">${Object.keys(TASK_LABELS).map(status => `<div class="metric"><strong>${String(counts[status]).padStart(2, "0")}</strong><span>${TASK_LABELS[status]}</span></div>`).join("")}</div><div class="notice">Completion has not been verified against the game files. “To verify” entries were discussed in previous chats. Only author-confirmed completed tasks should receive a checkmark.</div><div id="task-groups"></div>`;
  for (const group of new Set(WIKI.tasks.map(task => task.group))) {
    const section = document.createElement("section");
    section.className = "content-panel panel";
    section.style.marginBottom = "24px";
    const heading = document.createElement("h2");
    heading.textContent = group;
    const list = document.createElement("ul");
    list.className = "checklist";
    for (const task of WIKI.tasks.filter(task => task.group === group)) {
      const row = document.querySelector("#checklist-template").content.cloneNode(true);
      row.querySelector("li").dataset.status = task.status;
      row.querySelector(".check-label").textContent = task.label;
      row.querySelector(".badge").textContent = TASK_LABELS[task.status] || TASK_LABELS.unverified;
      row.querySelector(".check-indicator").textContent = task.status === "done" ? "✓" : "";
      list.append(row);
    }
    section.append(heading, list);
    document.querySelector("#task-groups").append(section);
  }
}

function renderAuthor() {
  const author = WIKI.author;
  // Permit only web URLs; never interpolate executable URL schemes.
  const connections = author.connections.filter(link => { try { return ["http:", "https:"].includes(new URL(link.url).protocol); } catch { return false; } });
  main.innerHTML = pageHeading("author") + `<div class="two-column"><section class="content-panel panel"><div class="profile-icon">${icon("person")}</div><h2>${escapeHTML(author.name)}</h2><span class="micro-label">${escapeHTML(author.role)}</span><div class="prose" style="margin-top:24px">${author.bio.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join("")}</div></section><section class="content-panel panel"><h2>Connections</h2>${connections.length ? `<div class="author-links">${connections.map(link => `<a class="pixel-button" href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(link.label)} ↗</a>`).join("")}</div>` : '<div class="empty-state"><span class="micro-label">NOTHING LINKED YET</span><p>[Add your website or social links here.]</p></div>'}</section></div>`;
}

const renderers = { home: renderHome, lore: renderLore, mechanics: renderMechanics, guides: renderGuides, devblog: renderJournal, state: renderState, author: renderAuthor };
const allEntries = [...WIKI.lore.map(entry => ({ ...entry, page: "lore" })), ...WIKI.biomes.map(entry => ({ ...entry, page: "lore" })), ...WIKI.mechanics.map(entry => ({ ...entry, page: "mechanics" })), ...WIKI.guides.map(entry => ({ ...entry, page: "guides" }))];

// TEMPLATE: HASH ROUTER. Supports direct article URLs, refresh, and back/forward.
function route() {
  const [requestedPage, entryId] = location.hash.slice(1).split("/");
  const page = Object.hasOwn(renderers, requestedPage) ? requestedPage : "home";
  const changed = page !== currentPage;
  if (changed) {
    stopScene();
    currentPage = page;
    renderers[page]();
    main.classList.remove("page-enter");
    void main.offsetWidth;
    main.classList.add("page-enter");
    window.scrollTo(0, 0);
    const label = WIKI.navigation.find(item => item.id === page).label;
    document.querySelector("#breadcrumb").textContent = label.toUpperCase();
    document.title = `${label} · ${WIKI.identity.name} Game Wiki`;
    document.querySelectorAll(".nav-link").forEach(link => {
      const active = link.dataset.page === page;
      link.classList.toggle("active", active);
      active ? link.setAttribute("aria-current", "page") : link.removeAttribute("aria-current");
    });
  }
  closeSidebar();
  const entry = allEntries.find(entry => entry.id === entryId && entry.page === page);
  if (entry) {
    document.querySelector("#article-title").textContent = entry.title;
    document.querySelector("#article-type").textContent = `${WIKI.navigation.find(item => item.id === page).label.toUpperCase()} / ${entry.status}`;
    document.querySelector("#article-body").innerHTML = articleBody(entry);
    articleDialog.setAttribute("aria-labelledby", "article-title");
    if (!articleDialog.open) articleDialog.showModal();
  } else if (articleDialog.open) articleDialog.close();
  if (changed && requestedPage) main.focus({ preventScroll: true });
}

// TEMPLATE: SEARCH INDEX. Only existing content and explicitly marked placeholders.
function search(query) {
  const results = document.querySelector("#search-results");
  const normalized = query.trim().toLowerCase();
  const records = [...WIKI.navigation.map(page => ({ title: page.label, page: page.id, summary: WIKI.pages[page.id]?.intro || WIKI.home.summary })), ...allEntries, ...WIKI.posts.map(post => ({ ...post, page: "devblog", id: undefined, summary: post.body.join(" ") }))];
  const matches = records.filter(record => `${record.title} ${record.summary || ""} ${(record.body || []).join(" ")}`.toLowerCase().includes(normalized));
  if (!normalized) { results.innerHTML = '<p class="search-empty">Type to find a section or entry.</p>'; return; }
  if (!matches.length) { results.innerHTML = '<p class="search-empty">No entries found. Try another word.</p>'; return; }
  results.innerHTML = matches.map(record => `<a class="search-result" href="#${record.page}${record.id ? `/${record.id}` : ""}"><span class="badge">${escapeHTML(WIKI.navigation.find(page => page.id === record.page).label)}</span><strong>${escapeHTML(record.title)}</strong><span>${escapeHTML(record.summary || "")}</span></a>`).join("");
  results.querySelectorAll("a").forEach(link => link.addEventListener("click", () => searchDialog.close()));
}

function openSearch() {
  if (articleDialog.open) articleDialog.close();
  searchDialog.showModal();
  document.querySelector("#search-input").value = "";
  search("");
  document.querySelector("#search-input").focus();
}
document.querySelector(".search-trigger").addEventListener("click", openSearch);
document.querySelector("#search-input").addEventListener("input", event => search(event.target.value));
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) && !searchDialog.open) { event.preventDefault(); openSearch(); }
  if (event.key === "Escape") closeSidebar();
});
document.querySelectorAll("[data-close-dialog]").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
articleDialog.addEventListener("close", () => {
  if (location.hash.includes("/")) history.replaceState(null, "", `#${currentPage}`);
});
document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
}));

// TEMPLATE: MOBILE NAVIGATION. Focus returns to the toggle when dismissed.
function closeSidebar() {
  const sidebar = document.querySelector("#sidebar");
  if (sidebar.contains(document.activeElement) && sidebar.classList.contains("is-open")) document.querySelector(".menu-toggle").focus();
  sidebar.classList.remove("is-open");
  sidebar.inert = mobileLayout.matches;
  document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
}
document.querySelector(".menu-toggle").addEventListener("click", () => {
  const sidebar = document.querySelector("#sidebar");
  const open = sidebar.classList.toggle("is-open");
  sidebar.inert = mobileLayout.matches && !open;
  document.querySelector(".menu-toggle").setAttribute("aria-expanded", String(open));
  if (open) document.querySelector(".nav-link.active").focus();
});
mobileLayout.addEventListener("change", closeSidebar);
document.querySelector(".skip-link").addEventListener("click", event => {
  event.preventDefault();
  main.focus();
});
document.addEventListener("click", event => {
  if (!event.target.closest(".sidebar, .menu-toggle")) closeSidebar();
});

// TEMPLATE: MOTION CONTROL. Session preference; no game data stored.
document.querySelector(".motion-toggle").addEventListener("click", () => {
  motionPaused = !motionPaused;
  document.body.classList.toggle("motion-paused", motionPaused);
  const button = document.querySelector(".motion-toggle");
  button.setAttribute("aria-pressed", String(motionPaused));
  button.innerHTML = motionPaused ? 'RESUME MOTION <span aria-hidden="true">▶</span>' : 'PAUSE MOTION <span aria-hidden="true">Ⅱ</span>';
});

// TEMPLATE: DECORATIVE PIXEL SCENE. No external images or invented game assets.
// This abstract monochrome horizon deliberately remains a wiki illustration.
function startLandscape() {
  const canvas = document.querySelector("#landscape");
  const context = canvas.getContext("2d");
  if (!context) return;
  let frame = 0;
  let lastDraw = 0;
  let stopped = false;
  const dust = Array.from({ length: 23 }, (_, index) => ({ x: (index * 53 + 13) % 320, y: (index * 31 + 7) % 140 }));
  function rect(x, y, width, height, color) { context.fillStyle = color; context.fillRect(x, y, width, height); }
  function draw(time) {
    rect(0, 0, 320, 140, "#363636");
    rect(258, 19, 21, 21, "#7d7d7d");rect(254, 23, 29, 13, "#7d7d7d");
    for (let x = 0; x < 320; x += 8) { const height = 10 + ((x * 7) % 23); rect(x, 96 - height, 8, height, "#464646"); }
    rect(0, 96, 320, 44, "#2a2a2a");
    for (let x = 122; x < 320; x += 23) {
      const height = 15 + ((x * 13) % 18);
      rect(x, 95 - height, 2, height + 5, "#1f1f1f");
      for (let step = 0; step < 4; step++) rect(x - step * 3, 91 - height + step * 6, step * 6 + 4, 6, "#292929");
    }
    rect(203, 99, 9, 3, "#585858");rect(197, 102, 19, 3, "#585858");rect(187, 105, 25, 3, "#585858");rect(174, 108, 31, 4, "#585858");rect(158, 112, 39, 5, "#585858");rect(134, 117, 46, 6, "#585858");rect(106, 123, 52, 7, "#585858");rect(71, 130, 66, 10, "#585858");
    for (let index = 0; index < 65; index++) rect((index * 47) % 320, 104 + (index * 13) % 36, 2 + index % 3, 1, index % 2 ? "#454545" : "#1e1e1e");
    // A stepped foreground silhouette, intentionally without a game character.
    rect(284, 83, 3, 57, "#1a1a1a");rect(281, 81, 8, 5, "#1a1a1a");rect(275, 91, 14, 3, "#1a1a1a");rect(270, 97, 16, 3, "#1a1a1a");rect(298, 120, 22, 20, "#1a1a1a");rect(305, 115, 15, 5, "#1a1a1a");
    for (const particle of dust) rect(Math.floor((particle.x + time * .0015) % 320), Math.floor((particle.y + time * .001) % 140), 1, 1, "#7d7d7d");
  }
  function animate(time) {
    if (stopped) return;
    if (time - lastDraw > 160 && !motionPaused && !motionPreference.matches && !document.hidden) { draw(time); lastDraw = time; }
    frame = requestAnimationFrame(animate);
  }
  draw(0);
  frame = requestAnimationFrame(animate);
  stopScene = () => { stopped = true; cancelAnimationFrame(frame); };
}

renderNavigation();
window.addEventListener("hashchange", route);
route();
