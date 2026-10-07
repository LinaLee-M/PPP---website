// Wiki behaviour. Author-editable lists live in content.js.
"use strict";

// Count calendar days in the project timezone, avoiding daylight-saving drift.
function projectAge(project, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(project.startDate);
  if (!match) throw new Error("project.startDate must use YYYY-MM-DD.");
  const [year, month, day] = match.slice(1).map(Number);
  const start = Date.UTC(year, month - 1, day);
  if (new Date(start).toISOString().slice(0, 10) !== project.startDate) throw new Error("Invalid project start date.");
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: project.timeZone, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now).map(part => [part.type, part.value]));
  const today = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  const days = Math.max(0, Math.floor((today - start) / 86400000));
  const anniversaryPassed = Number(parts.month) > month || (Number(parts.month) === month && Number(parts.day) >= day);
  const years = Math.max(0, Number(parts.year) - year - (anniversaryPassed ? 0 : 1));
  return { days, years };
}

function initializeWiki(WIKI) {
  projectAge(WIKI.project);


  // PIXEL ICON. Rectilinear SVG paths stay crisp at whole-pixel sizes.
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
  function icon(name) {
    return `<svg viewBox="0 0 16 16" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">
      <path fill-rule="evenodd" d="${ICONS[name] || ICONS.book}"/>
    </svg>`;
  }

  // All author text is displayed as text, including angle brackets and quotes.
  function escapeHTML(value) {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(value).replace(/[&<>"']/g, character => entities[character]);
  }
  const main = document.querySelector("main");
  const articleDialog = document.querySelector("#article-dialog");
  const searchDialog = document.querySelector("#search-dialog");
  const mobileLayout = window.matchMedia("(max-width: 650px)");
  let currentPage = "";
  let motionPaused = false;

  // NAVIGATION ITEM. Separate groups share the same link structure.
  function renderNavigation() {
    let previousGroup;
    document.querySelector("#navigation").innerHTML = WIKI.navigation.map(item => {
      const heading = item.group !== previousGroup ? '<p class="micro-label nav-group-label">' + escapeHTML(WIKI.navigationGroups[item.group] || item.group) + '</p>' : "";
      previousGroup = item.group;
      return heading + '<a href="#' + escapeHTML(item.id) + '" class="nav-link" data-page="' + escapeHTML(item.id) + '"><span class="nav-icon">' + icon(item.icon) + '</span>' + escapeHTML(item.label) + '</a>';
    }).join("");
    document.querySelector(".brand-mark").textContent = WIKI.identity.name.slice(0, 1);
    document.querySelector("#brand-name").textContent = WIKI.identity.name;
    document.querySelector("#brand-title").textContent = WIKI.identity.title.toUpperCase();
    document.querySelector(".brand").setAttribute("aria-label", WIKI.identity.name + " wiki home");
    document.querySelector("#sidebar-stage").textContent = WIKI.identity.stage.toUpperCase();
    document.querySelector("#footer-stage").textContent = WIKI.identity.stage.toUpperCase();
    document.querySelector("#footer-identity").textContent = WIKI.identity.name + " / " + WIKI.identity.title.toUpperCase();
  }

  // PAGE HEADING. Use for every inner page.
  function pageHeading(page) {
    const content = WIKI.pages[page];
    return `<header class="page-header">
      <div class="eyebrow">${escapeHTML(content.label)}</div>
      <h1>${escapeHTML(content.title)}</h1>
      <p>${escapeHTML(content.intro)}</p>
    </header>`;
  }

  // SECTION HEADING. Optional right-hand metadata.
  function sectionHeading(title, metadata = "") {
    return `<div class="section-heading">
      <h2>${escapeHTML(title)}</h2>
      <span class="micro-label">${escapeHTML(metadata)}</span>
    </div>`;
  }

  // ARTICLE PARAGRAPH & TUTORIAL STEPS. All editable text is escaped.
  function articleBody(entry) {
    const paragraphs = (entry.body || []).map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join("");
    const steps = entry.steps ? `<h3>Step by step</h3><ol>${entry.steps.map(step => `<li>${escapeHTML(step)}</li>`).join("")}</ol>` : "";
    return paragraphs + steps;
  }

  // ENTRY CARD FACTORY. Uses the actual HTML template in index.html.
  function appendCards(target, entries, page) {
    entries.forEach((entry, index) => {
      const card = document.querySelector("#entry-card-template").content.cloneNode(true);
      card.querySelector(".card-number").textContent = String(index + 1).padStart(2, "0");
      card.querySelector(".badge").textContent = entry.status;
      card.querySelector(".card-icon").innerHTML = icon(entry.icon);
      card.querySelector(".card-title").textContent = entry.title;
      card.querySelector(".card-description").textContent = entry.summary;
      card.querySelector("button").addEventListener("click", () => { location.hash = `${page}/${encodeURIComponent(entry.id)}`; });
      target.append(card);
    });
  }

  // HOME SECTION LINK. Variations use the same HTML structure.
  function archiveTile(page, description, number) {
    const item = WIKI.navigation.find(item => item.id === page);
    return `<a class="archive-tile" href="#${page}"><div class="archive-tile-header">${icon(item.icon)}<span class="micro-label">${number} ↗</span></div><h3>${escapeHTML(item.label)}</h3><p>${escapeHTML(description)}</p></a>`;
  }

  function updateProjectClock() {
    const age = projectAge(WIKI.project);
    const day = document.querySelector("#project-days");
    const year = document.querySelector("#project-years");
    if (day) day.textContent = String(age.days).padStart(3, "0");
    if (year) year.textContent = String(age.years).padStart(5, "0");
  }

  function renderHome() {
    const sections = WIKI.navigation.filter(item => item.id !== "home");
    const latestPost = WIKI.posts[0];
    const completed = WIKI.tasks.filter(task => task.status === "done").length;
    const actions = WIKI.home.actions.map(action => `
      <a class="pixel-button${action.primary ? " primary" : ""}" href="#${escapeHTML(action.page)}">
        ${escapeHTML(action.label)} <span aria-hidden="true">→</span>
      </a>`).join("");
    const tiles = sections.map((item, index) => {
      const number = String(index + 1).padStart(2, "0");
      return archiveTile(item.id, WIKI.pages[item.id].intro, number);
    }).join("");
    main.innerHTML = `<section class="hero panel" aria-labelledby="home-title">
      <div class="hero-art" aria-hidden="true">
        <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges">
        <path fill="#363636" d="M0 0h320v140H0z"/>
        <path fill="#7d7d7d" d="M258 19h21v21h-21z"/>
        <path fill="#464646" d="M0 88h32V72h24v10h24V66h32v17h40V71h32v12h40V62h32v20h32V70h32v70H0z"/>
        <path fill="#2a2a2a" d="M0 96h320v44H0z"/>
        <path fill="#1f1f1f" d="M135 66l-14 30h28zm43-12-18 42h36zm46 12-14 30h28zm52-12-18 42h36z"/>
        <path fill="#585858" d="M203 99h9v6h-20v7h-25v6h-28v7h-32v7H71v8h66v-10h22v-12h26v-9h27z"/>
        <path fill="#1a1a1a" d="M284 83h3v57h-3zm-9 8h14v3h-14zm-5 6h16v3h-16zm28 23h22v20h-22z"/>
      </svg>
        </div>
      <div class="hero-copy">
        <div class="eyebrow">THE OFFICIAL WORK-IN-PROGRESS WIKI</div>
        <h1 id="home-title">${WIKI.home.heading.map(line => escapeHTML(line)).join("<br>")}</h1>
        <p class="hero-summary">${escapeHTML(WIKI.home.summary)}</p>
        <div class="hero-actions">${actions}</div>
      </div>
      <span class="scene-caption">ARCHIVE ILLUSTRATION / NOT GAME FOOTAGE</span>
      </section>
      <section class="home-status panel">
        <div>
          <h2><span class="signal-dot"></span>A SMALL BEGINNING. A LONG ROAD AHEAD.</h2>
          <p>${escapeHTML(WIKI.home.note)}</p>
        </div>
        <div class="date-hud" aria-label="Project age since ${escapeHTML(WIKI.project.startDate)}" title="Elapsed calendar days since ${escapeHTML(WIKI.project.startDate)} (${escapeHTML(WIKI.project.timeZone)})">
        <div>
        <label>YEARS</label>
        <strong id="project-years"></strong>
        </div>
        <div>
        <label>DAYS</label>
        <strong id="project-days"></strong>
        </div>
        </div>
        </section>
      ${sectionHeading("Inside the archive", String(sections.length).padStart(2, "0") + " SECTIONS / ONE GROWING WORLD")}
      <div class="archive-grid">${tiles}</div>
      ${sectionHeading("From the development desk", "THE LATEST CHAPTER")}
      <div class="home-bottom">
        <section class="journal-preview">
        <span class="micro-label">${escapeHTML(latestPost?.tag || "DEV JOURNAL")}</span>
        <h3>${escapeHTML(latestPost?.title || "No journal entries yet.")}</h3>
        <p>${escapeHTML(latestPost?.body?.[0] || "Add a post to start the journal.")}</p>
        <a class="text-link" href="#devblog">OPEN THE JOURNAL ↗</a>
        </section>
        <section class="progress-preview">
        <span class="micro-label">PROJECT STATUS</span>
        <h3>${escapeHTML(WIKI.identity.stage)}</h3>
        <p>${completed} of ${WIKI.tasks.length} tasks complete.</p>
        <a class="text-link" href="#state">VIEW THE CHECKLIST →</a>
        </section>
        </div>`;
    updateProjectClock();
  }

  // Pages and their collections are configured in content.js.
  function renderCollection(page) {
    main.innerHTML = pageHeading(page);
    for (const section of WIKI.pages[page].sections) {
      const entries = WIKI[section.collection];
      const heading = document.createElement("div");
      heading.innerHTML = sectionHeading(section.title, entries.length + (entries.length === 1 ? " ENTRY" : " ENTRIES"));
      main.append(heading);
      if (section.description) {
        const description = document.createElement("p");
        description.className = "section-description";
        description.textContent = section.description;
        main.append(description);
      }
      const grid = document.createElement("div");
      grid.className = "card-grid";
      main.append(grid);
      appendCards(grid, entries, page);
      if (!entries.length) grid.innerHTML = '<p class="empty-state">No entries yet.</p>';
    }
  }

  // JOURNAL POST. Add posts in content.js, not this layout.
  function renderJournal() {
    main.innerHTML = pageHeading("devblog") + `<div class="journal-list">${WIKI.posts.map(post => `<details class="journal-post panel">
        <summary>
        <div class="journal-meta">
        <span class="badge">${escapeHTML(post.tag)}</span>
        <span>${escapeHTML(post.date || "UNDATED")}</span>
        </div>
        <h2>${escapeHTML(post.title)}</h2>
        <span class="micro-label">READ NOTE ↓</span>
        </summary>
        <div class="prose">${articleBody(post)}</div>
        </details>`).join("")}</div>`;
  }

  const TASK_LABELS = { done: "DONE", progress: "IN DEVELOPMENT", planned: "PLANNED", unverified: "TO VERIFY" };
  function renderState() {
    const counts = Object.fromEntries(Object.keys(TASK_LABELS).map(status => [status, WIKI.tasks.filter(task => task.status === status).length]));
    main.innerHTML = pageHeading("state") + `<div class="metrics">${Object.keys(TASK_LABELS).map(status => `<div class="metric">
        <strong>${String(counts[status]).padStart(2, "0")}</strong>
        <span>${TASK_LABELS[status]}</span>
        </div>`).join("")}</div>
        <div class="notice">Completion has not been verified against the game files. “To verify” entries still need confirmation in the game. Only author-confirmed completed tasks should receive a checkmark.</div>
        <div id="task-groups">
        </div>`;
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
    const connections = author.connections.filter(link => {
      try {
        return ["http:", "https:"].includes(new URL(link.url).protocol);
      } catch {
        return false;
      }
    });
    const links = connections.map(link => `
      <a class="pixel-button" href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">
        ${escapeHTML(link.label)} ↗
      </a>`).join("");
    main.innerHTML = pageHeading("author") + `
      <div class="two-column">
        <section class="content-panel panel">
          <div class="profile-icon">${icon("person")}</div>
          <h2>${escapeHTML(author.name)}</h2>
          <span class="micro-label">${escapeHTML(author.role)}</span>
          <div class="prose">${author.bio.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join("")}</div>
        </section>
        <section class="content-panel panel">
          <h2>Connections</h2>
          ${links ? `<div class="author-links">${links}</div>` : '<p class="empty-state">No links yet.</p>'}
        </section>
      </div>`;
  }

  // Authors only need a title and text. Fill the card's other fields automatically.
  function prepareEntries(entries, usedIds, defaultIcon = "book") {
    return entries.map(entry => {
      const title = entry.title || entry.name;
      if (!title) throw new Error("Every entry needs a title or name.");
      const text = entry.body || entry.content || [];
      const body = Array.isArray(text) ? text : String(text).split(/\n\s*\n/);
      const baseId = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "entry";
      let id = entry.id || baseId;
      if (entry.id && usedIds.has(id)) throw new Error("Duplicate article ID: " + id);
      let suffix = 2;
      while (usedIds.has(id)) id = baseId + "-" + suffix++;
      usedIds.add(id);
      return {
        ...entry, id, title, body,
        summary: entry.summary || (body[0]?.length > 160 ? body[0].slice(0, 157) + "…" : body[0]) || "Open this entry to read more.",
        icon: entry.icon || defaultIcon,
        status: entry.status || entry.tag || "ENTRY"
      };
    });
  }

  const renderers = { home: renderHome };
  const allEntries = [];
  const types = { collection: renderCollection, journal: renderJournal, tasks: renderState, author: renderAuthor };
  for (const [page, settings] of Object.entries(WIKI.pages)) {
    if (!types[settings.type]) throw new Error("Unknown page type: " + settings.type);
    renderers[page] = () => types[settings.type](page);
    const ids = new Set();
    for (const section of settings.sections || []) {
      if (!Array.isArray(WIKI[section.collection])) throw new Error("Missing collection: " + section.collection);
      WIKI[section.collection] = prepareEntries(WIKI[section.collection], ids, section.collection === "biomes" ? "world" : "book");
      for (const entry of WIKI[section.collection]) {
        allEntries.push({ ...entry, page });
      }
    }
  }
  WIKI.posts = prepareEntries(WIKI.posts, new Set(), "pen");
  for (const post of WIKI.posts) allEntries.push({ ...post, page: "devblog" });
  const navigationIds = new Set();
  for (const item of WIKI.navigation) {
    if (!/^[a-z0-9-]+$/.test(item.id) || navigationIds.has(item.id) || !renderers[item.id]) throw new Error("Invalid or duplicate navigation ID: " + item.id);
    navigationIds.add(item.id);
  }
  for (const page of Object.keys(renderers)) {
    if (!navigationIds.has(page)) throw new Error("Add a navigation item for page: " + page);
  }

  // HASH ROUTER. Supports direct article URLs, refresh, and back/forward.
  function route() {
    const [requestedPage, encodedId] = location.hash.slice(1).split("/");
    let entryId;
    try { entryId = decodeURIComponent(encodedId || ""); } catch { entryId = ""; }
    const page = Object.hasOwn(renderers, requestedPage) ? requestedPage : "home";
    const changed = page !== currentPage;
    if (changed) {
      currentPage = page;
      renderers[page]();
      main.classList.remove("page-enter");
      void main.offsetWidth;
      main.classList.add("page-enter");
      window.scrollTo(0, 0);
      const label = WIKI.navigation.find(item => item.id === page).label;
      document.querySelector("#breadcrumb").textContent = label.toUpperCase();
      document.title = `${label} · ${WIKI.identity.name} ${WIKI.identity.title}`;
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

  // Build the search index once from the same lists used for rendering.
  const searchRecords = [
    ...WIKI.navigation.map(page => ({
      title: page.label,
      page: page.id,
      summary: WIKI.pages[page.id]?.intro || WIKI.home.summary
    })),
    ...allEntries,
    ...WIKI.tasks.map(task => ({ title: task.label, page: "state", summary: task.group }))
  ];

  function search(query) {
    const results = document.querySelector("#search-results");
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      results.innerHTML = '<p class="search-empty">Type to find a section or entry.</p>';
      return;
    }
    const matches = searchRecords.filter(record => {
      const text = [record.title, record.summary, ...(record.body || []), ...(record.steps || [])];
      return text.join(" ").toLowerCase().includes(normalized);
    });
    if (!matches.length) {
      results.innerHTML = '<p class="search-empty">No entries found. Try another word.</p>';
      return;
    }
    results.innerHTML = matches.map(record => {
      const link = `#${record.page}${record.id ? "/" + encodeURIComponent(record.id) : ""}`;
      const section = WIKI.navigation.find(page => page.id === record.page).label;
      return `<a class="search-result" href="${link}">
        <span class="badge">${escapeHTML(section)}</span>
        <strong>${escapeHTML(record.title)}</strong>
        <span>${escapeHTML(record.summary || "")}</span>
      </a>`;
    }).join("");
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

  // MOBILE NAVIGATION. Focus returns to the toggle when dismissed.
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

  // MOTION CONTROL. Session preference; no game data stored.
  document.querySelector(".motion-toggle").addEventListener("click", () => {
    motionPaused = !motionPaused;
    document.body.classList.toggle("motion-paused", motionPaused);
    const button = document.querySelector(".motion-toggle");
    button.setAttribute("aria-pressed", String(motionPaused));
    button.innerHTML = motionPaused ? 'RESUME MOTION <span aria-hidden="true">▶</span>' : 'PAUSE MOTION <span aria-hidden="true">Ⅱ</span>';
  });

  renderNavigation();
  window.addEventListener("hashchange", route);
  route();

  setInterval(updateProjectClock, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) updateProjectClock(); });
}

try {
  initializeWiki(SITE_CONTENT);
} catch (error) {
  console.error(error);
  const heading = document.createElement("h1");
  heading.textContent = "The wiki could not load";
  const message = document.createElement("p");
  message.textContent = "Check content.js: " + error.message;
  document.querySelector("main").replaceChildren(heading, message);
}
