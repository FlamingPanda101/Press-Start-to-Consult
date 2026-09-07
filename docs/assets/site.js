// Progressive enhancement only. Every page reads and navigates with this file absent.
(function () {
  'use strict';

  // ---------------------------------------------------------- contents drawer
  var toggle = document.querySelector('.toc-toggle');
  var toc = document.getElementById('toc');
  if (toggle && toc) {
    var wide = window.matchMedia('(min-width: 64rem)');
    var sync = function () {
      if (wide.matches) { toc.hidden = false; toggle.setAttribute('aria-expanded', 'false'); }
      else { toc.hidden = toggle.getAttribute('aria-expanded') !== 'true'; }
    };
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toc.hidden = open;
    });
    // Choosing a section on a phone should close the drawer behind you.
    toc.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && !wide.matches) {
        toggle.setAttribute('aria-expanded', 'false');
        toc.hidden = true;
      }
    });
    (wide.addEventListener ? wide.addEventListener('change', sync) : wide.addListener(sync));
    sync();
  }

  // ---------------------------------------------------------- current section
  var links = toc ? Array.prototype.slice.call(toc.querySelectorAll('a')) : [];
  if (links.length && 'IntersectionObserver' in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var targets = Object.keys(byId).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var a = byId[en.target.id];
        if (!a || a === current) return;
        if (current) current.removeAttribute('aria-current');
        a.setAttribute('aria-current', 'true');
        current = a;
      });
    // rootMargin only accepts px and %, never rem: a rem here throws and kills
    // the rest of this file.
    }, { rootMargin: '-96px 0px -70% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  // ---------------------------------------------------- in-book search
  // Same index as the home page, filtered to the book you are reading. While a
  // query is active the results replace the contents list, so the narrow sidebar
  // never shows two competing lists.
  (function () {
    var nav = document.getElementById('toc');
    if (!nav) return;
    var input = document.getElementById('bq');
    var list = nav.querySelector('.toc__list');
    var out = nav.querySelector('.toc__results');
    var status = document.getElementById('bq-status');
    if (!input || !list || !out || !status) return;

    var book = nav.getAttribute('data-book');
    var src = nav.getAttribute('data-search') || 'assets/search-index.json';
    var rows = null, loading = false, queued = null;

    var esc = function (t) {
      return String(t).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    };

    var mark = function (text, q) {
      var i = text.toLowerCase().indexOf(q);
      if (i < 0) return esc(text.slice(0, 90));
      var from = Math.max(0, i - 30);
      var snip = (from > 0 ? '…' : '') + text.slice(from, i + q.length + 60);
      var at = snip.toLowerCase().indexOf(q);
      return esc(snip.slice(0, at)) + '<mark>' + esc(snip.substr(at, q.length)) + '</mark>' + esc(snip.slice(at + q.length));
    };

    var show = function (q) {
      if (!rows) { queued = q; load(); return; }
      if (q.length < 2) {
        out.hidden = true; out.innerHTML = '';
        list.hidden = false;
        status.textContent = '';
        return;
      }
      var hits = [];
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var inHead = r.h.toLowerCase().indexOf(q) >= 0;
        var inText = r.t.toLowerCase().indexOf(q) >= 0;
        if (inHead || inText) hits.push({ r: r, score: inHead ? 0 : 1 });
      }
      hits.sort(function (a, b) { return a.score - b.score; });
      list.hidden = true;
      out.hidden = false;
      if (!hits.length) {
        out.innerHTML = '<li><span class="r__none">No match in this book. The home page searches all three.</span></li>';
        status.textContent = 'No results';
        return;
      }
      out.innerHTML = hits.slice(0, 20).map(function (x) {
        return '<li><a href="#' + esc(x.r.u.split('#')[1]) + '">' + esc(x.r.h)
          + '<span class="r__snip">' + mark(x.r.t, q) + '</span></a></li>';
      }).join('');
      status.textContent = hits.length === 1 ? '1 section' : hits.length + ' sections';
    };

    var load = function () {
      if (rows || loading) return;
      loading = true;
      fetch(src)
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (all) {
          rows = all.filter(function (x) { return x.b === book; });
          loading = false;
          if (queued !== null) { show(queued); queued = null; }
        })
        .catch(function () { loading = false; rows = []; });
    };
    input.addEventListener('focus', load, { once: true });

    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim().toLowerCase();
      timer = setTimeout(function () { show(q); }, 140);
    });
    // Escape clears the query and brings the contents back.
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && input.value) { input.value = ''; show(''); }
    });
    // Following a result on a phone should close the drawer, like the contents do.
    out.addEventListener('click', function (e) {
      if (e.target.closest('a') && toggle && !window.matchMedia('(min-width: 64rem)').matches) {
        toggle.setAttribute('aria-expanded', 'false');
        toc.hidden = true;
      }
    });
  })();

  // ---------------------------------------------------------- search
  var input = document.getElementById('q');
  var results = document.getElementById('results');
  if (!input || !results) return;

  var index = null, loading = false, pending = null;

  var load = function () {
    if (index || loading) return;
    loading = true;
    var url = (document.getElementById('main') || {}).dataset;
    fetch((url && url.search) || 'assets/search-index.json')
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (d) { index = d; loading = false; if (pending !== null) { run(pending); pending = null; } })
      .catch(function () { loading = false; index = []; });
  };
  input.addEventListener('focus', load, { once: true });

  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  var mark = function (text, q) {
    var i = text.toLowerCase().indexOf(q);
    if (i < 0) return esc(text.slice(0, 150));
    var from = Math.max(0, i - 55);
    var snip = (from > 0 ? '…' : '') + text.slice(from, i + q.length + 95);
    var at = snip.toLowerCase().indexOf(q);
    return esc(snip.slice(0, at)) + '<mark>' + esc(snip.substr(at, q.length)) + '</mark>' + esc(snip.slice(at + q.length));
  };

  var run = function (q) {
    if (!index) { pending = q; load(); return; }
    if (q.length < 2) { results.innerHTML = ''; return; }
    var hits = [];
    for (var i = 0; i < index.length && hits.length < 40; i++) {
      var s = index[i];
      var inHead = s.h.toLowerCase().indexOf(q) >= 0;
      var inText = s.t.toLowerCase().indexOf(q) >= 0;
      if (inHead || inText) hits.push({ s: s, score: inHead ? 0 : 1 });
    }
    hits.sort(function (a, b) { return a.score - b.score; });
    if (!hits.length) {
      results.innerHTML = '<li><a href="#q" aria-disabled="true"><span class="r__head">Nothing found for &ldquo;' + esc(q) + '&rdquo;</span><span class="r__snip">Try a shorter word, such as a metric name or a step in the case.</span></a></li>';
      return;
    }
    results.innerHTML = hits.slice(0, 12).map(function (h) {
      return '<li><a href="' + esc(h.s.u) + '">'
        + '<span class="r__book">' + esc(h.s.b) + '</span>'
        + '<span class="r__head">' + esc(h.s.h) + '</span>'
        + '<span class="r__snip">' + mark(h.s.t, q) + '</span></a></li>';
    }).join('');
  };

  var timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    var q = input.value.trim().toLowerCase();
    timer = setTimeout(function () { run(q); }, 140);
  });
})();
