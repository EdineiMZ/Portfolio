import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { dict } from '../js/dict.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const doc = new JSDOM(html).window.document;

const keys = new Set();
doc.querySelectorAll('[data-i18n]').forEach(el => keys.add(el.dataset.i18n));
doc.querySelectorAll('[data-i18n-attr]').forEach(el =>
  el.dataset.i18nAttr.split(';').forEach(p => { const k = p.split(':')[1]; if (k) keys.add(k.trim()); }));

test('todas as chaves do HTML têm tradução em inglês', () => {
  const missing = [...keys].filter(k => !(k in dict.en));
  assert.deepEqual(missing, []);
});

test('nenhuma chave órfã no dicionário inglês', () => {
  const orphans = Object.keys(dict.en).filter(k => !keys.has(k));
  assert.deepEqual(orphans, []);
});

test('posicionamento honesto: sem termos de exagero', () => {
  const text = (doc.body.textContent + JSON.stringify(dict.en)).toLowerCase();
  for (const word of ['sênior', 'senior', 'especialista', 'expert', '+35%']) assert.ok(!text.includes(word), word);
});

test('links de contato corretos', () => {
  const hrefs = [...doc.querySelectorAll('a')].map(a => a.getAttribute('href'));
  for (const h of ['mailto:contato@edineizanol.dev', 'https://www.linkedin.com/in/edinei-miguel-zanol-0718b3266', 'https://github.com/EdineiMZ', 'https://wa.me/5549991943662'])
    assert.ok(hrefs.includes(h), h);
});

test('cada destaque tem placeholder de imagem comentado', () => {
  const cases = doc.querySelectorAll('.case');
  assert.equal(cases.length, 4);
  cases.forEach(c => assert.ok(c.querySelector('.media-placeholder'), c.id));
  assert.ok((html.match(/<!-- IMAGEM/g) || []).length >= 6);
});

test('CIEL não afirma que o verificador (Guardião) já existe', () => {
  const t = (doc.body.textContent + JSON.stringify(dict.en)).toLowerCase();
  assert.ok(!t.includes('reverte versões quebradas'));
  assert.ok(!t.includes('rolls back broken versions'));
});
