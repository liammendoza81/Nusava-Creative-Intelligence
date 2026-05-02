/* =========================================================
   Nusava — Weekly TikTok Performance View
   Reads window.DATA_WEEKLY (auto-generated each week by
   /Performance Reporting/Dashboard/tiktok_weekly_dashboard_html.py).
   ========================================================= */

window.Views = window.Views || {};

window.Views.weekly = (function () {

  var _section = 'summary';
  var _agencyFilter = 'all'; // all | creatify | thc | elle | internal | unattributed
  var _searchQ = '';

  /* ── Section definitions ── */
  var SECTIONS = [
    { id: 'summary',  label: 'Executive Summary' },
    { id: 'videos',   label: 'Video Leaderboard' },
    { id: 'new',      label: 'New Winners' },
    { id: 'legacy',   label: 'Legacy' },
    { id: 'decline',  label: 'Declining' },
    { id: 'ttp',      label: 'Time-to-Perform' },
    { id: 'creators', label: 'Creator Leaderboard' },
    { id: 'agency',   label: 'Agency Split' },
    { id: 'diag',     label: 'Diagnostics' },
    { id: 'rep',      label: 'Replication' },
    { id: 'action',   label: 'Action Plan' }
  ];

  var AGENCY_LABELS = {
    creatify: 'Creatify', thc: 'THC', elle: 'Elle Media',
    internal: 'Internal', unattributed: 'Unattributed', all: 'All'
  };
  var AGENCY_COLORS = {
    creatify: '#0284c7', thc: '#8b5cf6', elle: '#f97316',
    internal: '#10b981', unattributed: '#94a3b8'
  };

  /* ── Helpers ── */
  function statusBadge(s) {
    var map = {
      'New Winner': 'green', 'Scaling Winner': 'green',
      'Legacy Performer': 'blue', 'Steady': 'gray',
      'Watchlist': 'yellow', 'Declining Winner': 'red',
      'Dead / No Traction': 'gray',
      'Top Revenue Driver': 'green', 'Consistent Performer': 'blue',
      'Emerging Creator': 'purple', 'High Output / Low Conversion': 'yellow',
      'Declining Creator': 'red', 'One-Hit Performer': 'orange', 'Inactive': 'gray'
    };
    var color = map[s] || 'gray';
    return '<span class="badge badge-' + color + '">' + (s || '') + '</span>';
  }
  function agencyTag(a) {
    return '<span class="badge badge-gray" style="background:' + (AGENCY_COLORS[a]||'#94a3b8')
      + ';color:#fff;opacity:.85">' + (AGENCY_LABELS[a] || a) + '</span>';
  }
  function ageColor(d) {
    if (d == null) return '#94a3b8';
    if (d <= 14) return '#10b981';
    if (d <= 30) return '#3b82f6';
    if (d <= 90) return '#f59e0b';
    return '#ef4444';
  }
  function fmtMoney(v) { return v == null ? '—' : '$' + Math.round(v).toLocaleString(); }
  function fmtPctChg(p) {
    if (p == null) return '—';
    var sign = p >= 0 ? '+' : '';
    var cls = p >= 0 ? 'text-green' : 'text-red';
    return '<span class="' + cls + '">' + sign + p.toFixed(1) + '%</span>';
  }
  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }
  function applyAgencyFilter(rows) {
    if (_agencyFilter === 'all') return rows;
    return rows.filter(function (r) { return r.agency === _agencyFilter; });
  }
  function applySearch(rows) {
    if (!_searchQ) return rows;
    var q = _searchQ.toLowerCase();
    return rows.filter(function (r) {
      return ((r.creator||'').toLowerCase().indexOf(q) >= 0)
          || ((r.url||'').toLowerCase().indexOf(q) >= 0)
          || ((r.name||'').toLowerCase().indexOf(q) >= 0);
    });
  }
  function visible(rows) { return applySearch(applyAgencyFilter(rows || [])); }

  /* ── Render ── */
  function render() {
    var D = window.DATA_WEEKLY;
    var main = document.getElementById('main-content');
    if (!main) return;

    if (!D) {
      main.innerHTML =
        '<div class="placeholder-card" style="margin-top:60px">' +
          '<h3>Weekly TikTok data not loaded</h3>' +
          '<p>Run <code>tiktok_weekly_dashboard_html.py</code> from ' +
          '<code>/Performance Reporting/Dashboard/</code> to populate ' +
          '<code>data/weekly-tiktok.js</code>, then reload.</p>' +
        '</div>';
      return;
    }

    var html = '<div class="tab-pane">';

    // Page title
    html += '<div class="page-title"><h1>Weekly TikTok Performance</h1>' +
      '<div class="subtitle">Week of ' + D.label + ' &nbsp;·&nbsp; '
      + 'Generated ' + D.generated_at + ' &nbsp;·&nbsp; '
      + 'Source: TikTok Shop creator + video performance reports</div></div>';

    // Filter row
    html += '<div class="flex-between" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px">';
    html += '<div class="filter-chips">';
    ['all','creatify','thc','elle','internal','unattributed'].forEach(function (a) {
      var isActive = _agencyFilter === a;
      var count = '';
      if (a === 'all') {
        count = ' (' + D.creators.length + ')';
      } else {
        count = ' (' + D.creators.filter(function(c){return c.agency === a;}).length + ')';
      }
      html += '<button class="filter-chip ' + (isActive ? 'active' : '') + '" '
        + 'data-agency="' + a + '">' + AGENCY_LABELS[a] + count + '</button>';
    });
    html += '</div>';
    html += '<div class="search-wrap" style="min-width:240px">'
      + '<span class="search-icon">🔍</span>'
      + '<input type="text" class="search-bar" id="wk-search" placeholder="Filter creator or URL…" value="'
      + escapeHtml(_searchQ) + '"></div>';
    html += '</div>';

    // Sub-tab bar
    html += '<div class="filter-chips" style="margin-bottom:18px;border-bottom:1px solid var(--gray-200);padding-bottom:8px">';
    SECTIONS.forEach(function (s) {
      html += '<button class="filter-chip ' + (_section === s.id ? 'active' : '') + '" data-sec="' + s.id + '">' + s.label + '</button>';
    });
    html += '</div>';

    html += '<div id="wk-section-body">';
    html += renderSection(_section, D);
    html += '</div>';

    html += '</div>';
    main.innerHTML = html;

    bindFilterChips();
    drawCharts(_section, D);
  }

  /* ── Section dispatcher ── */
  function renderSection(sec, D) {
    switch (sec) {
      case 'summary':  return summarySection(D);
      case 'videos':   return videosSection(D);
      case 'new':      return newSection(D);
      case 'legacy':   return legacySection(D);
      case 'decline':  return declineSection(D);
      case 'ttp':      return ttpSection(D);
      case 'creators': return creatorsSection(D);
      case 'agency':   return agencySection(D);
      case 'diag':     return diagSection(D);
      case 'rep':      return repSection(D);
      case 'action':   return actionSection(D);
    }
    return '';
  }

  /* ── 1. Executive Summary ── */
  function summarySection(D) {
    var k = D.kpis;
    var ins = D.insight;

    // Filter-aware creator/video totals
    var c = visible(D.creators);
    var topV = visible(D.topVideos);
    var fGMV = c.reduce(function (s, r) { return s + r.gmv; }, 0);
    var fOrders = c.reduce(function (s, r) { return s + r.orders; }, 0);
    var fSellers = c.length;

    // 5 cards (was 6 → 8 originally). 2026-05 final cull: WoW $ folded into Total
    // Weekly GMV subtitle (one card, both signals). Title Case on labels.
    var wowDollar = (k.wow_dollar != null) ? k.wow_dollar : null;
    var wowPart = '';
    if (wowDollar != null && k.wow_pct != null) {
      var arrow = wowDollar >= 0 ? '▲' : '▼';
      var sign = wowDollar >= 0 ? '+' : '−';
      wowPart = arrow + ' ' + sign + fmtMoney(Math.abs(wowDollar)) + ' (' + (wowDollar >= 0 ? '+' : '−') + Math.abs(k.wow_pct).toFixed(2) + '% WoW)';
    } else {
      wowPart = 'baseline';
    }
    var html = '<div class="kpi-grid">';
    html += kpiCard('Total Weekly GMV',
      _agencyFilter === 'all' ? fmtMoney(k.total_gmv) : fmtMoney(fGMV),
      wowPart,
      'green');
    html += kpiCard('Selling Videos',
      _agencyFilter === 'all' ? k.selling_videos.toLocaleString() : visible(D.topVideos).length + '+',
      'of ' + k.total_videos.toLocaleString() + ' tracked',
      'green');
    html += kpiCard('Selling Creators (This Week)',
      _agencyFilter === 'all' ? k.selling_creators.toLocaleString() : fSellers.toLocaleString(),
      'of ' + k.total_creators.toLocaleString() + ' tracked',
      'orange');
    html += kpiCard('New Winners (≤14d)',
      k.new_selling_videos.toLocaleString(),
      k.new_pct != null ? k.new_pct.toFixed(2) + '% of GMV' : 'fresh content',
      'green');
    html += kpiCard('Top-5 Concentration',
      k.top5_creator_share.toFixed(2) + '% / ' + k.top5_video_share.toFixed(2) + '%',
      'creators / videos share of GMV',
      'red');
    html += '</div>';

    // KPI legend
    html += '<div class="kpi-legend">' +
      '<div class="kpi-legend-title">What these KPIs mean</div>' +
      '<dl>' +
        '<dt>Total Weekly GMV</dt><dd>All shoppable-video + livestream GMV for the reporting week. WoW change shown in dollars and percent.</dd>' +
        '<dt>Selling Videos</dt><dd>Number of videos that produced any GMV this week, against the total tracked.</dd>' +
        '<dt>Selling Creators (This Week)</dt><dd>Distinct creators with ≥ 1 selling video this week. Note: not the same as performing creators on the agency side (different cadence + denominator).</dd>' +
        '<dt>New Winners (≤14d)</dt><dd>Selling videos posted in the last 14 days — measures pipeline freshness.</dd>' +
        '<dt>Top-5 Concentration</dt><dd>Share of weekly GMV from the top 5 creators / top 5 videos. High concentration = pipeline fragility.</dd>' +
      '</dl></div>';

    // Leadership insight banner
    html += '<div class="alert-bar" style="margin-bottom:14px"><div class="alert alert-blue"><div>'
      + '<div style="margin-bottom:6px"><strong>What happened:</strong> ' + ins.what + '</div>'
      + '<div style="margin-bottom:6px"><strong>Why it matters:</strong> ' + ins.why + '</div>'
      + '<div><strong>Recommended actions:</strong><ul style="margin:4px 0 0 20px;padding:0">'
      + ins.actions.map(function (a) { return '<li>' + a + '</li>'; }).join('')
      + '</ul></div>'
      + '</div></div></div>';

    // Charts row
    html += '<div class="chart-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">';
    html += '<div class="chart-card"><div class="chart-title">GMV by video age</div>'
      + '<div class="chart-sub">Heavy legacy = fragile pipeline. Currently ' + k.legacy_pct + '% from videos older than 30 days.</div>'
      + '<canvas id="wk-c-age" height="200"></canvas></div>';
    html += '<div class="chart-card"><div class="chart-title">Top 15 creators — this week vs prior</div>'
      + '<div class="chart-sub">Blue = this week · grey = prior week</div>'
      + '<canvas id="wk-c-creators" height="200"></canvas></div>';
    html += '</div>';

    html += '<div class="chart-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">';
    html += '<div class="chart-card"><div class="chart-title">Top 15 videos — GMV (color = days since post)</div>'
      + '<div class="chart-sub">Green ≤14d · blue 15-30d · orange 31-90d · red 90d+</div>'
      + '<canvas id="wk-c-videos" height="200"></canvas></div>';
    html += '<div class="chart-card"><div class="chart-title">Creator status mix</div>'
      + '<div class="chart-sub">GMV concentration by status tag (selling creators only)</div>'
      + '<canvas id="wk-c-cstatus" height="200"></canvas></div>';
    html += '</div>';

    return html;
  }

  /* ── 2. Video Leaderboard ── */
  function videosSection(D) {
    var rows = visible(D.topVideos);
    var html = '<div style="margin-bottom:8px;color:var(--gray-500);font-size:12px">'
      + 'Showing ' + rows.length + ' top selling videos this week.</div>';
    html += renderVideoTable(rows, 'wk-tbl-videos');
    return html;
  }

  /* ── 3. New Winners ── */
  function newSection(D) {
    var rows = visible(D.newWinners);
    var newGMV = rows.reduce(function (s, r) { return s + r.gmv; }, 0);

    // New post yield: of all videos posted in the last 7 days, what % generated GMV?
    // Pulls from ageBuckets[New (0-7d)] which carries both `videos` (total posts in window)
    // and `selling` (subset that produced GMV). Drops `≤3-day Winners` and `Median Age`
    // (the latter lives in TTP) per 2026-05 KPI rationalization.
    var newBucket = (D.ageBuckets || []).find(function (b) {
      return b['Age bucket'] === 'New (0-7d)';
    }) || { videos: 0, selling: 0, gmv: 0 };
    var newPostYield = newBucket.videos > 0 ? (newBucket.selling / newBucket.videos * 100) : 0;
    var yieldColor = newPostYield >= 5 ? 'green' : newPostYield >= 2 ? 'yellow' : 'red';

    var top = rows.length ? rows[0] : null;

    // 3 cards (was 4). Dropped "New Selling Videos" (already on Summary as "New Winners ≤14d").
    var html = '<div class="kpi-grid">';
    html += kpiCard('New Post Yield (7d)',
      newPostYield.toFixed(2) + '%',
      newBucket.selling.toLocaleString() + ' of ' + newBucket.videos.toLocaleString() + ' fresh posts produced GMV',
      yieldColor);
    html += kpiCard('GMV From New', fmtMoney(newGMV),
      D.kpis.video_gmv ? (newGMV / D.kpis.video_gmv *100).toFixed(2) + '% of weekly video GMV' : '',
      'green');
    html += kpiCard('Top New Video',
      top ? fmtMoney(top.gmv) : '—',
      top ? '@' + top.creator : '',
      'orange');
    html += '</div>';

    // KPI legend
    html += '<div class="kpi-legend">' +
      '<div class="kpi-legend-title">What these KPIs mean</div>' +
      '<dl>' +
        '<dt>New Post Yield (7d)</dt><dd>Of all videos posted in the last 7 days, the share that produced any GMV. Higher = fresh content is converting.</dd>' +
        '<dt>GMV From New</dt><dd>Total weekly GMV from videos posted ≤14 days ago, plus its share of weekly video GMV.</dd>' +
        '<dt>Top New Video</dt><dd>Highest-grossing video posted ≤14 days ago this week.</dd>' +
      '</dl></div>';

    var note = rows.length >= 50
      ? '<strong>' + rows.length + ' new videos</strong> are producing GMV — pipeline is alive. Top of stack: @'
        + (rows[0]||{}).creator + ' at ' + fmtMoney((rows[0]||{}).gmv)
      : '<strong>Only ' + rows.length + ' new videos</strong> are producing GMV — pipeline is thin. Push briefs and expand sample volume this week.';
    html += '<div class="alert-bar"><div class="alert alert-blue"><div>' + note + '</div></div></div>';

    html += '<div style="height:12px"></div>';
    html += renderVideoTable(rows, 'wk-tbl-new');
    return html;
  }

  /* ── 4. Legacy ── */
  function legacySection(D) {
    var rows = visible(D.legacyTop);
    var legGMV = D.ageBuckets.filter(function(b){return b['Age bucket']==='Legacy (31-90d)' || b['Age bucket']==='Long-tail (90+d)';})
      .reduce(function(s,b){return s+b.gmv;}, 0);

    // 3 cards (was 4). Dropped "Legacy Selling Videos" count — folded into Legacy GMV subtitle.
    var lt = D.ageBuckets.find(function(b){return b['Age bucket']==='Long-tail (90+d)';});
    var ltShare = D.kpis.video_gmv ? ((lt && lt.gmv) / D.kpis.video_gmv *100).toFixed(2) : '0';

    var html = '<div class="kpi-grid">';
    html += kpiCard('Legacy GMV', fmtMoney(legGMV),
      D.kpis.legacy_pct.toFixed(2) + '% of video GMV · ' + D.kpis.legacy_selling_videos.toLocaleString() + ' selling videos >30d old',
      'orange');
    html += kpiCard('90d+ Long-tail Share', ltShare + '%',
      'GMV from videos older than 90 days', 'red');
    html += kpiCard('Top Legacy Video',
      fmtMoney((rows[0]||{}).gmv||0),
      '@' + ((rows[0]||{}).creator||'—'),
      'red');
    html += '</div>';

    // KPI legend
    html += '<div class="kpi-legend">' +
      '<div class="kpi-legend-title">What these KPIs mean</div>' +
      '<dl>' +
        '<dt>Legacy GMV</dt><dd>Total weekly GMV from videos older than 30 days, plus its share of weekly video GMV. Heavy legacy share = pipeline isn\'t replacing winners fast enough.</dd>' +
        '<dt>90d+ Long-tail Share</dt><dd>Share of weekly GMV from videos older than 90 days. High share suggests deep dependence on a few aged hits.</dd>' +
        '<dt>Top Legacy Video</dt><dd>Highest-grossing video older than 30 days this week.</dd>' +
      '</dl></div>';

    html += '<div class="chart-card" style="margin-bottom:14px"><div class="chart-title">GMV & selling-video count by age bucket</div>'
      + '<div class="chart-sub">Bars = GMV · line = number of selling videos in that bucket</div>'
      + '<canvas id="wk-c-legacy" height="160"></canvas></div>';

    html += renderVideoTable(rows, 'wk-tbl-legacy');
    return html;
  }

  /* ── 5. Declining ── */
  function declineSection(D) {
    var rows = D.declining || [];
    if (_agencyFilter !== 'all' || _searchQ) {
      // Decline rows don't carry agency directly; resolve via creator list
      var ag = {};
      D.creators.forEach(function (c) { ag[c.creator] = c.agency; });
      rows = rows.filter(function (r) {
        var hit = (_agencyFilter === 'all') || (ag[r.creator] === _agencyFilter);
        if (!hit) return false;
        if (_searchQ) {
          var q = _searchQ.toLowerCase();
          return ((r.creator||'').toLowerCase().indexOf(q) >= 0)
              || ((r.url||'').toLowerCase().indexOf(q) >= 0);
        }
        return true;
      });
    }

    var sev = rows.reduce(function (m, r) { m[r.severity] = (m[r.severity]||0)+1; return m; }, {});
    var lossSum = rows.reduce(function (s, r) { return s + Math.abs(r.delta); }, 0);

    var html = '<div class="alert-bar"><div class="alert alert-yellow"><div>'
      + '<strong>' + rows.length + ' videos</strong> are below their Jan-Mar weekly average — '
      + 'Severe: ' + (sev.Severe||0) + ' · Moderate: ' + (sev.Moderate||0) + ' · Mild: ' + (sev.Mild||0) + '. '
      + 'Total weekly GMV gap to recapture: <strong>' + fmtMoney(lossSum) + '</strong>.'
      + '</div></div></div>';

    html += '<div style="height:12px"></div>';
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr>'
      + '<th style="text-align:left">Creator</th>'
      + '<th style="text-align:left">Video</th>'
      + '<th>Posted</th><th>Age</th><th>Severity</th>'
      + '<th>Prior wk avg</th><th>This week</th>'
      + '<th>Δ $</th><th>Δ %</th><th>Lifetime GMV</th>'
      + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      var sevBadge = '<span class="badge badge-' + (r.severity==='Severe'?'red':r.severity==='Moderate'?'yellow':'gray') + '">' + r.severity + '</span>';
      html += '<tr>'
        + '<td style="text-align:left">@' + r.creator + '</td>'
        + '<td style="text-align:left"><a class="link" target="_blank" href="' + r.url + '">open ↗</a></td>'
        + '<td>' + r.post + '</td>'
        + '<td>' + (r.age != null ? r.age + 'd' : '—') + '</td>'
        + '<td>' + sevBadge + '</td>'
        + '<td>' + fmtMoney(r.prior_avg) + '</td>'
        + '<td>' + fmtMoney(r.gmv) + '</td>'
        + '<td class="text-red">' + fmtMoney(r.delta) + '</td>'
        + '<td class="text-red">' + r.pct.toFixed(2) + '%</td>'
        + '<td>' + fmtMoney(r.lifetime_gmv) + '</td>'
        + '</tr>';
    });
    html += '</tbody></table></div></div>';
    return html;
  }

  /* ── 6. Time-to-Performance ── */
  function ttpSection(D) {
    var t = D.timeToPerf;
    var fastest = visible(t.fastest || []);

    // 3 cards (was 4). Dropped "Avg age" — folded into Median Age subtitle (median is more robust).
    var html = '<div class="kpi-grid">';
    html += kpiCard('Median Post-to-Perf Age',
      t.median_age + 'd',
      'avg ' + t.avg_age + 'd · selling videos this week',
      'green');
    html += kpiCard('Fastest ≤7d Performers',
      fastest.length,
      '≤7d old, GMV > 0',
      'green');
    html += kpiCard('Top Fastest GMV',
      fmtMoney((fastest[0]||{}).gmv||0),
      '@' + ((fastest[0]||{}).creator||'—'),
      'orange');
    html += '</div>';

    // KPI legend
    html += '<div class="kpi-legend">' +
      '<div class="kpi-legend-title">What these KPIs mean</div>' +
      '<dl>' +
        '<dt>Median Post-to-Perf Age</dt><dd>Median number of days from post date to first GMV across all selling videos this week. Lower = videos converting faster after publication.</dd>' +
        '<dt>Fastest ≤7d Performers</dt><dd>Count of videos that produced GMV within 7 days of posting — pipeline of fast-ramping content.</dd>' +
        '<dt>Top Fastest GMV</dt><dd>Highest single-video GMV among the fast-performing ≤7d set.</dd>' +
      '</dl></div>';

    html += '<div class="chart-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">';
    html += '<div class="chart-card"><div class="chart-title">Days from post to milestone</div>'
      + '<div class="chart-sub">Median (blue) and average (orange) age of videos that have reached each threshold</div>'
      + '<canvas id="wk-c-milestones" height="220"></canvas></div>';
    html += '<div class="chart-card"><div class="chart-title">Milestone reach summary</div>'
      + '<div class="chart-sub">How many videos cleared each bar</div>'
      + '<div class="table-scroll"><table class="data-table">'
      + '<thead><tr><th style="text-align:left">Threshold</th><th>Videos that reached it</th><th>Median age (d)</th><th>Avg age (d)</th></tr></thead><tbody>';
    (t.milestones || []).forEach(function (m) {
      html += '<tr><td style="text-align:left">' + m.label + '</td><td>'
        + m.videos.toLocaleString() + '</td><td>' + m.median_age + '</td><td>' + m.avg_age + '</td></tr>';
    });
    html += '</tbody></table></div></div></div>';

    html += '<div style="margin:18px 0 8px;color:var(--gray-700);font-weight:700;font-size:12px">Fastest performers this week (≤7 days old)</div>';
    html += renderVideoTable(fastest, 'wk-tbl-fast');
    return html;
  }

  /* ── 7. Creator Leaderboard ── */
  function creatorsSection(D) {
    var rows = visible(D.creators);
    var html = '<div style="margin-bottom:8px;color:var(--gray-500);font-size:12px">'
      + 'Showing ' + rows.length + ' selling creators (filtered).</div>';
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr>'
      + '<th style="text-align:left">#</th>'
      + '<th style="text-align:left">Creator</th>'
      + '<th style="text-align:left">Agency</th>'
      + '<th style="text-align:left">Status</th>'
      + '<th>GMV</th><th>Prior wk</th><th>Δ $</th><th>Δ %</th>'
      + '<th>Orders</th><th>Items</th><th>Videos</th><th>GMV/Vid</th>'
      + '<th>AOV</th><th>Repeat wks</th><th>Followers</th>'
      + '</tr></thead><tbody>';
    rows.forEach(function (r, i) {
      var deltaCls = r.wow_dollar >= 0 ? 'text-green' : 'text-red';
      var sign = r.wow_dollar >= 0 ? '+' : '';
      html += '<tr>'
        + '<td style="text-align:left">' + (i+1) + '</td>'
        + '<td style="text-align:left">@' + r.creator + '</td>'
        + '<td style="text-align:left">' + agencyTag(r.agency) + '</td>'
        + '<td style="text-align:left">' + statusBadge(r.status) + '</td>'
        + '<td><strong>' + fmtMoney(r.gmv) + '</strong></td>'
        + '<td>' + fmtMoney(r.prior_gmv) + '</td>'
        + '<td class="' + deltaCls + '">' + sign + fmtMoney(r.wow_dollar) + '</td>'
        + '<td>' + fmtPctChg(r.wow_pct) + '</td>'
        + '<td>' + r.orders.toLocaleString() + '</td>'
        + '<td>' + r.items.toLocaleString() + '</td>'
        + '<td>' + r.videos.toLocaleString() + '</td>'
        + '<td>' + (r.videos > 0 ? fmtMoney(r.gmv / r.videos) : '—') + '</td>'
        + '<td>' + (r.aov > 0 ? '$' + r.aov.toFixed(2) : '—') + '</td>'
        + '<td>' + r.repeat_weeks + '</td>'
        + '<td>' + r.followers.toLocaleString() + '</td>'
        + '</tr>';
    });
    html += '</tbody></table></div></div>';
    return html;
  }

  /* ── 8. Agency Split ── */
  function agencySection(D) {
    var rows = D.agencyRollup || [];
    var html = '<div class="alert-bar"><div class="alert alert-blue"><div>'
      + 'Attribution sourced from <code>03_TikTok/Agency/&lt;agency&gt;/*.csv</code> rosters. '
      + 'Roster sizes: '
      + Object.keys(D.agencyRosterSizes || {}).map(function (k) {
        return '<strong>' + AGENCY_LABELS[k] + '</strong> ' + D.agencyRosterSizes[k];
      }).join(' · ')
      + '. Creators not on any roster show as <em>Unattributed</em>.'
      + '</div></div></div>';

    html += '<div class="chart-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:14px 0">';
    html += '<div class="chart-card"><div class="chart-title">GMV by agency this week</div>'
      + '<div class="chart-sub">Color-coded against the platform agency palette</div>'
      + '<canvas id="wk-c-agency-gmv" height="220"></canvas></div>';
    html += '<div class="chart-card"><div class="chart-title">New vs Legacy videos by agency</div>'
      + '<div class="chart-sub">Selling videos this week, split by post age</div>'
      + '<canvas id="wk-c-agency-mix" height="220"></canvas></div>';
    html += '</div>';

    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr>'
      + '<th style="text-align:left">Agency</th>'
      + '<th>Roster size</th>'
      + '<th>Selling creators</th>'
      + '<th>GMV (creator)</th><th>Prior wk</th><th>WoW</th>'
      + '<th>GMV (video)</th><th>Selling videos</th>'
      + '<th>New ≤14d</th><th>Legacy >30d</th>'
      + '<th>Orders</th>'
      + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr>'
        + '<td style="text-align:left">' + agencyTag(r.Agency) + '</td>'
        + '<td>' + (r.roster_size || 0) + '</td>'
        + '<td>' + (r.creators || 0) + '</td>'
        + '<td><strong>' + fmtMoney(r.gmv) + '</strong></td>'
        + '<td>' + fmtMoney(r.prior_gmv) + '</td>'
        + '<td>' + fmtPctChg(r.wow_pct == null || isNaN(r.wow_pct) ? null : r.wow_pct) + '</td>'
        + '<td>' + fmtMoney(r.video_gmv) + '</td>'
        + '<td>' + (r.selling_videos || 0) + '</td>'
        + '<td>' + (r.new_videos || 0) + '</td>'
        + '<td>' + (r.legacy_videos || 0) + '</td>'
        + '<td>' + (r.orders || 0).toLocaleString() + '</td>'
        + '</tr>';
    });
    html += '</tbody></table></div></div>';
    return html;
  }

  /* ── 9. Diagnostics ── */
  function diagSection(D) {
    var html = '<div class="chart-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">';
    html += '<div class="chart-card"><div class="chart-title">Creator status — GMV concentration</div>'
      + '<div class="chart-sub">How GMV distributes across creator status tags</div>'
      + '<canvas id="wk-c-diag-c" height="220"></canvas></div>';
    html += '<div class="chart-card"><div class="chart-title">Video status — GMV concentration</div>'
      + '<div class="chart-sub">Where revenue lands across video status tags</div>'
      + '<canvas id="wk-c-diag-v" height="220"></canvas></div>';
    html += '</div>';

    html += '<div style="margin:18px 0 8px;color:var(--gray-700);font-weight:700;font-size:12px">Creator status counts</div>';
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr><th style="text-align:left">Status</th><th>Creators</th><th>GMV</th><th>GMV %</th></tr></thead><tbody>';
    var totalC = D.creatorStatus.reduce(function (s, r) { return s + r.gmv; }, 0) || 1;
    D.creatorStatus.forEach(function (r) {
      html += '<tr><td style="text-align:left">' + statusBadge(r.Status) + '</td><td>'
        + r.creators + '</td><td>' + fmtMoney(r.gmv) + '</td><td>'
        + (r.gmv / totalC *100).toFixed(2) + '%</td></tr>';
    });
    html += '</tbody></table></div></div>';

    html += '<div style="margin:18px 0 8px;color:var(--gray-700);font-weight:700;font-size:12px">Video status counts</div>';
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr><th style="text-align:left">Status</th><th>Videos</th><th>GMV</th><th>GMV %</th></tr></thead><tbody>';
    var totalV = D.videoStatus.reduce(function (s, r) { return s + r.gmv; }, 0) || 1;
    D.videoStatus.forEach(function (r) {
      html += '<tr><td style="text-align:left">' + statusBadge(r.Status) + '</td><td>'
        + r.videos + '</td><td>' + fmtMoney(r.gmv) + '</td><td>'
        + (r.gmv / totalV *100).toFixed(2) + '%</td></tr>';
    });
    html += '</tbody></table></div></div>';
    return html;
  }

  /* ── 10. Replication ── */
  function repSection(D) {
    var html = '<div class="chart-card" style="margin-bottom:14px"><div class="chart-title">Angle tag GMV share</div>'
      + '<div class="chart-sub">Inferred from video name/caption keywords. Directional only.</div>'
      + '<canvas id="wk-c-rep" height="180"></canvas></div>';
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr><th style="text-align:left">Angle tag</th><th>GMV</th><th>Share</th><th>Selling videos</th><th>Orders</th></tr></thead><tbody>';
    (D.replication || []).forEach(function (r) {
      html += '<tr><td style="text-align:left">' + r.tag + '</td><td>'
        + fmtMoney(r.gmv) + '</td><td>' + (r.share*100).toFixed(2) + '%</td><td>'
        + r.videos + '</td><td>' + r.orders.toLocaleString() + '</td></tr>';
    });
    html += '</tbody></table></div></div>';
    return html;
  }

  /* ── 11. Action Plan ── */
  function actionSection(D) {
    var rows = D.actions || [];
    if (_agencyFilter !== 'all') {
      var ag = {};
      D.creators.forEach(function (c) { ag[c.creator] = c.agency; });
      rows = rows.filter(function (r) { return ag[r.creator] === _agencyFilter; });
    }
    if (_searchQ) {
      var q = _searchQ.toLowerCase();
      rows = rows.filter(function (r) {
        return ((r.creator||'').toLowerCase().indexOf(q) >= 0)
            || ((r.asset||'').toLowerCase().indexOf(q) >= 0)
            || ((r.action||'').toLowerCase().indexOf(q) >= 0);
      });
    }

    var html = '<div class="alert-bar"><div class="alert alert-blue"><div>'
      + '<strong>How to read:</strong> Boost = paid amplification &nbsp;·&nbsp; '
      + 'Replicate = brief 3 lookalikes &nbsp;·&nbsp; Coach = traffic without conversion &nbsp;·&nbsp; '
      + 'Reactivate = creator dropped sharply &nbsp;·&nbsp; Replace = legacy decaying &nbsp;·&nbsp; '
      + 'Sample = emerging creator &nbsp;·&nbsp; Retainer = lock relationship.'
      + '</div></div></div>';

    html += '<div style="height:12px"></div>';
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr>'
      + '<th style="text-align:left">Priority</th>'
      + '<th style="text-align:left">Action</th>'
      + '<th style="text-align:left">Owner</th>'
      + '<th style="text-align:left">Creator</th>'
      + '<th style="text-align:left">Asset</th>'
      + '<th style="text-align:left">Why</th>'
      + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      var priColor = r.priority === 'High' ? 'red' : r.priority === 'Medium' ? 'yellow' : 'green';
      var assetCell = r.asset && r.asset.indexOf('http') === 0
        ? '<a class="link" target="_blank" href="' + r.asset + '">open ↗</a>'
        : escapeHtml(r.asset || '—');
      html += '<tr>'
        + '<td style="text-align:left"><span class="badge badge-' + priColor + '">' + r.priority + '</span></td>'
        + '<td style="text-align:left"><strong>' + r.action + '</strong></td>'
        + '<td style="text-align:left">' + r.owner + '</td>'
        + '<td style="text-align:left">@' + r.creator + '</td>'
        + '<td style="text-align:left">' + assetCell + '</td>'
        + '<td style="text-align:left">' + escapeHtml(r.why) + '</td>'
        + '</tr>';
    });
    html += '</tbody></table></div></div>';
    return html;
  }

  /* ── Shared video table renderer ── */
  function renderVideoTable(rows, _id) {
    var html = '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr>'
      + '<th style="text-align:left">#</th>'
      + '<th style="text-align:left">Creator</th>'
      + '<th style="text-align:left">Agency</th>'
      + '<th style="text-align:left">Video</th>'
      + '<th style="text-align:left">Status</th>'
      + '<th>Age</th><th>Posted</th>'
      + '<th>GMV</th><th>Lifetime</th>'
      + '<th>Orders</th><th>Views</th><th>CTR</th>'
      + '</tr></thead><tbody>';
    rows.forEach(function (r, i) {
      html += '<tr>'
        + '<td style="text-align:left">' + (i+1) + '</td>'
        + '<td style="text-align:left">@' + r.creator + '</td>'
        + '<td style="text-align:left">' + agencyTag(r.agency) + '</td>'
        + '<td style="text-align:left;max-width:340px;white-space:normal">'
          + '<a class="link" target="_blank" href="' + r.url + '">open ↗</a>'
          + '<div style="font-size:11px;color:var(--gray-500);margin-top:2px">' + escapeHtml(r.name||'') + '</div></td>'
        + '<td style="text-align:left">' + statusBadge(r.status) + '</td>'
        + '<td>' + (r.age != null ? r.age + 'd' : '—') + '</td>'
        + '<td>' + r.post + '</td>'
        + '<td><strong>' + fmtMoney(r.gmv) + '</strong></td>'
        + '<td>' + fmtMoney(r.lifetime_gmv) + '</td>'
        + '<td>' + r.orders.toLocaleString() + '</td>'
        + '<td>' + r.views.toLocaleString() + '</td>'
        + '<td>' + r.ctr + '</td>'
        + '</tr>';
    });
    html += '</tbody></table></div></div>';
    return html;
  }

  /* ── Bind interactive controls ── */
  function bindFilterChips() {
    document.querySelectorAll('.filter-chip[data-sec]').forEach(function (b) {
      b.addEventListener('click', function () {
        _section = b.getAttribute('data-sec');
        render();
      });
    });
    document.querySelectorAll('.filter-chip[data-agency]').forEach(function (b) {
      b.addEventListener('click', function () {
        _agencyFilter = b.getAttribute('data-agency');
        render();
      });
    });
    var srch = document.getElementById('wk-search');
    if (srch) {
      var debounce;
      srch.addEventListener('input', function () {
        clearTimeout(debounce);
        var v = this.value;
        debounce = setTimeout(function () {
          _searchQ = v;
          var body = document.getElementById('wk-section-body');
          if (body) {
            body.innerHTML = renderSection(_section, window.DATA_WEEKLY);
            drawCharts(_section, window.DATA_WEEKLY);
          }
        }, 200);
      });
    }
  }

  /* ── Charts ── */
  function drawCharts(section, D) {
    if (typeof Chart === 'undefined') return;

    function safeKill(id) {
      if (Charts && Charts.instances && Charts.instances[id]) {
        Charts.instances[id].destroy();
        delete Charts.instances[id];
      }
    }
    function track(id, instance) {
      if (Charts && Charts.instances) Charts.instances[id] = instance;
    }

    var ageOrder = ['New (0-7d)', 'Recent (8-30d)', 'Legacy (31-90d)', 'Long-tail (90+d)', 'Unknown'];
    var ageColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#94a3b8'];

    if (section === 'summary') {
      var c1 = document.getElementById('wk-c-age');
      if (c1) {
        safeKill('wk-c-age');
        track('wk-c-age', new Chart(c1.getContext('2d'), {
          type: 'doughnut',
          data: { labels: D.ageBuckets.map(function(b){return b['Age bucket'];}),
                  datasets: [{ data: D.ageBuckets.map(function(b){return b.gmv;}),
                              backgroundColor: D.ageBuckets.map(function(b){return ageColors[ageOrder.indexOf(b['Age bucket'])];}) }] },
          options: { plugins: { legend: { position: 'right' },
            tooltip: { callbacks: { label: function (c) {
              var t = D.ageBuckets.reduce(function(s,b){return s+b.gmv;}, 0);
              return c.label + ': ' + fmtMoney(c.parsed) + ' (' + (c.parsed/t*100).toFixed(2) + '%)';
            } } } } }
        }));
      }
      var c2 = document.getElementById('wk-c-creators');
      if (c2) {
        safeKill('wk-c-creators');
        track('wk-c-creators', new Chart(c2.getContext('2d'), {
          type: 'bar',
          data: {
            labels: D.creatorChart.map(function(c){return '@'+c.creator;}),
            datasets: [
              { label: 'This week', data: D.creatorChart.map(function(c){return c.gmv;}), backgroundColor: '#0284c7' },
              { label: 'Prior week', data: D.creatorChart.map(function(c){return c.prior_gmv;}), backgroundColor: '#94a3b8' }
            ]
          },
          options: { indexAxis: 'y', plugins: { legend: { position: 'top' },
            tooltip: { callbacks: { label: function(c) { return c.dataset.label + ': ' + fmtMoney(c.parsed.x); } } } },
            scales: { x: { ticks: { callback: function(v){ return fmtMoney(v); } } } } }
        }));
      }
      var c3 = document.getElementById('wk-c-videos');
      if (c3) {
        safeKill('wk-c-videos');
        track('wk-c-videos', new Chart(c3.getContext('2d'), {
          type: 'bar',
          data: {
            labels: D.videoChart.map(function(v,i){return '#'+(i+1)+' @'+v.creator;}),
            datasets: [{ data: D.videoChart.map(function(v){return v.gmv;}),
              backgroundColor: D.videoChart.map(function(v){return ageColor(v.age);}) }]
          },
          options: { indexAxis: 'y', plugins: { legend: { display: false },
            tooltip: { callbacks: { label: function(c){ var d=D.videoChart[c.dataIndex]; return [fmtMoney(c.parsed.x), 'Age: '+(d.age||'?')+'d']; } } } },
            scales: { x: { ticks: { callback: function(v){ return fmtMoney(v); } } } } }
        }));
      }
      var c4 = document.getElementById('wk-c-cstatus');
      if (c4) {
        safeKill('wk-c-cstatus');
        var palette = ['#10b981','#3b82f6','#06b6d4','#8b5cf6','#f59e0b','#ef4444','#94a3b8','#0284c7'];
        track('wk-c-cstatus', new Chart(c4.getContext('2d'), {
          type: 'doughnut',
          data: { labels: D.creatorStatus.map(function(c){return c.Status;}),
                  datasets: [{ data: D.creatorStatus.map(function(c){return c.gmv;}), backgroundColor: palette }] },
          options: { plugins: { legend: { position: 'right' },
            tooltip: { callbacks: { label: function(c){ return c.label + ': ' + fmtMoney(c.parsed); } } } } }
        }));
      }
    }

    if (section === 'legacy') {
      var c5 = document.getElementById('wk-c-legacy');
      if (c5) {
        safeKill('wk-c-legacy');
        track('wk-c-legacy', new Chart(c5.getContext('2d'), {
          type: 'bar',
          data: {
            labels: ageOrder,
            datasets: [
              { label: 'GMV', data: ageOrder.map(function(a){var b=D.ageBuckets.find(function(x){return x['Age bucket']===a;});return b?b.gmv:0;}),
                backgroundColor: ageColors, yAxisID: 'y' },
              { label: 'Selling videos', data: ageOrder.map(function(a){var b=D.ageBuckets.find(function(x){return x['Age bucket']===a;});return b?b.selling:0;}),
                type: 'line', borderColor: '#0f172a', backgroundColor: '#0f172a', yAxisID: 'y2' }
            ]
          },
          options: { plugins: { legend: { position: 'top' } },
            scales: { y: { ticks: { callback: function(v){ return fmtMoney(v); } }, title: { display: true, text: 'GMV ($)' } },
                      y2: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Selling videos' } } } }
        }));
      }
    }

    if (section === 'ttp') {
      var c6 = document.getElementById('wk-c-milestones');
      if (c6) {
        safeKill('wk-c-milestones');
        track('wk-c-milestones', new Chart(c6.getContext('2d'), {
          type: 'bar',
          data: { labels: D.timeToPerf.milestones.map(function(m){return m.label;}),
                  datasets: [
                    { label: 'Median age (days)', data: D.timeToPerf.milestones.map(function(m){return m.median_age;}), backgroundColor: '#3b82f6' },
                    { label: 'Avg age (days)',    data: D.timeToPerf.milestones.map(function(m){return m.avg_age;}),    backgroundColor: '#f59e0b' }
                  ] },
          options: { plugins: { legend: { position: 'top' } },
                     scales: { y: { title: { display: true, text: 'Days from post' } } } }
        }));
      }
    }

    if (section === 'agency') {
      var c7 = document.getElementById('wk-c-agency-gmv');
      if (c7) {
        safeKill('wk-c-agency-gmv');
        var ag = D.agencyRollup || [];
        track('wk-c-agency-gmv', new Chart(c7.getContext('2d'), {
          type: 'bar',
          data: { labels: ag.map(function(r){return AGENCY_LABELS[r.Agency]||r.Agency;}),
                  datasets: [
                    { label: 'This week', data: ag.map(function(r){return r.gmv;}),
                      backgroundColor: ag.map(function(r){return AGENCY_COLORS[r.Agency]||'#94a3b8';}) },
                    { label: 'Prior week', data: ag.map(function(r){return r.prior_gmv||0;}),
                      backgroundColor: '#cbd5e1' }
                  ] },
          options: { plugins: { legend: { position: 'top' },
            tooltip: { callbacks: { label: function(c){ return c.dataset.label + ': ' + fmtMoney(c.parsed.y); } } } },
            scales: { y: { ticks: { callback: function(v){ return fmtMoney(v); } } } } }
        }));
      }
      var c8 = document.getElementById('wk-c-agency-mix');
      if (c8) {
        safeKill('wk-c-agency-mix');
        var ag2 = D.agencyRollup || [];
        track('wk-c-agency-mix', new Chart(c8.getContext('2d'), {
          type: 'bar',
          data: { labels: ag2.map(function(r){return AGENCY_LABELS[r.Agency]||r.Agency;}),
                  datasets: [
                    { label: 'New ≤14d',  data: ag2.map(function(r){return r.new_videos||0;}),    backgroundColor: '#10b981', stack: 's' },
                    { label: 'Legacy >30d', data: ag2.map(function(r){return r.legacy_videos||0;}), backgroundColor: '#f59e0b', stack: 's' }
                  ] },
          options: { plugins: { legend: { position: 'top' } },
            scales: { x: { stacked: true }, y: { stacked: true, title: { display: true, text: 'Selling videos' } } } }
        }));
      }
    }

    if (section === 'diag') {
      var palette2 = ['#10b981','#3b82f6','#06b6d4','#8b5cf6','#f59e0b','#ef4444','#94a3b8','#0284c7'];
      var c9 = document.getElementById('wk-c-diag-c');
      if (c9) {
        safeKill('wk-c-diag-c');
        track('wk-c-diag-c', new Chart(c9.getContext('2d'), {
          type: 'doughnut',
          data: { labels: D.creatorStatus.map(function(r){return r.Status;}),
                  datasets: [{ data: D.creatorStatus.map(function(r){return r.gmv;}), backgroundColor: palette2 }] },
          options: { plugins: { legend: { position: 'right' },
            tooltip: { callbacks: { label: function(c){ return c.label + ': ' + fmtMoney(c.parsed); } } } } }
        }));
      }
      var c10 = document.getElementById('wk-c-diag-v');
      if (c10) {
        safeKill('wk-c-diag-v');
        track('wk-c-diag-v', new Chart(c10.getContext('2d'), {
          type: 'doughnut',
          data: { labels: D.videoStatus.map(function(r){return r.Status;}),
                  datasets: [{ data: D.videoStatus.map(function(r){return r.gmv;}), backgroundColor: palette2 }] },
          options: { plugins: { legend: { position: 'right' },
            tooltip: { callbacks: { label: function(c){ return c.label + ': ' + fmtMoney(c.parsed); } } } } }
        }));
      }
    }

    if (section === 'rep') {
      var c11 = document.getElementById('wk-c-rep');
      if (c11) {
        safeKill('wk-c-rep');
        track('wk-c-rep', new Chart(c11.getContext('2d'), {
          type: 'bar',
          data: { labels: (D.replication||[]).map(function(r){return r.tag;}),
                  datasets: [{ data: (D.replication||[]).map(function(r){return r.gmv;}), backgroundColor: '#0284c7' }] },
          options: { indexAxis: 'y', plugins: { legend: { display: false },
            tooltip: { callbacks: { label: function(c){
              var r=D.replication[c.dataIndex]; return fmtMoney(c.parsed.x) + ' (' + (r.share*100).toFixed(2) + '%)';
            } } } },
            scales: { x: { ticks: { callback: function(v){ return fmtMoney(v); } } } } }
        }));
      }
    }
  }

  /* ── Public API for the Affiliate Performance orchestrator ──
     The new affiliate_performance.js mounts individual sections inside
     its own layout, so we expose the section-level renderer + state
     setters without changing the legacy `render()` entry point. */
  function renderSectionInto(sectionId, container) {
    var D = window.DATA_WEEKLY;
    if (!D) {
      container.innerHTML = '<div class="placeholder-card">' +
        '<h3>Weekly TikTok data not loaded</h3>' +
        '<p>Re-run the weekly pipeline to regenerate <code>data/weekly-tiktok.js</code>.</p>' +
        '</div>';
      return;
    }
    var prev = _section;
    _section = sectionId;
    container.innerHTML = renderSection(sectionId, D);
    setTimeout(function () { drawCharts(sectionId, D); }, 50);
    _section = prev;
  }
  function setSource(s)  { _agencyFilter = s; }
  function getSource()   { return _agencyFilter; }
  function setSearch(q)  { _searchQ = q; }
  function getData()     { return window.DATA_WEEKLY; }

  return {
    render: render,
    renderSectionInto: renderSectionInto,
    setSource: setSource,
    getSource: getSource,
    setSearch: setSearch,
    getData: getData
  };

})();
