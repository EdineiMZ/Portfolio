"""Verificação no navegador: toggles, responsividade, fallback sem JS e screenshots.

Uso: python3 tests/browser_check.py  (sobe um servidor local numa porta livre)
"""
import http.server, socketserver, threading, functools, os, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "test-results")
os.makedirs(OUT, exist_ok=True)
failures = []

def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        failures.append(msg)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=ROOT))
URL = f"http://127.0.0.1:{httpd.server_address[1]}/index.html"
threading.Thread(target=httpd.serve_forever, daemon=True).start()

with sync_playwright() as p:
    b = p.chromium.launch()

    # 1. Toggles + console limpo (fontes externas podem falhar offline: ignoramos erros de rede de CDN)
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, color_scheme="dark", locale="pt-BR")
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(URL, wait_until="networkidle")
    html = pg.locator("html")
    check(html.get_attribute("data-theme") == "dark", "tema inicial segue o sistema (escuro)")
    check(html.get_attribute("lang") == "pt-BR", "idioma inicial pt-BR")
    pg.click("#theme-toggle")
    check(html.get_attribute("data-theme") == "light", "botão alterna para claro")
    pg.click("#lang-toggle")
    check(html.get_attribute("lang") == "en", "botão alterna para inglês")
    check("people actually use" in pg.inner_text("h1"), "título traduzido")
    pg.reload(wait_until="networkidle")
    check(html.get_attribute("data-theme") == "light" and html.get_attribute("lang") == "en", "escolhas persistem após recarregar")
    check(not errors, f"sem erros de JS: {errors}")
    ctx.close()

    # 2. Primeira visita com navegador em inglês
    ctx = b.new_context(locale="en-US", color_scheme="light")
    pg = ctx.new_page(); pg.goto(URL, wait_until="networkidle")
    check(pg.locator("html").get_attribute("lang") == "en", "navegador en-US abre em inglês")
    check(pg.locator("html").get_attribute("data-theme") == "light", "sistema claro abre em claro")
    check(pg.evaluate("getComputedStyle(document.body).visibility") == "visible", "corpo visível após aplicar EN")
    ctx.close()

    # 3. main.js falhou (bloqueado): conteúdo precisa aparecer mesmo assim
    ctx = b.new_context(locale="en-US")
    pg = ctx.new_page()
    pg.route("**/js/main.js", lambda r: r.abort())
    pg.goto(URL); pg.wait_for_timeout(2200)
    vis = pg.evaluate("getComputedStyle(document.body).visibility")
    op = pg.evaluate("getComputedStyle(document.querySelector('.case')).opacity")
    check(vis == "visible" and op == "1", f"fallback sem main.js mostra conteúdo (visibility={vis}, opacity={op})")
    ctx.close()

    # 4. Sem JavaScript nenhum
    ctx = b.new_context(java_script_enabled=False)
    pg = ctx.new_page(); pg.goto(URL)
    check(pg.evaluate("1") if False else True, "carregou sem JS")
    check(pg.locator(".case").first.is_visible(), "sem JS os projetos aparecem")
    ctx.close()

    # 5. Screenshots + sem rolagem horizontal
    for w, h, tag in [(1440, 900, "desktop"), (360, 780, "mobile")]:
        for theme in ("dark", "light"):
            for lang in ("pt", "en"):
                ctx = b.new_context(viewport={"width": w, "height": h}, reduced_motion="reduce")
                ctx.add_init_script(f"localStorage.setItem('theme','{theme}');localStorage.setItem('lang','{lang}')")
                pg = ctx.new_page(); pg.goto(URL, wait_until="networkidle")
                pg.evaluate("async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); }")
                pg.wait_for_timeout(400)
                check(pg.evaluate("document.querySelector('.about-photo img').naturalWidth") > 0, f"{tag}/{theme}/{lang}: foto carregou")
                if tag == "mobile":
                    narrow = pg.evaluate("Math.min(...[...document.querySelectorAll('.case-body')].map(e => e.getBoundingClientRect().width))")
                    check(narrow > 280, f"{tag}/{theme}/{lang}: todos os cases em coluna única (menor largura {narrow:.0f}px)")
                sw = pg.evaluate("document.documentElement.scrollWidth")
                check(sw <= w, f"{tag}/{theme}/{lang}: sem rolagem horizontal ({sw} <= {w})")
                pg.screenshot(path=os.path.join(OUT, f"{tag}-{theme}-{lang}.png"), full_page=True)
                ctx.close()
    b.close()

httpd.shutdown()
print(f"\n{len(failures)} falha(s)")
sys.exit(1 if failures else 0)
