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
  // 2026-05 simplification: dropped Daily / Monthly. The dashboard operates on
  // weekly cadence (Mon–Sun) only. Custom range picks specific weekly buckets
  // from window.SAMPLING.weeks (Mar 2 – May 3, 2026 currently).
  var state = {
    view:         'executive',
    timeRange:    'latest',       // 'latest' | 'custom'
    grossMargin:  CONFIG.grossMargin,
    customFrom:   null,            // ISO start date (Mon)
    customTo:     null             // ISO end date (Sun)
  };

  // Expose app-level state to other view modules so they can react to time-range
  // changes (e.g. the Sampling tab picks the active week from this).
  window._appState = state;

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

  /* ── Build time filter bar ──
     Simplified to weekly-only. "Latest" = most recent reporting week (default).
     "Custom" lets the user pick any weekly bucket (Mon–Sun) we have data for.
     The list of available weeks is derived from window.SAMPLING.weeks since
     that's the single dataset that spans the full Mar 2 – May 3 range. */
  function buildTimeFilter() {
    var bar = document.getElementById('time-filter');
    if (!bar) return;

    var weeks = (window.SAMPLING && window.SAMPLING.weeks) ? window.SAMPLING.weeks : [];
    var latest = weeks.length ? weeks[weeks.length - 1] : null;

    var weekOpts = weeks.map(function (w) {
      return '<option value="' + w.start + '">' + w.label + '  (' + w.start + ' – ' + w.end + ')</option>';
    }).join('');

    bar.innerHTML =
      '<span class="tf-label">Period</span>' +
      '<button class="tf-btn ' + (state.timeRange === 'latest' ? 'active' : '') + '" data-range="latest">' +
        'Latest week' + (latest ? ' · ' + latest.label : '') +
      '</button>' +
      '<div class="tf-separator"></div>' +
      '<button class="tf-btn ' + (state.timeRange === 'custom' ? 'active' : '') + '" data-range="custom">Custom week</button>' +
      '<div id="custom-range-wrap" style="display:' + (state.timeRange === 'custom' ? 'flex' : 'none') + '" class="custom-range-picker">' +
        '<label>From:</label>' +
        '<select id="custom-from">' + weekOpts + '</select>' +
        '<label>To:</label>' +
        '<select id="custom-to">' + weekOpts + '</select>' +
        '<button class="btn btn-primary" id="apply-custom" style="padding:4px 12px;font-size:12px">Apply</button>' +
      '</div>';

    bar.querySelectorAll('.tf-btn[data-range]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var range = btn.getAttribute('data-range');
        state.timeRange = range;
        bar.querySelectorAll('.tf-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var customWrap = document.getElementById('custom-range-wrap');
        if (customWrap) customWrap.style.display = range === 'custom' ? 'flex' : 'none';
        if (range === 'latest') {
          state.customFrom = null;
          state.customTo = null;
          rerender();
        }
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

    // Time range is weekly-only post-2026-05 (Latest or Custom). The active
    // view dictates the surface; the time range only changes which week's
    // data each surface reads from.
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

  /* (Removed: daily/monthly placeholders — dashboard is weekly-only post-2026-05.) */

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
