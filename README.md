# hogiabao2601.github.io

Personal site of Ho Gia Bao (Bao Ho), Staff Engineer in Singapore.

Live at <https://hogiabao2601.github.io/>

## Structure

```
index.html              the page
404.html                not-found page (GitHub Pages serves it automatically)
Ho-Gia-Bao-CV.pdf       CV linked from the page
assets/css/site.css     styles
assets/js/site.js       local clock, copy-email button, active nav link, transaction-stream animation
assets/img/             portrait (WebP with a JPEG fallback) and a square crop for search results
assets/fonts/           Archivo, IBM Plex Sans and IBM Plex Mono, subset for the site (SIL OFL)
og-image.png            preview image for LinkedIn, Slack, etc. (1200 x 630)
favicon.svg, *.png      icons
robots.txt, sitemap.xml search engines
```

Plain HTML, CSS and a little JavaScript. No build step, no framework, no tracking.

## Editing

Open `index.html`, change the text, commit. GitHub Pages redeploys within a few minutes.

When the content changes, also update:

- `dateModified` in the JSON-LD block near the top of `index.html`
- "Updated ..." in the footer
- `lastmod` in `sitemap.xml`

## Using a custom domain

1. Verify the domain first under your GitHub account's **Settings → Pages** (GitHub recommends this to prevent takeovers), then add these DNS records at the registrar:
   - `A` records for the apex (`@`): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - or a `CNAME` for `www` pointing to `hogiabao2601.github.io`
2. In the repository: **Settings → Pages → Custom domain**, enter the domain, save, then tick **Enforce HTTPS** once it is available. GitHub adds a `CNAME` file to the repo.
3. Replace `https://hogiabao2601.github.io/` with the new address in `index.html` (canonical, Open Graph and JSON-LD), `robots.txt` and `sitemap.xml`.
