Put the font file here.

The stylesheet (css/style.css) looks for a file named:

    VCR_OSD_MONO.ttf

Steps:
1. Download VCR OSD Mono and check its license allows personal use.
2. Copy the .ttf file into this folder.
3. Rename it to VCR_OSD_MONO.ttf, or change the file name in the
   @font-face block at the top of css/style.css.
4. Reload the page.

Until then the site uses VT323 (loaded from Google Fonts in each page's
<head>), then Courier New. You can delete that Google Fonts <link> from
every page once the real font works, so the site loads nothing from outside.
