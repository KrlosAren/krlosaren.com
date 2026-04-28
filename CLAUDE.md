# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local development (includes drafts)
hugo server -D

# Production build
hugo --minify --baseURL "https://krlosaren.com"

# New post
hugo new posts/nombre-del-articulo.md
```

Deployment is automatic via GitHub Actions on push to `main`. No manual deploy step needed.

## Architecture

**Hugo static site** using the [Paper theme](https://github.com/nanxiaobei/hugo-paper) (git submodule at `themes/paper/`). Published at krlosaren.com.

Hugo's override system means any file in `layouts/` takes precedence over the equivalent in `themes/paper/layouts/`. The theme is never edited directly.

### Content

All blog posts live in `content/posts/` as flat `.md` files (no subdirectories). Content is written in Spanish.

**Frontmatter (TOML, `+++` delimiters):**
```toml
+++
date = '2026-04-14'
draft = false
title = 'Título del artículo'
description = 'Resumen para SEO y og:description'
tags = ['devops', 'linux']
images = ['/nombre-imagen.png']   # controls og:image for social share previews
+++
```

`images[0]` feeds the Open Graph image — if omitted, share previews will have no image. Hero images go in `static/` and are referenced as `/filename.png` (Hugo serves `static/` from the site root).

### Layout Overrides

| File | What it changes from the theme |
|------|-------------------------------|
| `layouts/_default/single.html` | Adds reading time (`· X min de lectura`) next to date and author |
| `layouts/_default/list.html` | Shows avatar/bio/social links on first page; supports featured posts (`weight > 0`) |
| `layouts/tags/list.html` | Groups posts by year |
| `layouts/partials/head.html` | CSS pipeline (main.css + custom.css), Google Fonts (Inter), GA4, inline style overrides |
| `layouts/partials/seo.html` | Full OG + Twitter Card implementation; reads `images` and `description` from frontmatter |
| `layouts/partials/footer.html` | GitHub/LinkedIn links and copyright |

### SEO

`layouts/partials/seo.html` is the canonical place for all meta tags. It handles:
- `og:title`, `og:description`, `og:image`, `og:type` (article vs website)
- `twitter:card` (`summary_large_image`)
- `article:published_time`, `article:modified_time`, `article:tag`
- Canonical URL

`layouts/partials/head.html` includes this partial and also adds GA4 and schema.org via Hugo's internal templates (only in production builds).

### Styling

Custom styles are in `assets/custom.css` and a small inline block in `layouts/partials/head.html`. Key overrides: orange nav links, 15px article font, code block padding. The site color scheme is set to `gray` in `hugo.toml`.
