document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var list = document.querySelector('.nav__list');
  if (!toggle || !list) return;

  toggle.addEventListener('click', function () {
    var isOpen = list.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  list.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      list.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.querySelectorAll('[data-slider]').forEach(function (slider) {
    var track = slider.querySelector('.photo-slider__track');
    var slides = slider.querySelectorAll('.photo-slider__slide');
    var dotsWrap = slider.querySelector('.photo-slider__dots');
    if (slides.length <= 1) return;
    var index = 0;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'photo-slider__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Bild ' + (i + 1) + ' von ' + slides.length);
      dot.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(dot);
    });
    var dots = dotsWrap.querySelectorAll('.photo-slider__dot');

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function (d, di) { d.classList.toggle('is-active', di === index); });
    }

    slider.querySelector('.photo-slider__nav--prev').addEventListener('click', function () { go(index - 1); });
    slider.querySelector('.photo-slider__nav--next').addEventListener('click', function () { go(index + 1); });
  });

  var finder = document.querySelector('[data-finder]');
  if (finder) {
    var questions = finder.querySelectorAll('[data-question]');
    var progressSteps = finder.querySelectorAll('[data-progress-step]');
    var resultEl = finder.querySelector('[data-result]');
    var scores = { marinele: 0, kim: 0, potosi: 0 };

    var resources = {
      marinele: {
        title: 'Marinele',
        image: 'assets/photos/marinele-2.jpg',
        text: 'Das eigene Binnenschiff auf Weser und Elbe passt, wenn Alltagsstruktur, gemeinsames Kochen und Selbstorganisation im Vordergrund stehen — ein „schwimmendes Jugendzimmer" mit viel Raum für Beziehungsarbeit auf engem Raum.',
        anchor: 'konzept.html#marinele'
      },
      kim: {
        title: 'KIM-Mobil',
        image: 'assets/photos/kim-mobil-1.jpg',
        text: 'Das Kriseninterventionsmobil mit getrennten Schlafkabinen ist flexibel und kurzfristig einsetzbar — passend, wenn schnell Rückzug und Ruhe gebraucht werden, auch ohne langen Vorlauf.',
        anchor: 'konzept.html#kim-mobil'
      },
      potosi: {
        title: 'Potosi',
        image: 'assets/photos/potosi-1.jpg',
        text: 'Das Segelschiff Potosi wird rund viermal im Jahr gechartert und bietet maximale Distanz zum bisherigen Umfeld sowie ein intensives Naturerlebnis auf offener See.',
        anchor: 'konzept.html#potosi'
      }
    };

    function showQuestion(index) {
      questions.forEach(function (q, i) { q.classList.toggle('is-active', i === index); });
      progressSteps.forEach(function (s, i) { s.classList.toggle('is-done', i < index); });
    }

    questions.forEach(function (question, qIndex) {
      question.querySelectorAll('.finder__option').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var data = JSON.parse(btn.getAttribute('data-scores'));
          Object.keys(data).forEach(function (key) { scores[key] += data[key]; });
          if (qIndex < questions.length - 1) {
            showQuestion(qIndex + 1);
          } else {
            showResult();
          }
        });
      });

      var back = question.querySelector('[data-back]');
      if (back) {
        back.addEventListener('click', function (e) {
          e.preventDefault();
          showQuestion(qIndex - 1);
        });
      }
    });

    function showResult() {
      var winner = Object.keys(scores).reduce(function (a, b) { return scores[b] > scores[a] ? b : a; });
      var r = resources[winner];
      resultEl.innerHTML =
        '<div class="finder__result-grid">' +
          '<img class="finder__result-image" src="' + r.image + '" alt="' + r.title + '">' +
          '<div>' +
            '<p class="finder__result-label">Empfehlung</p>' +
            '<h3 class="mt-0">' + r.title + '</h3>' +
            '<p>' + r.text + '</p>' +
            '<div class="finder__result-actions">' +
              '<a class="btn btn--primary" href="' + r.anchor + '">Mehr zu ' + r.title + '</a>' +
              '<a class="btn btn--outline-dark" href="kontakt.html">Fall besprechen</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<a href="#" class="finder__restart" data-restart>↺ Noch einmal von vorn</a>';

      questions.forEach(function (q) { q.classList.remove('is-active'); });
      progressSteps.forEach(function (s) { s.classList.add('is-done'); });
      resultEl.classList.add('is-active');

      resultEl.querySelector('[data-restart]').addEventListener('click', function (e) {
        e.preventDefault();
        scores = { marinele: 0, kim: 0, potosi: 0 };
        resultEl.classList.remove('is-active');
        resultEl.innerHTML = '';
        showQuestion(0);
      });
    }
  }
});
