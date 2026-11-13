import { initTheme, toggleTheme } from './theme.js';
import { initLang, toggleLang } from './i18n.js';
import { dict } from './dict.js';

const root = document.documentElement;

initTheme();
initLang(document, dict);
root.classList.add('ready');
root.classList.remove('lang-pending');

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const theme = toggleTheme();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#FAFAF7' : '#0B0B0C');
});
document.getElementById('lang-toggle')?.addEventListener('click', () => toggleLang(document, dict));

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

const header = document.querySelector('.site-header');
const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  reveals.forEach(el => io.observe(el));
} else {
  reveals.forEach(el => el.classList.add('in'));
}

const links = [...document.querySelectorAll('.nav a')];
const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window && sections.length) {
  const nav = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => nav.observe(s));
}
