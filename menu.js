/* Mobile menu + current-page highlight. Strings are \u-escaped so the file works with any server charset. */
(function () {
  var header = document.querySelector('header');
  var btn = header && header.querySelector('.burger');
  var nav = document.getElementById('site-nav');
  if (!btn || !nav) return;

  var LABEL_OPEN = 'Открыть меню';   // Открыть меню
  var LABEL_CLOSE = 'Закрыть меню';  // Закрыть меню

  function setOpen(open) {
    header.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? LABEL_CLOSE : LABEL_OPEN);
  }

  btn.addEventListener('click', function () { setOpen(!header.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('open')) { setOpen(false); btn.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (header.classList.contains('open') && !header.contains(e.target)) setOpen(false);
  });
  var wide = window.matchMedia('(min-width: 961px)');
  var onWide = function (m) { if (m.matches) setOpen(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide); else wide.addListener(onWide);

  // highlight the section the visitor is in
  var path = location.pathname.replace(/index\.html$/, '');
  var links = nav.querySelectorAll('a[href]');
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    if (a.hash || a.protocol === 'tel:') continue;
    var target = a.pathname.replace(/index\.html$/, '');
    var isSection = /\/articles\/$/.test(target) && path.indexOf(target) === 0;
    var isService = /\/uslugi\.html$/.test(target) && /\/usluga-[^/]+\.html$/.test(path);
    if (target === path || isSection || isService) a.setAttribute('aria-current', 'page');
  }
})();
