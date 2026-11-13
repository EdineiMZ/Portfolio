const mem = {};

export function makeStore(backend) {
  return {
    get(key) {
      try { const v = backend.getItem(key); if (v !== null) return v; } catch (_) {}
      return key in mem ? mem[key] : null;
    },
    set(key, value) {
      mem[key] = value;
      try { backend.setItem(key, value); } catch (_) {}
    },
  };
}

let backend;
try { backend = window.localStorage; } catch (_) { backend = null; }
export const safeStore = makeStore(backend || { getItem: () => null, setItem: () => {} });

export function initTheme(doc = document, store = safeStore, prefersLight = matchLight()) {
  const saved = store.get('theme');
  const theme = saved === 'light' || saved === 'dark' ? saved : prefersLight ? 'light' : 'dark';
  doc.documentElement.dataset.theme = theme;
  return theme;
}

export function toggleTheme(doc = document, store = safeStore) {
  const next = doc.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  doc.documentElement.dataset.theme = next;
  store.set('theme', next);
  return next;
}

function matchLight() {
  try { return window.matchMedia('(prefers-color-scheme: light)').matches; } catch (_) { return false; }
}
