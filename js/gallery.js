/* ==========================================================
   gallery.js - only the drawings page loads this.
   Reads drawings/drawings.json (made by the robot, see README)
   and builds the whole gallery from it:
   1. Tag filter buttons      3. NSFW blur (click to show)
   2. Picture columns          4. Full-size viewer
   You never need to edit this file to add pictures.
   ========================================================== */
(function () {
  'use strict';

  var HIDDEN_TAG = 'nsfw';   // pictures with this tag start blurred
  var BLUR_KEY = 'suzuran:blur';

  var gallery = document.getElementById('gallery');
  var filters = document.getElementById('filters');
  var count = document.getElementById('count');
  var viewer = document.getElementById('viewer');
  if (!gallery) { return; }

  var all = [];          // every drawing from the list
  var shown = [];        // the ones the current filter lets through
  var tag = 'all';       // current filter
  var revealed = {};     // file names someone clicked to show
  var blurOn = true;
  var columnCount = 0;

  try { blurOn = localStorage.getItem(BLUR_KEY) !== 'off'; } catch (err) { /* storage blocked */ }

  function isHidden(item) {
    return blurOn && item.tags.indexOf(HIDDEN_TAG) !== -1 && !revealed[item.file];
  }

  function nameOf(item) { return item.title || item.file; }


  /* ---------- LOAD THE LIST ---------- */
  fetch('drawings/drawings.json', { cache: 'no-cache' })
    .then(function (response) { return response.json(); })
    .then(function (list) {
      all = list;
      buildFilters();
      applyFilter('all');
      window.addEventListener('resize', function () {
        if (columnsFor(gallery.clientWidth) !== columnCount) { layout(); }
      });
    })
    .catch(function () {
      gallery.innerHTML = '<p class="muted">// could not load the drawings list.</p>';
    });


  /* ---------- 1. FILTER BUTTONS ----------
     One button per tag, with how many pictures have it. */
  function buildFilters() {
    var tags = {};
    all.forEach(function (item) {
      item.tags.forEach(function (t) { tags[t] = (tags[t] || 0) + 1; });
    });

    filters.innerHTML = '';
    addButton('all', 'ALL', all.length);
    Object.keys(tags).sort().forEach(function (t) { addButton(t, t.toUpperCase(), tags[t]); });

    // The blur switch only matters when something is tagged nsfw.
    if (tags[HIDDEN_TAG]) {
      var blur = document.createElement('button');
      blur.type = 'button';
      blur.className = 'filter filter--blur';
      blur.addEventListener('click', function () {
        blurOn = !blurOn;
        revealed = {};
        try { localStorage.setItem(BLUR_KEY, blurOn ? 'on' : 'off'); } catch (err) { /* ignore */ }
        blur.textContent = blurOn ? '[ BLUR: ON ]' : '[ BLUR: OFF ]';
        blur.setAttribute('aria-pressed', String(blurOn));
        layout();
      });
      blur.textContent = blurOn ? '[ BLUR: ON ]' : '[ BLUR: OFF ]';
      blur.setAttribute('aria-pressed', String(blurOn));
      filters.appendChild(blur);
    }
  }

  function addButton(value, label, n) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'filter';
    b.dataset.tag = value;
    b.textContent = '[ ' + label + ' ' + n + ' ]';
    b.addEventListener('click', function () { applyFilter(value); });
    filters.appendChild(b);
  }

  function applyFilter(value) {
    tag = value;
    shown = all.filter(function (item) { return tag === 'all' || item.tags.indexOf(tag) !== -1; });
    var buttons = filters.querySelectorAll('[data-tag]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].dataset.tag === tag));
    }
    if (count) { count.textContent = shown.length; }
    layout();
  }


  /* ---------- 2. COLUMNS ----------
     Each picture goes into whichever column is shortest right
     now, so the order still reads left to right, top to bottom. */
  function columnsFor(width) {
    if (width < 520) { return 1; }
    if (width < 860) { return 2; }
    return 3;
  }

  function layout() {
    columnCount = columnsFor(gallery.clientWidth);
    var columns = [];
    var heights = [];
    gallery.innerHTML = '';
    for (var c = 0; c < columnCount; c++) {
      var col = document.createElement('div');
      col.className = 'gallery__col';
      gallery.appendChild(col);
      columns.push(col);
      heights.push(0);
    }

    shown.forEach(function (item, index) {
      var shortest = heights.indexOf(Math.min.apply(null, heights));
      columns[shortest].appendChild(makeTile(item, index));
      heights[shortest] += item.height / item.width + 0.12; // 0.12 = title bar and gap
    });
  }

  function makeTile(item, index) {
    var figure = document.createElement('figure');
    figure.className = 'tile' + (index % 2 ? ' tile--red' : '');

    var bar = document.createElement('figcaption');
    bar.className = 'tile__bar';
    var name = document.createElement('span');
    name.className = 'tile__name';
    name.textContent = nameOf(item);
    bar.appendChild(name);
    if (item.tags.length) {
      var tags = document.createElement('span');
      tags.className = 'tile__tags';
      tags.textContent = item.tags.map(function (t) { return '#' + t; }).join(' ');
      bar.appendChild(tags);
    }

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile__art tile__open';

    var img = document.createElement('img');
    img.src = item.thumb;
    img.width = item.width;
    img.height = item.height;
    img.loading = 'lazy';
    img.alt = item.title || ('drawing ' + item.file);
    button.appendChild(img);

    if (isHidden(item)) {
      figure.classList.add('is-hidden');
      button.setAttribute('aria-label', 'Hidden drawing, click to show');
      var cover = document.createElement('span');
      cover.className = 'tile__cover';
      cover.textContent = '[ NSFW ]\nclick to show';
      button.appendChild(cover);
    }

    // First click on a hidden picture only un-blurs it; after that
    // (and for normal pictures) a click opens the big viewer.
    button.addEventListener('click', function () {
      if (figure.classList.contains('is-hidden')) {
        revealed[item.file] = true;
        figure.classList.remove('is-hidden');
        button.removeAttribute('aria-label');
        var c = button.querySelector('.tile__cover');
        if (c) { c.remove(); }
        return;
      }
      open(shown.indexOf(item));
    });

    figure.appendChild(bar);
    figure.appendChild(button);
    return figure;
  }


  /* ---------- 4. BIG VIEWER ----------
     A <dialog>. Arrow keys or the buttons go to the next and
     previous picture; Esc, [ X ] or a click outside closes it. */
  if (!viewer || typeof viewer.showModal !== 'function') { return; }

  var viewerImg = document.getElementById('viewerImg');
  var viewerTitle = document.getElementById('viewerTitle');
  var viewerCount = document.getElementById('viewerCount');
  var viewerOriginal = document.getElementById('viewerOriginal');
  var viewerCover = document.getElementById('viewerCover');
  var current = 0;

  function open(index) {
    show(index);
    viewer.showModal();
  }

  function show(index) {
    current = (index + shown.length) % shown.length;
    var item = shown[current];
    var hidden = isHidden(item);
    viewerImg.src = item.large;
    viewerImg.alt = item.title || ('drawing ' + item.file);
    viewerImg.width = item.width;
    viewerImg.height = item.height;
    viewer.classList.toggle('is-hidden', hidden);
    viewerCover.hidden = !hidden;
    viewerTitle.textContent = nameOf(item);
    viewerCount.textContent = (current + 1) + '/' + shown.length;
    viewerOriginal.href = item.original;
  }

  viewerCover.addEventListener('click', function () {
    revealed[shown[current].file] = true;
    show(current);
    layout();
  });

  document.getElementById('viewerPrev').addEventListener('click', function () { show(current - 1); });
  document.getElementById('viewerNext').addEventListener('click', function () { show(current + 1); });
  document.getElementById('viewerClose').addEventListener('click', function () { viewer.close(); });

  viewer.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { show(current - 1); }
    if (e.key === 'ArrowRight') { show(current + 1); }
  });

  // A click on the dark area around the window closes it.
  viewer.addEventListener('click', function (e) {
    if (e.target === viewer) { viewer.close(); }
  });
})();
