/* =========================================================
   Nusava Creator Intelligence Platform — TikTok Forecasting
   ---------------------------------------------------------
   Sub-tab router for the comprehensive TikTok forecasting +
   inventory + profitability dashboard. Each sub-tab calls
   the corresponding tiktok_<name> view registered by:
     js/views/tiktok_weekly_summary.js
     js/views/tiktok_sku_breakdown.js
     js/views/tiktok_forecast.js
     js/views/tiktok_scenarios.js
     js/views/tiktok_profitability.js
     js/views/tiktok_q2_profit.js
     js/views/tiktok_action_plan.js
     js/views/tiktok_insights.js
   Each sub-view accepts (root, data) where data = window.DASHBOARD_DATA.

   This view is independent of weekly.js (which surfaces the
   platform's Video Leaderboard / Creator Leaderboard / etc.).
   Both coexist as separate top-nav entries.
   ========================================================= */

(function () {

  var SUB_TABS = [
    { id: 'weekly_summary',  label: 'Weekly Summary',     view: 'tiktok_weekly_summary' },
    { id: 'sku_breakdown',   label: 'SKU Breakdown',      view: 'tiktok_sku_breakdown' },
    { id: 'forecast',        label: 'GMV & DSR Forecast', view: 'tiktok_forecast' },
    { id: 'scenarios',       label: 'Q2 Scenarios',       view: 'tiktok_scenarios' },
    { id: 'profitability',   label: 'Profitability',      view: 'tiktok_profitability' },
    { id: 'q2_profit',       label: 'Q2 Profit Matrix',   view: 'tiktok_q2_profit' },
    { id: 'action_plan',     label: 'Action Plan',        view: 'tiktok_action_plan' },
    { id: 'insights',        label: 'Insights',           view: 'tiktok_insights' }
  ];

  var state = { activeSubTab: 'weekly_summary' };

  function render() {
    var main = document.getElementById('main-content');
    if (!main) return;

    var data = window.DASHBOARD_DATA;
    if (!data) {
      main.innerHTML = '<div class="empty-state">' +
        '<div class="empty-state-icon">⚠</div>' +
        '<h3>TikTok forecasting data not loaded</h3>' +
        '<p>Re-run <code>/weekly-tiktok-dashboard</code> to regenerate <code>data/dashboard.js</code>.</p>' +
        '</div>';
      return;
    }

    var meta = data.meta || {};
    var subTabHtml = '';
    SUB_TABS.forEach(function (t) {
      var cls = 'sub-tab' + (t.id === state.activeSubTab ? ' active' : '');
      subTabHtml += '<button class="' + cls + '" data-subtab="' + t.id + '">' +
        escapeHtml(t.label) + '</button>';
    });

    main.innerHTML =
      '<div class="page-title">' +
        '<h1>TikTok Forecasting</h1>' +
        '<div class="subtitle">' +
          'Week ' + escapeHtml(meta.week_label || '?') + ' &middot; ' +
          escapeHtml(meta.week_period || '?') +
          (meta.is_partial_week ? ' &middot; <span style="color:var(--orange)">&#9889; partial week</span>' : '') +
          (meta.generated_at ? ' &middot; Generated ' + new Date(meta.generated_at).toLocaleString() : '') +
        '</div>' +
      '</div>' +
      '<div class="sub-tab-bar">' + subTabHtml + '</div>' +
      '<div id="tiktok-subview"></div>';

    main.querySelectorAll('.sub-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.activeSubTab = btn.getAttribute('data-subtab');
        render();
      });
    });

    renderActiveSubView(data);
  }

  function renderActiveSubView(data) {
    var sub = SUB_TABS.find(function (t) { return t.id === state.activeSubTab; });
    if (!sub) return;
    var host = document.getElementById('tiktok-subview');
    if (!host) return;
    var view = (window.Views || {})[sub.view];
    if (!view || !view.render) {
      host.innerHTML = '<div class="empty-state"><h3>Sub-view "' + sub.id + '" not loaded</h3>' +
        '<p>Expected <code>window.Views.' + sub.view + '</code> to be registered. ' +
        'Check that <code>js/views/' + sub.view + '.js</code> is loaded in index.html.</p></div>';
      return;
    }
    try {
      view.render(host, data);
    } catch (err) {
      console.error('Sub-view render error:', err);
      host.innerHTML = '<div class="empty-state"><h3>Error rendering ' + sub.id + '</h3>' +
        '<pre style="text-align:left;max-width:600px;margin:0 auto;white-space:pre-wrap;color:var(--red)">' +
        escapeHtml(err && err.stack ? err.stack : String(err)) +
        '</pre></div>';
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.Views = window.Views || {};
  window.Views.tiktok = { render: render };

})();
