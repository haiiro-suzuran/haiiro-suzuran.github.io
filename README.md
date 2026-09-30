# Suzuran site

Live at https://haiiro-suzuran.github.io

A static website: plain HTML, CSS and a little JavaScript. No build tools,
no frameworks, nothing to install. GitHub Pages can host it as it is.

## How to look at it on your computer

- Open `index.html` in your browser (right-click the file, "Open with").
- Or, in VSCodium, install the **Live Server** extension, right-click
  `index.html` and choose "Open with Live Server". The page then refreshes
  by itself every time you save.

The live site is whatever is on the main branch of this repository.

## What is in each file

```
haiiro-suzuran.github.io/
├── index.html            Home page: intro window, links to stories and drawings
├── stories.html          Story index (list of all stories)
├── gallery.html          Drawing gallery
├── stories/
│   ├── Merveille_Dinah.html              Merveille & Dinah
│   ├── the dolls of witch house.html     The Dolls of the Witch's House
│   ├── Rena_Hatsune1.html                Many First's in a Single Day
│   ├── Rena_Hatsune2.html                Good Girl Rena is Loved by Her Big-Sis Hatsune
│   └── Rena_Hatsune3.html                The World of Rena
├── css/
│   └── style.css         ALL the styling. Colors live at the top (:root).
├── js/
│   ├── main.js           Every page: cursor trail, star spin, rabbit, error window
│   ├── home.js           Home only: rotating facts + silly status line
│   └── story.js          Story pages: progress bar, section list, resume prompt
├── images/               The ornaments (SVG), rabbit.jpg, and later your covers and drawings
├── utils/                Old pictures from the first version of the site (not used any more)
├── fonts/                VCR_OSD_MONO.ttf, the site font
└── robots.txt            Asks search engines to stay away
```

## Things to try first (small experiments)

1. In `css/style.css`, change `--purple` at the top and save. Watch the site recolor.
2. In `index.html`, change the text of one `.fact`.
3. In `gallery.html`, change `--h: 360px` on one tile and see the column shift.
4. In `css/style.css`, change `box-shadow: 6px 6px 0 var(--edge)` on `.entry` to `10px 10px 0`.
5. In any page, change the rabbit's `data-lines` (lines are split by `|`). The last line is the one that makes it explode.

Break things on purpose. Ctrl+Z always brings them back.

## How to add a story

1. Copy one of the files in `stories/` (for example `stories/Rena_Hatsune1.html`)
   and rename the copy, for example `stories/my-new-story.html`.
2. Open it and change the title, the warning, the text and the section ids.
   Paragraphs go inside `<div class="prose">`. A side note (like an author's
   comment) is a `<blockquote>` inside the prose. A scene break is `<hr class="rule">`.
   If you add or remove a section, also edit the file list (`<nav class="filetree">`).
   Also update the `// ~... words` line under the title.
3. In `stories.html`, copy one `<article class="entry">` block and point its
   links at the new file.

## How to add a drawing

1. Save the image in `images/`. Keep it under about 1 MB (export as JPG or WebP,
   around 1200 pixels wide is plenty).
2. In `gallery.html`, copy one `<figure class="tile">` block. Inside it, replace
   `[ drawing ]` with `<img src="images/your-file.jpg" alt="describe the drawing">`
   and remove the `style="--h: ..."` part.

## How to put a picture in a placeholder

Anything with `class="slot"` shows placeholder text. Replace the text with an
image and it fills the box:

```html
<div class="hero__photo slot"><img src="images/rabbit.jpg" alt="Suzuran the rabbit"></div>
```

## Privacy: what is and isn't protected

- Every page has `<meta name="robots" content="noindex, nofollow">` and there
  is a `robots.txt`. These politely ask search engines not to list the site.
  They do not stop anyone who has the link.
- On a free GitHub account the repository and the site are public. Anyone who
  finds the repository can read every file, including the stories.
- So: this is a "hard to find, easy to share in person" site, not a private one.

## Notes

- Files in the `stories/` folder use `../` in their paths (one folder up).
- The header and footer are repeated in every page, because a static site has
  no includes. If you change the menu, change it in each page.
- The animations switch themselves off for visitors whose device is set to
  "reduce motion".
