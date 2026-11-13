import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initTheme, toggleTheme, makeStore } from '../js/theme.js';
import { detectLang, applyLang, toggleLang } from '../js/i18n.js';

const mem = () => { const m = {}; return { get: k => m[k] ?? null, set: (k, v) => { m[k] = v; } }; };
const broken = makeStore({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });

function dom(html = '<p data-i18n="a">Olá</p><p data-i18n="b">Só PT</p><p data-i18n="c_html">Texto <b>pt</b></p>') {
  return new JSDOM(`<!doctype html><html lang="pt-BR"><body>${html}</body></html>`).window.document;
}
const dict = { pt: {}, en: { a: 'Hello', c_html: 'Text <b>en</b>' } };

test('detectLang: navegador en-US abre em inglês', () => assert.equal(detectLang(null, 'en-US'), 'en'));
test('detectLang: pt-PT abre em português', () => assert.equal(detectLang(null, 'pt-PT'), 'pt'));
test('detectLang: escolha salva vence o navegador', () => assert.equal(detectLang('pt', 'en-US'), 'pt'));
test('detectLang: valor salvo inválido é ignorado', () => assert.equal(detectLang('xx', 'en'), 'en'));

test('toggleTheme alterna e persiste', () => {
  const doc = dom(); const s = mem();
  initTheme(doc, s, false);
  assert.equal(doc.documentElement.dataset.theme, 'dark');
  assert.equal(toggleTheme(doc, s), 'light');
  assert.equal(s.get('theme'), 'light');
  assert.equal(toggleTheme(doc, s), 'dark');
});

test('initTheme respeita preferência do sistema e depois a salva', () => {
  const doc = dom();
  initTheme(doc, mem(), true);
  assert.equal(doc.documentElement.dataset.theme, 'light');
  const s = mem(); s.set('theme', 'dark');
  initTheme(doc, s, true);
  assert.equal(doc.documentElement.dataset.theme, 'dark');
});

test('storage bloqueado não quebra os toggles', () => {
  const doc = dom();
  assert.doesNotThrow(() => { initTheme(doc, broken, false); toggleTheme(doc, broken); });
  assert.equal(doc.documentElement.dataset.theme, 'light');
  assert.doesNotThrow(() => toggleLang(doc, dict, broken));
});

test('applyLang troca textos, mantém PT quando falta chave e restaura', () => {
  const doc = dom();
  applyLang(doc, 'en', dict);
  assert.equal(doc.querySelector('[data-i18n="a"]').textContent, 'Hello');
  assert.equal(doc.querySelector('[data-i18n="b"]').textContent, 'Só PT');
  assert.equal(doc.querySelector('[data-i18n="c_html"]').innerHTML, 'Text <b>en</b>');
  assert.equal(doc.documentElement.lang, 'en');
  applyLang(doc, 'pt', dict);
  assert.equal(doc.querySelector('[data-i18n="a"]').textContent, 'Olá');
  assert.equal(doc.querySelector('[data-i18n="c_html"]').innerHTML, 'Texto <b>pt</b>');
  assert.equal(doc.documentElement.lang, 'pt-BR');
});

test('applyLang traduz atributos via data-i18n-attr', () => {
  const doc = dom('<button data-i18n-attr="aria-label:lbl" aria-label="Alternar tema"></button>');
  applyLang(doc, 'en', { pt: {}, en: { lbl: 'Toggle theme' } });
  assert.equal(doc.querySelector('button').getAttribute('aria-label'), 'Toggle theme');
  applyLang(doc, 'pt', { pt: {}, en: { lbl: 'Toggle theme' } });
  assert.equal(doc.querySelector('button').getAttribute('aria-label'), 'Alternar tema');
});
