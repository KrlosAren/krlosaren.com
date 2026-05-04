(function () {
  function attachButtons() {
    document.querySelectorAll('article pre').forEach(function (pre) {
      if (pre.querySelector('.copy-code-btn')) return;

      var btn = document.createElement('button');
      btn.className = 'copy-code-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Copiar código');
      btn.textContent = 'Copiar';

      btn.addEventListener('click', function () {
        var code = pre.querySelector('code') || pre;
        navigator.clipboard
          .writeText(code.innerText)
          .then(function () {
            btn.textContent = '¡Copiado!';
            setTimeout(function () {
              btn.textContent = 'Copiar';
            }, 1500);
          })
          .catch(function () {
            btn.textContent = 'Error';
            setTimeout(function () {
              btn.textContent = 'Copiar';
            }, 1500);
          });
      });

      pre.appendChild(btn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachButtons);
  } else {
    attachButtons();
  }
})();
