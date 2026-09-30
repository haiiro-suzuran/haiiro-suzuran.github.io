/* ==========================================================
   home.js - only the home page loads this.
   Rotating "did you know?" facts in the intro window
   ========================================================== */
(function () {
  'use strict';

  var calm = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------- ROTATING FACTS ----------
     The facts are written in the HTML (each one is a
     <div class="fact">). We just hide all but one. */
  var facts = document.querySelectorAll('.fact');
  var factNo = document.getElementById('factNo');
  var factDots = document.getElementById('factDots');
  var nextButton = document.getElementById('nextFact');
  var index = 0;

  function showFact(n) {
    index = (n + facts.length) % facts.length;

    var dots = '';
    for (var i = 0; i < facts.length; i++) {
      facts[i].hidden = (i !== index);
      dots += (i === index) ? '#' : '-';
    }
    factNo.textContent = (index + 1) + '/' + facts.length;
    factDots.textContent = '[' + dots + ']';
  }

  if (facts.length && factNo && factDots && nextButton) {
    showFact(0);
    nextButton.addEventListener('click', function () { showFact(index + 1); });
    if (!calm) {
      setInterval(function () { showFact(index + 1); }, 8000);
    }
  }
})();
