/* =========================================================
   Nusava Creator Intelligence Platform — App Controller
   =========================================================

   CRUVA INTEGRATION POINT
   -----------------------
   When the Cruva API is available, the static DATA_* objects
   loaded from /data/*.js files can be replaced by live fetch
   calls. Pattern:

   async function fetchCruvaAgency(agencyId) {
     if (!CONFIG.CRUVA_API_KEY) {
       // fallback to static data (current behavior)
       return window['DATA_' + agencyId.toUpperCase()];
     }
     try {
       const resp = await fetch(
         CONFIG.CRUVA_BASE_URL + '/agency/' + agencyId + '/monthly-summary',
         { headers: { 'X-API-Key': CONFIG.CRUVA_API_KEY, 'Content-Type': 'application/json' } }
       );
       if (!resp.ok) throw new Error('Cruva API error: ' + resp.status);
       const data = await resp.json();
       // Map Cruva response shape to the DATA_* shape expected by Views.*
       return mapCruvaResponse(data);
     } catch (e) {
       console.warn('Cruva API unavailable, using static data:', e);
       return window['DATA_' + agencyId.toUpperCase()];
     }
   }

   Then call Views.agency.render(agencyId) after data is
   loaded, or trigger a global refresh when API key is set.
   ========================================================= */

(function () {

  /* ── State ── */
  var state = {
    view:         'executive',    // 'executive' | agency id
    timeRange:    'monthly',      // 'daily' | 'weekly' | 'monthly' | 'custom'
    grossMargin:  CONFIG.grossMargin,
    customFrom:   null,
    customTo:     null
  };

  /* ── Chart.js Global Defaults ── */
  function applyChartDefaults() {
    if (typeof Chart === 'undefined') {
      console.error('Chart.js not loaded');
      return;
    }
    Chart.defaults.font.family = "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";
    Chart.defaults.font.size   = 12;
    Chart.defaults.color       = '#64748b';
    Chart.defaults.plugins.legend.labels.boxWidth = 12;
    Chart.defaults.plugins.tooltip.backgroundColor = '#0f172a';
    Chart.defaults.plugins.tooltip.titleColor      = '#f8fafc';
    Chart.defaults.plugins.tooltip.bodyColor       = '#e2e8f0';
    Chart.defaults.plugins.tooltip.padding         = 10;
    Chart.defaults.plugins.tooltip.cornerRadius    = 8;
    Chart.defaults.animation.duration              = 300;
    Chart.defaults.devicePixelRatio               = window.devicePixelRatio || 2;
  }

  /* ── Build site header ── */
  function buildHeader() {
    var header = document.getElementById('site-header');
    if (!header) return;

    header.innerHTML =
      '<a class="logo" href="#" onclick="return false;">' +
        '<div class="logo-mark">N</div>' +
        '<div><div class="brand-name">Nusava</div><div class="brand-sub">Creator Intelligence</div></div>' +
      '</a>' +
      '<div class="header-spacer"></div>' +
      '<div class="gm-control">' +
        '<label for="gm-slider">Gross Margin</label>' +
        '<input type="range" id="gm-slider" min="10" max="80" step="1" value="' + Math.round(state.grossMargin * 100) + '">' +
        '<span class="gm-value" id="gm-value">' + Math.round(state.grossMargin * 100) + '%</span>' +
      '</div>';

    // Gross margin slider
    var slider = document.getElementById('gm-slider');
    var gmVal  = document.getElementById('gm-value');
    if (slider) {
      slider.addEventListener('input', function () {
        state.grossMargin  = parseInt(this.value) / 100;
        CONFIG.grossMargin = state.grossMargin;
        if (gmVal) gmVal.textContent = this.value + '%';
        rerender();
      });
    }
  }

  /* ── Build agency nav bar ── */
  function buildNav() {
    var nav = document.getElementById('agency-nav');
    if (!nav) return;

    var html = '<button class="nav-tab" data-view="executive">Executive</button>';

    CONFIG.agencies.forEach(function (ag) {
      html += '<button class="nav-tab" data-view="' + ag.id + '">' +
        '<span class="agency-dot" style="background:' + ag.color + '"></span>' +
        ag.short +
        '</button>';
    });

    // Separator + platform-wide tools
    html += '<div style="flex:1"></div>';
    html += '<button class="nav-tab" data-view="search">🔍 Search</button>';
    html += '<button class="nav-tab" data-view="affiliates">🤝 Affiliates</button>';
    html += '<button class="nav-tab" data-view="narrative">💡 Narratives</button>';
    html += '<button class="nav-tab" data-view="alerts">🔔 Alerts</button>';

    nav.innerHTML = html;

    nav.querySelectorAll('.nav-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.getAttribute('data-view');
        navigate(view);
      });
    });
  }

  /* ── Build time filter bar ── */
  function buildTimeFilter() {
    var bar = document.getElementById('time-filter');
    if (!bar) return;

    // Build month options for custom range picker
    var allMonthOpts = '';
    CONFIG.agencies.forEach(function (ag) {
      var raw = U.getAgencyData(ag.id);
      if (raw && raw.months) {
        raw.months.forEach(function (m, i) {
          var lbl = (m.label || ('M' + (i + 1))) + ' (' + ag.short + ')';
          allMonthOpts += '<option value="' + ag.id + '-' + (m.label || ('M' + (i + 1))) + '">' + lbl + '</option>';
        });
      }
    });

    bar.innerHTML =
      '<span class="tf-label">Period</span>' +
      '<button class="tf-btn" data-range="daily">Daily</button>' +
      '<button class="tf-btn" data-range="weekly">Weekly</button>' +
      '<button class="tf-btn active" data-range="monthly">Monthly</button>' +
      '<div class="tf-separator"></div>' +
      '<button class="tf-btn" data-range="custom">Custom Range</button>' +
      '<div id="custom-range-wrap" style="display:none" class="custom-range-picker">' +
        '<label>From:</label>' +
        '<select id="custom-from">' + allMonthOpts + '</select>' +
        '<label>To:</label>' +
        '<select id="custom-to">' + allMonthOpts + '</select>' +
        '<button class="btn btn-primary" id="apply-custom" style="padding:4px 12px;font-size:12px">Apply</button>' +
      '</div>';

    bar.querySelectorAll('.tf-btn[data-range]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var range = btn.getAttribute('data-range');
        state.timeRange = range;

        // Update active state
        bar.querySelectorAll('.tf-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var customWrap = document.getElementById('custom-range-wrap');
        if (customWrap) customWrap.style.display = range === 'custom' ? 'flex' : 'none';

        if (range !== 'custom') rerender();
      });
    });

    var applyBtn = document.getElementById('apply-custom');
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        var fromSel = document.getElementById('custom-from');
        var toSel   = document.getElementById('custom-to');
        state.customFrom = fromSel ? fromSel.value : null;
        state.customTo   = toSel   ? toSel.value   : null;
        rerender();
      });
    }
  }

  /* ── Navigate to a view ── */
  function navigate(view) {
    state.view = view;

    // Update nav active state
    document.querySelectorAll('.nav-tab').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    rerender();
  }

  /* ── Re-render current view ── */
  function rerender() {
    var main = document.getElementById('main-content');
    if (!main) return;

    // Kill all chart instances before re-render
    Object.keys(Charts.instances).forEach(function (id) { Charts.kill(id); });

    // Handle non-monthly time views with placeholder
    if (state.timeRange === 'daily' || state.timeRange === 'weekly') {
      renderTimePlaceholder(state.timeRange);
      return;
    }

    if (state.view === 'executive') {
      Views.executive.render();
    } else if (state.view === 'affiliates') {
      Views.affiliates.render();
    } else if (state.view === 'search') {
      Views.search.render();
    } else if (state.view === 'narrative') {
      Views.narrative.render();
    } else if (state.view === 'alerts') {
      Views.alerts.render();
    } else {
      Views.agency.render(state.view);
    }
  }

  /* ── Placeholder for daily/weekly ── */
  function renderTimePlaceholder(range) {
    var main = document.getElementById('main-content');
    if (!main) return;

    var label = range === 'daily' ? 'Daily' : 'Weekly';
    main.innerHTML =
      '<div class="placeholder-card" style="margin-top:60px">' +
        '<div class="ph-icon">📅</div>' +
        '<h3>' + label + ' View Requires Video-Level Data</h3>' +
        '<p>' +
          'Video-level daily data required. Export from TikTok Shop Creator Center, ' +
          'or connect the Cruva API in <code>js/config.js</code> to populate this view automatically.' +
        '</p>' +
        '<p style="margin-top:12px">Switch to <strong>Monthly</strong> to view current aggregated data.</p>' +
      '</div>';
  }

  /* ── Initialise the application ── */
  function init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    applyChartDefaults();
    buildHeader();
    buildNav();
    buildTimeFilter();

    // Default view: Executive
    navigate('executive');
  }

  init();

})();
