/* =========================================================
   Nusava — Executive Overview
   ---------------------------------------------------------
   Single-scroll meeting opener. The job of this view is to
   answer "did the engine work this week, and what should
   we discuss?" in 30 seconds of reading.

   Layout (per 2026-05 IA):
     1. Headline KPI strip       — Total GMV, Blended ROAS,
                                    Performing Creators, WoW driver
     2. Agency Scorecard          — sortable; deep-link to AP
     3. Creator Performance       — top 5 + concentration + median
     4. Video Performance         — top 3 + new winners + legacy
     5. Videos per SKU            — compact bar chart
     6. Narratives Summary        — top 3 winning families
     7. KPI legend
   ========================================================= */

window.Views = window.Views || {};

window.Views.executive = {

  render: function () {
    var main = document.getElementById('main-content');
    if (!main) return;

    /* ── Pull data ── */
    var agencyData = computeAgencyAggregates();
    var weekly = window.DATA_WEEKLY || null;

    /* ── Build HTML ── */
    var html = '<div class="page-title">' +
      '<h1>Executive Overview</h1>' +
      '<div class="subtitle">Cross-agency snapshot for the weekly review. ' +
      'Click any row to drill into Affiliate Performance.</div></div>';

    html += buildHeadlineKPIs(agencyData, weekly);
    html += buildAgencyScorecard(agencyData);
    html += buildCreatorSummary(weekly);
    html += buildVideoSummary(weekly);
    html += buildVideosPerSKU(weekly);
    html += buildNarrativesSummary();
    html += buildLegend();

    main.innerHTML = html;

    /* ── Wire deep links ── */
    document.querySelectorAll('[data-deep-link]').forEach(function (el) {
      el.addEventListener('click', function () {
        var target = el.getAttribute('data-deep-link');
        var source = el.getAttribute('data-source') || 'all';
        deepLink(target, source);
      });
    });

    /* No charts on Executive — all sections are tables/cards. */
  }
};

/* ───────────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────────── */

function computeAgencyAggregates() {
  var out = (CONFIG.agencies || []).map(function (ag) {
    var raw = U.getAgencyData(ag.id);
    if (!raw || !raw.months || !raw.months.length) return null;
    var months = U.enrichAll(raw);
    var latest = months[months.length - 1];
    var totalCost = months.reduce(function (s, m) { return s + (m.totalCost || 0); }, 0);
    var totalGMV  = months.reduce(function (s, m) { return s + (m.gmv || 0); }, 0);
    var overallROAS = totalCost > 0 ? totalGMV / totalCost : null;
    var avgPerfRate = months.reduce(function (s, m) { return s + (m.perfRate || 0); }, 0) / months.length;

    // Trend (latest vs prior month ROAS)
    var trend = '—';
    if (months.length >= 2) {
      var prev = months[months.length - 2].roi;
      var curr = latest.roi;
      if (prev != null && curr != null) {
        trend = curr > prev ? '<span class="trend-up">↑</span>' :
                curr < prev ? '<span class="trend-down">↓</span>' :
                              '<span class="trend-flat">→</span>';
      }
    }

    return {
      id: ag.id, name: ag.name, short: ag.short, color: ag.color,
      months: months, latest: latest,
      totalCost: totalCost, totalGMV: totalGMV,
      overallROAS: overallROAS, avgPerfRate: avgPerfRate, trend: trend
    };
  }).filter(Boolean);

  // Aggregates
  var totalGMVAll  = out.reduce(function (s, a) { return s + (a.latest.gmv || 0); }, 0);
  var totalCostAll = out.reduce(function (s, a) { return s + (a.latest.totalCost || 0); }, 0);
  var blendedROAS  = totalCostAll > 0 ? totalGMVAll / totalCostAll : null;
  var totalCreators = out.reduce(function (s, a) { return s + (a.latest.creators || 0); }, 0);
  var totalPerf    = out.reduce(function (s, a) { return s + (a.latest.performing || 0); }, 0);

  return {
    agencies: out,
    totals: {
      gmv: totalGMVAll, cost: totalCostAll,
      roas: blendedROAS,
      creators: totalCreators, performing: totalPerf,
      perfRate: totalCreators > 0 ? totalPerf / totalCreators : 0
    }
  };
}

/* ── 1. Headline KPI strip ── */
function buildHeadlineKPIs(ag, weekly) {
  var t = ag.totals;
  var weeklyWoWDollar = weekly ? weekly.kpis.wow_dollar : null;
  var weeklyWoWPct    = weekly ? weekly.kpis.wow_pct    : null;
  var driverNote = buildWoWDriverNote(weekly);

  // GMV card uses monthly aggregate as headline; weekly delta in subtitle for context.
  var gmvSub = 'Latest month, all agencies';
  if (weekly && weeklyWoWDollar != null) {
    var sign = weeklyWoWDollar >= 0 ? '+' : '−';
    gmvSub = 'Latest week: ' + sign + '$' + Math.abs(Math.round(weeklyWoWDollar)).toLocaleString() +
      ' (' + (weeklyWoWPct != null ? (weeklyWoWPct >= 0 ? '+' : '') + weeklyWoWPct.toFixed(2) + '% WoW' : 'WoW —') + ')';
  }

  var roasColor = t.roas != null && t.roas >= CONFIG.roi.excellent ? 'green'
    : (t.roas != null && t.roas >= CONFIG.roi.good ? 'yellow' : 'red');
  var perfColor = t.perfRate >= CONFIG.perfRate.good ? 'green'
    : t.perfRate >= CONFIG.perfRate.warn ? 'yellow' : 'red';
  var driverColor = driverNote.dir === 'pos' ? 'green'
    : driverNote.dir === 'neg' ? 'red' : 'gray';

  return '<div class="kpi-grid">' +
    kpiCard('Total GMV',        U.fmt$(t.gmv),                   gmvSub, 'green') +
    kpiCard('Blended ROAS',     U.fmtX(t.roas),                  'GMV ÷ ' + U.fmt$(t.cost) + ' all-in cost · break-even ' + U.fmtX(U.getBreakEven()), roasColor) +
    kpiCard('Performing Creators',
            t.performing + ' / ' + t.creators,
            U.fmtPct(t.perfRate) + ' performing rate', perfColor) +
    kpiCard('WoW Driver',
            driverNote.headline,
            driverNote.detail,
            driverColor) +
  '</div>';
}

function buildWoWDriverNote(weekly) {
  if (!weekly || !weekly.kpis || weekly.kpis.wow_dollar == null) {
    return { headline: '—', detail: 'No prior-week comparison available', dir: 'neutral' };
  }
  var d = weekly.kpis.wow_dollar;
  var sign = d >= 0 ? '+' : '−';
  var headline = sign + '$' + Math.abs(Math.round(d)).toLocaleString();

  // Simple driver inference from agencyRollup
  var rollup = (weekly.agencyRollup || []).slice().sort(function (a, b) {
    return Math.abs(b.wow_dollar || 0) - Math.abs(a.wow_dollar || 0);
  });
  var detail = 'Latest week vs prior week';
  if (rollup.length) {
    var top = rollup[0];
    var label = AGENCY_LABEL_FOR(top.Agency);
    var topVal = top.wow_dollar || 0;
    var topSign = topVal >= 0 ? '+' : '−';
    detail = label + ' drove ' + topSign + '$' + Math.abs(Math.round(topVal)).toLocaleString() + ' of the swing';
  }
  return { headline: headline, detail: detail, dir: d >= 0 ? 'pos' : 'neg' };
}

function AGENCY_LABEL_FOR(id) {
  var map = { creatify: 'Creatify', thc: 'THC', elle: 'Elle Media',
              internal: 'Internal', unattributed: 'Open / Target' };
  return map[id] || id;
}

/* ── 2. Agency Scorecard ── */
function buildAgencyScorecard(ag) {
  var html = '<div class="section-header" style="margin-top:32px">' +
    '<span class="section-title">Agency Scorecard</span>' +
    '<span class="section-meta">Click row to drill into Affiliate Performance</span></div>';

  html += '<div class="table-card"><div class="table-scroll"><table class="data-table">' +
    '<thead><tr>' +
      '<th style="text-align:left">Agency</th>' +
      '<th>Active Months</th>' +
      '<th>Total GMV</th>' +
      '<th>Total Cost</th>' +
      '<th>Overall ROAS</th>' +
      '<th>Latest ROAS</th>' +
      '<th>Avg Perf Rate</th>' +
      '<th>Trend</th>' +
    '</tr></thead><tbody>';

  var roasArr = ag.agencies.map(function (a) { return a.overallROAS; });
  var bw = U.bestWorst(roasArr);

  ag.agencies.forEach(function (a) {
    var hl = (a.overallROAS === bw.best) ? 'cell-best' :
             (a.overallROAS === bw.worst) ? 'cell-worst' : '';
    html += '<tr style="cursor:pointer" data-deep-link="affiliate_performance" data-source="' + a.id + '">' +
      '<td style="text-align:left"><span class="agency-dot" style="background:' + a.color + ';margin-right:8px"></span><strong>' + escapeHtml(a.name) + '</strong></td>' +
      '<td>' + a.months.length + '</td>' +
      '<td>' + U.fmt$(a.totalGMV) + '</td>' +
      '<td>' + U.fmt$(a.totalCost) + '</td>' +
      '<td><span class="' + hl + ' ' + U.roiCls(a.overallROAS) + '">' + U.fmtX(a.overallROAS) + '</span></td>' +
      '<td><span class="' + U.roiCls(a.latest.roi) + '">' + U.fmtX(a.latest.roi) + '</span></td>' +
      '<td><span class="' + U.perfCls(a.avgPerfRate) + '">' + U.fmtPct(a.avgPerfRate) + '</span></td>' +
      '<td>' + a.trend + '</td>' +
      '</tr>';
  });
  html += '</tbody></table></div></div>';
  return html;
}

/* ── 3. Creator Performance Summary ── */
function buildCreatorSummary(weekly) {
  if (!weekly || !weekly.creators) {
    return '<div class="section-header" style="margin-top:32px"><span class="section-title">Creator Performance</span></div>' +
      '<div class="info-notice">No weekly creator data loaded.</div>';
  }
  var creators = weekly.creators.slice().sort(function (a, b) { return (b.gmv || 0) - (a.gmv || 0); });
  var totalGMV = creators.reduce(function (s, c) { return s + (c.gmv || 0); }, 0);
  var top5 = creators.slice(0, 5);
  var top5GMV = top5.reduce(function (s, c) { return s + c.gmv; }, 0);
  var top5Share = totalGMV > 0 ? (top5GMV / totalGMV * 100) : 0;

  var selling = creators.filter(function (c) { return (c.gmv || 0) > 0; });
  var medianGMV = (function () {
    if (!selling.length) return 0;
    var arr = selling.map(function (c) { return c.gmv; }).sort(function (a, b) { return a - b; });
    var mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  })();

  var html = '<div class="section-header" style="margin-top:32px">' +
    '<span class="section-title">Creator Performance</span>' +
    '<span class="section-meta">Top movers · concentration · distribution &nbsp;·&nbsp; ' +
    '<a href="#" data-deep-link="affiliate_performance" data-source="all" style="color:var(--brand-green);font-weight:600">View full leaderboard →</a></span></div>';

  html += '<div class="kpi-grid">' +
    kpiCard('Selling Creators', selling.length.toLocaleString(), 'of ' + creators.length.toLocaleString() + ' tracked this week', 'green') +
    kpiCard('Top-5 Concentration', top5Share.toFixed(2) + '%', 'GMV from top 5 creators', top5Share >= 60 ? 'red' : top5Share >= 45 ? 'yellow' : 'green') +
    kpiCard('Median GMV / Creator', '$' + Math.round(medianGMV).toLocaleString(), 'Selling creators only', 'green') +
    kpiCard('Top Creator', top5[0] ? '$' + Math.round(top5[0].gmv).toLocaleString() : '—', top5[0] ? '@' + top5[0].creator : '', 'orange') +
    '</div>';

  // Top 5 list
  html += '<div class="table-card" style="margin-top:14px"><div class="table-scroll"><table class="data-table">' +
    '<thead><tr><th style="text-align:left">#</th><th style="text-align:left">Creator</th><th style="text-align:left">Source</th><th>This Wk GMV</th><th>WoW</th></tr></thead><tbody>';
  top5.forEach(function (c, i) {
    var meta = AGENCY_LABEL_FOR(c.agency || 'unattributed');
    var wowDir = (c.wow_dollar || 0) >= 0 ? 'text-green' : 'text-red';
    var wowSign = (c.wow_dollar || 0) >= 0 ? '+' : '−';
    html += '<tr>' +
      '<td style="text-align:left">' + (i + 1) + '</td>' +
      '<td style="text-align:left">@' + escapeHtml(c.creator || '') + '</td>' +
      '<td style="text-align:left">' + escapeHtml(meta) + '</td>' +
      '<td><strong>$' + Math.round(c.gmv).toLocaleString() + '</strong></td>' +
      '<td><span class="' + wowDir + '">' + wowSign + '$' + Math.abs(Math.round(c.wow_dollar || 0)).toLocaleString() + '</span></td>' +
      '</tr>';
  });
  html += '</tbody></table></div></div>';
  return html;
}

/* ── 4. Video Performance Summary ── */
function buildVideoSummary(weekly) {
  if (!weekly || !weekly.topVideos) {
    return '<div class="section-header" style="margin-top:32px"><span class="section-title">Video Performance</span></div>' +
      '<div class="info-notice">No weekly video data loaded.</div>';
  }
  var k = weekly.kpis;
  var top3 = weekly.topVideos.slice(0, 3);

  var html = '<div class="section-header" style="margin-top:32px">' +
    '<span class="section-title">Video Performance</span>' +
    '<span class="section-meta">' +
    '<a href="#" data-deep-link="affiliate_performance" data-source="all" style="color:var(--brand-green);font-weight:600">View full breakdown →</a></span></div>';

  html += '<div class="kpi-grid">' +
    kpiCard('Selling Videos', k.selling_videos.toLocaleString(), 'of ' + k.total_videos.toLocaleString() + ' tracked', 'green') +
    kpiCard('New Winners (≤14d)', k.new_selling_videos.toLocaleString(), (k.new_pct != null ? k.new_pct.toFixed(2) + '% of GMV' : '—'), 'green') +
    kpiCard('Legacy Share', k.legacy_pct.toFixed(2) + '%', 'GMV from videos >30 days old', k.legacy_pct >= 80 ? 'red' : k.legacy_pct >= 60 ? 'yellow' : 'green') +
    kpiCard('Top Video', top3[0] ? '$' + Math.round(top3[0].gmv).toLocaleString() : '—', top3[0] ? '@' + top3[0].creator : '', 'orange') +
    '</div>';

  return html;
}

/* ── 5. Videos per SKU — driven by window.SKU_VIDEOS (subscription dashboard) ── */
function buildVideosPerSKU(weekly) {
  var skus = window.SKU_VIDEOS || [];
  if (!skus.length) {
    return '<div class="section-header" style="margin-top:32px">' +
      '<span class="section-title">Videos per SKU</span></div>' +
      '<div class="info-notice">SKU video data not loaded. Re-run ' +
      '<code>pipeline/parsers/sku_videos.py</code> to regenerate <code>web/data/sku-videos.js</code>.</div>';
  }

  // Sort by Published Videos (cumulative) desc — the SKUs producing the most content sit on top.
  var rows = skus.slice().sort(function (a, b) { return (b.published_total || 0) - (a.published_total || 0); });

  var totalPublished = rows.reduce(function (s, r) { return s + (r.published_total || 0); }, 0);
  var totalGMV       = rows.reduce(function (s, r) { return s + (r.gmv_total || 0); }, 0);

  var html = '<div class="section-header" style="margin-top:32px">' +
    '<span class="section-title">Videos per SKU</span>' +
    '<span class="section-meta">' + rows.length + ' SKUs · ' + totalPublished.toLocaleString() + ' total published videos · cumulative across reporting period</span></div>';

  html += '<div class="table-card"><div class="table-scroll"><table class="data-table">' +
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
      '<td>$' + Math.round(gpv).toFixed(0) + '</td>' +
    '</tr>';
  });

  // Totals row
  html += '<tr style="font-weight:700;background:var(--bg);border-top:2px solid var(--border)">' +
    '<td style="text-align:left">TOTAL</td>' +
    '<td>' + totalPublished.toLocaleString() + '</td>' +
    '<td>—</td>' +
    '<td>$' + Math.round(totalGMV).toLocaleString() + '</td>' +
    '<td>—</td>' +
    '<td>—</td>' +
    '</tr>';
  html += '</tbody></table></div></div>';
  return html;
}

/* ── 6. Narratives Summary — full 6-card strip + deep link ── */
function buildNarrativesSummary() {
  // Pull narrative dataset from Views.narrative._narratives — same source the
  // Narratives tab renders from. Falls back gracefully if the module isn't loaded.
  var narratives = (window.Views && window.Views.narrative && window.Views.narrative._narratives) || [];

  if (!narratives.length) {
    return '<div class="section-header" style="margin-top:32px">' +
      '<span class="section-title">Narrative Intelligence</span></div>' +
      '<div class="info-notice">Narrative dataset not loaded.</div>';
  }

  var counts = { winning: 0, waning: 0, potential: 0 };
  narratives.forEach(function (n) { if (counts[n.momentum] != null) counts[n.momentum]++; });
  var topByGMV = narratives.slice().sort(function (a, b) { return (b.total_gmv || 0) - (a.total_gmv || 0); })[0];
  var topByEff = narratives.slice().sort(function (a, b) { return (b.avg_gmv_video || 0) - (a.avg_gmv_video || 0); })[0];
  var totalVideos = narratives.reduce(function (s, n) { return s + (n.videos || 0); }, 0);

  return '<div class="section-header" style="margin-top:32px">' +
      '<span class="section-title">Narrative Intelligence</span>' +
      '<span class="section-meta">Content families driving conversion — what\'s working, waning, and what to scale</span></div>' +
    '<div class="kpi-grid">' +
      kpiCard('Narrative Families', narratives.length, totalVideos.toLocaleString() + ' total videos tracked', 'gray') +
      kpiCard('Winning', counts.winning, 'Trending up in GMV / video', 'green') +
      kpiCard('Has Potential', counts.potential, 'Rising — scale now', 'orange') +
      kpiCard('Waning', counts.waning, 'Declining efficiency', 'red') +
      kpiCard('Top Narrative GMV', U.fmt$(topByGMV ? topByGMV.total_gmv : 0), topByGMV ? topByGMV.name : '', 'green') +
      kpiCard('Best GMV / Video', topByEff ? '$' + Math.round(topByEff.avg_gmv_video).toLocaleString() : '—', topByEff ? topByEff.name : '', 'green') +
    '</div>' +
    '<div style="text-align:right;margin-top:-8px">' +
      '<a href="#" data-deep-link="narrative" style="color:var(--brand-green);font-weight:600;font-size:13px">View full narrative analysis →</a>' +
    '</div>';
}

/* ── 7. Legend ── */
function buildLegend() {
  return '<div class="kpi-legend" style="margin-top:32px">' +
    '<div class="kpi-legend-title">What these KPIs mean</div>' +
    '<dl>' +
      '<dt>Total GMV</dt><dd>Sum of GMV across all active agencies for the latest reporting month. Subtitle shows weekly WoW change.</dd>' +
      '<dt>Blended ROAS</dt><dd>Cumulative GMV ÷ all-in agency cost (fees + samples + retainers). Break-even depends on gross margin.</dd>' +
      '<dt>Performing Creators</dt><dd>Performing ÷ active across all agencies in the latest month — utilization signal.</dd>' +
      '<dt>WoW Driver</dt><dd>Dollar change in weekly TikTok GMV plus the agency that drove most of the swing.</dd>' +
      '<dt>ROAS vs. ROI</dt><dd><strong>ROAS</strong> = agency-side metric (GMV ÷ all-in cost). <strong>ROI</strong> = TikTok GMV-max campaign metric (GMV ÷ ad spend). Not directly comparable.</dd>' +
    '</dl></div>';
}

/* ── Deep-link to Affiliate Performance with optional source filter ── */
function deepLink(view, source) {
  // Set source filter on weekly.js so AP picks it up
  if (window.Views.weekly && window.Views.weekly.setSource) {
    window.Views.weekly.setSource(source || 'all');
  }
  // Trigger nav by clicking the appropriate top-nav button
  var tab = document.querySelector('.nav-tab[data-view="' + view + '"]');
  if (tab) tab.click();
}

/* Helper — KPI card HTML (shared style) */
function kpiCard(label, value, sub, color) {
  return '<div class="kpi-card ' + (color || '') + '">' +
    '<div class="kpi-label">' + label + '</div>' +
    '<div class="kpi-value">' + (value != null ? value : '—') + '</div>' +
    (sub ? '<div class="kpi-sub">' + sub + '</div>' : '') +
    '</div>';
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
