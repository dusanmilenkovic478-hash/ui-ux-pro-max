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
});
