// Everything lives in this phone's localStorage. Reads and writes are wrapped
// because storage can be unavailable (private mode, cleared site data).

const KEY = 'wingman.v1';
const MAX_SESSIONS = 60;

const DEFAULTS = {
  settings: { apiKey: '', model: 'claude-opus-5-5', name: '', age: '', ageOk: false },
  sessions: [],
  activeId: null,
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULTS), ...parsed, settings: { ...DEFAULTS.settings, ...parsed.settings } };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the app keeps working in memory.
  }
}

export const store = {
  get settings() { return state.settings; },
  setSettings(patch) { state.settings = { ...state.settings, ...patch }; save(); },

  get sessions() { return state.sessions; },
  session(id) { return state.sessions.find((s) => s.id === id); },
  get active() { return state.activeId ? this.session(state.activeId) : null; },

  addSession(s) {
    state.sessions.unshift(s);
    state.sessions = state.sessions.slice(0, MAX_SESSIONS);
    state.activeId = s.id;
    save();
  },
  updateSession(s) {
    const i = state.sessions.findIndex((x) => x.id === s.id);
    if (i >= 0) state.sessions[i] = s;
    save();
  },
  clearActive() { state.activeId = null; save(); },
  deleteSession(id) {
    state.sessions = state.sessions.filter((s) => s.id !== id);
    if (state.activeId === id) state.activeId = null;
    save();
  },
  clearHistory() { state.sessions = []; state.activeId = null; save(); },
};
