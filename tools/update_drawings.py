"""
update_drawings.py - builds everything the gallery needs from the
pictures in the drawings/ folder. GitHub runs it by itself after every
upload (see .github/workflows/drawings.yml), so normally you never have
to run it. To run it on your own computer:  python3 tools/update_drawings.py
(it needs Pillow:  pip install pillow)

What it does:
1. For every picture in drawings/ it makes two smaller copies:
     drawings/thumbs/<name>.webp   small preview for the gallery grid
     drawings/large/<name>.webp    big version for the full-size view
   It only makes them when they are missing or the picture changed
   (it remembers a fingerprint of each picture in drawings.json).
2. Adds a line for every new picture to drawings/info.txt, where you
   write tags and descriptions. Lines you already wrote are kept.
3. Writes drawings/drawings.json, the list the gallery page reads.
"""
import hashlib
import json
import os
import re
import sys

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOLDER = os.path.join(ROOT, 'drawings')
THUMBS = os.path.join(FOLDER, 'thumbs')
LARGE = os.path.join(FOLDER, 'large')
INFO = os.path.join(FOLDER, 'info.txt')
DATA = os.path.join(FOLDER, 'drawings.json')

PICTURE_TYPES = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
THUMB_WIDTH = 480
LARGE_SIDE = 1800

INFO_HEADER = """\
# Tags and descriptions for the drawings.
# One line per picture:   file | tags | description
#
#   017.png | nsfw        | Rena with the music box
#   018.jpg | oc sketch   |
#
# - Tags are single words separated by spaces. Each tag becomes a
#   filter button on the gallery page.
# - The tag  nsfw  blurs the picture until someone clicks it.
# - The description is optional. Without one, the file name is shown.
# - New pictures get a line here by themselves. Lines starting with #
#   are notes and are ignored.
"""


def natural_key(name):
    """Sort 2.jpg before 10.jpg, and 082-0 before 082-2."""
    return [int(p) if p.isdigit() else p.lower() for p in re.split(r'(\d+)', name)]


def read_info():
    entries = {}
    if not os.path.exists(INFO):
        return entries
    with open(INFO, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = [p.strip() for p in line.split('|')]
            parts += [''] * (3 - len(parts))
            name = parts[0]
            tags = [t.lower() for t in re.split(r'[\s,]+', parts[1]) if t]
            title = '|'.join(parts[2:]).strip()
            entries[name] = {'tags': tags, 'title': title}
    return entries


def write_info(names, entries):
    width = max([len(n) for n in names] + [8])
    lines = [INFO_HEADER]
    for name in names:
        e = entries.get(name, {'tags': [], 'title': ''})
        tags = ' '.join(e['tags'])
        lines.append(f"{name.ljust(width)} | {tags.ljust(12)} | {e['title']}".rstrip() + '\n')
    with open(INFO, 'w', encoding='utf-8') as f:
        f.writelines(lines)


def fingerprint(path):
    with open(path, 'rb') as f:
        return hashlib.sha1(f.read()).hexdigest()[:12]


def save_webp(img, path, size):
    copy = img.copy()
    copy.thumbnail(size, Image.LANCZOS)
    copy.save(path, 'WEBP', quality=82, method=6)


def load(path):
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)  # phone photos can be stored sideways
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGBA' if 'transparency' in img.info or img.mode in ('LA', 'PA') else 'RGB')
    return img


def main():
    os.makedirs(THUMBS, exist_ok=True)
    os.makedirs(LARGE, exist_ok=True)

    names = sorted(
        (n for n in os.listdir(FOLDER)
         if os.path.isfile(os.path.join(FOLDER, n)) and n.lower().endswith(PICTURE_TYPES)),
        key=natural_key)

    entries = read_info()
    old = {}
    if os.path.exists(DATA):
        with open(DATA, encoding='utf-8') as f:
            old = {d['file']: d for d in json.load(f)}

    items = []
    made = 0
    for name in names:
        source = os.path.join(FOLDER, name)
        stem = os.path.splitext(name)[0]
        thumb = os.path.join(THUMBS, stem + '.webp')
        large = os.path.join(LARGE, stem + '.webp')

        mark = fingerprint(source)
        before = old.get(name)
        if (before is None or before.get('hash') != mark
                or not os.path.exists(thumb) or not os.path.exists(large)):
            img = load(source)
            size = img.size
            save_webp(img, thumb, (THUMB_WIDTH, THUMB_WIDTH * 4))
            save_webp(img, large, (LARGE_SIDE, LARGE_SIDE))
            made += 1
        else:
            size = (before['width'], before['height'])

        e = entries.get(name, {'tags': [], 'title': ''})
        items.append({
            'file': name,
            'thumb': 'drawings/thumbs/' + stem + '.webp',
            'large': 'drawings/large/' + stem + '.webp',
            'original': 'drawings/' + name,
            'width': size[0],
            'height': size[1],
            'title': e['title'],
            'tags': e['tags'],
            'hash': mark,
        })

    # Remove small copies of pictures that were deleted.
    stems = {os.path.splitext(n)[0] for n in names}
    for folder in (THUMBS, LARGE):
        for n in os.listdir(folder):
            if os.path.splitext(n)[0] not in stems:
                os.remove(os.path.join(folder, n))

    write_info(names, entries)
    with open(DATA, 'w', encoding='utf-8') as f:
        f.write('[\n' + ',\n'.join('  ' + json.dumps(i, ensure_ascii=False) for i in items) + '\n]\n')

    print(f'{len(items)} drawings, {made} new previews made')


if __name__ == '__main__':
    sys.exit(main())
