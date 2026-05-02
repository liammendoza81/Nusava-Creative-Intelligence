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
    Chart.defaults.font.family = "'Fira Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    Chart.defaults.font.size   = 12;
    Chart.defaults.color       = '#8C9091';                /* brand neutral */
    Chart.defaults.plugins.legend.labels.boxWidth = 12;
    Chart.defaults.plugins.tooltip.backgroundColor = '#222222'; /* brand charcoal */
    Chart.defaults.plugins.tooltip.titleColor      = '#FFFFFF';
    Chart.defaults.plugins.tooltip.bodyColor       = '#E8E8E4';
    Chart.defaults.plugins.tooltip.padding         = 10;
    Chart.defaults.plugins.tooltip.cornerRadius    = 8;
    Chart.defaults.animation.duration              = 300;
    Chart.defaults.devicePixelRatio               = window.devicePixelRatio || 2;
  }

  /* ── Build site header ── */
  function buildHeader() {
    var header = document.getElementById('site-header');
    if (!header) return;

    // Wordmark on charcoal header — clean, no controls. The GM slider was
    // only meaningful for forecasting/CM views and has been removed with
    // the forecasting section.
    header.innerHTML =
      '<a class="logo" href="#" onclick="return false;" aria-label="Nusava">' +
        '<img class="logo-wordmark" src="assets/nusava-wordmark-white.svg" alt="nusava">' +
        '<span class="logo-divider" aria-hidden="true"></span>' +
        '<span class="brand-sub">Creator Intelligence</span>' +
      '</a>' +
      '<div class="header-spacer"></div>';
  }

  /* ── Build agency nav bar ── */
  function buildNav() {
    var nav = document.getElementById('agency-nav');
    if (!nav) return;

    // Top-level nav (rationalized 2026-05). 4 entries — affiliate engine, narratives, alerts.
    // Forecasting was removed; it lives in a separate project. Search functionality
    // moved into per-tab search bars on Creators + Videos in Affiliate Performance.
    var html = '<button class="nav-tab" data-view="executive">Executive</button>';
    html += '<button class="nav-tab" data-view="affiliate_performance">Affiliate Performance</button>';
    html += '<div style="flex:1"></div>';
    html += '<button class="nav-tab" data-view="narrative">Narratives</button>';
    html += '<button class="nav-tab" data-view="alerts">Alerts</button>';

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

    // Weekly time-range jumps straight into the affiliate engine.
    if (state.timeRange === 'weekly') {
      Views.affiliate_performance.render();
      return;
    }
    // Daily surfaces the placeholder (no daily-level data wired yet)
    if (state.timeRange === 'daily') {
      renderTimePlaceholder(state.timeRange);
      return;
    }

    if (state.view === 'executive') {
      Views.executive.render();
    } else if (state.view === 'affiliate_performance') {
      Views.affiliate_performance.render();
    } else if (state.view === 'narrative') {
      Views.narrative.render();
    } else if (state.view === 'alerts') {
      Views.alerts.render();
    } else {
      // Legacy URL / deep link → fall through to Affiliate Performance.
      Views.affiliate_performance.render();
    }
  }

  /* ── Placeholder for daily/weekly ── */
  function renderTimePlaceholder(range) {
    var main = document.getElementById('main-content');
    if (!main) return;

    var label = range === 'daily' ? 'Daily' : 'Weekly';
    main.innerHTML =
      '<div class="placeholder-card" style="margin-top:60px">' +
        '<h3>' + label + ' view requires video-level data</h3>' +
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
