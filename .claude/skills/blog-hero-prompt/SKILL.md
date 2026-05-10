---
name: blog-hero-prompt
description: Generate AI image prompts for blog post hero images on krlosaren.com, anchored to the brand palette (soft gray + deep orange) and a 16:9 flat-illustration style consistent across the post series. Use when the user asks for a prompt for a hero image, wants to generate the visual for a new blog post, or mentions creating a hero/header image for the blog.
---

# Generador de prompts para hero images del blog

Este skill genera prompts de IA (DALL-E, Midjourney, Flux) para las imágenes hero de los posts en krlosaren.com, manteniendo coherencia visual con la serie de heroes ya publicados.

## Cuándo invocar este skill

- El usuario pide un prompt para una imagen hero de un post
- El usuario quiere crear el visual de un artículo nuevo
- El usuario menciona "crea un prompt" / "generar imagen" en contexto del blog

## Proceso

### Paso 1 — Entender el post

Si el usuario menciona un post específico (por path o por título), lee el archivo en `content/posts/*.md` para identificar:

- **La transformación o relación central** del post — no el sustantivo. Esto es la regla más importante. Ejemplos:
  - Post de Hugo → no es "una página web", es *markdown → web*
  - Post de systemd-contenedores → no es "contenedores", es *systemd cuida contenedores*
  - Post de CI/CD → no es "GitHub Actions", es *código → imagen → registry → service*
- El tono (pragmático, personal, educativo)
- Las asociaciones visuales disponibles del tema

Si no hay archivo, pídele al usuario un resumen de 1-2 frases del post antes de continuar.

### Paso 2 — Componer el prompt usando esta plantilla

Reemplaza los segmentos en `[CORCHETES]` según el contenido:

```
A clean modern flat illustration of [CENTRAL CONCEPT IN ACTION],
horizontal composition flowing [LEFT TO RIGHT, or describe specific
layout if not linear]. [NUMBER] connected stages:
([ENUMERATE STAGES — 2 to 4 max — each with a clear visual element
described concretely]).
[CONNECTOR SENTENCE — what flows or connects between elements:
arrows, lines, transformation cues].
Color palette: soft warm gray background (#f5f4f1), deep orange
accents (#FC7100) on [SPECIFIC ELEMENTS — usually arrows, active
components, or the focal piece], dark charcoal (#1f1f1f) for
outlines and icon details.
[OPTIONAL — only when semantic need: muted accent color, always
muted not saturated. Examples: muted green (#5a8a5e) for "running"
status, muted blue (#4a6b8a) for water/data flow context]
Minimalist vector style, subtle drop shadows, generous negative
space, no text, no labels, no logos. Professional tech blog header
aesthetic, 16:9 aspect ratio, 1200x630 pixels.
```

### Paso 3 — Devolver el prompt + tweaks

Después del prompt, siempre incluir 2-3 tweaks específicos en formato:
*"Si [escenario observable después de la primera generación] → [cambio concreto al prompt]"*.

## Reglas de estilo (no negociables)

- **16:9 aspect ratio (1200x630)** — requerido para OG previews en Twitter/LinkedIn
- **Paleta anclada:** `#f5f4f1` (warm gray bg) + `#FC7100` (orange accent) + `#1f1f1f` (charcoal outlines)
- **`no text, no labels, no logos`** — los modelos generativos rinden mal el texto y suelen meterse en zona gris legal con logos de marcas (GitHub, Docker, AWS, etc.)
- **`flat illustration`** y **`minimalist vector style`** son keywords obligatorios — mantienen cohesión con la serie
- Color extra solo cuando hay necesidad semántica fuerte (verde = running, rojo = error, azul = data). Siempre muted, nunca saturado, para que se sienta parte de la paleta

## Reglas de composición

- Composición horizontal preferida — matchea el ratio 16:9 sin desperdiciar espacio
- Identificar una transformación o relación, NO un objeto estático
- Máximo 2-4 etapas o elementos centrales — más satura
- Iconos abstractos siempre, **nunca logos específicos** (octocat, ballena Docker, cubos AWS, etc.). Usar descripciones genéricas: "code repository icon", "container box", "cloud registry"

## Formato de output

````markdown
## Prompt — [Nombre corto del post]

```
[Prompt completo, formateado en líneas de ~70-75 caracteres
para legibilidad en el chat]
```

**Tweaks por si la primera generación no convence:**
- Si [escenario observable] → [cambio concreto en el prompt]
- Si [escenario observable] → [cambio concreto en el prompt]
````

## Ejemplos de referencia (heroes ya publicados)

### Post: CI/CD con GitHub Actions, ECR y ECS
- **Transformación central:** *código → imagen → registry → orquestador → service desplegado*
- **Stages:** (1) code repository icon con merging branch, (2) container box + cloud registry conectados por arrow, (3) cluster de 3 container nodes en grid 2x2
- **Paleta:** estándar (sin color extra)

### Post: Cómo construir tu página web con Hugo
- **Transformación central:** *markdown source → página web publicada*
- **Stages:** (1) stack de documentos markdown con marcadores sutiles (#, *), (2) gear de transformación / build, (3) layout de webpage limpio (header + hero + grid de cards)
- **Paleta:** estándar (sin color extra)

### Post: Systemd para manejar contenedores
- **Transformación central:** *systemd gestiona el lifecycle de contenedores*
- **Composición:** panel de control central con cog/gear (systemd) conectado a grid 2x2 de containers con status indicators y un subtle restart loop
- **Paleta:** estándar + verde muted (`#5a8a5e`) por necesidad semántica (running status)

### Post: 100 Days of DevOps (KodeKloud)
- **Transformación central:** *caos de aprendizaje → progreso estructurado a través de práctica real*
- **Stages:** (1) calendar grid de days completados, (2) progression line a través de tool icons del stack devops, (3) terminal silhouette con cursor
- **Paleta:** estándar (sin color extra)

## Después de generar la imagen

Indícale al usuario cómo integrarla:

1. Guardar como `static/hero_<slug-del-post>_post.png` (o `.webp` si ya está optimizada)
2. Agregar al frontmatter del post: `images = ['/hero_<slug-del-post>_post.png']`
3. El bloque `{{- if .Params.images -}}` en `layouts/_default/single.html` la renderiza automáticamente entre el header y el contenido del post

Si la imagen pesa mucho (>500 KB), sugerir convertirla a WebP con `cwebp -q 80 input.png -o output.webp` antes de guardarla — mejora el LCP en un orden de magnitud.

## Idioma

- **Conversación con el usuario:** español, **siempre tuteo** (no voseo). Imperativos correctos: "crea", "verifica", "encuentra", "guarda", "abre" — nunca "creá", "verificá", "encontrá", "guardá", "abrí".
- **El prompt en sí:** inglés. Los modelos generativos rinden notablemente mejor con prompts en inglés que en español, especialmente en términos de adherencia a la paleta y al estilo.
