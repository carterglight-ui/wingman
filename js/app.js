import { store } from './store.js';
import * as ai from './ai.js';
import {
  SCENARIOS, ARCHETYPES, INTEREST_LEVELS, CIRCUMSTANCES, RED_FLAGS, CATEGORIES, FIRST_NAMES, PLAYBOOK,
} from './data.js';
import { icon } from './icons.js';
import { lineChart } from './chart.js';

const app = document.getElementById('app');
const tabbar = document.getElementById('tabbar');
const TAB_SCREENS = ['home', 'progress', 'playbook', 'settings'];

let current = { name: 'home', params: {} };
let chat = null; // live chat engine state while the chat screen is open

/* ---------------------------- helpers ---------------------------- */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (min, max) => min + Math.random() * (max - min);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function weighted(entries) {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of entries) { if ((r -= w) <= 0) return v; }
  return entries[entries.length - 1][0];
}

function hueFor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function avatar(her, cls = '') {
  return `<div class="avatar ${cls}" style="--h:${hueFor(her.name)}" aria-hidden="true">${esc(her.name[0])}</div>`;
}

function fmtDelay(min) {
  if (min < 60) return `${min} minutes`;
  if (min < 1440) { const h = Math.round(min / 60); return `${h} hour${h > 1 ? 's' : ''}`; }
  const d = Math.round(min / 1440); return `${d} day${d > 1 ? 's' : ''}`;
}

function relDate(ts) {
  const d = new Date(ts);
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days === 0) return `Today ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 3700);
}

function haptic() { try { navigator.vibrate?.(8); } catch { /* not supported */ } }

/* ---------------------------- routing ---------------------------- */

function go(name, params = {}) {
  stopChat();
  current = { name, params };
  render();
  window.scrollTo(0, 0);
}

function render() {
  const s = store.settings;
  if (ai.backend === 'none') return unavailable();
  const needsKey = ai.backend === 'key' && !s.apiKey;
  if ((!s.ageOk || needsKey) && current.name !== 'settings') current = { name: 'onboarding', params: {} };
  const screen = SCREENS[current.name] || SCREENS.home;
  document.body.dataset.screen = current.name;
  tabbar.hidden = !TAB_SCREENS.includes(current.name);
  tabbar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === current.name));
  screen(current.params);
}

tabbar.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (b) { haptic(); go(b.dataset.tab); }
});

/* --------------------------- onboarding -------------------------- */

function unavailable() {
  tabbar.hidden = true;
  app.innerHTML = `
  <div class="screen loading">
    <div class="logo-mark big">${icon('wing')}</div>
    <h2>Wingman couldn't connect to Claude</h2>
    <p class="muted center">Open this link in the Claude app or at claude.ai while signed in, then reload the page.</p>
  </div>`;
}

function onboarding() {
  const s = store.settings;
  app.innerHTML = `
  <div class="screen onboarding">
    <div class="ob-hero">
      <div class="logo-mark big">${icon('wing')}</div>
      <h1>Wingman</h1>
      <p class="lede">Your sideline coach for texting women. Practice real conversations, get graded, and learn what actually works.</p>
    </div>
    <div class="pillars">
      <div class="pillar"><span>🧠</span><div><b>Be yourself</b><p>No scripts, no tricks. Talk like a normal, confident man.</p></div></div>
      <div class="pillar"><span>📡</span><div><b>Read the room</b><p>Learn the difference between interest, politeness and friendship.</p></div></div>
      <div class="pillar"><span>🧭</span><div><b>Lead with respect</b><p>Take initiative, make plans and honor her comfort.</p></div></div>
    </div>
    <form class="card form" id="obForm">
      <label class="field"><span>Your first name <em>(optional)</em></span>
        <input name="name" autocomplete="given-name" value="${esc(s.name)}" placeholder="e.g. Jake"></label>
      <label class="field"><span>Your age <em>(optional, keeps her age realistic)</em></span>
        <input name="age" inputmode="numeric" pattern="[0-9]*" value="${esc(s.age)}" placeholder="e.g. 26"></label>
      ${ai.backend === 'key' ? `
      <label class="field"><span>Claude API key</span>
        <input name="apiKey" type="password" autocomplete="off" value="${esc(s.apiKey)}" placeholder="sk-ant-..." required></label>
      <p class="hint">Wingman uses Claude to play her and to coach you. Get a key at <b>console.anthropic.com</b> → API Keys. You only enter it once. It is stored only on this phone.</p>
      <p class="hint">Using the home-screen app? Enter your key there. Safari and the home-screen app keep separate storage.</p>` : `
      <p class="hint">Wingman runs on your Claude account. No API key needed. The first time she replies, Claude will ask you to allow it.</p>`}
      <label class="check"><input type="checkbox" name="ageOk" ${s.ageOk ? 'checked' : ''} required> <span>I am 18 or older</span></label>
      <button class="btn primary block" type="submit">Let's go</button>
    </form>
  </div>`;
  app.querySelector('#obForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    store.setSettings({
      name: f.get('name').trim(), age: f.get('age').trim(), ageOk: f.get('ageOk') === 'on',
      ...(f.has('apiKey') ? { apiKey: f.get('apiKey').trim() } : {}),
    });
    if (!store.canSave) {
      toast("Your phone is blocking Wingman from saving. Turn off Private Browsing (and Settings → Safari → Block All Cookies), or you'll have to re-enter your key.");
    }
    go('home');
  });
}

/* ------------------------------ home ----------------------------- */

function home() {
  const s = store.settings;
  const graded = store.sessions.filter((x) => x.result);
  const active = store.active && store.active.status !== 'graded' ? store.active : null;
  const avg = graded.length ? Math.round(graded.reduce((a, x) => a + x.result.score, 0) / graded.length) : null;
  const tip = PLAYBOOK[Math.floor(Date.now() / 86400000) % PLAYBOOK.length];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  app.innerHTML = `
  <div class="screen home">
    <header class="top">
      <div class="brand"><div class="logo-mark">${icon('wing')}</div><span>Wingman</span></div>
      <div class="mini-stats">${graded.length ? `<span>${graded.length} played</span><span>avg ${avg}</span>` : ''}</div>
    </header>
    <h1 class="greet">${greet}${s.name ? `, ${esc(s.name)}` : ''}.</h1>
    <p class="sub">Who are you texting today?</p>

    ${active ? `
    <button class="card resume" data-resume="${active.id}">
      ${avatar(active.her)}
      <div><small>${active.status === 'ended' ? 'Ready to grade' : 'Conversation in progress'}</small>
      <b>${esc(active.her.name)} · ${esc(active.scenario.title)}</b></div>
      ${icon('chev')}
    </button>` : ''}

    <button class="hero-cta" id="randomBtn">
      <div class="hero-glow"></div>
      <div class="hero-text">
        <small>Quick start</small>
        <b>Surprise me</b>
        <p>Random scenario, random woman. Just like real life.</p>
      </div>
      <div class="hero-icon">${icon('shuffle')}</div>
    </button>

    <h2 class="section">Pick a scenario</h2>
    <div class="scenario-list">
      ${SCENARIOS.map((sc) => `
      <button class="scenario" data-sc="${sc.id}">
        <span class="sc-icon">${sc.icon}</span>
        <div><b>${esc(sc.title)}</b><p>${esc(sc.short)}</p></div>
        <span class="skin-tag ${sc.skin}">${sc.skin === 'app' ? 'Dating app' : 'Text'}</span>
      </button>`).join('')}
    </div>

    <h2 class="section">Today's tip</h2>
    <button class="card tip" data-lesson="${tip.id}">
      <span class="tip-emoji">${tip.emoji}</span>
      <div><b>${esc(tip.title)}</b><p>${esc(tip.body[0])}</p></div>
    </button>
  </div>`;

  app.querySelector('#randomBtn').onclick = () => startScenario(null);
  app.querySelectorAll('[data-sc]').forEach((b) => { b.onclick = () => startScenario(b.dataset.sc); });
  app.querySelector('[data-resume]')?.addEventListener('click', () => {
    go(active.status === 'ended' ? 'results' : active.status === 'briefing' ? 'briefing' : 'chat', { id: active.id });
  });
  app.querySelector('[data-lesson]').onclick = (e) => go('lesson', { id: e.currentTarget.dataset.lesson });
}

/* ------------------------- start scenario ------------------------ */

function loadingScreen(title, lines) {
  app.innerHTML = `
  <div class="screen loading">
    <div class="pulse-ring">${icon('wing')}</div>
    <h2>${esc(title)}</h2>
    <p class="cycle" id="cycle">${esc(lines[0])}</p>
  </div>`;
  let i = 0;
  const el = app.querySelector('#cycle');
  const t = setInterval(() => {
    if (!el.isConnected) return clearInterval(t);
    i = (i + 1) % lines.length;
    el.textContent = lines[i];
  }, 1800);
}

function errorScreen(message, retry) {
  app.innerHTML = `
  <div class="screen loading">
    <div class="err-icon">!</div>
    <h2>Something went wrong</h2>
    <p class="muted center">${esc(message)}</p>
    <div class="row-btns">
      <button class="btn ghost" id="errHome">Home</button>
      <button class="btn primary" id="errRetry">Try again</button>
    </div>
  </div>`;
  app.querySelector('#errHome').onclick = () => go('home');
  app.querySelector('#errRetry').onclick = retry;
}

async function startScenario(scenarioId) {
  haptic();
  const scenario = scenarioId ? SCENARIOS.find((s) => s.id === scenarioId) : pick(SCENARIOS);
  const archetype = pick(ARCHETYPES);
  const interestKey = weighted(Object.entries(scenario.interest));
  const interest = INTEREST_LEVELS[interestKey];
  const circumstance = weighted(CIRCUMSTANCES.map((c) => [c.text, c.w]));
  const redFlag = Math.random() < (archetype.id === 'high-standards' ? 0.5 : 0.25) ? pick(RED_FLAGS) : '';
  const name = pick(FIRST_NAMES);

  loadingScreen(scenario.skin === 'app' ? 'Finding your match…' : 'Setting the scene…', [
    'Giving her a personality', 'Deciding how her week is going', 'Writing her backstory', 'Hiding her true feelings',
  ]);

  try {
    const gen = await ai.createHer({ scenario, archetype, interest, circumstance, redFlag, name });
    if (current.name !== 'home') return; // user navigated away while loading
    const her = {
      name, age: gen.age, job: gen.job, location: gen.location, bio: gen.bio, prompts: gen.prompts,
      interests: gen.interests, userBrief: gen.user_brief, privateTake: gen.her_private_take,
      archetype, circumstance, redFlag, startInterest: interest.value, interestLabel: interest.label,
    };
    const session = {
      id: uid(), createdAt: Date.now(), scenario, her, transcript: [], turns: [],
      status: 'briefing', endReason: '', result: null, dateAgreed: false,
    };
    if (scenario.herFirst && gen.opening_message) {
      session.transcript.push({ role: 'her', text: gen.opening_message });
    }
    store.addSession(session);
    go('briefing', { id: session.id });
  } catch (err) {
    errorScreen(err.message, () => { current = { name: 'home', params: {} }; startScenario(scenarioId); });
  }
}

/* ---------------------------- briefing --------------------------- */

function profileCard(her, scenario) {
  if (scenario.skin === 'app') {
    return `
    <div class="profile">
      <div class="photo" style="--h:${hueFor(her.name)}">
        <span class="photo-initial">${esc(her.name[0])}</span>
        <div class="photo-meta"><b>${esc(her.name)}, ${her.age}</b><span>${esc(her.job)} · ${esc(her.location)}</span></div>
      </div>
      <div class="profile-body">
        <p class="bio">${esc(her.bio)}</p>
        ${(her.prompts || []).map((p) => `<div class="prompt"><small>${esc(p.q)}</small><p>${esc(p.a)}</p></div>`).join('')}
        <div class="chips">${her.interests.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div>
      </div>
    </div>`;
  }
  return `
  <div class="contact">
    ${avatar(her, 'xl')}
    <b>${esc(her.name)}</b>
    <span class="muted">${her.age} · ${esc(her.job)}</span>
    <p>${esc(her.bio)}</p>
  </div>`;
}

function briefing({ id }) {
  const s = store.session(id);
  if (!s) return go('home');
  app.innerHTML = `
  <div class="screen briefing">
    <header class="bar">
      <button class="icon-btn" id="back" aria-label="Back">${icon('back')}</button>
      <span class="bar-title">Briefing</span>
      <span class="spacer"></span>
    </header>
    <div class="scenario-banner"><span>${s.scenario.icon}</span><div><small>Scenario</small><b>${esc(s.scenario.title)}</b></div></div>
    <div class="card brief">
      <small class="label">What you know</small>
      <p>${esc(s.her.userBrief)}</p>
    </div>
    ${profileCard(s.her, s.scenario)}
    <div class="card rules">
      <small class="label">How this works</small>
      <ul>
        <li>Text her like you really would. There is no perfect answer.</li>
        <li>She replies within a few minutes. If she would really take hours, you'll see a note.</li>
        <li>Stuck? Call a <b>Timeout</b> for a quick read from your coach.</li>
        <li>Tap <b>End</b> anytime to get graded.</li>
      </ul>
    </div>
    <div class="sticky-cta"><button class="btn primary block" id="go">${s.scenario.herFirst ? 'Open her message' : 'Start texting'}</button></div>
  </div>`;
  app.querySelector('#back').onclick = () => go('home');
  app.querySelector('#go').onclick = () => {
    s.status = 'active';
    store.updateSession(s);
    go('chat', { id });
  };
}

/* ------------------------------ chat ----------------------------- */

function stopChat() {
  if (!chat) return;
  chat.timers.forEach(clearTimeout);
  chat.dead = true;
  chat = null;
}

function chatScreen({ id }) {
  const s = store.session(id);
  if (!s) return go('home');
  const app_ = s.scenario.skin === 'app';
  chat = { s, gen: 0, timers: [], typing: false, waiting: false, error: null, dead: false };

  app.innerHTML = `
  <div class="chat ${s.scenario.skin}">
    <header class="chat-head">
      <button class="icon-btn" id="back" aria-label="Back">${icon('back')}</button>
      <button class="who" id="who">
        ${avatar(s.her, app_ ? 'sm' : 'md')}
        <div><b>${esc(s.her.name)}</b><small>${app_ ? 'Matched' : esc(s.scenario.title)}</small></div>
      </button>
      <button class="pill coach" id="timeoutBtn">${icon('whistle')}<span>Timeout</span></button>
      <button class="pill end" id="endBtn">End</button>
    </header>
    <div class="msgs" id="msgs"></div>
    <div class="ended-bar" id="endedBar" hidden></div>
    <form class="composer" id="composer">
      <textarea id="input" rows="1" placeholder="${app_ ? 'Type a message' : 'Text Message'}" enterkeyhint="send" autocomplete="off"></textarea>
      <button class="send" type="submit" aria-label="Send">${icon('send')}</button>
    </form>
  </div>`;

  const input = app.querySelector('#input');
  const autosize = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; };
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); app.querySelector('#composer').requestSubmit(); }
  });
  app.querySelector('#composer').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || s.status !== 'active') return;
    input.value = '';
    autosize();
    sendMine(text);
    input.focus();
  });
  app.querySelector('#back').onclick = () => go('home');
  app.querySelector('#who').onclick = () => showProfileSheet(s);
  app.querySelector('#timeoutBtn').onclick = () => callTimeout(s);
  app.querySelector('#endBtn').onclick = () => confirmEnd(s);

  drawMessages();

  // Resume: if his last message never got an answer (app closed mid-wait), ask her again.
  const last = s.transcript[s.transcript.length - 1];
  if (s.status === 'active' && last && last.role === 'me') schedule(requestHer, 1200);
}

function schedule(fn, ms) {
  if (!chat) return;
  const c = chat;
  c.timers.push(setTimeout(() => { if (!c.dead) fn(); }, ms));
}

function drawMessages() {
  if (!chat) return;
  const { s } = chat;
  const box = app.querySelector('#msgs');
  const app_ = s.scenario.skin === 'app';
  const t = s.transcript;
  let lastMine = -1;
  t.forEach((m, i) => { if (m.role === 'me') lastMine = i; });

  let html = `<div class="chat-intro">${avatar(s.her, 'lg')}<b>${esc(s.her.name)}</b><small>${
    app_ ? `You matched with ${esc(s.her.name)}` : esc(s.scenario.short)}</small></div>`;

  t.forEach((m, i) => {
    if (m.role === 'note') {
      html += `<div class="note ${m.kind || ''}">${esc(m.text)}</div>`;
      return;
    }
    const next = t[i + 1];
    const tail = !next || next.role !== m.role;
    html += `<div class="bubble ${m.role === 'me' ? 'me' : 'her'} ${tail ? 'tail' : ''} ${m.fresh ? 'fresh' : ''}" style="${m.fresh ? `animation-delay:${m.fresh}ms` : ''}">${esc(m.text)}</div>`;
    if (i === lastMine && i === t.length - 1) {
      html += `<div class="receipt">${m.read ? (app_ ? 'Seen' : 'Read') : (app_ ? 'Sent' : 'Delivered')}</div>`;
    }
  });
  t.forEach((m) => { delete m.fresh; });

  if (chat.typing) html += `<div class="bubble her typing tail"><i></i><i></i><i></i></div>`;
  if (chat.error) html += `<button class="note error" id="retryHer">${esc(chat.error)} Tap to retry.</button>`;
  box.innerHTML = html;
  box.querySelector('#retryHer')?.addEventListener('click', () => { chat.error = null; drawMessages(); requestHer(); });
  box.scrollTop = box.scrollHeight;

  const ended = s.status !== 'active';
  app.querySelector('#composer').hidden = ended;
  const bar = app.querySelector('#endedBar');
  if (ended) {
    bar.hidden = false;
    bar.innerHTML = `<p>${esc(s.endTitle || 'Conversation over')}</p><button class="btn primary block" id="toResults">See your results</button>`;
    bar.querySelector('#toResults').onclick = () => go('results', { id: s.id });
  } else if (s.dateAgreed) {
    bar.hidden = false;
    bar.innerHTML = `<p>📅 She said yes to a date! Wrap up naturally, or end now.</p><button class="btn primary block" id="toResults">End &amp; get graded</button>`;
    bar.querySelector('#toResults').onclick = () => finish(s, `She agreed to a date. He ended the chat after that.`);
  } else {
    bar.hidden = true;
  }
}

function sendMine(text) {
  const { s } = chat;
  haptic();
  s.transcript.push({ role: 'me', text, read: false, fresh: 1 });
  store.updateSession(s);
  // A new message from him cancels any reply she was about to send; she will
  // reconsider with everything he has said (that is how double-texting works).
  chat.gen++;
  chat.timers.forEach(clearTimeout);
  chat.timers = [];
  chat.typing = false;
  chat.error = null;
  drawMessages();
  schedule(requestHer, 1600);
}

async function requestHer() {
  if (!chat) return;
  const c = chat;
  const myGen = ++c.gen;
  const { s } = c;
  let res;
  try {
    res = await ai.herTurn(s);
  } catch (err) {
    if (c.dead || myGen !== c.gen) return;
    c.error = err.message;
    drawMessages();
    return;
  }
  if (c.dead || myGen !== c.gen) return; // he sent more while she was deciding

  const delay = Math.max(0, res.delay_minutes | 0);
  // Real waiting time is compressed: everything lands within a few seconds,
  // and a note tells him how long she really took.
  const waitMs = delay <= 3 ? rand(800, 2000) : delay <= 30 ? rand(2000, 4000) : rand(3500, 6000);

  schedule(() => {
    s.transcript.forEach((m) => { if (m.role === 'me') m.read = true; });
    const showTyping = res.action === 'reply' || ((res.action === 'unmatch' || res.action === 'block') && res.messages.length);
    if (showTyping) { c.typing = true; }
    drawMessages();
    const typeMs = showTyping ? Math.min(900 + (res.messages.join(' ').length * 25), 3200) : 300;
    schedule(() => { c.typing = false; applyTurn(s, res, delay); }, typeMs);
  }, waitMs);
}

function applyTurn(s, res, delay) {
  const name = s.her.name;
  const app_ = s.scenario.skin === 'app';
  const turnIndex = s.turns.length;
  s.turns.push({ thought: res.inner_thought, interest: Math.max(0, Math.min(100, res.interest)), action: res.action, delay, dateStatus: res.date_status });

  const push = (m) => s.transcript.push(m);
  const msgs = (res.messages || []).filter((m) => m.trim());
  let action = res.action;
  if (action === 'reply' && !msgs.length) action = 'leave_on_read';
  if (action === 'unmatch' && !app_) action = 'block';

  if (action === 'reply') {
    if (delay >= 30) push({ role: 'note', text: `${name} replied ${fmtDelay(delay)} later` });
    msgs.forEach((text, i) => push({ role: 'her', text, fresh: 1 + i * 650 }));
  } else if (action === 'leave_on_read') {
    push({ role: 'note', kind: 'warn', text: `${name} read your message and hasn't replied.` });
  } else if (action === 'ghost') {
    push({ role: 'note', text: `— ${fmtDelay(Math.max(delay, 4320))} pass —` });
    push({ role: 'note', kind: 'bad', text: `${name} never replied. She ghosted you.` });
    s.status = 'ended';
    s.endTitle = `${name} stopped replying.`;
    s.endReason = 'She ghosted him (stopped replying for good).';
  } else {
    msgs.forEach((text, i) => push({ role: 'her', text, fresh: 1 + i * 650 }));
    if (action === 'unmatch' || app_) {
      push({ role: 'note', kind: 'bad', text: `${name} unmatched you.` });
      s.endTitle = `${name} unmatched you.`;
      s.endReason = 'She unmatched him.';
    } else {
      push({ role: 'note', kind: 'bad', text: `Your messages to ${name} aren't being delivered. She likely blocked your number.` });
      s.endTitle = `${name} blocked your number.`;
      s.endReason = 'She blocked his number.';
    }
    s.status = 'ended';
  }
  s.transcript[s.transcript.length - 1].turnEnd = turnIndex;

  if (res.date_status === 'agreed' && !s.dateAgreed) {
    s.dateAgreed = true;
    push({ role: 'note', kind: 'good', text: '📅 Date set!' });
  }
  if (s.status === 'ended') store.clearActive();
  store.updateSession(s);
  if (msgs.length) haptic();
  drawMessages();
}

function sheet(html, onMount) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-bg"></div><div class="sheet"><div class="grabber"></div>${html}</div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  const close = () => { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 250); };
  wrap.querySelector('.sheet-bg').onclick = close;
  onMount?.(wrap.querySelector('.sheet'), close);
  return close;
}

function showProfileSheet(s) {
  sheet(`${profileCard(s.her, s.scenario)}<div class="card brief"><small class="label">What you know</small><p>${esc(s.her.userBrief)}</p></div>`);
}

async function callTimeout(s) {
  haptic();
  if (!s.transcript.some((m) => m.role === 'me')) {
    sheet(`<div class="timeout"><h3>${icon('whistle')} Timeout</h3><p>Nothing to read yet. Send your first message! Keep it short, specific and like you. Check the briefing for something real to react to.</p></div>`);
    return;
  }
  let closed = false;
  const close = sheet(`<div class="timeout"><h3>${icon('whistle')} Timeout</h3><div id="tBody"><div class="dots"><i></i><i></i><i></i></div><p class="muted">Coach is looking over your shoulder…</p></div></div>`,
    (el) => { el.closest('.sheet-wrap').querySelector('.sheet-bg').addEventListener('click', () => { closed = true; }); });
  try {
    const r = await ai.timeout(s);
    if (closed) return;
    const body = document.getElementById('tBody');
    if (!body) return;
    const vibeLabel = { warm: 'Warm', neutral: 'Neutral', cool: 'Cooling off', cold: 'Cold' }[r.vibe];
    body.innerHTML = `
      <span class="vibe ${r.vibe}">${icon('signal')} Her vibe: ${vibeLabel}</span>
      <p>${esc(r.read)}</p>
      <div class="tip-box"><small>Your move</small><p>${esc(r.tip)}</p></div>
      <button class="btn primary block" id="tClose">Back to the game</button>`;
    body.querySelector('#tClose').onclick = close;
  } catch (err) {
    const body = document.getElementById('tBody');
    if (body) body.innerHTML = `<p>${esc(err.message)}</p>`;
  }
}

function confirmEnd(s) {
  const mine = s.transcript.filter((m) => m.role === 'me').length;
  if (!mine) {
    sheet(`<div class="confirm"><h3>Leave this conversation?</h3><p class="muted">You haven't sent anything yet, so there is nothing to grade.</p>
      <div class="row-btns"><button class="btn ghost" data-x>Keep going</button><button class="btn danger" data-del>Discard</button></div></div>`,
    (el, close) => {
      el.querySelector('[data-x]').onclick = close;
      el.querySelector('[data-del]').onclick = () => { close(); store.deleteSession(s.id); go('home'); };
    });
    return;
  }
  sheet(`<div class="confirm"><h3>End and get graded?</h3><p class="muted">Your coach will grade the conversation and show you what she was really thinking.</p>
    <div class="row-btns"><button class="btn ghost" data-x>Keep texting</button><button class="btn primary" data-end>Grade me</button></div></div>`,
  (el, close) => {
    el.querySelector('[data-x]').onclick = close;
    el.querySelector('[data-end]').onclick = () => {
      close();
      const reason = s.dateAgreed ? 'She agreed to a date. He ended the chat after that.' : 'He ended the practice conversation here (still open).';
      finish(s, reason);
    };
  });
}

function finish(s, reason) {
  s.status = 'ended';
  s.endReason = reason;
  s.endTitle = 'Conversation ended';
  store.updateSession(s);
  go('results', { id: s.id });
}

/* ---------------------------- results ---------------------------- */

const RATING = {
  great: { label: 'Great', icon: '✅' },
  good: { label: 'Good', icon: '👍' },
  okay: { label: 'Okay', icon: '➖' },
  risky: { label: 'Risky', icon: '⚠️' },
  hurt: { label: 'Hurt you', icon: '❌' },
};
const ON_HIM = {
  mostly_you: { label: 'Mostly on you', cls: 'bad' },
  partly_you: { label: 'Partly on you', cls: 'warn' },
  not_you: { label: 'Not on you', cls: 'good' },
  went_well: { label: 'You earned this', cls: 'good' },
};

async function results({ id }) {
  const s = store.session(id);
  if (!s) return go('home');
  if (!s.result) {
    loadingScreen('Coach is reviewing your game…', [
      'Reading every message', 'Checking what she was really thinking', 'Scoring your charisma', 'Finding your best moments',
    ]);
    try {
      const r = await ai.gradeSession(s);
      s.result = r;
      s.status = 'graded';
      s.gradedAt = Date.now();
      store.updateSession(s);
      if (store.active?.id === s.id) store.clearActive();
    } catch (err) {
      if (current.name === 'results' && current.params.id === id) errorScreen(err.message, () => results({ id }));
      return;
    }
    if (current.name !== 'results' || current.params.id !== id) return;
  }
  drawResults(s, current.params.tab || 'score');
}

function gradeClass(score) {
  return score >= 87 ? 'g-a' : score >= 77 ? 'g-b' : score >= 67 ? 'g-c' : 'g-d';
}

function drawResults(s, tab) {
  const r = s.result;
  const on = ON_HIM[r.outcome.on_him] || ON_HIM.partly_you;
  const tabs = [['score', 'Score'], ['replay', 'Replay'], ['her', 'Her side'], ['flags', 'Flags'], ['coach', 'Coaching']];

  app.innerHTML = `
  <div class="screen results">
    <header class="bar">
      <button class="icon-btn" id="back" aria-label="Back">${icon('back')}</button>
      <span class="bar-title">Results</span>
      <span class="spacer"></span>
    </header>

    <section class="grade-hero ${gradeClass(r.score)}">
      <div class="ring" style="--p:${r.score}"><div><b>${esc(r.grade)}</b><small>${r.score}/100</small></div></div>
      <div class="grade-copy">
        <small>${esc(s.scenario.title)} · ${esc(s.her.name)}</small>
        <h2>${esc(r.headline)}</h2>
      </div>
    </section>

    <section class="card outcome">
      <div class="outcome-top"><span class="outcome-label">${esc(r.outcome.label)}</span><span class="badge ${on.cls}">${esc(on.label)}</span></div>
      <p>${esc(r.outcome.explanation)}</p>
      <small class="muted">Your grade measures how you communicated. The outcome is what she did. They are not the same thing.</small>
    </section>

    <nav class="seg" role="tablist">
      ${tabs.map(([k, l]) => `<button role="tab" data-t="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}
    </nav>
    <div id="tabBody">${RESULT_TABS[tab](s)}</div>

    <div class="row-btns end-actions">
      <button class="btn ghost" id="again">Same scenario</button>
      <button class="btn primary" id="next">Next match</button>
    </div>
  </div>`;

  app.querySelector('#back').onclick = () => go('home');
  app.querySelectorAll('[data-t]').forEach((b) => {
    b.onclick = () => { haptic(); current.params.tab = b.dataset.t; drawResults(s, b.dataset.t); };
  });
  app.querySelector('#again').onclick = () => { current = { name: 'home', params: {} }; startScenario(s.scenario.id); };
  app.querySelector('#next').onclick = () => { current = { name: 'home', params: {} }; startScenario(null); };
  mountCharts();
}

const RESULT_TABS = {
  score(s) {
    const r = s.result;
    const byKey = Object.fromEntries(r.categories.map((c) => [c.key, c]));
    return `
    <div class="card cats">
      ${CATEGORIES.map((c) => {
        const v = byKey[c.key];
        if (!v) return '';
        return `<div class="cat">
          <div class="cat-top"><b>${c.label}</b><span>${v.score}</span></div>
          <div class="meter"><i style="width:${Math.max(2, Math.min(100, v.score))}%"></i></div>
          <p>${esc(v.note)}</p>
        </div>`;
      }).join('')}
    </div>
    ${r.charisma_moments.length ? `<div class="card list good"><h3>✨ Charismatic moments</h3><ul>${r.charisma_moments.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    ${r.missed_opportunities.length ? `<div class="card list warn"><h3>🎯 Missed opportunities</h3><ul>${r.missed_opportunities.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}`;
  },

  replay(s) {
    const r = s.result;
    const notes = Object.fromEntries(r.annotations.map((a) => [a.n, a]));
    let n = 0;
    let html = `<div class="replay chat ${s.scenario.skin}">`;
    for (const m of s.transcript) {
      if (m.role === 'note') { html += `<div class="note ${m.kind || ''}">${esc(m.text)}</div>`; }
      else if (m.role === 'me') {
        n++;
        const a = notes[n];
        html += `<div class="bubble me tail">${esc(m.text)}</div>`;
        if (a) {
          const R = RATING[a.rating] || RATING.okay;
          html += `<div class="annot ${a.rating}"><span>${R.icon} ${R.label}</span><p>${esc(a.note)}</p></div>`;
        }
      } else {
        html += `<div class="bubble her tail">${esc(m.text)}</div>`;
      }
      if (m.turnEnd !== undefined && s.turns[m.turnEnd]) {
        const t = s.turns[m.turnEnd];
        html += `<div class="thought"><span>💭 ${esc(s.her.name)} was thinking</span><p>${esc(t.thought)}</p><small>Interest ${t.interest}/100</small></div>`;
      }
    }
    return html + '</div>';
  },

  her(s) {
    const r = s.result;
    const fvr = r.friend_vs_romance;
    const readLabel = { romantic: 'Romantic interest', friendly: 'Friendly, not romantic', unclear: 'Unclear', neither: 'Not interested either way' }[fvr.read];
    const pts = [s.her.startInterest, ...s.turns.map((t) => t.interest)];
    return `
    <div class="card her-card">
      <div class="her-top">${avatar(s.her, 'md')}<div><b>${esc(s.her.name)}, ${s.her.age}</b><small>${esc(s.her.archetype.label)} · ${esc(s.her.job)}</small></div></div>
      <p>${esc(r.her_side)}</p>
      <dl>
        <dt>Her personality</dt><dd>${esc(s.her.archetype.about)}</dd>
        <dt>What was going on with her</dt><dd>${esc(s.her.circumstance)}</dd>
        ${s.her.redFlag ? `<dt>🚩 Her flaw</dt><dd>${esc(s.her.redFlag)}</dd>` : ''}
      </dl>
    </div>
    <div class="card">
      <h3>Her interest, message by message</h3>
      <div class="chart" data-chart='${JSON.stringify({ values: pts, labels: pts.map((_, i) => (i === 0 ? 'Start' : `After reply ${i}`)) })}'></div>
      <small class="muted">Hidden from you during the chat. 50 is neutral.</small>
    </div>
    <div class="card fvr">
      <h3>Friendship or romance?</h3>
      <span class="badge ${fvr.read === 'romantic' ? 'good' : fvr.read === 'friendly' ? 'info' : 'warn'}">${readLabel}</span>
      <ul>${fvr.signals.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p>${esc(fvr.advice)}</p>
    </div>`;
  },

  flags(s) {
    const f = s.result.flags;
    const group = (title, items, cls, ic) => `
      <div class="flag-group ${cls}"><h4>${ic} ${title}</h4>
      ${items.length ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">None noticed.</p>'}</div>`;
    return `
    <div class="card flags">
      <h3>Her</h3>
      ${group('Green flags', f.her_green, 'green', '🟢')}
      ${group('Red flags', f.her_red, 'red', '🚩')}
    </div>
    <div class="card flags">
      <h3>You</h3>
      ${group('Green flags', f.your_green, 'green', '🟢')}
      ${group('Red flags', f.your_red, 'red', '🚩')}
    </div>`;
  },

  coach(s) {
    const r = s.result;
    const mine = s.transcript.filter((m) => m.role === 'me');
    return `
    <div class="card focus"><small class="label">Work on this next</small><p>${esc(r.work_on)}</p></div>
    ${r.rewrites.length ? `<div class="card"><h3>Try it this way</h3>
      ${r.rewrites.map((w) => `
        <div class="rewrite">
          <div class="rw-old"><small>You said</small><p>${esc(mine[w.n - 1]?.text ?? '')}</p></div>
          <div class="rw-new"><small>More like you, but better</small><p>${esc(w.better)}</p></div>
          <p class="muted">${esc(w.why)}</p>
        </div>`).join('')}
    </div>` : ''}
    ${r.in_person_tip ? `<div class="card"><h3>🤝 When you meet in person</h3><p>${esc(r.in_person_tip)}</p></div>` : ''}
    <div class="card reassure"><h3>From your coach</h3><p>${esc(r.reassurance)}</p></div>`;
  },
};

function mountCharts() {
  app.querySelectorAll('[data-chart]').forEach((el) => {
    const { values, labels } = JSON.parse(el.dataset.chart);
    lineChart(el, values, labels);
  });
}

/* ---------------------------- progress --------------------------- */

function progress() {
  const graded = store.sessions.filter((x) => x.result).sort((a, b) => a.gradedAt - b.gradedAt);
  const all = store.sessions;
  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
  const dates = graded.filter((x) => x.result.outcome.label === 'Date locked in').length;
  const notYou = graded.filter((x) => x.result.outcome.on_him === 'not_you').length;

  // Streak: consecutive days (ending today or yesterday) with at least one graded session.
  const days = new Set(graded.map((x) => new Date(x.gradedAt).toDateString()));
  let streak = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }

  const catAvg = CATEGORIES.map((c) => ({
    ...c,
    v: avg(graded.map((x) => x.result.categories.find((k) => k.key === c.key)?.score).filter((v) => v != null)),
  }));
  const sorted = [...catAvg].sort((a, b) => b.v - a.v);
  const recent = graded.slice(-15);

  app.innerHTML = `
  <div class="screen progress">
    <header class="top"><h1>Progress</h1></header>
    ${!graded.length ? `
      <div class="empty card"><span>📈</span><b>No graded conversations yet</b><p>Finish a conversation and get graded to start tracking your game.</p>
      <button class="btn primary" id="startNow">Start one now</button></div>` : `
    <div class="tiles">
      <div class="tile"><small>Graded</small><b>${graded.length}</b></div>
      <div class="tile"><small>Avg score</small><b>${avg(graded.map((x) => x.result.score))}</b></div>
      <div class="tile"><small>Dates set</small><b>${dates}</b></div>
      <div class="tile"><small>Day streak</small><b>${streak}🔥</b></div>
    </div>
    <div class="card">
      <h3>Your scores over time</h3>
      <div class="chart" data-chart='${JSON.stringify({ values: recent.map((x) => x.result.score), labels: recent.map((x) => `${x.result.grade} · ${x.her.name}`) })}'></div>
    </div>
    <div class="card cats">
      <h3>Skill breakdown</h3>
      ${catAvg.map((c) => `<div class="cat"><div class="cat-top"><b>${c.label}</b><span>${c.v}</span></div><div class="meter"><i style="width:${Math.max(2, c.v)}%"></i></div><small class="muted">${c.blurb}</small></div>`).join('')}
    </div>
    <div class="card insight">
      <p>💪 Strongest: <b>${sorted[0].label}</b>. 🎯 Focus area: <b>${sorted[sorted.length - 1].label}</b>.</p>
      ${notYou ? `<p>🌧️ ${notYou} of your conversations ended in a way that was <b>not on you</b>. That is real dating. Keep your standards and keep going.</p>` : ''}
    </div>`}
    ${all.length ? `
    <h2 class="section">History</h2>
    <div class="history">
      ${all.map((x) => `
      <button class="hist" data-id="${x.id}">
        ${avatar(x.her, 'sm')}
        <div><b>${esc(x.her.name)}</b><small>${esc(x.scenario.title)} · ${relDate(x.createdAt)}</small></div>
        ${x.result ? `<span class="grade-chip ${gradeClass(x.result.score)}">${esc(x.result.grade)}</span>` : `<span class="muted small">${x.status === 'ended' ? 'Grade' : 'Resume'}</span>`}
      </button>`).join('')}
    </div>` : ''}
  </div>`;

  app.querySelector('#startNow')?.addEventListener('click', () => go('home'));
  app.querySelectorAll('.hist').forEach((b) => {
    b.onclick = () => {
      const x = store.session(b.dataset.id);
      go(x.result || x.status === 'ended' ? 'results' : x.status === 'briefing' ? 'briefing' : 'chat', { id: x.id });
    };
  });
  mountCharts();
}

/* ---------------------------- playbook --------------------------- */

function playbook() {
  app.innerHTML = `
  <div class="screen playbook">
    <header class="top"><h1>Playbook</h1></header>
    <p class="sub">Short reads on communication, charisma and character.</p>
    <div class="lessons">
      ${PLAYBOOK.map((l) => `
      <button class="lesson-card" data-id="${l.id}">
        <span class="tip-emoji">${l.emoji}</span>
        <div><b>${esc(l.title)}</b><small>${l.minutes} min read</small></div>
        ${icon('chev')}
      </button>`).join('')}
    </div>
  </div>`;
  app.querySelectorAll('[data-id]').forEach((b) => { b.onclick = () => go('lesson', { id: b.dataset.id }); });
}

function lesson({ id }) {
  const l = PLAYBOOK.find((x) => x.id === id);
  if (!l) return go('playbook');
  app.innerHTML = `
  <div class="screen lesson">
    <header class="bar">
      <button class="icon-btn" id="back" aria-label="Back">${icon('back')}</button>
      <span class="bar-title">Playbook</span><span class="spacer"></span>
    </header>
    <div class="lesson-hero"><span>${l.emoji}</span><h1>${esc(l.title)}</h1><small>${l.minutes} min read</small></div>
    <article class="card article">${l.body.map((p) => `<p>${esc(p)}</p>`).join('')}</article>
    <button class="btn primary block" id="practice">Practice it now</button>
  </div>`;
  app.querySelector('#back').onclick = () => go('playbook');
  app.querySelector('#practice').onclick = () => { current = { name: 'home', params: {} }; startScenario(null); };
}

/* ---------------------------- settings --------------------------- */

function settings() {
  const s = store.settings;
  app.innerHTML = `
  <div class="screen settings">
    <header class="top"><h1>Settings</h1></header>
    <form class="card form" id="setForm">
      <label class="field"><span>Your first name</span><input name="name" value="${esc(s.name)}" placeholder="Optional"></label>
      <label class="field"><span>Your age</span><input name="age" inputmode="numeric" value="${esc(s.age)}" placeholder="Optional"></label>
      ${ai.backend === 'key' ? `<label class="field"><span>Claude API key</span>
        <div class="key-row"><input name="apiKey" type="password" value="${esc(s.apiKey)}" placeholder="sk-ant-..." autocomplete="off"><button type="button" class="btn ghost small" id="showKey">Show</button></div></label>
      <label class="field"><span>AI model</span>
        <select name="model">
          <option value="claude-opus-5-5" ${s.model === 'claude-opus-5-5' ? 'selected' : ''}>Claude Opus 5.5 (most realistic)</option>
          <option value="claude-sonnet-5-5" ${s.model === 'claude-sonnet-5-5' ? 'selected' : ''}>Claude Sonnet 5.5 (faster, cheaper)</option>
        </select></label>` : '<p class="hint">Running on your Claude account. No API key needed.</p>'}
      <button class="btn primary block" type="submit">Save</button>
    </form>
    <div class="card about">
      <h3>About Wingman</h3>
      <p>Wingman helps men communicate with women the way confident, respectful men do: by being themselves, staying curious, leading with clear intentions and reading the room. No tricks. No scripts.</p>
      <p class="muted small">Your history is stored only on this device. Conversations are sent to Claude to generate replies and coaching.</p>
    </div>
    <button class="btn danger block" id="clear">Clear conversation history</button>
  </div>`;
  app.querySelector('#showKey')?.addEventListener('click', (e) => {
    const inp = app.querySelector('[name=apiKey]');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    e.target.textContent = inp.type === 'password' ? 'Show' : 'Hide';
  });
  app.querySelector('#setForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    store.setSettings({
      name: f.get('name').trim(), age: f.get('age').trim(),
      ...(f.has('apiKey') ? { apiKey: f.get('apiKey').trim(), model: f.get('model') } : {}),
    });
    toast('Saved');
    if (!store.settings.ageOk) go('onboarding');
  });
  app.querySelector('#clear').onclick = () => {
    sheet(`<div class="confirm"><h3>Clear all history?</h3><p class="muted">This deletes every conversation and your progress. It can't be undone.</p>
      <div class="row-btns"><button class="btn ghost" data-x>Cancel</button><button class="btn danger" data-y>Delete all</button></div></div>`,
    (el, close) => {
      el.querySelector('[data-x]').onclick = close;
      el.querySelector('[data-y]').onclick = () => { store.clearHistory(); close(); toast('History cleared'); };
    });
  };
}

const SCREENS = { onboarding, home, briefing, chat: chatScreen, results, progress, playbook, lesson, settings };

/* ------------------------- viewport + boot ------------------------ */

// Keep the chat composer above the iOS keyboard.
function syncViewport() {
  const vv = window.visualViewport;
  document.documentElement.style.setProperty('--app-h', `${vv ? vv.height : window.innerHeight}px`);
  if (document.body.dataset.screen === 'chat') {
    window.scrollTo(0, 0);
    const box = document.getElementById('msgs');
    if (box) box.scrollTop = box.scrollHeight;
  }
}
window.visualViewport?.addEventListener('resize', syncViewport);
window.addEventListener('resize', syncViewport);
syncViewport();

if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.claude) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

if (window.claude) loadingScreen('Warming up…', ['Connecting to Claude']);
ai.initBackend().then(render);
