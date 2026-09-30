/* ==========================================================
   main.js - loaded on every page.
   Four small features:
   1. Cursor trail   2. Spinning stars
   3. ASCII rabbit (it explodes)   4. Fake error window (home page only)
   Each block checks that its elements exist first, so the same
   file works on pages that don't have them.
   ========================================================== */
(function () {
  'use strict';

  // Some people set their device to reduce motion. Respect that.
  var calm = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------- 1. CURSOR TRAIL ----------
     Every time the mouse has moved far enough, drop a small
     diamond at that spot. CSS fades it out, then we remove it. */
  if (!calm) {
    var lastPoint = null;
    var dotCount = 0;

    document.addEventListener('mousemove', function (e) {
      if (lastPoint &&
          Math.abs(lastPoint.x - e.clientX) + Math.abs(lastPoint.y - e.clientY) < 18) {
        return;
      }
      lastPoint = { x: e.clientX, y: e.clientY };
      dotCount++;

      var size = 8 + (dotCount % 3) * 3;
      var dot = document.createElement('div');
      dot.className = 'trail-dot';
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      dot.style.width = size + 'px';
      dot.style.height = size + 'px';
      dot.style.background = (dotCount % 2) ? '#ff2e4d' : '#c77dff';
      dot.addEventListener('animationend', function () { dot.remove(); });
      document.body.appendChild(dot);
    });
  }


  /* ---------- 2. SPINNING STARS ----------
     Each click adds another full turn. The CSS "transition"
     on the image makes the turn smooth. */
  var starButtons = document.querySelectorAll('.star-btn');
  for (var i = 0; i < starButtons.length; i++) {
    (function (button) {
      var img = button.querySelector('img');
      var turns = 0;
      button.addEventListener('click', function () {
        turns += 360;
        img.style.transform = 'rotate(' + turns + 'deg)';
      });
    })(starButtons[i]);
  }


  /* ---------- 3. ASCII RABBIT ----------
     Each poke makes the rabbit say the next line from its
     data-lines attribute and get a little angrier. After the
     last line it explodes. On the home page the error window
     opens after the explosion; elsewhere the rabbit just
     comes back after a moment. */
  var rabbit = document.getElementById('rabbit');
  if (!rabbit) { return; }

  var art = rabbit.querySelector('.rabbit__art');
  var speech = document.getElementById('speech');
  var speechText = document.getElementById('speechText');
  var errorDialog = document.getElementById('errorDialog');
  var horde = document.getElementById('horde');

  // "\\" is how you write one backslash inside a JavaScript string.
  function sprite(face) { return '(\\(\\\n' + face + '\no_(")(")'; }
  var REST = sprite('( -.-)');
  var HOP  = sprite('( ^.^)');

  // One face per poke: calm, surprised, annoyed, furious, VIOLENCE.
  var FACES = ['( -.-)', '( o.o)', '( >.<)', '(#>.<)', '(#O_O)'];

  // The explosion, one drawing after another.
  var BOOM = [
    '  \\|/\n--(*)--\n  /|\\',
    '\\ . | . /\n. BOOM! .\n/ \' | \' \\',
    ' .  \'  .\n\'  .  \' \n .  \'  .',
    '\n  ~ ~\n'
  ];

  var lines = (rabbit.getAttribute('data-lines') || 'hrair!').split('|');
  var pokes = 0;
  var exploding = false;
  var hopping = false;

  function draw() {
    if (exploding) { return; }
    if (pokes === 0) {
      art.textContent = hopping ? HOP : REST;
    } else {
      art.textContent = sprite(FACES[Math.min(pokes, FACES.length - 1)]);
    }
    rabbit.classList.toggle('is-hopping', hopping && pokes === 0);
  }

  if (!calm) {
    setInterval(function () {
      hopping = !hopping;
      draw();
    }, 650);
  }

  rabbit.addEventListener('click', function () {
    if (exploding) { return; }
    pokes++;

    var last = pokes >= lines.length;
    speechText.textContent = lines[Math.min(pokes, lines.length) - 1];
    speech.hidden = false;
    speech.classList.toggle('is-violent', last);

    // Angrier every poke: red from the third one, shaking on the last.
    rabbit.classList.toggle('is-angry', pokes >= 3);
    rabbit.classList.toggle('is-raging', last);
    draw();

    if (last) { setTimeout(explode, calm ? 300 : 900); }
  });

  function explode() {
    exploding = true;
    rabbit.classList.remove('is-raging');
    if (!calm) { scatter(); }

    var frame = 0;
    (function next() {
      if (frame < BOOM.length) {
        art.textContent = BOOM[frame++];
        setTimeout(next, calm ? 250 : 160);
        return;
      }
      art.textContent = '\n\n';
      speech.hidden = true;
      if (errorDialog && typeof errorDialog.showModal === 'function') {
        errorDialog.returnValue = '';
        errorDialog.showModal();   // respawn() runs when it closes
      } else {
        setTimeout(respawn, 2500);
      }
    })();
  }

  // Little red and purple bits flying away from the rabbit.
  function scatter() {
    var box = rabbit.getBoundingClientRect();
    for (var n = 0; n < 16; n++) {
      var bit = document.createElement('div');
      var angle = Math.random() * Math.PI * 2;
      var dist = 60 + Math.random() * 120;
      bit.className = 'boom-bit';
      bit.style.left = (box.left + box.width / 2) + 'px';
      bit.style.top = (box.top + box.height / 2) + 'px';
      bit.style.background = (n % 2) ? '#ff2e4d' : '#c77dff';
      bit.style.setProperty('--dx', Math.round(Math.cos(angle) * dist) + 'px');
      bit.style.setProperty('--dy', Math.round(Math.sin(angle) * dist) + 'px');
      bit.addEventListener('animationend', function () { this.remove(); });
      document.body.appendChild(bit);
    }
  }

  function respawn() {
    exploding = false;
    pokes = 0;
    speech.classList.remove('is-violent');
    rabbit.classList.remove('is-angry', 'is-raging');
    draw();
  }


  /* ---------- 4. FAKE ERROR WINDOW ----------
     The <dialog> closes itself when a button inside its <form
     method="dialog"> is pressed. We only need to react afterwards:
     if the button was "more", let a row of rabbits hop by. */
  if (errorDialog && horde) {
    errorDialog.addEventListener('close', function () {
      respawn();
      if (errorDialog.returnValue === 'more') { startHorde(); }
    });
  }

  function startHorde() {
    horde.innerHTML = '';
    horde.hidden = false;

    var rabbits = [];
    for (var n = 0; n < 5; n++) {
      var span = document.createElement('span');
      span.textContent = REST;
      horde.appendChild(span);
      rabbits.push(span);
    }

    var timer = null;
    if (!calm) {
      var tick = 0;
      timer = setInterval(function () {
        tick++;
        for (var k = 0; k < rabbits.length; k++) {
          var up = (tick + k) % 2 === 1;
          rabbits[k].textContent = up ? HOP : REST;
          rabbits[k].classList.toggle('is-up', up);
        }
      }, 650);
    }

    setTimeout(function () {
      if (timer) { clearInterval(timer); }
      horde.hidden = true;
      horde.innerHTML = '';
    }, 9000);
  }
})();
