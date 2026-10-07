import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const contentSource = fs.readFileSync(new URL('../content.js', import.meta.url), 'utf8');
const content = vm.runInNewContext(contentSource + '\nSITE_CONTENT;');
const clockContext = vm.createContext({ Intl, Date });
vm.runInContext(source.slice(0, source.indexOf('function initializeWiki')), clockContext);
const age = date => clockContext.projectAge(content.project, new Date(date));
assert.equal(age('2026-07-11T21:59:59Z').days, 0);
assert.equal(age('2026-07-11T22:00:00Z').days, 0);
assert.equal(age('2026-07-12T22:00:00Z').days, 1);
assert.equal(age('2026-10-07T12:00:00Z').days, 87);
assert.equal(age('2026-10-24T22:00:00Z').days, 105);
assert.equal(age('2026-10-25T23:00:00Z').days, 106);
assert.equal(age('2027-07-11T22:00:00Z').years, 1);
assert.equal(age('2027-07-11T22:00:00Z').days, 365);
assert.throws(() => clockContext.projectAge({ ...content.project, startDate: '2026-02-30' }));
assert.throws(() => clockContext.projectAge({ ...content.project, timeZone: 'invalid/timezone' }));

// Exercise rendering and routing with a minimal DOM adapter. No dependencies needed.
class Element {
  constructor() {
    this.innerHTML = ''; this.textContent = ''; this.children = []; this.dataset = {}; this.style = {};
    this.classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    this.listeners = {}; this.content = { cloneNode: () => new Element() };
  }
  querySelector(selector) { return this.nodes?.[selector] || (this.nodes ||= {}, this.nodes[selector] = new Element()); }
  querySelectorAll() { return []; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute() {} removeAttribute() {} focus() {} contains() { return false; }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  showModal() { this.open = true; } close() { this.open = false; }
  getContext() { return null; }
}

async function mount(data, hash = '') {
  const elements = new Map();
  const errors = [];
  const document = {
    querySelector(selector) { if (!elements.has(selector)) elements.set(selector, new Element()); return elements.get(selector); },
    querySelectorAll() { return []; }, createElement() { return new Element(); },
    activeElement: { tagName: 'BODY' }, addEventListener() {}
  };
  const location = { hash, protocol: 'file:' };
  const events = {};
  const context = vm.createContext({
    Intl, Date, document, location,
    SITE_CONTENT: structuredClone(data),
    fetch: () => { throw new Error('Offline wiki must never fetch content'); },
    console: { error: error => errors.push(error) },
    window: { matchMedia: () => ({ matches: false, addEventListener() {} }), scrollTo() {}, addEventListener(type, handler) { events[type] = handler; } },
    history: { replaceState() {} }, setInterval() {}, requestAnimationFrame() {}, cancelAnimationFrame() {}
  });
  vm.runInContext(source, context);
  await new Promise(resolve => setImmediate(resolve));
  return { document, location, events, errors };
}

const home = await mount(content);
assert.equal(home.errors.length, 0);
assert.match(home.document.querySelector('main').innerHTML, /06 SECTIONS/);
assert.match(home.document.querySelector('main').innerHTML, /1 of 14 tasks complete/);
assert.equal(home.document.querySelector('#brand-name').textContent, content.identity.name);
const renamedContent = vm.runInNewContext(
  contentSource.replace('const GAME_NAME = "PPP";', 'const GAME_NAME = "New Adventure";') + '\nSITE_CONTENT;'
);
for (const page of renamedContent.navigation) {
  const renamed = await mount(renamedContent, '#' + page.id);
  assert.equal(renamed.errors.length, 0);
  assert.equal(renamed.document.querySelector('#brand-name').textContent, 'New Adventure');
  assert.equal(renamed.document.querySelector('.brand-mark').textContent, 'N');
  assert.equal(renamed.document.querySelector('#footer-identity').textContent, 'New Adventure / GAME WIKI');
  assert.ok(renamed.document.title.includes('New Adventure'));
  assert.ok(!renamed.document.title.includes('PPP'));
}
assert.equal(Number(home.document.querySelector('#project-days').textContent), clockContext.projectAge(content.project).days);
for (const page of content.navigation) {
  const mounted = await mount(content, '#' + page.id);
  assert.equal(mounted.errors.length, 0, 'Page failed: ' + page.id + ': ' + mounted.errors[0]?.stack);
}

const extended = structuredClone(content);
extended.biomes.push({ id: 'test-forest', title: 'Test forest', icon: 'world', status: 'TEST', summary: 'A test biome', body: ['Trees & <rocks>'] });
extended.characters = [{ id: 'test-character', title: 'Test character', icon: 'person', status: 'TEST', summary: 'A test NPC', body: ['A new character.'] }];
extended.pages.characters = { type: 'collection', label: '07 / THE PEOPLE', title: 'Characters', intro: 'Meet the people.', sections: [{ collection: 'characters', title: 'Characters' }] };
extended.navigation.push({ id: 'characters', label: 'Characters', icon: 'person', group: 'archive' });
const expandedHome = await mount(extended);
assert.equal(expandedHome.errors.length, 0);
assert.match(expandedHome.document.querySelector('main').innerHTML, /07 SECTIONS/);
assert.match(expandedHome.document.querySelector('#navigation').innerHTML, /#characters/);
const lore = await mount(extended, '#lore');
const cards = lore.document.querySelector('main').children.filter(element => element.className === 'card-grid');
assert.equal(cards[1].children.length, 4, 'Added biome should create a card');
const article = await mount(extended, '#lore/test-forest');
assert.equal(article.document.querySelector('#article-title').textContent, 'Test forest');
assert.equal(article.document.querySelector('#article-dialog').open, true);
assert.match(article.document.querySelector('#article-body').innerHTML, /Trees &amp; &lt;rocks&gt;/);
const characters = await mount(extended, '#characters/test-character');
assert.equal(characters.errors.length, 0);
assert.equal(characters.document.querySelector('#article-title').textContent, 'Test character');
const input = characters.document.querySelector('#search-input');
input.listeners.input({ target: { value: 'test forest' } });
assert.match(characters.document.querySelector('#search-results').innerHTML, /#lore\/test-forest/);
const post = await mount(content, '#devblog/' + content.posts[0].id);
assert.equal(post.document.querySelector('#article-title').textContent, content.posts[0].title);
const invalid = structuredClone(content);
invalid.biomes.push(invalid.biomes[0]);
assert.match((await mount(invalid)).errors[0].message, /duplicate article ID/i);

const minimal = structuredClone(content);
minimal.biomes.push({ name: 'Quiet forest', content: 'Tall trees.\n\nA stream runs through the valley.' });
minimal.biomes.push({ name: 'Quiet forest', body: ['A different forest with the same name.'] });
const automatic = await mount(minimal, '#lore/quiet-forest');
assert.equal(automatic.errors.length, 0);
assert.equal(automatic.document.querySelector('#article-title').textContent, 'Quiet forest');
assert.match(automatic.document.querySelector('#article-body').innerHTML, /A stream runs through the valley/);
const sameName = await mount(minimal, '#lore/quiet-forest-2');
assert.match(sameName.document.querySelector('#article-body').innerHTML, /A different forest/);
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.ok(html.indexOf('src="content.js"') < html.indexOf('src="app.js"'), 'Content loads before the renderer');
assert.doesNotMatch(source, /\bfetch\s*\(|\bimport\s|XMLHttpRequest/, 'Offline rendering needs no server');
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  assert.ok(fs.existsSync(new URL('../' + match[1], import.meta.url)), 'Missing HTML asset: ' + match[1]);
}
const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
for (const match of css.matchAll(/url\("([^"]+)"\)/g)) {
  assert.ok(fs.existsSync(new URL('../' + match[1], import.meta.url)), 'Missing font: ' + match[1]);
}
console.log('Passed: file-mode loading without fetch, local assets, minimal author entries, automatic links, and duplicate names.');
console.log('Passed: project calendar, all pages, dynamic biome and page additions, cards, deep links, search, escaping, and duplicate-ID validation.');
