/* ==========================================================
   main.js - loaded on every page.
   Four small features:
   1. Cursor trail   2. Spinning stars
   3. ASCII rabbit   4. Fake error window (home page only)
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
     The rabbit alternates between two drawings, and says a line
     from its data-lines attribute each time it is poked. */
  var rabbit = document.getElementById('rabbit');
  if (!rabbit) { return; }

  var art = rabbit.querySelector('.rabbit__art');
  var speech = document.getElementById('speech');
  var speechText = document.getElementById('speechText');
  var errorDialog = document.getElementById('errorDialog');
  var horde = document.getElementById('horde');

  // "\\" is how you write one backslash inside a JavaScript string.
  var REST = '(\\(\\\n( -.-)\no_(")(")';
  var HOP  = '(\\(\\\n( ^.^)\no_(")(")';
  var lines = (rabbit.getAttribute('data-lines') || 'hrair!').split('|');

  if (!calm) {
    var hopping = false;
    setInterval(function () {
      hopping = !hopping;
      art.textContent = hopping ? HOP : REST;
      rabbit.classList.toggle('is-hopping', hopping);
    }, 650);
  }

  var pokes = 0;
  rabbit.addEventListener('click', function () {
    pokes++;
    speechText.textContent = lines[(pokes - 1) % lines.length];
    speech.hidden = false;

    // Five pokes on the home page opens the error window.
    if (errorDialog && pokes >= 5 && typeof errorDialog.showModal === 'function') {
      pokes = 0;
      speech.hidden = true;
      errorDialog.returnValue = '';
      errorDialog.showModal();
    }
  });


  /* ---------- 4. FAKE ERROR WINDOW ----------
     The <dialog> closes itself when a button inside its <form
     method="dialog"> is pressed. We only need to react afterwards:
     if the button was "more", let a row of rabbits hop by. */
  if (errorDialog && horde) {
    errorDialog.addEventListener('close', function () {
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
