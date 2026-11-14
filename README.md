# edineizanol.dev

Portfólio pessoal. HTML, CSS e JavaScript puros, sem build. Publicado no GitHub Pages.

## Rodar localmente

Os módulos JS não carregam por `file://`, então use um servidor:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Imagens

Ficam em `imgs/` (WebP). Para trocar uma, substitua o arquivo mantendo o nome e a proporção: 16:11 nos projetos em destaque, 16:9 nos cards menores. Se mudar o tamanho, ajuste `width` e `height` da tag `<img>`.

Para um projeto novo sem imagem ainda, use o bloco `<div class="media-placeholder">` (o estilo continua no CSS).

## Textos e traduções

- Português: direto no `index.html`.
- Inglês: `js/dict.js`, com a mesma chave do atributo `data-i18n`.

## Testes

```bash
npm install
npm test                         # tema, idioma, paridade das traduções, CSS
python3 tests/browser_check.py   # navegador: toggles, mobile, fallback sem JS, screenshots
```
