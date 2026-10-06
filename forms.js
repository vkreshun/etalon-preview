/* Отправка заявок с форм [data-lead] на api/lead.php (почта + Telegram).
   Без JavaScript формы тоже работают: отправляются обычным POST, обработчик покажет страницу «Спасибо». */
(function () {
  var forms = document.querySelectorAll('form[data-lead]');
  if (!forms.length) return;

  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/forms\.js(\?.*)?$/, '') : '/';
  var ENDPOINT = base + 'api/lead.php';
  var PHONE = '+7 (4822) 33-07-17';
  // демо-версия сайта (атрибут data-demo на <html>): заявки не отправляются
  var DEMO = document.documentElement.hasAttribute('data-demo');

  var token = null;
  var tokenRequest = null;

  // Токен запрашиваем, когда посетитель начинает заполнять форму, — без лишних запросов на каждый просмотр.
  function getToken() {
    if (token && Date.now() - token.at < 60 * 60 * 1000) return Promise.resolve(token);
    if (tokenRequest) return tokenRequest;
    tokenRequest = fetch(ENDPOINT + '?token=1', { headers: { 'X-Requested-With': 'fetch' }, credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error('token'); return r.json(); })
      .then(function (j) { token = { t: j.t, sig: j.sig, at: Date.now() }; tokenRequest = null; return token; })
      .catch(function (e) { tokenRequest = null; throw e; });
    return tokenRequest;
  }

  function digits(s) { return String(s || '').replace(/\D/g, ''); }

  Array.prototype.forEach.call(forms, function (form) {
    form.setAttribute('novalidate', '');   // проверяем сами, с понятными сообщениями
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var warmed = false;

    form.addEventListener('focusin', function () {
      if (!warmed && !DEMO) { warmed = true; getToken().catch(function () {}); }
    });

    function say(text, kind) {
      if (!status) return;
      status.textContent = text;
      status.className = 'form-status' + (kind ? ' is-' + kind : '');
    }
    function fail(el, text) {
      el.setAttribute('aria-invalid', 'true');
      el.focus();
      say(text, 'error');
      return false;
    }
    function el(name) { return form.elements.namedItem(name); }

    function validate() {
      Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (x) { x.removeAttribute('aria-invalid'); });
      var name = el('name'), phone = el('phone'), email = el('email'), consent = el('consent');
      if (name && !name.value.trim()) return fail(name, 'Укажите, как к вам обращаться.');
      if (phone) {
        var d = digits(phone.value);
        if (d.length < 10 || d.length > 15) return fail(phone, 'Проверьте номер телефона — нужно не меньше 10 цифр.');
      }
      if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        return fail(email, 'Проверьте адрес электронной почты.');
      }
      if (consent && !consent.checked) return fail(consent, 'Отметьте согласие на обработку персональных данных.');
      return true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      if (DEMO) {
        form.innerHTML = '<div class="form-done" role="status"><b>Это демо-версия сайта</b>' +
          '<p>Заявка не отправлена. На рабочем сайте она сразу придёт на почту и в Telegram.</p></div>';
        return;
      }

      var label = button ? button.textContent : '';
      if (button) { button.disabled = true; button.textContent = 'Отправляем…'; }
      say('');

      getToken()
        .then(function (tk) {
          var data = new FormData(form);
          data.append('form', form.getAttribute('data-lead'));
          data.append('page', location.pathname);
          data.append('t', tk.t);
          data.append('sig', tk.sig);
          return fetch(ENDPOINT, {
            method: 'POST', body: data, credentials: 'same-origin',
            headers: { 'X-Requested-With': 'fetch' }
          });
        })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (j) {
          if (!j || !j.ok) throw new Error((j && j.error) || 'fail');
          form.innerHTML = '<div class="form-done" role="status"><b>Спасибо, заявка отправлена!</b>' +
            '<p>Перезвоним в течение 30 минут в рабочее время (Пн–Пт 9:00–18:00).</p></div>';
          if (window.ym && window.YM_COUNTER) window.ym(window.YM_COUNTER, 'reachGoal', 'lead');
        })
        .catch(function (err) {
          if (button) { button.disabled = false; button.textContent = label; }
          if (err && err.message === 'token') token = null;
          say(err && err.message === 'rate'
            ? 'Слишком много заявок подряд. Попробуйте позже или позвоните нам: ' + PHONE + '.'
            : 'Не удалось отправить заявку. Позвоните нам: ' + PHONE + '.', 'error');
        });
    });
  });
})();
