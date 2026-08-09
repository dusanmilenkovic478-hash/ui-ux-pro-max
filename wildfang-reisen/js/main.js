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
});
