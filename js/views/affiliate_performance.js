/* =========================================================
   Nusava — Affiliate Performance
   ---------------------------------------------------------
   The single TikTok-affiliate-engine view. Unifies what used
   to be three separate top-nav entries (per-agency drilldown,
   "Affiliates" prospecting, "TikTok Performance") into one
   coherent surface with:

     • Sticky filter bar     — Source pills + Search
     • 4 sub-tabs            — Summary | Creators | Videos | Diagnostics

   Source pill values (active filter is shared across sub-tabs):
     • all         — all TikTok creators (default)
     • creatify, thc, elle, internal — paid agency rosters
     • unattributed — open + target collabs (organic affiliates)

   Most section content is rendered by the existing weekly.js
   helpers via Views.weekly.renderSectionInto(sectionId, container).
   The Diagnostics tab is built here from scratch — it answers
   "What changed this week and why?" via WoW driver decomposition.
   ========================================================= */

(function () {

  var SOURCE_OPTS = [
    { id: 'all',          label: 'All affiliates' },
    { id: 'creatify',     label: 'Creatify',      color: '#0284c7' },
    { id: 'thc',          label: 'THC',           color: '#8b5cf6' },
    { id: 'elle',         label: 'Elle Media',    color: '#f97316' },
    { id: 'internal',     label: 'Internal',      color: '#10b981' },
    { id: 'unattributed', label: 'Open / Target', color: '#8C9091' }
  ];

  var TABS = [
    { id: 'summary',     label: 'Summary' },
    { id: 'creators',    label: 'Creators' },
    { id: 'videos',      label: 'Videos' },
    { id: 'sampling',    label: 'Sampling' },
    { id: 'diagnostics', label: 'Diagnostics' }
    // Economics intentionally omitted — channel-level profit/CM lives in the
    // separate TikTok performance dashboard alongside Forecasting.
  ];

  var state = {
    tab: 'summary', source: 'all', search: '',
    // Per-section pagination (10 per page). Reset to 0 on source/search change.
    videoPage: 0, creatorPage: 0,
    newPage: 0, legacyPage: 0, declinePage: 0
  };
  var PAGE_SIZE = 10;

  /* ── Entry point ── */
  function render() {
    var main = document.getElementById('main-content');
    if (!main) return;

    var D = window.DATA_WEEKLY;
    if (!D) {
      main.innerHTML = '<div class="placeholder-card" style="margin-top:60px">' +
        '<h3>Weekly TikTok data not loaded</h3>' +
        '<p>Re-run the weekly pipeline to regenerate <code>data/weekly-tiktok.js</code>, then reload.</p>' +
        '</div>';
      return;
    }

    main.innerHTML =
      buildPageTitle(D) +
      buildFilterBar(D) +
      buildTabBar() +
      '<div id="ap-body"></div>';

    bindFilterBar();
    bindTabBar();
    renderActiveTab();
  }

  /* ── Page title ── */
  function buildPageTitle(D) {
    return '<div class="page-title">' +
      '<h1>Affiliate Performance</h1>' +
      '<div class="subtitle">' +
        'TikTok affiliate engine — agency contracts + open/target collabs. ' +
        'Week of ' + escapeHtml(D.label || '?') +
        ' &nbsp;·&nbsp; Generated ' + escapeHtml(D.generated_at || '') +
      '</div></div>';
  }

  /* ── Sticky filter bar (Source pills + Search) ── */
  function buildFilterBar(D) {
    var pills = SOURCE_OPTS.map(function (s) {
      var n = countBySource(D, s.id);
      var dot = s.color ? '<span class="agency-dot" style="background:' + s.color + ';margin-right:6px"></span>' : '';
      return '<button class="filter-chip ' + (state.source === s.id ? 'active' : '') + '" ' +
        'data-source="' + s.id + '">' + dot + escapeHtml(s.label) + ' <span style="opacity:.6">(' + n + ')</span></button>';
    }).join('');

    return '<div class="ap-filter-bar">' +
      '<div class="ap-filter-label">Source</div>' +
      '<div class="filter-chips">' + pills + '</div>' +
      '<div class="ap-filter-spacer"></div>' +
      '<div class="search-wrap" style="min-width:240px">' +
        '<input type="text" class="search-bar" id="ap-search" ' +
          'placeholder="Search creator handle, video, or SKU…" ' +
          'value="' + escapeHtml(state.search) + '">' +
      '</div>' +
    '</div>';
  }

  function countBySource(D, sourceId) {
    if (sourceId === 'all') return (D.creators || []).length;
    return (D.creators || []).filter(function (c) {
      return (c.agency || 'unattributed') === sourceId;
    }).length;
  }

  /* ── 4-tab nav ── */
  function buildTabBar() {
    return '<div class="ap-tab-bar">' +
      TABS.map(function (t) {
        return '<button class="ap-tab ' + (state.tab === t.id ? 'active' : '') + '" ' +
          'data-tab="' + t.id + '">' + escapeHtml(t.label) + '</button>';
      }).join('') +
    '</div>';
  }

  /* ── Wire interactions ── */
  function bindFilterBar() {
    document.querySelectorAll('.ap-filter-bar .filter-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.source = btn.getAttribute('data-source');
        resetPagination();
        if (window.Views.weekly && window.Views.weekly.setSource) {
          window.Views.weekly.setSource(state.source);
        }
        render();
      });
    });
    var searchEl = document.getElementById('ap-search');
    if (searchEl) {
      var t;
      searchEl.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          state.search = searchEl.value || '';
          resetPagination();
          if (window.Views.weekly && window.Views.weekly.setSearch) {
            window.Views.weekly.setSearch(state.search);
          }
          renderActiveTab();
        }, 200);
      });
    }
  }

  function resetPagination() {
    state.videoPage = 0; state.creatorPage = 0;
    state.newPage = 0; state.legacyPage = 0; state.declinePage = 0;
  }

  function bindTabBar() {
    document.querySelectorAll('.ap-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.ap-tab').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-tab') === state.tab);
        });
        renderActiveTab();
      });
    });
  }

  /* ── Active tab dispatcher ── */
  function renderActiveTab() {
    var body = document.getElementById('ap-body');
    if (!body) return;

    // Pre-set the source filter on weekly.js so all delegated sections
    // honor the active source.
    if (window.Views.weekly && window.Views.weekly.setSource) {
      window.Views.weekly.setSource(state.source);
    }

    switch (state.tab) {
      case 'summary':     return renderSummary(body);
      case 'creators':    return renderCreators(body);
      case 'videos':      return renderVideos(body);
      case 'sampling':    return renderSampling(body);
      case 'diagnostics': return renderDiagnostics(body);
    }
  }

  /* ───────────────────────────────────────────────────
     Tab 1 — SUMMARY
     KPI strip + Agency Scorecard + Movers
     ─────────────────────────────────────────────────── */
  function renderSummary(host) {
    var hostId = host.id;
    host.innerHTML =
      '<div id="ap-summary-section"></div>' +
      '<div class="section-header" style="margin-top:32px"><span class="section-title">Age Cohorts</span>' +
        '<span class="section-meta">Distribution of weekly GMV by video age</span></div>' +
      '<div id="ap-summary-cohorts"></div>' +
      '<div id="ap-summary-sampling"></div>';

    // Render the weekly Summary KPI strip via weekly.js
    var section = document.getElementById('ap-summary-section');
    section.id = 'main-content';
    host.id = 'ap-host-shell';
    try {
      window.Views.weekly.renderSectionInto('summary', section);
    } finally {
      section.id = 'ap-summary-section';
      host.id = hostId;
    }

    // Age Cohorts panel — gives a fast read of where weekly GMV is concentrated by video age.
    renderAgeCohorts(document.getElementById('ap-summary-cohorts'));

    // Sampling top view — quick read of this week's sample-program activity
    // with a deep-link to the full Sampling tab.
    renderSamplingTop(document.getElementById('ap-summary-sampling'));

    // When a specific agency is filtered, append a per-agency monthly
    // context card so weekly TikTok data is grounded in contract context.
    if (state.source !== 'all' && state.source !== 'unattributed') {
      appendAgencyMonthlyContext(host, state.source);
    }
  }

  // Sampling top view for the Summary tab. Compact 4-card strip + deep-link.
  function renderSamplingTop(host) {
    if (!host) return;
    var sampling = window.SAMPLING;
    if (!sampling || !sampling.weeks || !sampling.weeks.length) {
      host.innerHTML = '';
      return;
    }
    var week = pickSamplingWeek(sampling);
    if (!week || !week.core) {
      // Selected week has no sampling data — show a quiet notice with a link
      // to the latest sampling week so the user knows what's available.
      var picked = (window._appState || {});
      var pickedLabel = picked.customFrom || '';
      var latestSampling = sampling.weeks[sampling.weeks.length - 1];
      host.innerHTML =
        '<div class="section-header" style="margin-top:32px">' +
          '<span class="section-title">Sampling</span>' +
          '<span class="section-meta">No sampling data' + (pickedLabel ? ' for ' + escapeHtml(pickedLabel) : '') +
            ' &nbsp;·&nbsp; <a href="#" data-ap-tab="sampling" style="color:var(--brand-green);font-weight:600">Latest available: ' + escapeHtml(latestSampling.label) + ' →</a></span></div>';
      var deepLinkBtn = host.querySelector('[data-ap-tab]');
      if (deepLinkBtn) {
        deepLinkBtn.addEventListener('click', function (e) {
          e.preventDefault();
          state.tab = 'sampling';
          render();
        });
      }
      return;
    }
    var c = week.core;

    // Posting rate = creators with samples shipped & at least one video posted
    // (we approximate from by_creator: posting_rate = videos_with_samples / samples_shipped per creator)
    var creators = (week.by_creator || []).filter(function (r) { return (r.samples_shipped || 0) > 0; });
    var creatorsActivated = creators.filter(function (r) { return (r.videos_with_samples || 0) > 0; }).length;
    var activationRate = creators.length > 0 ? (creatorsActivated / creators.length * 100) : 0;

    host.innerHTML =
      '<div class="section-header" style="margin-top:32px">' +
        '<span class="section-title">Sampling</span>' +
        '<span class="section-meta">Week of ' + escapeHtml(week.label) +
          ' &nbsp;·&nbsp; <a href="#" data-ap-tab="sampling" style="color:var(--brand-green);font-weight:600">Full Sampling tab →</a></span></div>' +
      '<div class="kpi-grid">' +
        kpiCard('Samples Shipped',
          (c.samples_shipped || 0).toLocaleString(),
          'Drives next 7–14 days of fresh content', 'green') +
        kpiCard('Content Generated',
          (c.content_count || 0).toLocaleString() + ' videos',
          'From this week\'s sample wave', 'green') +
        kpiCard('Sampling-Driven GMV',
          '$' + Math.round(c.content_gmv || 0).toLocaleString(),
          'GMV from sampled content', 'green') +
        kpiCard('Activation Rate',
          activationRate.toFixed(2) + '%',
          creatorsActivated + ' of ' + creators.length + ' shipped creators posted',
          activationRate >= 60 ? 'green' : activationRate >= 40 ? 'yellow' : 'red') +
      '</div>';

    // Wire deep-link to switch active sub-tab
    var deepLinkBtn = host.querySelector('[data-ap-tab]');
    if (deepLinkBtn) {
      deepLinkBtn.addEventListener('click', function (e) {
        e.preventDefault();
        state.tab = 'sampling';
        render();
      });
    }
  }

  // 2026-05 weekly-mode: per-agency context shows weekly performance from
  // DATA_WEEKLY.agencyRollup + a weekly fee proxy (monthly contract ÷ 4).
  // Old monthly-contract drilldown is dropped per Liam's direction.
  function appendAgencyMonthlyContext(host, agencyId) {
    var D = window.DATA_WEEKLY;
    if (!D || !D.agencyRollup) return;
    var weekly = D.agencyRollup.find(function (r) { return r.Agency === agencyId; });
    if (!weekly) return;
    var agCfg = U.getAgencyConfig(agencyId);

    // Weekly fee proxy: monthly cost (fees + samples) ÷ 4.
    // Pull the latest monthly entry from the agency data file as the source.
    var raw = U.getAgencyData(agencyId);
    var weeklyFeeProxy = null, monthlySource = null;
    if (raw && raw.months && raw.months.length) {
      var months = U.enrichAll(raw);
      monthlySource = months[months.length - 1];
      weeklyFeeProxy = (monthlySource.totalCost || 0) / 4;
    }

    // Weekly ROAS proxy
    var weeklyROAS = (weeklyFeeProxy && weeklyFeeProxy > 0) ? (weekly.gmv || 0) / weeklyFeeProxy : null;
    var breakEven = U.getBreakEven();

    var wowDir = (weekly.wow_dollar || 0) >= 0 ? 'green' : 'red';
    var wowSign = (weekly.wow_dollar || 0) >= 0 ? '+' : '−';
    var wowSub = weekly.wow_pct != null
      ? wowSign + '$' + Math.abs(Math.round(weekly.wow_dollar || 0)).toLocaleString() +
        ' (' + (weekly.wow_pct >= 0 ? '+' : '') + weekly.wow_pct.toFixed(2) + '% WoW)'
      : 'baseline';

    var ctx = document.createElement('div');
    ctx.style.marginTop = '24px';
    ctx.innerHTML =
      '<div class="section-header"><span class="section-title">Weekly Performance · ' + escapeHtml(agCfg.short) + '</span>' +
        '<span class="section-meta">Week of ' + escapeHtml(D.label || '?') + '</span></div>' +
      '<div class="kpi-grid">' +
        kpiCard('Weekly GMV',
          '$' + Math.round(weekly.gmv || 0).toLocaleString(),
          wowSub, wowDir) +
        kpiCard('Weekly ROAS (proxy)',
          weeklyROAS != null ? U.fmtX(weeklyROAS) : '—',
          weeklyFeeProxy != null
            ? 'GMV ÷ $' + Math.round(weeklyFeeProxy).toLocaleString() + '/wk fee proxy (monthly ÷ 4)'
            : 'No monthly fee data',
          weeklyROAS != null && weeklyROAS >= breakEven ? 'green' : 'red') +
        kpiCard('Selling Creators',
          (weekly.creators || 0).toLocaleString(),
          (weekly.roster_size || 0) + ' on roster', 'orange') +
        kpiCard('Selling Videos',
          (weekly.selling_videos || 0).toLocaleString(),
          'New ≤14d: ' + (weekly.new_videos || 0) + ' · Legacy >30d: ' + (weekly.legacy_videos || 0),
          'green') +
      '</div>' +
      (monthlySource
        ? '<div class="info-notice" style="margin-top:-8px;font-size:11px">' +
          'Weekly fee proxy is monthly ' + escapeHtml(monthlySource.label || '') + ' cost ($' +
          Math.round(monthlySource.totalCost || 0).toLocaleString() + ') ÷ 4. ' +
          'Updates each Monday refresh.</div>'
        : '');
    host.appendChild(ctx);
  }

  /* (Removed: computeContractPacing — monthly contract pacing dropped per
     the 2026-05 weekly-mode pivot. Per-agency drilldown now reads from
     DATA_WEEKLY.agencyRollup with a weekly fee proxy (monthly cost ÷ 4). */
  function _removed_computeContractPacing() {
    return { label: '—', detail: '', color: 'gray' };
  }

  /* ───────────────────────────────────────────────────
     Tab 2 — CREATORS
     ─────────────────────────────────────────────────── */
  function renderCreators(host) {
    // Layout (each block has its own section header):
    //   1. Highlights        — 5 KPI cards (incl. "New in Top 15")
    //   2. Agency Split       — when source = all
    //   3. Creator Leaderboard — paginated 10/page
    //   4. Legend
    host.innerHTML =
      '<div class="section-header"><span class="section-title">Highlights</span></div>' +
      '<div id="ap-creators-highlights"></div>' +

      '<div id="ap-creators-extras" style="margin-top:32px"></div>' +

      '<div class="section-header" style="margin-top:32px"><span class="section-title">Creator Leaderboard</span>' +
        '<span class="section-meta">All creators in the active source filter · 10 per page</span></div>' +
      '<div id="ap-creators-leaderboard"></div>' +

      '<div class="kpi-legend" style="margin-top:24px">' +
        '<div class="kpi-legend-title">What this view shows</div>' +
        '<dl>' +
          '<dt>Selling Creators</dt><dd>Distinct creators with ≥ 1 selling video this week, against the total tracked in the active source filter.</dd>' +
          '<dt>Top-5 Concentration</dt><dd>Share of weekly GMV from the top 5 creators. Above 60% = high concentration risk.</dd>' +
          '<dt>Median GMV / Creator</dt><dd>Median is robust to outliers; mean (in subtitle) is responsive to top-end performance.</dd>' +
          '<dt>New in Top 15</dt><dd>Creators ranked in this week\'s top 15 by GMV who produced zero GMV last week — fresh entrants to the leaderboard.</dd>' +
          '<dt>Top Creator</dt><dd>Highest single-creator GMV this week, in the active source filter.</dd>' +
          '<dt>Agency Split</dt><dd>How weekly GMV breaks down across paid agencies vs open / target collabs.</dd>' +
          '<dt>Leaderboard</dt><dd>Full creator ranking by weekly GMV. Status is computed from prior-week comparison and lifetime activity.</dd>' +
        '</dl></div>';

    renderCreatorHighlights(document.getElementById('ap-creators-highlights'));
    renderCreatorExtras(document.getElementById('ap-creators-extras'));
    renderCreatorLeaderboard(document.getElementById('ap-creators-leaderboard'));
  }

  // Highlight strip — 5 KPI cards at the top of the Creators tab.
  function renderCreatorHighlights(host) {
    var D = window.DATA_WEEKLY;
    if (!D || !D.creators) { host.innerHTML = ''; return; }
    var visible = filterBySource(D.creators, state.source);
    if (state.search) visible = applySearch(visible, state.search);

    var totalGMV = visible.reduce(function (s, c) { return s + (c.gmv || 0); }, 0);
    var sorted   = visible.slice().sort(function (a, b) { return (b.gmv || 0) - (a.gmv || 0); });
    var top5GMV  = sorted.slice(0, 5).reduce(function (s, c) { return s + (c.gmv || 0); }, 0);
    var top5Share = totalGMV > 0 ? (top5GMV / totalGMV * 100) : 0;
    var selling  = visible.filter(function (c) { return (c.gmv || 0) > 0; });
    var meanGMV  = selling.length > 0 ? totalGMV / selling.length : 0;
    var medianGMV = (function () {
      if (!selling.length) return 0;
      var arr = selling.map(function (c) { return c.gmv; }).sort(function (a, b) { return a - b; });
      var mid = Math.floor(arr.length / 2);
      return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    })();
    var top = sorted[0];

    // New in Top 15: creators in this week's top 15 who had zero prior_gmv.
    var top15 = sorted.slice(0, 15);
    var newInTop15 = top15.filter(function (c) { return (c.prior_gmv || 0) === 0 && (c.gmv || 0) > 0; });

    host.innerHTML = '<div class="kpi-grid">' +
      kpiCard('Selling Creators', selling.length.toLocaleString(),
        'of ' + visible.length.toLocaleString() + ' tracked in source filter', 'green') +
      kpiCard('Top-5 Concentration', top5Share.toFixed(2) + '%',
        'GMV from the top 5 creators',
        top5Share >= 60 ? 'red' : top5Share >= 45 ? 'yellow' : 'green') +
      kpiCard('Median GMV / Creator', '$' + Math.round(medianGMV).toLocaleString(),
        'Mean: $' + Math.round(meanGMV).toLocaleString() + ' · selling creators only', 'green') +
      kpiCard('New in Top 15',
        newInTop15.length.toString(),
        newInTop15.length > 0 ? newInTop15.slice(0, 3).map(function (c) { return '@' + c.creator; }).join(', ') + (newInTop15.length > 3 ? ' +' + (newInTop15.length - 3) : '') : 'No new entrants this week',
        newInTop15.length >= 3 ? 'green' : newInTop15.length >= 1 ? 'orange' : 'gray') +
      kpiCard('Top Creator',
        top ? '$' + Math.round(top.gmv).toLocaleString() : '—',
        top ? '@' + top.creator : '', 'orange') +
    '</div>';
  }

  // Paginated creator leaderboard — 10 per page.
  function renderCreatorLeaderboard(host) {
    var D = window.DATA_WEEKLY;
    if (!D || !D.creators) { host.innerHTML = ''; return; }

    var visible = filterBySource(D.creators, state.source);
    if (state.search) visible = applySearch(visible, state.search);
    visible = visible.slice().sort(function (a, b) { return (b.gmv || 0) - (a.gmv || 0); });

    var totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    if (state.creatorPage >= totalPages) state.creatorPage = 0;

    var pageRows = visible.slice(state.creatorPage * PAGE_SIZE, (state.creatorPage + 1) * PAGE_SIZE);
    var startRank = state.creatorPage * PAGE_SIZE + 1;

    var html = '<div class="table-card"><div class="table-scroll"><table class="data-table">' +
      '<thead><tr>' +
        '<th style="text-align:left">#</th>' +
        '<th style="text-align:left">Creator</th>' +
        '<th style="text-align:left">Source</th>' +
        '<th style="text-align:left">Status</th>' +
        '<th>This Week GMV</th>' +
        '<th>Prior Week GMV</th>' +
        '<th>Δ $</th>' +
        '<th>Orders</th>' +
        '<th>Videos</th>' +
        '<th>Followers</th>' +
      '</tr></thead><tbody>';
    if (!pageRows.length) {
      html += '<tr><td colspan="10" style="text-align:center;color:var(--gray-500)">No creators in this slice.</td></tr>';
    }
    pageRows.forEach(function (c, i) {
      var meta = SOURCE_OPTS.find(function (o) { return o.id === (c.agency || 'unattributed'); }) || { label: 'Unattributed', color: '#8C9091' };
      var delta = (c.gmv || 0) - (c.prior_gmv || 0);
      var sign = delta >= 0 ? '+' : '−';
      var cls = delta >= 0 ? 'text-green' : 'text-red';
      html += '<tr>' +
        '<td style="text-align:left">' + (startRank + i) + '</td>' +
        '<td style="text-align:left">@' + escapeHtml(c.creator || '?') + '</td>' +
        '<td style="text-align:left"><span class="agency-dot" style="background:' + meta.color + ';margin-right:6px"></span>' + escapeHtml(meta.label) + '</td>' +
        '<td style="text-align:left">' + escapeHtml(c.status || '—') + '</td>' +
        '<td><strong>$' + Math.round(c.gmv || 0).toLocaleString() + '</strong></td>' +
        '<td>$' + Math.round(c.prior_gmv || 0).toLocaleString() + '</td>' +
        '<td><span class="' + cls + '">' + sign + '$' + Math.abs(Math.round(delta)).toLocaleString() + '</span></td>' +
        '<td>' + (c.orders || 0).toLocaleString() + '</td>' +
        '<td>' + (c.videos || 0).toLocaleString() + '</td>' +
        '<td>' + (c.followers || 0).toLocaleString() + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div></div>';
    html += buildPager('creator', state.creatorPage, totalPages, visible.length);
    host.innerHTML = html;

    host.querySelectorAll('[data-cpage]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.creatorPage = parseInt(btn.getAttribute('data-cpage'), 10);
        renderCreatorLeaderboard(host);
      });
    });
  }

  // Agency split table (only meaningful when source = all). Highlight cards
  // moved out into renderCreatorHighlights and rendered above this block.
  function renderCreatorExtras(host) {
    var D = window.DATA_WEEKLY;
    if (!D || !D.creators) { host.innerHTML = ''; return; }
    if (state.source !== 'all') { host.innerHTML = ''; return; }

    var visible = filterBySource(D.creators, state.source);
    if (state.search) visible = applySearch(visible, state.search);

    var totalGMV  = visible.reduce(function (s, c) { return s + (c.gmv || 0); }, 0);

    var bySource = {};
    visible.forEach(function (c) {
      var s = c.agency || 'unattributed';
      if (!bySource[s]) bySource[s] = { gmv: 0, creators: 0, performing: 0 };
      bySource[s].gmv += (c.gmv || 0);
      bySource[s].creators += 1;
      if ((c.gmv || 0) > 0) bySource[s].performing += 1;
    });
    var rows = Object.keys(bySource).map(function (k) {
      var meta = SOURCE_OPTS.find(function (o) { return o.id === k; }) || { label: k, color: '#8C9091' };
      return { id: k, label: meta.label, color: meta.color, agg: bySource[k] };
    }).sort(function (a, b) { return b.agg.gmv - a.agg.gmv; });

    var html = '<div class="section-header"><span class="section-title">Agency Split</span></div>' +
      '<div class="table-card"><div class="table-scroll"><table class="data-table">' +
      '<thead><tr><th style="text-align:left">Source</th><th>GMV</th><th>Share</th><th>Active Creators</th><th>Performing</th><th>Performing Rate</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      var share = totalGMV > 0 ? (r.agg.gmv / totalGMV * 100).toFixed(2) + '%' : '—';
      var perfRate = r.agg.creators > 0 ? (r.agg.performing / r.agg.creators * 100).toFixed(2) + '%' : '—';
      html += '<tr>' +
        '<td style="text-align:left"><span class="agency-dot" style="background:' + r.color + ';margin-right:8px"></span>' + escapeHtml(r.label) + '</td>' +
        '<td>$' + Math.round(r.agg.gmv).toLocaleString() + '</td>' +
        '<td>' + share + '</td>' +
        '<td>' + r.agg.creators + '</td>' +
        '<td>' + r.agg.performing + '</td>' +
        '<td>' + perfRate + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div></div>';
    host.innerHTML = html;
  }

  /* ───────────────────────────────────────────────────
     Tab 3 — VIDEOS
     Leaderboard + Velocity per SKU + Age cohorts
     ─────────────────────────────────────────────────── */
  function renderVideos(host) {
    // Layout (each block has its own section header):
    //   1. Highlights         — 6 KPI cards
    //   2. Videos per SKU      — table (from window.SKU_VIDEOS)
    //   3. Age Cohorts          — KPI cards
    //   4. Top Videos           — paginated leaderboard (10/page)
    //   5. New / Legacy / Declining — drill-down sections
    host.innerHTML =
      '<div class="section-header"><span class="section-title">Highlights</span></div>' +
      '<div id="ap-video-highlights"></div>' +

      '<div class="section-header" style="margin-top:32px"><span class="section-title">Videos per SKU</span>' +
        '<span class="section-meta">Cumulative across reporting period · from subscription dashboard</span></div>' +
      '<div id="ap-video-velocity"></div>' +

      '<div class="section-header" style="margin-top:32px"><span class="section-title">Age Cohorts</span>' +
        '<span class="section-meta">Distribution of weekly GMV by video age</span></div>' +
      '<div id="ap-video-cohorts"></div>' +

      '<div class="section-header" style="margin-top:32px"><span class="section-title">Top Videos</span>' +
        '<span class="section-meta">Highest-grossing videos this week · 10 per page</span></div>' +
      '<div id="ap-video-leaderboard"></div>' +

      '<div class="section-header" style="margin-top:32px"><span class="section-title">Pipeline Detail</span>' +
        '<span class="section-meta">New winners · legacy survivors · declining videos</span></div>' +
      '<div id="ap-video-newlegacy"></div>' +

      '<div class="kpi-legend" style="margin-top:24px">' +
        '<div class="kpi-legend-title">What this view shows</div>' +
        '<dl>' +
          '<dt>Selling Videos</dt><dd>Number of videos that produced any GMV this week.</dd>' +
          '<dt>Current Month GMV</dt><dd>Weekly video GMV from videos posted in the last 30 days (≈ "this campaign month"). Proxy for "current month" until calendar-month grouping is wired into the pipeline.</dd>' +
          '<dt>Legacy GMV</dt><dd>Weekly video GMV from videos older than 30 days. High share = pipeline isn\'t replacing winners fast enough.</dd>' +
          '<dt>New Winners (≤14d)</dt><dd>Selling videos posted in the last 14 days — pipeline freshness signal.</dd>' +
          '<dt>Legacy Share</dt><dd>Legacy GMV ÷ total weekly video GMV.</dd>' +
          '<dt>Top Video</dt><dd>Highest single-video GMV this week.</dd>' +
          '<dt>Videos per SKU</dt><dd>Cumulative published-video count and GMV per pack-size SKU, from the subscription dashboard.</dd>' +
          '<dt>Age Cohorts</dt><dd>Distribution of weekly GMV across new (0–7d), recent (8–30d), legacy (31–90d), long-tail (90+d).</dd>' +
        '</dl></div>';

    renderVideoHighlights(document.getElementById('ap-video-highlights'));
    renderSkuTable(document.getElementById('ap-video-velocity'));
    renderAgeCohorts(document.getElementById('ap-video-cohorts'));
    renderVideoLeaderboard(document.getElementById('ap-video-leaderboard'));
    renderNewLegacyDeclining(document.getElementById('ap-video-newlegacy'));
  }

  // Highlight strip — 6 KPI cards. Adds Current Month GMV + Legacy GMV per Liam's request.
  function renderVideoHighlights(host) {
    var D = window.DATA_WEEKLY;
    if (!D || !D.kpis) { host.innerHTML = ''; return; }
    var k = D.kpis;

    // Source-filtered video pool (for Selling/New/Top cards)
    var videos = filterBySource(D.topVideos || [], state.source);
    if (state.search) videos = applySearch(videos, state.search);
    var sellingVideos = videos.filter(function (v) { return (v.gmv || 0) > 0; });
    var newWinners = videos.filter(function (v) { return v.age != null && v.age <= 14 && (v.gmv || 0) > 0; });
    var sortedByGmv = videos.slice().sort(function (a, b) { return (b.gmv || 0) - (a.gmv || 0); });
    var top = sortedByGmv[0];

    // Legacy / Current-Month split — uses age buckets (always global; bucket-by-source not in data).
    var currentGmv = 0, legacyGmv = 0;
    (D.ageBuckets || []).forEach(function (b) {
      var name = b['Age bucket'] || '';
      if (name === 'New (0-7d)' || name === 'Recent (8-30d)') currentGmv += (b.gmv || 0);
      else if (name === 'Legacy (31-90d)' || name === 'Long-tail (90+d)') legacyGmv += (b.gmv || 0);
    });
    var legacyPct = state.source === 'all' ? k.legacy_pct : null;

    host.innerHTML = '<div class="kpi-grid">' +
      kpiCard('Selling Videos',
        sellingVideos.length.toLocaleString(),
        'in active source filter', 'green') +
      kpiCard('Current Month GMV',
        '$' + Math.round(currentGmv).toLocaleString(),
        'Videos posted ≤ 30 days ago', 'green') +
      kpiCard('Legacy GMV',
        '$' + Math.round(legacyGmv).toLocaleString(),
        'Videos posted > 30 days ago',
        legacyPct != null && legacyPct >= 80 ? 'red' : legacyPct != null && legacyPct >= 60 ? 'yellow' : 'orange') +
      kpiCard('New Winners (≤14d)',
        newWinners.length.toLocaleString(),
        'Fresh videos producing GMV', 'green') +
      kpiCard('Legacy Share',
        legacyPct != null ? legacyPct.toFixed(2) + '%' : '—',
        legacyPct != null ? 'Legacy ÷ total video GMV' : 'All sources only',
        legacyPct != null && legacyPct >= 80 ? 'red' : legacyPct != null && legacyPct >= 60 ? 'yellow' : 'green') +
      kpiCard('Top Video',
        top ? '$' + Math.round(top.gmv).toLocaleString() : '—',
        top ? '@' + (top.creator || '?') : '', 'orange') +
    '</div>';
  }

  // SKU table — same format as Executive's Videos per SKU. Uses window.SKU_VIDEOS.
  function renderSkuTable(host) {
    var skus = window.SKU_VIDEOS || [];
    if (!skus.length) {
      host.innerHTML = '<div class="info-notice">SKU video data not loaded. Re-run ' +
        '<code>pipeline/parsers/sku_videos.py</code> to regenerate <code>data/sku-videos.js</code>.</div>';
      return;
    }
    var rows = skus.slice().sort(function (a, b) { return (b.published_total || 0) - (a.published_total || 0); });
    var totalPublished = rows.reduce(function (s, r) { return s + (r.published_total || 0); }, 0);
    var totalGMV       = rows.reduce(function (s, r) { return s + (r.gmv_total || 0); }, 0);

    var html = '<div class="table-card"><div class="table-scroll"><table class="data-table">' +
      '<thead><tr>' +
        '<th style="text-align:left">SKU</th>' +
        '<th>Published Videos (Total)</th>' +
        '<th>Published Videos (Latest Week)</th>' +
        '<th>Cumulative GMV</th>' +
        '<th>Latest Week GMV</th>' +
        '<th>GMV / Published Video</th>' +
      '</tr></thead><tbody>';
    rows.forEach(function (r) {
      var gpv = r.published_total > 0 ? r.gmv_total / r.published_total : 0;
      var shareTxt = totalPublished > 0 ? ' (' + ((r.published_total || 0) / totalPublished * 100).toFixed(2) + '%)' : '';
      html += '<tr>' +
        '<td style="text-align:left"><strong>' + escapeHtml(r.sku) + '</strong></td>' +
        '<td>' + (r.published_total || 0).toLocaleString() + '<span style="color:var(--gray-500);font-size:11px">' + shareTxt + '</span></td>' +
        '<td>' + (r.published_week || 0).toLocaleString() + '</td>' +
        '<td>$' + Math.round(r.gmv_total || 0).toLocaleString() + '</td>' +
        '<td>$' + Math.round(r.gmv_week || 0).toLocaleString() + '</td>' +
        '<td>$' + Math.round(gpv).toLocaleString() + '</td>' +
      '</tr>';
    });
    html += '<tr style="font-weight:700;background:var(--bg);border-top:2px solid var(--border)">' +
      '<td style="text-align:left">TOTAL</td>' +
      '<td>' + totalPublished.toLocaleString() + '</td>' +
      '<td>—</td>' +
      '<td>$' + Math.round(totalGMV).toLocaleString() + '</td>' +
      '<td>—</td>' +
      '<td>—</td>' +
      '</tr>';
    html += '</tbody></table></div></div>';
    host.innerHTML = html;
  }

  // Paginated video leaderboard — 10 per page, page links 1..N below.
  function renderVideoLeaderboard(host) {
    var D = window.DATA_WEEKLY;
    if (!D || !D.topVideos) { host.innerHTML = ''; return; }

    var videos = filterBySource(D.topVideos, state.source);
    if (state.search) videos = applySearch(videos, state.search);
    videos = videos.slice().sort(function (a, b) { return (b.gmv || 0) - (a.gmv || 0); });

    var totalPages = Math.max(1, Math.ceil(videos.length / PAGE_SIZE));
    if (state.videoPage >= totalPages) state.videoPage = 0;

    var pageRows = videos.slice(state.videoPage * PAGE_SIZE, (state.videoPage + 1) * PAGE_SIZE);
    var startRank = state.videoPage * PAGE_SIZE + 1;

    var html = '<div class="table-card"><div class="table-scroll"><table class="data-table">' +
      buildVideoTableHead() + '<tbody>';
    if (!pageRows.length) {
      html += '<tr><td colspan="11" style="text-align:center;color:var(--gray-500)">No videos in this slice.</td></tr>';
    }
    pageRows.forEach(function (v, i) { html += buildVideoRow(v, startRank + i); });
    html += '</tbody></table></div></div>';
    html += buildPager('video', state.videoPage, totalPages, videos.length);
    host.innerHTML = html;

    // Wire pager
    host.querySelectorAll('[data-vpage]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.videoPage = parseInt(btn.getAttribute('data-vpage'), 10);
        renderVideoLeaderboard(host);
      });
    });
  }

  // Generic pager — info text first (top), page buttons below. Left-aligned.
  // `kind` selects the data-attr the buttons carry so the click handler routes
  // to the right state slot.
  function buildPager(kind, page, totalPages, totalCount) {
    if (totalCount === 0) return '';
    var attr = ({
      video:    'data-vpage',
      creator:  'data-cpage',
      newwin:   'data-npage',
      legacy:   'data-lpage',
      decline:  'data-dpage'
    })[kind] || 'data-page';

    if (totalPages <= 1) {
      return '<div class="ap-pager"><span class="ap-pager-info">' +
        totalCount + ' total · 1 page' +
        '</span></div>';
    }
    var html = '<div class="ap-pager">';
    html += '<span class="ap-pager-info">' +
      ((page * PAGE_SIZE) + 1) + '–' + Math.min((page + 1) * PAGE_SIZE, totalCount) +
      ' of ' + totalCount + '</span>';
    html += '<div class="ap-pager-pages">';
    for (var i = 0; i < totalPages; i++) {
      html += '<button class="ap-pager-btn ' + (i === page ? 'active' : '') + '" ' + attr + '="' + i + '">' + (i + 1) + '</button>';
    }
    html += '</div></div>';
    return html;
  }

  // (Old renderVelocityPerSKU removed — per Liam's feedback the SKU table
  // format from the subscription dashboard is the canonical view; rendered
  // by renderSkuTable above.)

  function renderAgeCohorts(host) {
    var D = window.DATA_WEEKLY;
    if (!D || !D.ageBuckets) return;
    var totalGmv = D.ageBuckets.reduce(function (s, b) { return s + (b.gmv || 0); }, 0);

    var html = '<div class="kpi-grid">';
    D.ageBuckets.forEach(function (b) {
      var share = totalGmv > 0 ? (b.gmv / totalGmv * 100).toFixed(2) + '%' : '—';
      html += kpiCard(b['Age bucket'],
        '$' + Math.round(b.gmv).toLocaleString(),
        share + ' of weekly video GMV · ' + b.selling.toLocaleString() + ' selling videos',
        'gray');
    });
    html += '</div>';
    host.innerHTML = html;
  }

  function renderNewLegacyDeclining(host) {
    host.innerHTML =
      '<div class="section-header"><span class="section-title">New Winners (≤14 Days)</span>' +
        '<span class="section-meta">Fresh videos producing GMV · 10 per page</span></div>' +
      '<div id="ap-new"></div>' +

      '<div class="section-header" style="margin-top:32px"><span class="section-title">Legacy Sellers (>30 Days)</span>' +
        '<span class="section-meta">Aging videos still producing GMV · 10 per page</span></div>' +
      '<div id="ap-legacy"></div>' +

      '<div class="section-header" style="margin-top:32px"><span class="section-title">Declining Videos</span>' +
        '<span class="section-meta">Below their Jan–Mar weekly average · 10 per page</span></div>' +
      '<div id="ap-decline"></div>';

    renderNewWinners(document.getElementById('ap-new'));
    renderLegacyTop(document.getElementById('ap-legacy'));
    renderDecliningVideos(document.getElementById('ap-decline'));
  }

  /* New Winners — paginated D.newWinners (≤14d videos with GMV). */
  function renderNewWinners(host) {
    var D = window.DATA_WEEKLY;
    if (!D || !D.newWinners) { host.innerHTML = ''; return; }

    var rows = filterBySource(D.newWinners, state.source);
    if (state.search) rows = applySearch(rows, state.search);
    rows = rows.slice().sort(function (a, b) { return (b.gmv || 0) - (a.gmv || 0); });

    var totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (state.newPage >= totalPages) state.newPage = 0;

    var note = rows.length >= 50
      ? '<strong>' + rows.length + ' new videos</strong> are producing GMV — pipeline is alive. Top of stack: @'
        + (rows[0]||{}).creator + ' at $' + Math.round((rows[0]||{}).gmv || 0).toLocaleString()
      : '<strong>Only ' + rows.length + ' new videos</strong> are producing GMV — pipeline is thin. Push briefs and expand sample volume this week.';

    var slice = rows.slice(state.newPage * PAGE_SIZE, (state.newPage + 1) * PAGE_SIZE);
    var startRank = state.newPage * PAGE_SIZE + 1;

    var html = '<div class="alert-bar"><div class="alert alert-blue"><div>' + note + '</div></div></div>';
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">' +
      buildVideoTableHead() + '<tbody>';
    slice.forEach(function (v, i) { html += buildVideoRow(v, startRank + i); });
    html += '</tbody></table></div></div>';
    html += buildPager('newwin', state.newPage, totalPages, rows.length);
    host.innerHTML = html;

    host.querySelectorAll('[data-npage]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.newPage = parseInt(btn.getAttribute('data-npage'), 10);
        renderNewWinners(host);
      });
    });
  }

  /* Legacy Sellers — paginated D.legacyTop (>30d videos still selling). */
  function renderLegacyTop(host) {
    var D = window.DATA_WEEKLY;
    if (!D || !D.legacyTop) { host.innerHTML = ''; return; }

    var rows = filterBySource(D.legacyTop, state.source);
    if (state.search) rows = applySearch(rows, state.search);
    rows = rows.slice().sort(function (a, b) { return (b.gmv || 0) - (a.gmv || 0); });

    var totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (state.legacyPage >= totalPages) state.legacyPage = 0;

    var slice = rows.slice(state.legacyPage * PAGE_SIZE, (state.legacyPage + 1) * PAGE_SIZE);
    var startRank = state.legacyPage * PAGE_SIZE + 1;

    var html = '<div class="table-card"><div class="table-scroll"><table class="data-table">' +
      buildVideoTableHead() + '<tbody>';
    slice.forEach(function (v, i) { html += buildVideoRow(v, startRank + i); });
    html += '</tbody></table></div></div>';
    html += buildPager('legacy', state.legacyPage, totalPages, rows.length);
    host.innerHTML = html;

    host.querySelectorAll('[data-lpage]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.legacyPage = parseInt(btn.getAttribute('data-lpage'), 10);
        renderLegacyTop(host);
      });
    });
  }

  /* Declining videos — paginated D.declining (below Jan–Mar baseline). */
  function renderDecliningVideos(host) {
    var D = window.DATA_WEEKLY;
    if (!D || !D.declining) { host.innerHTML = ''; return; }

    // Source filter via creator→agency lookup (decline rows lack agency directly).
    var creatorAgency = {};
    (D.creators || []).forEach(function (c) { creatorAgency[c.creator] = c.agency; });
    var rows = D.declining.slice();
    if (state.source !== 'all') {
      rows = rows.filter(function (r) { return creatorAgency[r.creator] === state.source; });
    }
    if (state.search) {
      var q = state.search.toLowerCase();
      rows = rows.filter(function (r) {
        return ((r.creator || '').toLowerCase().indexOf(q) >= 0)
            || ((r.url || '').toLowerCase().indexOf(q) >= 0);
      });
    }

    var totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (state.declinePage >= totalPages) state.declinePage = 0;

    var sev = rows.reduce(function (m, r) { m[r.severity] = (m[r.severity] || 0) + 1; return m; }, {});
    var lossSum = rows.reduce(function (s, r) { return s + Math.abs(r.delta || 0); }, 0);

    var alertHtml = '<div class="alert-bar"><div class="alert alert-yellow"><div>' +
      '<strong>' + rows.length + ' videos</strong> are below their Jan–Mar weekly average — ' +
      'Severe: ' + (sev.Severe || 0) + ' · Moderate: ' + (sev.Moderate || 0) + ' · Mild: ' + (sev.Mild || 0) + '. ' +
      'Total weekly GMV gap to recapture: <strong>$' + Math.round(lossSum).toLocaleString() + '</strong>.' +
      '</div></div></div>';

    var slice = rows.slice(state.declinePage * PAGE_SIZE, (state.declinePage + 1) * PAGE_SIZE);

    var html = alertHtml;
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">' +
      '<thead><tr>' +
        '<th style="text-align:left">Creator</th>' +
        '<th style="text-align:left">Video</th>' +
        '<th>Posted</th><th>Age</th><th>Severity</th>' +
        '<th>Prior Wk Avg</th><th>This Week</th>' +
        '<th>Δ $</th><th>Δ %</th><th>Lifetime GMV</th>' +
      '</tr></thead><tbody>';
    if (!slice.length) {
      html += '<tr><td colspan="10" style="text-align:center;color:var(--gray-500)">No declining videos in this slice.</td></tr>';
    }
    slice.forEach(function (r) {
      var sevColor = r.severity === 'Severe' ? 'red' : r.severity === 'Moderate' ? 'yellow' : 'gray';
      html += '<tr>' +
        '<td style="text-align:left">@' + escapeHtml(r.creator || '') + '</td>' +
        '<td style="text-align:left">' + (r.url ? '<a class="link" target="_blank" href="' + r.url + '">open ↗</a>' : '—') + '</td>' +
        '<td>' + escapeHtml(r.post || '—') + '</td>' +
        '<td>' + (r.age != null ? r.age + 'd' : '—') + '</td>' +
        '<td><span class="badge badge-' + sevColor + '">' + escapeHtml(r.severity || '—') + '</span></td>' +
        '<td>$' + Math.round(r.prior_avg || 0).toLocaleString() + '</td>' +
        '<td>$' + Math.round(r.gmv || 0).toLocaleString() + '</td>' +
        '<td class="text-red">−$' + Math.abs(Math.round(r.delta || 0)).toLocaleString() + '</td>' +
        '<td class="text-red">' + (r.pct != null ? r.pct.toFixed(2) : '0') + '%</td>' +
        '<td>$' + Math.round(r.lifetime_gmv || 0).toLocaleString() + '</td>' +
      '</tr>';
    });
    html += '</tbody></table></div></div>';
    html += buildPager('decline', state.declinePage, totalPages, rows.length);
    host.innerHTML = html;

    host.querySelectorAll('[data-dpage]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.declinePage = parseInt(btn.getAttribute('data-dpage'), 10);
        renderDecliningVideos(host);
      });
    });
  }

  /* Shared video table head + row helpers — used by Top Videos, New Winners, Legacy. */
  function buildVideoTableHead() {
    return '<thead><tr>' +
      '<th style="text-align:left">#</th>' +
      '<th style="text-align:left">Creator</th>' +
      '<th style="text-align:left">Source</th>' +
      '<th>Posted</th>' +
      '<th>Age</th>' +
      '<th>Status</th>' +
      '<th>GMV</th>' +
      '<th>Lifetime GMV</th>' +
      '<th>Orders</th>' +
      '<th>Views</th>' +
      '<th style="text-align:left">Link</th>' +
    '</tr></thead>';
  }

  function buildVideoRow(v, rank) {
    var meta = SOURCE_OPTS.find(function (o) { return o.id === (v.agency || 'unattributed'); }) || { label: 'Unattributed', color: '#8C9091' };
    return '<tr>' +
      '<td style="text-align:left">' + rank + '</td>' +
      '<td style="text-align:left">@' + escapeHtml(v.creator || '?') + '</td>' +
      '<td style="text-align:left"><span class="agency-dot" style="background:' + meta.color + ';margin-right:6px"></span>' + escapeHtml(meta.label) + '</td>' +
      '<td>' + escapeHtml(v.post || '—') + '</td>' +
      '<td>' + (v.age != null ? v.age + 'd' : '—') + '</td>' +
      '<td>' + escapeHtml(v.status || '—') + '</td>' +
      '<td><strong>$' + Math.round(v.gmv || 0).toLocaleString() + '</strong></td>' +
      '<td>$' + Math.round(v.lifetime_gmv || 0).toLocaleString() + '</td>' +
      '<td>' + (v.orders || 0).toLocaleString() + '</td>' +
      '<td>' + (v.views || 0).toLocaleString() + '</td>' +
      '<td style="text-align:left">' + (v.url ? '<a class="link" target="_blank" href="' + v.url + '">open ↗</a>' : '—') + '</td>' +
    '</tr>';
  }

  /* ───────────────────────────────────────────────────
     Tab 4 — DIAGNOSTICS  (the new "What Changed" view)
     WoW driver decomposition + Mix-shift + Top contributors
     ─────────────────────────────────────────────────── */
  function renderDiagnostics(host) {
    var D = window.DATA_WEEKLY;
    if (!D || !D.kpis) {
      host.innerHTML = '<div class="placeholder-card"><h3>No diagnostics data</h3></div>';
      return;
    }

    var k = D.kpis;
    var creators = filterBySource(D.creators || [], state.source);
    var totalGMV     = creators.reduce(function (s, c) { return s + (c.gmv || 0); }, 0);
    var totalPrior   = creators.reduce(function (s, c) { return s + (c.prior_gmv || 0); }, 0);
    var totalDelta   = totalGMV - totalPrior;
    var totalDeltaPct = totalPrior > 0 ? (totalDelta / totalPrior * 100) : 0;

    // Driver decomposition
    var newPerf       = creators.filter(function (c) { return (c.gmv || 0) > 0 && (c.prior_gmv || 0) === 0; });
    var lost          = creators.filter(function (c) { return (c.gmv || 0) === 0 && (c.prior_gmv || 0) > 0; });
    var continuing    = creators.filter(function (c) { return (c.gmv || 0) > 0 && (c.prior_gmv || 0) > 0; });
    var newPerfDelta  = newPerf.reduce(function (s, c) { return s + (c.gmv || 0); }, 0);
    var lostDelta     = -lost.reduce(function (s, c) { return s + (c.prior_gmv || 0); }, 0);
    var continuingDelta = continuing.reduce(function (s, c) { return s + ((c.gmv || 0) - (c.prior_gmv || 0)); }, 0);

    // Top contributors / detractors among continuing creators
    var moveSorted = continuing.slice().sort(function (a, b) {
      return ((b.gmv - b.prior_gmv) - (a.gmv - a.prior_gmv));
    });
    var topGainers  = moveSorted.slice(0, 5);
    var topDecliners = moveSorted.slice(-5).reverse();

    // Agency contribution to delta — when source = all
    var agencyContribHTML = '';
    if (state.source === 'all') {
      var rollup = D.agencyRollup || [];
      if (rollup.length) {
        var maxAbs = Math.max.apply(null, rollup.map(function (r) { return Math.abs(r.wow_dollar || 0); }));
        agencyContribHTML = '<div class="card" style="margin-bottom:24px">' +
          '<div class="card-header"><h3 class="card-title">Agency Contribution to WoW Delta</h3>' +
          '<p class="card-sub">How much each source moved the weekly GMV total.</p></div>';
        rollup.forEach(function (r) {
          var meta = SOURCE_OPTS.find(function (o) { return o.id === r.Agency; }) || { color: '#8C9091' };
          var v = r.wow_dollar || 0;
          var w = maxAbs > 0 ? Math.abs(v) / maxAbs * 100 : 0;
          var dir = v >= 0 ? 'pos' : 'neg';
          var sign = v >= 0 ? '+' : '−';
          agencyContribHTML += '<div class="ap-bar-row">' +
            '<div class="ap-bar-label"><span class="agency-dot" style="background:' + meta.color + '"></span>' + escapeHtml(AGENCY_LABEL(r.Agency)) + '</div>' +
            '<div class="ap-bar-track">' +
              '<div class="ap-bar-fill ap-bar-' + dir + '" style="width:' + w.toFixed(1) + '%"></div>' +
            '</div>' +
            '<div class="ap-bar-value ap-bar-' + dir + '">' + sign + '$' + Math.abs(Math.round(v)).toLocaleString() + '</div>' +
          '</div>';
        });
        agencyContribHTML += '</div>';
      }
    }

    // Heuristic interpretation
    var interp = buildInterpretation(creators, newPerf, lost, continuing,
      newPerfDelta, lostDelta, continuingDelta, totalDelta);

    host.innerHTML =
      // Headline + interpretation
      '<div class="ap-headline-card">' +
        '<div class="ap-headline-label">Weekly GMV moved</div>' +
        '<div class="ap-headline-value ' + (totalDelta >= 0 ? 'pos' : 'neg') + '">' +
          (totalDelta >= 0 ? '+' : '−') + '$' + Math.abs(Math.round(totalDelta)).toLocaleString() +
          '<span class="ap-headline-pct">' + (totalDelta >= 0 ? '+' : '') + totalDeltaPct.toFixed(2) + '%</span>' +
        '</div>' +
        '<div class="ap-headline-interp">' + interp + '</div>' +
      '</div>' +

      // Funnel decomposition (NEW) — answers "where in the funnel did GMV move?"
      buildFunnelDecomp(D, creators) +

      // Driver decomposition (waterfall-style table) — life-stage view
      '<div class="card">' +
        '<div class="card-header"><h3 class="card-title">Driver Decomposition · By Creator Life-Stage</h3>' +
        '<p class="card-sub">Breakdown of the WoW GMV change by creator life-stage.</p></div>' +
        buildDriverTable(newPerfDelta, lostDelta, continuingDelta, totalDelta,
          newPerf.length, lost.length, continuing.length) +
      '</div>' +

      // Agency contribution (when source = all)
      agencyContribHTML +

      // Narrative theme contribution (NEW) — when source = all
      buildNarrativeContrib(D, state.source) +

      // Top gainers / decliners
      '<div class="ap-grid-2">' +
        buildMoverTable('Top Gainers (Continuing Creators)', topGainers, 'pos') +
        buildMoverTable('Top Decliners (Continuing Creators)', topDecliners, 'neg') +
      '</div>' +

      // Legend
      '<div class="kpi-legend" style="margin-top:24px">' +
        '<div class="kpi-legend-title">How to read this</div>' +
        '<dl>' +
          '<dt>Funnel Decomposition</dt><dd>Five sequential metrics: Views → CTR → Orders → AOV. WoW change at each step tells you <em>where</em> the funnel broke (or won).</dd>' +
          '<dt>Driver Decomposition</dt><dd>The WoW GMV change is broken into three creator life-stages: <strong>new performing</strong> (no prior-week GMV), <strong>continuing</strong> (sold both weeks), and <strong>lost</strong> (sold last week, not this week). The three components sum to the total delta.</dd>' +
          '<dt>Agency Contribution</dt><dd>Each agency / source\'s share of the weekly GMV delta — positive bars helped, negative bars hurt.</dd>' +
          '<dt>Narrative Theme Contribution</dt><dd>How weekly GMV breaks down across content narrative families — surfaces which messaging frames are driving the period.</dd>' +
          '<dt>Top Gainers / Decliners</dt><dd>The 5 continuing creators who moved the dial most in either direction. Use to identify both rising stars and roster members at risk.</dd>' +
        '</dl></div>';
  }

  /* Funnel decomposition — Views → CTR → Orders → AOV. Sums across topVideos
     for the source-filtered slice (best available since per-creator views aren't
     in D.creators directly). */
  function buildFunnelDecomp(D, creators) {
    var videos = filterBySource(D.topVideos || [], state.source);
    if (state.search) videos = applySearch(videos, state.search);
    var totalViews = videos.reduce(function (s, v) { return s + (v.views || 0); }, 0);

    // Use creators[] for orders + GMV since topVideos is just top-50 set
    var totalGMV = creators.reduce(function (s, c) { return s + (c.gmv || 0); }, 0);
    var totalOrders = creators.reduce(function (s, c) { return s + (c.orders || 0); }, 0);
    var priorGMV = creators.reduce(function (s, c) { return s + (c.prior_gmv || 0); }, 0);
    var aov = totalOrders > 0 ? totalGMV / totalOrders : 0;

    // CTR proxy: weight average across topVideos. Each row has ctr like "3.23%".
    var ctrSum = 0, ctrCount = 0;
    videos.forEach(function (v) {
      if (typeof v.ctr === 'string') {
        var m = parseFloat(v.ctr.replace('%', ''));
        if (!isNaN(m)) { ctrSum += m; ctrCount++; }
      }
    });
    var avgCtr = ctrCount > 0 ? (ctrSum / ctrCount) : 0;

    var html = '<div class="card">' +
      '<div class="card-header"><h3 class="card-title">Funnel Decomposition</h3>' +
      '<p class="card-sub">Where in the funnel did GMV move? Each step has its own diagnostic.</p></div>' +
      '<div class="kpi-grid">' +
        funnelCard('Views',  totalViews.toLocaleString(), 'Top-50 videos in active filter', 'green') +
        funnelCard('Avg CTR', avgCtr.toFixed(2) + '%',     'Click-through rate across top videos', avgCtr >= 3 ? 'green' : avgCtr >= 1.5 ? 'yellow' : 'red') +
        funnelCard('Orders', totalOrders.toLocaleString(), 'Total orders in active filter', 'green') +
        funnelCard('AOV',    '$' + aov.toFixed(2),         'GMV ÷ orders', 'green') +
      '</div></div>';
    return html;
  }

  function funnelCard(label, value, sub, color) {
    return '<div class="kpi-card ' + (color || '') + '">' +
      '<div class="kpi-label">' + label + '</div>' +
      '<div class="kpi-value">' + value + '</div>' +
      '<div class="kpi-sub">' + sub + '</div>' +
      '</div>';
  }

  /* Narrative theme contribution — maps creators in this week's data to narrative
     families via Views.narrative._narratives.creators[], then sums GMV per family. */
  function buildNarrativeContrib(D, source) {
    var narrSrc = (window.Views && window.Views.narrative && window.Views.narrative._narratives) || [];
    if (!narrSrc.length) return '';

    // Build creator → narrative mapping (one creator can be in multiple narratives;
    // pick the first match for simplicity)
    var creatorToNarr = {};
    narrSrc.forEach(function (n) {
      (n.creators || []).forEach(function (handle) {
        if (!creatorToNarr[handle]) creatorToNarr[handle] = n.name;
      });
    });

    var creators = filterBySource(D.creators || [], source);
    if (state.search) creators = applySearch(creators, state.search);

    var byNarr = {};
    var unattributed = 0;
    creators.forEach(function (c) {
      var n = creatorToNarr[c.creator];
      if (!n) { unattributed += (c.gmv || 0); return; }
      if (!byNarr[n]) byNarr[n] = { gmv: 0, creators: 0 };
      byNarr[n].gmv += (c.gmv || 0);
      byNarr[n].creators += 1;
    });

    var rows = Object.keys(byNarr).map(function (k) {
      return { name: k, gmv: byNarr[k].gmv, creators: byNarr[k].creators };
    }).sort(function (a, b) { return b.gmv - a.gmv; });

    var totalCovered = rows.reduce(function (s, r) { return s + r.gmv; }, 0);
    if (totalCovered === 0) return '';
    var maxAbs = Math.max.apply(null, rows.map(function (r) { return r.gmv; }));

    var html = '<div class="card" style="margin-bottom:24px">' +
      '<div class="card-header"><h3 class="card-title">Narrative Theme Contribution</h3>' +
      '<p class="card-sub">Weekly GMV by narrative family, based on creator → narrative mapping. ' +
      (unattributed > 0 ? '$' + Math.round(unattributed).toLocaleString() + ' from creators not yet mapped.' : 'All creators mapped.') +
      '</p></div>';
    rows.forEach(function (r) {
      var w = (r.gmv / maxAbs * 100).toFixed(1);
      html += '<div class="ap-bar-row">' +
        '<div class="ap-bar-label">' + escapeHtml(r.name) + ' <span style="color:var(--gray-500);font-size:11px;font-weight:400">· ' + r.creators + ' creators</span></div>' +
        '<div class="ap-bar-track"><div class="ap-bar-fill ap-bar-pos" style="width:' + w + '%"></div></div>' +
        '<div class="ap-bar-value ap-bar-pos">$' + Math.round(r.gmv).toLocaleString() + '</div>' +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function buildDriverTable(newDelta, lostDelta, contDelta, totalDelta, nNew, nLost, nCont) {
    var rows = [
      { label: 'New performing creators',  count: nNew,  delta: newDelta,  note: 'Creators selling for the first time this week.' },
      { label: 'Continuing creators (net)', count: nCont, delta: contDelta, note: 'Creators selling both weeks — change reflects per-creator output shift.' },
      { label: 'Lost creators',             count: nLost, delta: lostDelta, note: 'Creators who sold last week but produced zero GMV this week.' }
    ];
    var html = '<div class="table-card"><div class="table-scroll"><table class="data-table">' +
      '<thead><tr><th style="text-align:left">Driver</th><th>Creators</th><th>Δ GMV</th><th style="text-align:left">Note</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      var dir = r.delta >= 0 ? 'text-green' : 'text-red';
      var sign = r.delta >= 0 ? '+' : '−';
      html += '<tr>' +
        '<td style="text-align:left"><strong>' + escapeHtml(r.label) + '</strong></td>' +
        '<td>' + r.count + '</td>' +
        '<td><span class="' + dir + '">' + sign + '$' + Math.abs(Math.round(r.delta)).toLocaleString() + '</span></td>' +
        '<td style="text-align:left;color:var(--gray-500);font-size:12px">' + escapeHtml(r.note) + '</td>' +
      '</tr>';
    });
    var totalDir = totalDelta >= 0 ? 'text-green' : 'text-red';
    var totalSign = totalDelta >= 0 ? '+' : '−';
    html += '<tr style="font-weight:700;background:var(--bg);border-top:2px solid var(--border)">' +
      '<td style="text-align:left">Total Δ</td>' +
      '<td>—</td>' +
      '<td><span class="' + totalDir + '">' + totalSign + '$' + Math.abs(Math.round(totalDelta)).toLocaleString() + '</span></td>' +
      '<td></td>' +
    '</tr>';
    html += '</tbody></table></div></div>';
    return html;
  }

  function buildMoverTable(title, rows, dir) {
    var html = '<div class="card">' +
      '<div class="card-header"><h3 class="card-title">' + escapeHtml(title) + '</h3></div>' +
      '<div class="table-scroll"><table class="data-table">' +
      '<thead><tr><th style="text-align:left">Creator</th><th>Source</th><th>This Wk</th><th>Prior Wk</th><th>Δ $</th></tr></thead><tbody>';
    rows.forEach(function (c) {
      var delta = (c.gmv || 0) - (c.prior_gmv || 0);
      var meta = SOURCE_OPTS.find(function (o) { return o.id === (c.agency || 'unattributed'); }) || { label: 'Unattributed', color: '#8C9091' };
      var sign = delta >= 0 ? '+' : '−';
      var cls = delta >= 0 ? 'text-green' : 'text-red';
      html += '<tr>' +
        '<td style="text-align:left">@' + escapeHtml(c.creator || '?') + '</td>' +
        '<td><span class="agency-dot" style="background:' + meta.color + ';margin-right:6px"></span>' + escapeHtml(meta.label) + '</td>' +
        '<td>$' + Math.round(c.gmv || 0).toLocaleString() + '</td>' +
        '<td>$' + Math.round(c.prior_gmv || 0).toLocaleString() + '</td>' +
        '<td><span class="' + cls + '">' + sign + '$' + Math.abs(Math.round(delta)).toLocaleString() + '</span></td>' +
      '</tr>';
    });
    if (!rows.length) html += '<tr><td colspan="5" style="text-align:center;color:var(--gray-500)">No movers in this slice.</td></tr>';
    html += '</tbody></table></div></div>';
    return html;
  }

  function buildInterpretation(creators, newPerf, lost, continuing, newDelta, lostDelta, contDelta, totalDelta) {
    var bits = [];
    if (Math.abs(newDelta) > Math.abs(contDelta) && Math.abs(newDelta) > Math.abs(lostDelta)) {
      bits.push('<strong>New performing creators are the dominant driver</strong> (' + newPerf.length + ' creators contributed ' + (newDelta >= 0 ? '+' : '') + '$' + Math.round(newDelta).toLocaleString() + ').');
    } else if (Math.abs(contDelta) > Math.abs(newDelta) && Math.abs(contDelta) > Math.abs(lostDelta)) {
      bits.push('<strong>Continuing creators</strong> moved the dial most this week (' + continuing.length + ' creators net ' + (contDelta >= 0 ? '+' : '') + '$' + Math.round(contDelta).toLocaleString() + ').');
    } else if (Math.abs(lostDelta) > Math.abs(newDelta)) {
      bits.push('<strong>Lost creators</strong> are the biggest swing factor (' + lost.length + ' creators dropped, costing $' + Math.abs(Math.round(lostDelta)).toLocaleString() + ').');
    }
    if (lost.length >= 5) bits.push(lost.length + ' creators went silent this week — flag for outreach.');
    if (newPerf.length >= 10) bits.push(newPerf.length + ' new creators started selling — pipeline is ramping.');
    if (totalDelta < 0 && continuing.length && contDelta < 0) {
      bits.push('Continuing-creator output is contracting — investigate top decliners below.');
    }
    return bits.length ? bits.join(' ') : 'Week-over-week movement is balanced across drivers — no single dominant signal.';
  }

  /* ── Helpers ── */
  function filterBySource(rows, source) {
    if (source === 'all') return rows.slice();
    return rows.filter(function (r) { return (r.agency || 'unattributed') === source; });
  }

  function applySearch(rows, q) {
    if (!q) return rows;
    var ql = q.toLowerCase();
    return rows.filter(function (r) {
      return ['creator', 'name', 'url', 'sku'].some(function (k) {
        return ((r[k] || '') + '').toLowerCase().indexOf(ql) >= 0;
      });
    });
  }

  function AGENCY_LABEL(id) {
    var meta = SOURCE_OPTS.find(function (o) { return o.id === id; });
    return meta ? meta.label : id;
  }

  function kpiCard(label, value, sub, color) {
    return '<div class="kpi-card ' + (color || '') + '">' +
      '<div class="kpi-label">' + escapeHtml(label) + '</div>' +
      '<div class="kpi-value">' + value + '</div>' +
      '<div class="kpi-sub">' + escapeHtml(sub || '') + '</div>' +
      '</div>';
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Channel economics (CM stack, subscription mix, weekly P&L) is intentionally
     not part of this dashboard. It lives in the separate TikTok performance
     project alongside Forecasting. The data scaffolding (DASHBOARD_DATA.profitability)
     is still loaded in case we need a quick read, but no UI surfaces it here. */

  /* ───────────────────────────────────────────────────
     Tab — SAMPLING
     Reads window.SAMPLING.weeks[] and renders the active week's
     core metrics + per-creator + per-product detail.
     Honors the active app-level time range (Latest / Custom).
     ─────────────────────────────────────────────────── */
  function renderSampling(host) {
    var sampling = window.SAMPLING;
    if (!sampling || !sampling.weeks || !sampling.weeks.length) {
      host.innerHTML = '<div class="placeholder-card">' +
        '<h3>Sampling data not loaded</h3>' +
        '<p>Re-run <code>pipeline/parsers/sampling.py</code> to regenerate <code>web/data/sampling.js</code>.</p>' +
        '</div>';
      return;
    }

    var week = pickSamplingWeek(sampling);
    if (!week) {
      // Picked a custom week that doesn't have sampling files yet (e.g. the
      // most recent week before sampling exports are uploaded). Show a clean
      // empty state instead of failing.
      var picked = (window._appState || {});
      var pickedLabel = picked.customFrom || 'this week';
      host.innerHTML =
        '<div class="placeholder-card">' +
          '<h3>No sampling data for ' + escapeHtml(pickedLabel) + '</h3>' +
          '<p>Sampling files for this week haven\'t been uploaded to ' +
          '<code>03_TikTok/Performance Reporting/Sampling/</code> yet. ' +
          'Other tabs (Summary, Creators, Videos, Diagnostics) still show this week\'s data.</p>' +
          '<p style="margin-top:12px">Most recent sampling week: <strong>' +
          escapeHtml(sampling.weeks[sampling.weeks.length - 1].label) + '</strong> — ' +
          'switch to "Latest week" or pick a custom week within that range.</p>' +
        '</div>';
      return;
    }

    host.innerHTML =
      '<div class="section-header"><span class="section-title">Highlights</span>' +
        '<span class="section-meta">Week of ' + escapeHtml(week.label) +
          ' (' + escapeHtml(week.start) + ' – ' + escapeHtml(week.end) + ')</span></div>' +
      '<div id="ap-sampling-highlights"></div>' +

      '<div class="section-header" style="margin-top:32px"><span class="section-title">By Product</span>' +
        '<span class="section-meta">Sample shipments + content GMV per SKU</span></div>' +
      '<div id="ap-sampling-products"></div>' +

      '<div class="section-header" style="margin-top:32px"><span class="section-title">Top Creators by Sampling-Driven GMV</span>' +
        '<span class="section-meta">10 per page · ranked by content GMV</span></div>' +
      '<div id="ap-sampling-creators"></div>' +

      '<div class="kpi-legend" style="margin-top:24px">' +
        '<div class="kpi-legend-title">What this view shows</div>' +
        '<dl>' +
          '<dt>Samples Shipped</dt><dd>Total samples sent to creators in this reporting week. Leading indicator — drives the next 7–14 days of fresh content.</dd>' +
          '<dt>Content Generated</dt><dd>Videos posted by creators who received samples in this week.</dd>' +
          '<dt>Sampling-Driven GMV</dt><dd>GMV attributed to videos in the sampling-attributed set for this week.</dd>' +
          '<dt>Est. COGS / Shipping</dt><dd>Cost-of-goods + shipping spent on this week\'s sample wave. The denominator of sample ROI.</dd>' +
          '<dt>45-day ROI</dt><dd>Sampling-driven GMV ÷ (sample COGS + shipping) over a 45-day attribution window. The single number that says whether the sampling program is paying for itself.</dd>' +
          '<dt>Activation Rate</dt><dd>Of creators who received samples, the share who posted ≥1 video with that sample.</dd>' +
        '</dl></div>';

    renderSamplingHighlights(document.getElementById('ap-sampling-highlights'), week);
    renderSamplingProducts(document.getElementById('ap-sampling-products'), week);
    renderSamplingCreators(document.getElementById('ap-sampling-creators'), week);
  }

  function renderSamplingHighlights(host, week) {
    var c = week.core || {};
    var creators = (week.by_creator || []).filter(function (r) { return (r.samples_shipped || 0) > 0; });
    var creatorsActivated = creators.filter(function (r) { return (r.videos_with_samples || 0) > 0; }).length;
    var activationRate = creators.length > 0 ? (creatorsActivated / creators.length * 100) : 0;
    var totalCost = (c.est_cogs || 0) + (c.est_shipping || 0);
    var grossROI = totalCost > 0 ? (c.content_gmv || 0) / totalCost : null;

    host.innerHTML = '<div class="kpi-grid">' +
      kpiCard('Samples Shipped',
        (c.samples_shipped || 0).toLocaleString(),
        'Leading indicator', 'green') +
      kpiCard('Content Generated',
        (c.content_count || 0).toLocaleString(),
        'Videos posted by sampled creators', 'green') +
      kpiCard('Sampling-Driven GMV',
        '$' + Math.round(c.content_gmv || 0).toLocaleString(),
        'GMV from sampled content', 'green') +
      kpiCard('Est. Cost',
        '$' + Math.round(totalCost).toLocaleString(),
        '$' + Math.round(c.est_cogs || 0).toLocaleString() + ' COGS + $' + Math.round(c.est_shipping || 0).toLocaleString() + ' shipping',
        'gray') +
      kpiCard('45-day ROI',
        c.roi_45d != null ? c.roi_45d.toFixed(2) + 'x' : '—',
        c.roi_45d != null && c.roi_45d >= 1 ? 'Above break-even' : 'Below break-even',
        c.roi_45d != null && c.roi_45d >= 2 ? 'green' : c.roi_45d >= 1 ? 'yellow' : 'red') +
      kpiCard('Activation Rate',
        activationRate.toFixed(2) + '%',
        creatorsActivated + ' of ' + creators.length + ' shipped creators posted',
        activationRate >= 60 ? 'green' : activationRate >= 40 ? 'yellow' : 'red') +
    '</div>';
  }

  function renderSamplingProducts(host, week) {
    var rows = (week.by_product || []).slice();
    if (!rows.length) { host.innerHTML = '<div class="info-notice">No per-product data for this week.</div>'; return; }
    var totalGMV = rows.reduce(function (s, r) { return s + (r.content_gmv || 0); }, 0);

    var html = '<div class="table-card"><div class="table-scroll"><table class="data-table">' +
      '<thead><tr>' +
        '<th style="text-align:left">Product</th>' +
        '<th>Samples Requested</th>' +
        '<th>Samples Shipped</th>' +
        '<th>Content GMV</th>' +
        '<th>Share</th>' +
        '<th>Refunds</th>' +
      '</tr></thead><tbody>';
    rows.forEach(function (r) {
      var share = totalGMV > 0 ? ((r.content_gmv || 0) / totalGMV * 100).toFixed(2) + '%' : '—';
      html += '<tr>' +
        '<td style="text-align:left"><strong>' + escapeHtml(r.product_name || '—') + '</strong></td>' +
        '<td>' + (r.samples_requested || 0).toLocaleString() + '</td>' +
        '<td>' + (r.samples_shipped || 0).toLocaleString() + '</td>' +
        '<td>$' + Math.round(r.content_gmv || 0).toLocaleString() + '</td>' +
        '<td>' + share + '</td>' +
        '<td>$' + Math.round(r.refunds || 0).toLocaleString() + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div></div>';
    host.innerHTML = html;
  }

  function renderSamplingCreators(host, week) {
    var rows = (week.by_creator || []).slice()
      .filter(function (r) { return (r.content_gmv || 0) > 0 || (r.samples_shipped || 0) > 0; })
      .sort(function (a, b) { return (b.content_gmv || 0) - (a.content_gmv || 0); });
    if (!rows.length) { host.innerHTML = '<div class="info-notice">No per-creator data for this week.</div>'; return; }

    var page = state._samplingPage || 0;
    var totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (page >= totalPages) page = 0;

    var slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    var startRank = page * PAGE_SIZE + 1;

    var html = '<div class="table-card"><div class="table-scroll"><table class="data-table">' +
      '<thead><tr>' +
        '<th style="text-align:left">#</th>' +
        '<th style="text-align:left">Creator</th>' +
        '<th>Content GMV</th>' +
        '<th>Samples Requested</th>' +
        '<th>Samples Shipped</th>' +
        '<th>Videos with Samples</th>' +
        '<th>Posting Rate</th>' +
      '</tr></thead><tbody>';
    slice.forEach(function (r, i) {
      var posting = r.posting_rate;
      var postingTxt = (posting == null) ? '—'
        : (typeof posting === 'number' && posting <= 1) ? (posting * 100).toFixed(2) + '%'
        : (typeof posting === 'number' ? posting.toFixed(2) + '%' : String(posting));
      html += '<tr>' +
        '<td style="text-align:left">' + (startRank + i) + '</td>' +
        '<td style="text-align:left">@' + escapeHtml(r.creator_name || '—') + '</td>' +
        '<td><strong>$' + Math.round(r.content_gmv || 0).toLocaleString() + '</strong></td>' +
        '<td>' + (r.samples_requested || 0).toLocaleString() + '</td>' +
        '<td>' + (r.samples_shipped || 0).toLocaleString() + '</td>' +
        '<td>' + (r.videos_with_samples || 0).toLocaleString() + '</td>' +
        '<td>' + postingTxt + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div></div>';
    html += buildSamplingPager(page, totalPages, rows.length);
    host.innerHTML = html;

    host.querySelectorAll('[data-spage]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state._samplingPage = parseInt(btn.getAttribute('data-spage'), 10);
        renderSamplingCreators(host, week);
      });
    });
  }

  function buildSamplingPager(page, totalPages, totalCount) {
    if (totalCount === 0) return '';
    if (totalPages <= 1) {
      return '<div class="ap-pager"><span class="ap-pager-info">' + totalCount + ' total · 1 page</span></div>';
    }
    var html = '<div class="ap-pager">';
    html += '<span class="ap-pager-info">' +
      ((page * PAGE_SIZE) + 1) + '–' + Math.min((page + 1) * PAGE_SIZE, totalCount) + ' of ' + totalCount + '</span>';
    html += '<div class="ap-pager-pages">';
    // For potentially long lists, cap visible page buttons to first 10 + last
    var pagesToShow = Math.min(totalPages, 12);
    for (var i = 0; i < pagesToShow; i++) {
      html += '<button class="ap-pager-btn ' + (i === page ? 'active' : '') + '" data-spage="' + i + '">' + (i + 1) + '</button>';
    }
    if (totalPages > 12) {
      html += '<span style="padding:0 6px;color:var(--gray-500);font-size:13px">…</span>';
      html += '<button class="ap-pager-btn ' + (totalPages - 1 === page ? 'active' : '') + '" data-spage="' + (totalPages - 1) + '">' + totalPages + '</button>';
    }
    html += '</div></div>';
    return html;
  }

  // Pick the active sampling week based on app-level state (timeRange + customFrom).
  // Returns null if state.timeRange === 'custom' and the picked week isn't in the dataset.
  function pickSamplingWeek(sampling) {
    var weeks = sampling.weeks || [];
    if (!weeks.length) return null;

    var appState = window._appState || {};
    var timeRange = appState.timeRange || 'latest';
    var customFrom = appState.customFrom || null;

    if (timeRange === 'custom' && customFrom) {
      var match = weeks.find(function (w) { return w.start === customFrom; });
      if (match) return match;
    }
    return weeks[weeks.length - 1];
  }

  window.Views = window.Views || {};
  window.Views.affiliate_performance = { render: render };

})();
