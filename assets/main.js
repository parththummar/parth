/* parththummar.com — pipeline behaviour.
   Everything here is progressive enhancement: the page is fully
   readable with this file absent. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var STAGES = ['placed', 'validated', 'queued', 'synced', 'paid', 'fulfilled', 'delivered'];
  var STAGE_LABELS = ['Placed', 'Validated', 'Queued', 'Synced', 'Paid', 'Fulfilled', 'Delivered'];
  var STAGE_COLORS = {
    placed: '#3FB6FF', validated: '#3DDC97', queued: '#FFC53D', synced: '#3FB6FF',
    paid: '#3DDC97', fulfilled: '#3DDC97', delivered: '#3DDC97'
  };

  var sections = STAGES.map(function (id) { return document.getElementById(id); });
  var navLinks = {};
  document.querySelectorAll('[data-stage-link]').forEach(function (a) {
    navLinks[a.getAttribute('data-stage-link')] = a;
  });

  /* ── Stage stamps: each node records the moment the visitor reaches it ── */
  function stampNow() {
    var d = new Date();
    function pad(x, w) { return String(x).padStart(w || 2, '0'); }
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.' + pad(d.getMilliseconds(), 3);
  }

  /* ── Order id year: PT-2013-<current year>, renews itself every January ── */
  var thisYear = String(new Date().getFullYear());
  var orderYear = document.getElementById('order-year');
  if (orderYear) orderYear.textContent = thisYear;
  var packetLabel = document.getElementById('packet-label');
  if (packetLabel) packetLabel.textContent = '#PT-2013-' + thisYear;

  /* ── Live "in_transit" uptime in the hero payload ── */
  var uptimeEl = document.getElementById('uptime');
  if (uptimeEl && !reducedMotion) {
    var EPOCH = Date.UTC(2013, 5, 1, 9, 0, 0); // matches "placed_at" in the JSON
    var tick = function () {
      var s = Math.floor((Date.now() - EPOCH) / 1000);
      var years = Math.floor(s / 31557600); s -= years * 31557600; // 365.25d years
      var days = Math.floor(s / 86400); s -= days * 86400;
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      function pad(x) { return String(x).padStart(2, '0'); }
      uptimeEl.textContent = years + 'y ' + days + 'd ' + pad(h) + ':' + pad(m) + ':' + pad(sec);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ── Capture chip: AUTH HELD -> CAPTURED (initialised before the first
     scroll update so a deep link into #paid can't race it) ── */
  var captureChip = document.getElementById('capture-chip');
  var captureDone = reducedMotion || !captureChip;
  if (!captureDone) {
    captureChip.classList.add('is-held');
    captureChip.textContent = 'AUTH HELD';
  }
  function flipCapture() {
    if (captureDone) return;
    captureDone = true;
    setTimeout(function () {
      captureChip.textContent = 'CAPTURED';
      captureChip.classList.remove('is-held');
    }, 400);
  }

  /* ── Scroll-driven pipeline state: stamps, tracking bar, packet ── */
  var packet = document.getElementById('packet');
  var rail = document.getElementById('rail');
  var progressFill = document.getElementById('progress-fill');
  var chipLabel = document.getElementById('stage-chip-label');
  var stamped = {};
  var ticking = false;

  function activationLine() { return window.innerHeight * 0.45; }

  function positionPacket() {
    if (!packet || !rail) return;
    var r = rail.getBoundingClientRect();
    packet.style.left = (r.left + r.width / 2 - 8) + 'px';
  }

  function update() {
    ticking = false;
    var line = activationLine();
    var current = 'placed';

    sections.forEach(function (sec, i) {
      if (!sec) return;
      var id = STAGES[i];
      var top = sec.getBoundingClientRect().top;
      // 4px hysteresis so the node doesn't flicker at the threshold
      var on = stamped[id] ? top < line + 4 : top < line - 4;
      if (on !== !!stamped[id]) {
        stamped[id] = on;
        sec.classList.toggle('is-stamped', on);
        var stampEl = sec.querySelector('[data-stamp]');
        if (stampEl) stampEl.textContent = on ? stampNow() : 'PENDING';
      }
      if (on) current = id;
    });

    // tracking bar
    var currentIdx = STAGES.indexOf(current);
    STAGES.forEach(function (id, i) {
      var a = navLinks[id];
      if (!a) return;
      a.classList.toggle('is-done', i < currentIdx);
      a.classList.toggle('is-current', i === currentIdx);
    });
    if (chipLabel) {
      chipLabel.textContent = 'Stage ' + String(currentIdx + 1).padStart(2, '0') + '/07 — ' + STAGE_LABELS[currentIdx];
    }
    if (progressFill) {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progressFill.style.setProperty('--scroll-progress', pct.toFixed(1) + '%');
      progressFill.style.background = STAGE_COLORS[current];
    }

    // packet: ride the rail between the pipeline start and the terminal node
    if (packet) {
      var pipeline = document.querySelector('.pipeline');
      var delivered = sections[6];
      if (pipeline && delivered) {
        var pTop = pipeline.getBoundingClientRect().top;
        var dNode = delivered.querySelector('.node');
        var docked = dNode ? dNode.getBoundingClientRect().top < line : false;
        packet.classList.toggle('is-visible', pTop < line && !docked);
      }
    }

    // capture chip flips AUTH HELD -> CAPTURED when the paid stage activates
    if (stamped.paid) flipCapture();
  }

  function requestUpdate() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', function () { positionPacket(); requestUpdate(); });
  positionPacket();
  update();

  /* ── One-shot reveals (checklist, history) ── */
  function revealOnce(el, cls, threshold) {
    if (!el) return;
    if (reducedMotion) { el.classList.add(cls); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { el.classList.add(cls); io.disconnect(); }
      });
    }, { threshold: threshold || 0.35 });
    io.observe(el);
  }
  revealOnce(document.querySelector('.checklist'), 'is-revealed');

  var history = document.querySelector('.history');
  if (history) {
    history.querySelectorAll('li').forEach(function (li, i) { li.style.setProperty('--i', i); });
    revealOnce(history, 'is-revealed', 0.1);
  }

  /* ── Metric count-up + queue chip ── */
  var queueChip = document.getElementById('queue-chip');
  var metricsPanel = document.querySelector('#queued .panel');
  if (metricsPanel && !reducedMotion) {
    if (queueChip) {
      queueChip.textContent = 'QUEUED';
      queueChip.classList.remove('chip--green-outline');
      queueChip.classList.add('chip--amber-outline');
    }
    var counters = metricsPanel.querySelectorAll('.count');
    counters.forEach(function (c) {
      // reserve final width so the +/×/M suffix never shifts mid-count
      c.style.minWidth = String(c.getAttribute('data-count')).length + 'ch';
      c.textContent = '0';
    });
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      var start = performance.now();
      var DUR = 700;
      function frame(now) {
        var t = Math.min((now - start) / DUR, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        counters.forEach(function (c) {
          c.textContent = String(Math.round(eased * Number(c.getAttribute('data-count'))));
        });
        if (t < 1) { requestAnimationFrame(frame); return; }
        if (queueChip) {
          queueChip.textContent = 'CONSUMED';
          queueChip.classList.remove('chip--amber-outline');
          queueChip.classList.add('chip--green-outline');
        }
      }
      requestAnimationFrame(frame);
    }, { threshold: 0.5 });
    io.observe(metricsPanel);
  }

  /* ── Project cards: expand/collapse + rail connector ── */
  document.querySelectorAll('[data-card]').forEach(function (card) {
    var btn = card.querySelector('.pcard__toggle');
    var label = card.querySelector('[data-toggle-label]');
    if (btn) {
      btn.addEventListener('click', function () {
        var open = card.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        if (label) label.textContent = open ? 'HIDE TRACE' : 'VIEW TRACE';
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { card.classList.add('is-linked'); io.disconnect(); }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    io.observe(card);
  });

  /* ── Contact: copy button + status flip ── */
  var copySlot = document.getElementById('copy-slot');
  if (copySlot && navigator.clipboard) {
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'COPY';
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText('parththummar@gmail.com').then(function () {
        copyBtn.textContent = 'COPIED';
        var status = document.getElementById('copy-status');
        if (status) status.textContent = 'Email address copied to clipboard';
        setTimeout(function () { copyBtn.textContent = 'COPY'; }, 1500);
      });
    });
    copySlot.appendChild(copyBtn);
  }

  var emailLink = document.getElementById('email-link');
  var kicker = document.getElementById('delivered-kicker');
  if (emailLink && kicker) {
    var flipTimer = null;
    var flip = function () {
      if (flipTimer) return;
      kicker.textContent = 'REORDER INITIATED — 202 ACCEPTED';
      flipTimer = setTimeout(function () {
        kicker.textContent = kicker.getAttribute('data-default');
        flipTimer = null;
      }, 1200);
    };
    emailLink.addEventListener('mouseenter', flip);
    emailLink.addEventListener('focus', flip);
  }

  /* ── Mobile stage menu ── */
  var stageChip = document.getElementById('stage-chip');
  var stageMenu = document.getElementById('stage-menu');
  if (stageChip && stageMenu) {
    stageChip.hidden = false;
    var closeMenu = function () {
      stageMenu.hidden = true;
      stageChip.setAttribute('aria-expanded', 'false');
    };
    stageChip.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = stageMenu.hidden;
      stageMenu.hidden = !open;
      stageChip.setAttribute('aria-expanded', String(open));
    });
    stageMenu.addEventListener('click', closeMenu);
    document.addEventListener('click', function (e) {
      if (!stageMenu.hidden && !stageMenu.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ── Command palette ── */
  var palette = document.getElementById('palette');
  var paletteInput = document.getElementById('palette-input');
  var paletteList = document.getElementById('palette-list');
  if (palette && typeof palette.showModal === 'function' && paletteInput && paletteList) {
    var items = Array.prototype.slice.call(paletteList.querySelectorAll('li'));
    var activeIdx = -1;

    function visibleItems() {
      return items.filter(function (li) { return !li.hidden; });
    }
    function setActive(idx) {
      var vis = visibleItems();
      items.forEach(function (li) { li.classList.remove('is-active'); });
      if (!vis.length) { activeIdx = -1; return; }
      activeIdx = (idx + vis.length) % vis.length;
      vis[activeIdx].classList.add('is-active');
      vis[activeIdx].scrollIntoView({ block: 'nearest' });
    }
    function openPalette() {
      palette.showModal();
      paletteInput.value = '';
      items.forEach(function (li) { li.hidden = false; });
      setActive(0);
      paletteInput.focus();
    }

    document.addEventListener('keydown', function (e) {
      var active = document.activeElement;
      var inField = !!active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName);
      if ((e.key === '/' && !inField) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        if (!palette.open) openPalette();
      }
    });
    paletteInput.addEventListener('input', function () {
      var q = paletteInput.value.trim().toLowerCase();
      items.forEach(function (li) {
        li.hidden = q !== '' && li.textContent.toLowerCase().indexOf(q) === -1;
      });
      setActive(0);
    });
    paletteInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
      else if (e.key === 'Enter') {
        var vis = visibleItems();
        if (vis[activeIdx]) { vis[activeIdx].querySelector('a').click(); palette.close(); }
      }
    });
    paletteList.addEventListener('click', function (e) {
      if (e.target.closest('a')) palette.close();
    });
    palette.addEventListener('click', function (e) {
      if (e.target === palette) palette.close(); // backdrop click
    });
  }

  /* ── After-hours step sequencer (Web Audio, strictly opt-in) ── */
  var seq = document.getElementById('seq');
  var playSlot = document.getElementById('play-slot');
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (seq && playSlot && AudioCtx) {
    var cells = {
      kick: Array.prototype.slice.call(seq.querySelectorAll('[data-voice="kick"] button')),
      blip: Array.prototype.slice.call(seq.querySelectorAll('[data-voice="blip"] button'))
    };
    var allCells = cells.kick.concat(cells.blip);

    allCells.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-checked') !== 'true';
        btn.setAttribute('aria-checked', String(on));
        btn.classList.toggle('on', on);
      });
    });

    var playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'play-btn';
    playBtn.textContent = 'PLAY';
    playBtn.setAttribute('aria-label', 'Play sequencer loop');
    playSlot.appendChild(playBtn);

    var ctx = null;
    var playing = false;
    var step = 0;
    var nextTime = 0;
    var timer = null;
    var STEP_DUR = 60 / 112 / 2; // 8th notes at 112 BPM

    function kick(time) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(50, time + 0.12);
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.13);
    }
    function blip(time) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      osc.type = 'square';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.07);
    }
    function setPlayhead(col) {
      allCells.forEach(function (b) { b.classList.remove('is-playhead'); });
      if (col >= 0) {
        cells.kick[col].classList.add('is-playhead');
        cells.blip[col].classList.add('is-playhead');
      }
    }
    // 25ms lookahead scheduler against the audio clock — survives tab jank
    function schedule() {
      while (nextTime < ctx.currentTime + 0.1) {
        var col = step;
        if (cells.kick[col].classList.contains('on')) kick(nextTime);
        if (cells.blip[col].classList.contains('on')) blip(nextTime);
        var delay = Math.max(0, (nextTime - ctx.currentTime) * 1000);
        (function (c) { setTimeout(function () { if (playing) setPlayhead(c); }, delay); })(col);
        nextTime += STEP_DUR;
        step = (step + 1) % 8;
      }
    }
    function stop() {
      playing = false;
      clearInterval(timer);
      setPlayhead(-1);
      playBtn.textContent = 'PLAY';
      playBtn.setAttribute('aria-label', 'Play sequencer loop');
    }
    playBtn.addEventListener('click', function () {
      if (playing) { stop(); return; }
      try {
        if (!ctx) ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
      } catch (err) { return; }
      playing = true;
      step = 0;
      nextTime = ctx.currentTime + 0.05;
      timer = setInterval(schedule, 25);
      playBtn.textContent = 'STOP';
      playBtn.setAttribute('aria-label', 'Stop sequencer loop');
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && playing) stop();
    });
  }

  /* ── Shipping block: the order ships to the visitor ──
     Everything below is resolved in the browser and rendered once into the
     hero payload; nothing is stored, no cookies, no identifiers kept.
     The only network calls are one anonymous IP-geo lookup (same provider
     the /ip app uses) and an open-meteo weather read — both fail silently. */
  var shipSlot = document.getElementById('ship-slot');
  if (shipSlot && window.fetch) {
    var esc = function (s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    };

    var deviceType = (function () {
      if (navigator.userAgentData && navigator.userAgentData.mobile) return 'mobile';
      var coarse = window.matchMedia('(pointer: coarse)').matches;
      if (coarse && Math.min(screen.width, screen.height) >= 600) return 'tablet';
      return coarse ? 'mobile' : 'desktop';
    })();

    var ua = navigator.userAgent;
    var os =
      (navigator.userAgentData && navigator.userAgentData.platform) ||
      (/iphone|ipad|ipod/i.test(ua) ? 'iOS' :
       /android/i.test(ua) ? 'Android' :
       /mac/i.test(ua) ? 'macOS' :
       /win/i.test(ua) ? 'Windows' :
       /linux/i.test(ua) ? 'Linux' : 'unknown');
    var browser =
      /edg\//i.test(ua) ? 'Edge' :
      /firefox\//i.test(ua) ? 'Firefox' :
      /chrome|crios\//i.test(ua) ? 'Chrome' :
      /safari\//i.test(ua) ? 'Safari' : 'browser';

    var tz = 'UTC';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) {}
    var localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var conn = navigator.connection && navigator.connection.effectiveType;

    function fetchJson(url, ms) {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (ctrl) setTimeout(function () { ctrl.abort(); }, ms);
      return fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
    }

    // WMO weather codes -> short labels
    function weatherLabel(code) {
      if (code === 0) return 'clear';
      if (code <= 3) return 'partly cloudy';
      if (code <= 48) return 'fog';
      if (code <= 67) return 'rain';
      if (code <= 86) return 'snow';
      return 'thunderstorm';
    }

    var geoP = fetchJson('https://ipapi.co/json/', 3000)
      .then(function (d) {
        if (!d || !d.city) throw new Error('no city');
        return { city: d.city, region: d.region_code || d.region || '', country: d.country_code || '', lat: d.latitude, lon: d.longitude };
      })
      .catch(function () {
        return fetchJson('https://ipwho.is/', 3000).then(function (d) {
          if (!d || !d.success || !d.city) throw new Error('no city');
          return { city: d.city, region: (d.region_code || d.region || ''), country: d.country_code || '', lat: d.latitude, lon: d.longitude };
        });
      })
      .catch(function () { return null; });

    geoP.then(function (geo) {
      var weatherP = (geo && geo.lat != null)
        ? fetchJson('https://api.open-meteo.com/v1/forecast?latitude=' + geo.lat + '&longitude=' + geo.lon + '&current_weather=true', 3000)
            .then(function (d) {
              var w = d && d.current_weather;
              return w ? weatherLabel(w.weathercode) + ' · ' + Math.round(w.temperature) + '°C' : null;
            })
            .catch(function () { return null; })
        : Promise.resolve(null);

      weatherP.then(function (weather) {
        var fields = [];
        if (geo) {
          fields.push(['city', geo.city + (geo.region ? ', ' + geo.region : '') + (geo.country ? ', ' + geo.country : '')]);
        }
        fields.push(['local_time', localTime]);
        if (weather) fields.push(['weather', weather]);
        fields.push(['device', deviceType + ' · ' + os + ' · ' + browser]);
        fields.push(['viewport', window.innerWidth + '×' + window.innerHeight]);
        fields.push(['locale', navigator.language || 'en']);
        fields.push(['tz', tz]);
        if (conn) fields.push(['connection', conn]);
        fields.push(['_privacy', 'resolved client-side, never stored']);

        // keys are hardcoded; every value passes through esc() above
        var lines = ['  <span class="j-key">"shipping_to"</span>: {'];
        fields.forEach(function (f, i) {
          var cls = f[0] === '_privacy' ? 'j-mut' : 'j-str';
          lines.push('    <span class="j-key">"' + f[0] + '"</span>: <span class="' + cls + '">"' + esc(f[1]) + '"</span>' + (i < fields.length - 1 ? ',' : ''));
        });
        lines.push('  },');
        shipSlot.innerHTML = lines.map(function (l, i) {
          return '<span class="ship-line" style="--i:' + i + '">' + l + '\n</span>';
        }).join('');

        // the delivery confirmation now knows where it landed
        if (geo) {
          var kicker = document.getElementById('delivered-kicker');
          if (kicker) {
            var signed = 'STATUS: DELIVERED — signed_for_by: you (' + geo.city + (geo.region ? ', ' + geo.region : '') + ')';
            kicker.setAttribute('data-default', signed);
            kicker.textContent = signed;
          }
        }
      });
    });
  }
})();
