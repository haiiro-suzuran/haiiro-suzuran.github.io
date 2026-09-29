/* ==========================================================
   story.js - loaded on story pages.
   1. Reading progress bar
   2. Highlights the current section in the file list
   3. "Resume where you left off" (remembered in the reader's
      own browser with localStorage - it never leaves their
      device, and only they can see it)
   ========================================================== */
(function () {
  'use strict';


  /* ---------- 1. PROGRESS BAR ---------- */
  var fill = document.getElementById('progressFill');
  var label = document.getElementById('progressLabel');

  function updateProgress() {
    var page = document.documentElement;
    var scrollable = page.scrollHeight - page.clientHeight;
    var percent = scrollable > 0 ? Math.round(page.scrollTop / scrollable * 100) : 0;
    if (fill) { fill.style.width = percent + '%'; }
    if (label) { label.textContent = '[ ' + percent + '% READ ]'; }
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();


  /* ---------- 2 + 3. SECTIONS AND RESUME ----------
     Anything in the page with a data-section attribute counts
     as a section. Its id links it to the file list, and its
     data-title is the name shown in the resume banner. */
  var sections = document.querySelectorAll('[data-section]');
  var links = document.querySelectorAll('.filetree a');
  var storageKey = 'suzuran:last-section:' + location.pathname;

  function highlight(id) {
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle('is-current', links[i].getAttribute('href') === '#' + id);
    }
  }

  function remember(id) {
    try { localStorage.setItem(storageKey, id); } catch (err) { /* storage blocked: ignore */ }
  }

  function recall() {
    try { return localStorage.getItem(storageKey); } catch (err) { return null; }
  }

  // Read the saved place BEFORE we start saving new ones.
  var saved = recall();
  var tracking = false;
  window.addEventListener('scroll', function () { tracking = true; }, { once: true });

  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          highlight(entries[i].target.id);
          if (tracking) { remember(entries[i].target.id); }
        }
      }
    }, { rootMargin: '0px 0px -70% 0px' });

    for (var s = 0; s < sections.length; s++) { observer.observe(sections[s]); }
  }

  if (sections.length) { highlight(sections[0].id); }

  // Show the banner only if there is a saved place past the first section.
  var banner = document.getElementById('resume');
  var savedEl = saved ? document.getElementById(saved) : null;

  if (banner && savedEl && sections.length && savedEl !== sections[0]) {
    document.getElementById('resumeName').textContent =
      savedEl.getAttribute('data-title') || saved;
    banner.hidden = false;

    document.getElementById('resumeGo').addEventListener('click', function () {
      banner.hidden = true;
      savedEl.scrollIntoView();
    });
    document.getElementById('resumeTop').addEventListener('click', function () {
      banner.hidden = true;
    });
  }
})();
