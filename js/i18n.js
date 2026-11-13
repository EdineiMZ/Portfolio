import { safeStore } from './theme.js';

export function detectLang(saved, navigatorLang = '') {
  if (saved === 'pt' || saved === 'en') return saved;
  return String(navigatorLang).toLowerCase().startsWith('en') ? 'en' : 'pt';
}

export function applyLang(doc, lang, dict) {
  const table = (dict && dict[lang]) || {};

  doc.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const isHtml = key.endsWith('_html');
    if (el.dataset.i18nPt === undefined) el.dataset.i18nPt = isHtml ? el.innerHTML : el.textContent;
    const value = lang === 'pt' ? el.dataset.i18nPt : table[key] ?? el.dataset.i18nPt;
    if (isHtml) el.innerHTML = value; else el.textContent = value;
  });

  doc.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.dataset.i18nAttr.split(';').forEach(pair => {
      const [attr, key] = pair.split(':').map(s => s.trim());
      if (!attr || !key) return;
      const store = `i18nPt${attr.replace(/[^a-z]/gi, '')}`;
      if (el.dataset[store] === undefined) el.dataset[store] = el.getAttribute(attr) ?? '';
      el.setAttribute(attr, lang === 'pt' ? el.dataset[store] : table[key] ?? el.dataset[store]);
    });
  });

  doc.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
  doc.documentElement.dataset.lang = lang;
}

export function initLang(doc = document, dict, store = safeStore) {
  let navLang = '';
  try { navLang = navigator.language; } catch (_) {}
  const lang = detectLang(store.get('lang'), navLang);
  applyLang(doc, lang, dict);
  return lang;
}

export function toggleLang(doc = document, dict, store = safeStore) {
  const next = doc.documentElement.dataset.lang === 'en' ? 'pt' : 'en';
  applyLang(doc, next, dict);
  store.set('lang', next);
  return next;
}
