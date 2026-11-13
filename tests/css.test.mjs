import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), body: m[2] }));

test('sem JS o conteúdo não fica escondido: opacity 0 de .reveal só sob .js', () => {
  const hiding = rules.filter(r => /\.reveal\b/.test(r.sel) && /opacity\s*:\s*0(?![.\d])/.test(r.body));
  assert.ok(hiding.length > 0, 'deve existir uma regra de entrada');
  hiding.forEach(r => assert.match(r.sel, /\.js\s+\.reveal/, r.sel));
});

test('animações respeitam prefers-reduced-motion', () => {
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('tema claro e escuro definem as mesmas variáveis', () => {
  const vars = sel => {
    const r = rules.find(x => x.sel.includes(sel));
    return new Set([...(r?.body || '').matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  };
  const dark = vars('[data-theme="dark"]'), light = vars('[data-theme="light"]');
  assert.ok(dark.size >= 8);
  assert.deepEqual([...dark].sort(), [...light].sort());
});

test('acento usa os valores do spec', () => {
  assert.match(css, /--accent:\s*#B8F36B/i);
  assert.match(css, /--accent:\s*#3F6212/i);
  assert.match(css, /--bg:\s*#0B0B0C/i);
});
