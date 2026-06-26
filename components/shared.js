(function() {
  function loadComponent(id, url, callback) {
    fetch(url)
      .then(function(r) { return r.text(); })
      .then(function(html) {
        document.getElementById(id).innerHTML = html;
        if (callback) callback();
      });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var navbarDone = false;
    var footerDone = false;

    function tryInitI18n() {
      if (navbarDone && footerDone && typeof initI18n === 'function') {
        initI18n();
      }
    }

    loadComponent('navbar-placeholder', 'components/navbar.html', function() {
      navbarDone = true;
      tryInitI18n();
    });

    loadComponent('footer-placeholder', 'components/footer.html', function() {
      footerDone = true;
      tryInitI18n();
    });
  });
})();
