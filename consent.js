/* Согласие на cookie: баннер, Яндекс.Метрика и карты Яндекса загружаются только после согласия.
   Выбор хранится в localStorage («all» — все, «necessary» — только необходимые). */
(function () {
  var KEY = 'etalon-cookie-consent';
  var METRIKA_ID = 53456584;   // счётчик Яндекс.Метрики (тот же, что на старом сайте)
  var script = document.currentScript;
  var root = script && script.src ? script.src.replace(/consent\.js(\?.*)?$/, '') : '/';

  function read() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && v.choice; } catch (e) { return null; }
  }
  function save(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({ choice: choice, at: new Date().toISOString() })); } catch (e) {}
  }

  function loadMetrika() {
    if (!METRIKA_ID || window.ym) return;
    if (document.documentElement.hasAttribute('data-demo')) return;   // демо-версия: статистику не собираем
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(METRIKA_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
    window.YM_COUNTER = METRIKA_ID;   // для цели «lead» в forms.js
  }

  function loadMaps() {
    var boxes = document.querySelectorAll('[data-map-src]');
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      if (box.querySelector('iframe')) continue;
      var f = document.createElement('iframe');
      f.src = box.getAttribute('data-map-src');
      f.title = box.getAttribute('data-map-title') || 'Карта';
      f.setAttribute('allowfullscreen', '');
      box.innerHTML = '';
      box.appendChild(f);
    }
  }

  function apply(choice) {
    if (choice === 'all') { loadMetrika(); loadMaps(); }
  }

  function showBanner() {
    if (document.getElementById('cookie-banner')) return;
    var b = document.createElement('div');
    b.id = 'cookie-banner';
    b.className = 'cookie-banner';
    b.setAttribute('role', 'region');
    b.setAttribute('aria-label', 'Согласие на использование файлов cookie');
    b.innerHTML =
      '<p>Мы используем файлы cookie: необходимые — для работы сайта, а с вашего согласия — для статистики посещений ' +
      '(Яндекс.Метрика) и карты Яндекса. <a href="' + root + 'cookie.html">Подробнее о cookie</a></p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-primary" data-consent="all">Принять все</button>' +
      '<button type="button" class="btn btn-outline" data-consent="necessary">Только необходимые</button>' +
      '</div>';
    document.body.appendChild(b);
    b.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-consent]') : null;
      if (!btn) return;
      var choice = btn.getAttribute('data-consent');
      save(choice);
      b.parentNode.removeChild(b);
      apply(choice);
    });
  }

  // цели Яндекс.Метрики (отправляются, только если посетитель разрешил статистику)
  function goal(name) { if (window.ym && window.YM_COUNTER) window.ym(window.YM_COUNTER, 'reachGoal', name); }

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    if (e.target.closest('[data-load-map]')) { e.preventDefault(); loadMaps(); }
    if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); showBanner(); }
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href.indexOf('tel:') === 0) goal('phone_click');
    else if (href.indexOf('mailto:') === 0) goal('email_click');
    else if (/pricelist\.pdf$/.test(href)) goal('pricelist_download');
    else if (href.indexOf('yandex.ru/maps/?rtext') !== -1) goal('route_click');
  });

  var choice = read();
  if (choice) apply(choice); else showBanner();
})();
