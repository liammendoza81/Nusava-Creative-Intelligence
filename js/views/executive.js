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
    // Resolve the active week from app state. Returns the matching weekly_summary
    // row when custom is selected, or null = use latest.
    var pickedWeek = pickActiveWeek();

    /* ── Build HTML ── */
    var html = '<div class="page-title">' +
      '<h1>Executive Overview</h1>' +
      '<div class="subtitle">Cross-agency snapshot for the weekly review. ' +
      'Click any row to drill into Affiliate Performance.</div></div>';

    html += buildSelectedWeekBanner(pickedWeek);
    html += buildHeadlineKPIs(agencyData, weekly, pickedWeek);
    html += buildPipelineHealth(pickedWeek);
    html += buildTopActions(agencyData, weekly);
    html += buildRiskConcentration(weekly);
    html += build8WeekTrend(pickedWeek);
    html += buildAgencyScorecard(agencyData);
    html += buildCreatorSummary(weekly);
    html += buildVideoSummary(weekly);
    html += buildVideosPerSKU(weekly, pickedWeek);
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

    /* Render the 8-week trend chart after DOM is ready. */
    setTimeout(function () { draw8WeekChart(); }, 50);
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

/* ── 1. Headline KPI strip — with % of target ──
   When a custom week is picked AND we have a summaryRow for it, the GMV card
   reflects THAT week's numbers (vs weekly target). Otherwise it shows the
   monthly cross-agency aggregate (vs monthly target). */
function buildHeadlineKPIs(ag, weekly, pickedWeek) {
  var t = ag.totals;
  var T = (CONFIG.targets || {});
  var driverNote = buildWoWDriverNote(weekly);

  // Default: monthly cross-agency aggregate
  var gmvHeadline = U.fmt$(t.gmv);
  var gmvSub, gmvColor;

  if (pickedWeek && pickedWeek.summaryRow) {
    // Custom week → headline becomes that week's total GMV
    var row = pickedWeek.summaryRow;
    var weeklyTarget = T.weeklyGMV;
    var weeklyVsTargetPct = weeklyTarget ? Math.round(row.total_gmv / weeklyTarget * 100) : null;
    gmvHeadline = '$' + Math.round(row.total_gmv).toLocaleString();
    var wowSign = (row.total_gmv_wow != null && row.total_gmv_wow >= 0) ? '+' : '−';
    var wowPart = row.total_gmv_wow != null
      ? wowSign + Math.abs(row.total_gmv_wow * 100).toFixed(2) + '% WoW'
      : 'WoW —';
    gmvSub = (weeklyVsTargetPct != null ? weeklyVsTargetPct + '% of $' + weeklyTarget.toLocaleString() + ' weekly target · ' : '') +
      'Week of ' + (pickedWeek.label || pickedWeek.start) + ' · ' + wowPart;
    gmvColor = weeklyVsTargetPct == null ? 'green'
      : weeklyVsTargetPct >= 100 ? 'green'
      : weeklyVsTargetPct >= 80 ? 'yellow' : 'red';
  } else {
    // Default: monthly aggregate
    var gmvVsTargetPct = T.monthlyGMV ? Math.round(t.gmv / T.monthlyGMV * 100) : null;
    var weeklyWoWDollar = weekly ? weekly.kpis.wow_dollar : null;
    var weeklyWoWPct    = weekly ? weekly.kpis.wow_pct    : null;

    gmvSub = gmvVsTargetPct != null
      ? gmvVsTargetPct + '% of $' + T.monthlyGMV.toLocaleString() + ' monthly target'
      : 'Latest month, all agencies';
    if (weekly && weeklyWoWDollar != null) {
      var sign = weeklyWoWDollar >= 0 ? '+' : '−';
      var wowFragment = 'Latest week: ' + sign + '$' + Math.abs(Math.round(weeklyWoWDollar)).toLocaleString() +
        ' (' + (weeklyWoWPct != null ? (weeklyWoWPct >= 0 ? '+' : '') + weeklyWoWPct.toFixed(2) + '% WoW' : 'WoW —') + ')';
      gmvSub = (gmvVsTargetPct != null ? gmvVsTargetPct + '% of monthly target · ' : '') + wowFragment;
    }
    gmvColor = gmvVsTargetPct == null ? 'green'
      : gmvVsTargetPct >= 100 ? 'green'
      : gmvVsTargetPct >= 80 ? 'yellow' : 'red';
  }

  // ROAS vs target
  var roasVsTarget = T.blendedROAS && t.roas != null ? Math.round(t.roas / T.blendedROAS * 100) : null;
  var roasSub = 'GMV ÷ ' + U.fmt$(t.cost) + ' all-in cost · break-even ' + U.fmtX(U.getBreakEven());
  if (roasVsTarget != null) roasSub = roasVsTarget + '% of ' + U.fmtX(T.blendedROAS) + ' target · ' + roasSub;
  var roasColor = T.blendedROAS && t.roas != null
    ? (t.roas >= T.blendedROAS ? 'green' : t.roas >= T.blendedROAS * 0.8 ? 'yellow' : 'red')
    : (t.roas != null && t.roas >= CONFIG.roi.excellent ? 'green' : (t.roas != null && t.roas >= CONFIG.roi.good ? 'yellow' : 'red'));

  // Performing rate vs target
  var perfVsTarget = T.performingRate ? Math.round(t.perfRate / T.performingRate * 100) : null;
  var perfSub = U.fmtPct(t.perfRate) + ' performing rate';
  if (perfVsTarget != null) perfSub = perfVsTarget + '% of ' + U.fmtPct(T.performingRate) + ' target · ' + perfSub;
  var perfColor = T.performingRate
    ? (t.perfRate >= T.performingRate ? 'green' : t.perfRate >= T.performingRate * 0.8 ? 'yellow' : 'red')
    : (t.perfRate >= CONFIG.perfRate.good ? 'green' : t.perfRate >= CONFIG.perfRate.warn ? 'yellow' : 'red');

  var driverColor = driverNote.dir === 'pos' ? 'green'
    : driverNote.dir === 'neg' ? 'red' : 'gray';

  var gmvLabel = pickedWeek && pickedWeek.summaryRow ? 'Weekly GMV' : 'Total GMV';

  return '<div class="kpi-grid">' +
    kpiCard(gmvLabel,           gmvHeadline,                     gmvSub, gmvColor) +
    kpiCard('Blended ROAS',     U.fmtX(t.roas),                  roasSub, roasColor) +
    kpiCard('Performing Creators',
            t.performing + ' / ' + t.creators,
            perfSub, perfColor) +
    kpiCard('WoW Driver',
            driverNote.headline,
            driverNote.detail,
            driverColor) +
  '</div>';
}

/* ── Pipeline Health (mixed: auto-from-sampling + manual config) ── */
function buildPipelineHealth(pickedWeek) {
  var p = (CONFIG.pipelineHealth || {});

  // Samples Shipped comes from window.SAMPLING (the source-of-truth weekly
  // sampling rollup) so it doesn't rely on manual entry. Picks the week
  // matching the active selection, else the latest sampling week.
  var samplingWeek = pickSamplingWeekForExec(pickedWeek);
  var rawShipped = samplingWeek && samplingWeek.core ? samplingWeek.core.samples_shipped : null;
  var samplesShipped = rawShipped != null ? parseFloat(rawShipped) : null;
  if (samplesShipped != null && isNaN(samplesShipped)) samplesShipped = null;
  var samplesContext = samplingWeek
    ? 'Week of ' + samplingWeek.label + ' · activations 7–14 days out'
    : (pickedWeek && !samplingWeek ? 'No sampling files yet for this week' : 'Sampling data not loaded');
  var samplesColor = samplesShipped == null ? 'gray' : samplesShipped > 0 ? 'green' : 'red';

  var stale = p.lastUpdated ? '' : '<span style="color:var(--brand-amber);font-size:11px;font-weight:600;margin-left:8px">Update manual fields before meeting →</span>';
  var sub = p.lastUpdated
    ? 'Manual fields last updated ' + p.lastUpdated + ' · Samples Shipped is auto-pulled from sampling data'
    : 'Samples Shipped is auto-pulled from sampling data. Edit other fields in <code>js/config.js</code> → <code>pipelineHealth</code>';

  return '<div class="section-header" style="margin-top:32px">' +
    '<span class="section-title">Pipeline Health</span>' +
    '<span class="section-meta">Leading indicators' + stale + '</span></div>' +
    '<div class="kpi-grid">' +
      kpiCard('Briefs Sent', (p.briefsSent || 0).toLocaleString(), 'This week · drives next 2 weeks of new content (manual)', p.briefsSent > 0 ? 'green' : 'gray') +
      kpiCard('Samples Shipped',
        samplesShipped != null ? Math.round(samplesShipped).toLocaleString() : '—',
        samplesContext,
        samplesColor) +
      kpiCard('Creators Onboarding', (p.creatorsOnboarding || 0).toLocaleString(), 'Signed, not yet posting (manual)', p.creatorsOnboarding > 0 ? 'green' : 'gray') +
      kpiCard('Creators in Outreach', (p.creatorsInOutreach || 0).toLocaleString(), 'Prospecting pipeline (manual)', p.creatorsInOutreach > 0 ? 'green' : 'gray') +
    '</div>' +
    '<div class="info-notice" style="margin-top:-8px;font-size:11px">' + sub + '</div>';
}

/* Resolve which sampling week matches the active selection. Falls back to
   the most recent sampling week when no custom week is picked, or returns
   null if the picked week has no sampling counterpart. */
function pickSamplingWeekForExec(pickedWeek) {
  var weeks = (window.SAMPLING && window.SAMPLING.weeks) || [];
  if (!weeks.length) return null;
  if (pickedWeek && pickedWeek.start) {
    return weeks.find(function (w) { return w.start === pickedWeek.start; }) || null;
  }
  return weeks[weeks.length - 1];
}

/* ── Top 3 Actions This Week (heuristic-derived) ── */
function buildTopActions(ag, weekly) {
  if (!weekly || !weekly.kpis) return '';
  var actions = [];
  var T = CONFIG.targets || {};

  // Heuristic 1: ROAS below break-even or below target
  if (ag.totals.roas != null && ag.totals.roas < U.getBreakEven()) {
    actions.push({
      severity: 'high',
      action: 'Review agency ROAS portfolio',
      why: 'Blended ROAS ' + U.fmtX(ag.totals.roas) + ' is below break-even (' + U.fmtX(U.getBreakEven()) + '). At current GM, the agency program is destroying contribution margin.'
    });
  } else if (T.blendedROAS && ag.totals.roas < T.blendedROAS) {
    actions.push({
      severity: 'medium',
      action: 'Lift blended ROAS toward target',
      why: 'Blended ROAS ' + U.fmtX(ag.totals.roas) + ' is below target ' + U.fmtX(T.blendedROAS) + '. Investigate fee structure on the lowest-ROAS agency.'
    });
  }

  // Heuristic 2: Top-5 concentration too high
  if (weekly.kpis.top5_creator_share >= 60) {
    actions.push({
      severity: 'high',
      action: 'Diversify creator roster',
      why: 'Top-5 creator concentration is ' + weekly.kpis.top5_creator_share.toFixed(2) + '% — single point of failure. Brief 5 new creators outside the current top set.'
    });
  }

  // Heuristic 3: Legacy share too high
  if (weekly.kpis.legacy_pct >= 80) {
    actions.push({
      severity: 'high',
      action: 'Push new content',
      why: 'Legacy GMV share is ' + weekly.kpis.legacy_pct.toFixed(2) + '%. Pipeline is decaying — fresh content isn\'t replacing aging winners fast enough.'
    });
  }

  // Heuristic 4: Lost creators this week
  var lostCreators = (weekly.creators || []).filter(function (c) {
    return (c.gmv || 0) === 0 && (c.prior_gmv || 0) > 0;
  });
  if (lostCreators.length >= 5) {
    var topLost = lostCreators.slice().sort(function (a, b) { return (b.prior_gmv || 0) - (a.prior_gmv || 0); }).slice(0, 3);
    actions.push({
      severity: 'medium',
      action: 'Re-engage silent creators',
      why: lostCreators.length + ' creators went silent this week (' + topLost.map(function (c) { return '@' + c.creator + ' ($' + Math.round(c.prior_gmv || 0).toLocaleString() + ')'; }).join(', ') + (lostCreators.length > 3 ? ' +' + (lostCreators.length - 3) : '') + '). Outreach this week.'
    });
  }

  // Heuristic 5: New winners pipeline thin
  if (T.weeklyNewWinners && weekly.kpis.new_selling_videos < T.weeklyNewWinners * 0.5) {
    actions.push({
      severity: 'medium',
      action: 'Expand new content pipeline',
      why: 'Only ' + weekly.kpis.new_selling_videos + ' new winners (≤14d) this week vs. target ' + T.weeklyNewWinners + '. Increase brief volume and sample shipments.'
    });
  }

  // Heuristic 6: GMV behind monthly target
  if (T.monthlyGMV && ag.totals.gmv < T.monthlyGMV * 0.8) {
    var pct = Math.round(ag.totals.gmv / T.monthlyGMV * 100);
    actions.push({
      severity: 'high',
      action: 'Address GMV pacing gap',
      why: 'Monthly GMV at ' + pct + '% of target. Run a tactical push (creator boost, ad spend lift, or flash promo) to close the gap.'
    });
  }

  if (!actions.length) {
    actions.push({
      severity: 'low',
      action: 'Maintain current execution',
      why: 'No headline triggers fired this week. Use the meeting to discuss medium-term moves: roster expansion, narrative tests, SKU mix.'
    });
  }

  // Sort: high severity first, take top 3
  var rank = { high: 0, medium: 1, low: 2 };
  actions.sort(function (a, b) { return rank[a.severity] - rank[b.severity]; });
  actions = actions.slice(0, 3);

  var html = '<div class="section-header" style="margin-top:32px">' +
    '<span class="section-title">Top 3 Actions This Week</span>' +
    '<span class="section-meta">Auto-generated from this week\'s metrics — review before the meeting</span></div>' +
    '<div class="ap-actions">';
  actions.forEach(function (a, i) {
    var sevColor = a.severity === 'high' ? 'var(--brand-crimson)' : a.severity === 'medium' ? 'var(--brand-amber)' : 'var(--brand-gray)';
    var sevBg = a.severity === 'high' ? '#fef2f2' : a.severity === 'medium' ? '#FFFBEB' : 'var(--bg)';
    html += '<div class="ap-action-card" style="background:' + sevBg + ';border-left:4px solid ' + sevColor + '">' +
      '<div class="ap-action-rank">' + (i + 1) + '</div>' +
      '<div class="ap-action-body">' +
        '<div class="ap-action-title">' + escapeHtml(a.action) +
          '<span class="ap-action-severity" style="color:' + sevColor + '">' + a.severity + '</span></div>' +
        '<div class="ap-action-why">' + a.why + '</div>' +
      '</div></div>';
  });
  html += '</div>';
  return html;
}

/* ── Risk Concentration ── */
function buildRiskConcentration(weekly) {
  if (!weekly || !weekly.creators) return '';

  // Top creator $ exposure
  var topCreator = weekly.creators.slice().sort(function (a, b) { return (b.gmv || 0) - (a.gmv || 0); })[0];
  var totalCreatorGMV = weekly.creators.reduce(function (s, c) { return s + (c.gmv || 0); }, 0);
  var topShare = (topCreator && totalCreatorGMV > 0) ? (topCreator.gmv / totalCreatorGMV * 100) : 0;

  // Top SKU $ exposure (cumulative — from sku-videos.js)
  var skuRisk = '—';
  var skuRiskSub = 'SKU data not loaded';
  var skuRiskColor = 'gray';
  if (window.SKU_VIDEOS && window.SKU_VIDEOS.length) {
    var topSku = window.SKU_VIDEOS.slice().sort(function (a, b) { return (b.gmv_total || 0) - (a.gmv_total || 0); })[0];
    var totalSkuGMV = window.SKU_VIDEOS.reduce(function (s, r) { return s + (r.gmv_total || 0); }, 0);
    var skuShare = totalSkuGMV > 0 ? (topSku.gmv_total / totalSkuGMV * 100) : 0;
    skuRisk = skuShare.toFixed(2) + '%';
    skuRiskSub = topSku.sku + ' · $' + Math.round(topSku.gmv_total).toLocaleString() + ' cumulative';
    skuRiskColor = skuShare >= 70 ? 'red' : skuShare >= 50 ? 'yellow' : 'green';
  }

  // Agency dependency
  var rollup = weekly.agencyRollup || [];
  var topAgency = rollup.slice().sort(function (a, b) { return (b.gmv || 0) - (a.gmv || 0); })[0];
  var totalAgencyGMV = rollup.reduce(function (s, r) { return s + (r.gmv || 0); }, 0);
  var agencyShare = (topAgency && totalAgencyGMV > 0) ? (topAgency.gmv / totalAgencyGMV * 100) : 0;
  var agencyShareColor = agencyShare >= 70 ? 'red' : agencyShare >= 50 ? 'yellow' : 'green';

  return '<div class="section-header" style="margin-top:32px">' +
    '<span class="section-title">Risk Concentration</span>' +
    '<span class="section-meta">Single-point-of-failure exposure — diversify when shares get high</span></div>' +
    '<div class="kpi-grid">' +
      kpiCard('Top-1 Creator Dependency',
        topShare.toFixed(2) + '%',
        topCreator ? '@' + topCreator.creator + ' · $' + Math.round(topCreator.gmv).toLocaleString() + ' this week' : '—',
        topShare >= 20 ? 'red' : topShare >= 12 ? 'yellow' : 'green') +
      kpiCard('Top-1 SKU Dependency',
        skuRisk,
        skuRiskSub,
        skuRiskColor) +
      kpiCard('Top-1 Source Dependency',
        agencyShare.toFixed(2) + '%',
        topAgency ? AGENCY_LABEL_FOR(topAgency.Agency) + ' · $' + Math.round(topAgency.gmv).toLocaleString() + ' this week' : '—',
        agencyShareColor) +
      kpiCard('Top-5 Creator Concentration',
        weekly.kpis.top5_creator_share.toFixed(2) + '%',
        'GMV from top 5 creators',
        weekly.kpis.top5_creator_share >= 60 ? 'red' : weekly.kpis.top5_creator_share >= 45 ? 'yellow' : 'green') +
    '</div>';
}

/* ── 8-week trend chart (uses DASHBOARD_DATA.weekly_summary) ── */
function build8WeekTrend(pickedWeek) {
  var ws = window.DASHBOARD_DATA && window.DASHBOARD_DATA.weekly_summary;
  if (!ws || !ws.rows) return '';
  var meta = 'Trailing 8 weekly periods · 4-week rolling average overlaid';
  if (pickedWeek) meta += ' · highlighting ' + (pickedWeek.label || pickedWeek.start);
  return '<div class="section-header" style="margin-top:32px">' +
    '<span class="section-title">8-Week GMV Trend</span>' +
    '<span class="section-meta">' + meta + '</span></div>' +
    '<div class="chart-card"><div class="chart-wrap" style="height:280px"><canvas id="exec-8wk-chart"></canvas></div></div>';
}

function draw8WeekChart() {
  var ws = window.DASHBOARD_DATA && window.DASHBOARD_DATA.weekly_summary;
  if (!ws || !ws.rows) return;
  var canvas = document.getElementById('exec-8wk-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  var labels = ws.rows.map(function (r) { return r.week; });
  var gmv = ws.rows.map(function (r) { return r.total_gmv; });
  // 4-week rolling average
  var rolling = gmv.map(function (_, i) {
    var slice = gmv.slice(Math.max(0, i - 3), i + 1);
    return slice.reduce(function (s, v) { return s + v; }, 0) / slice.length;
  });
  var T = (CONFIG.targets || {}).weeklyGMV;

  // Highlight the picked week (if any) by enlarging that point and changing color
  var pickedWeek = pickActiveWeek();
  var highlightIdx = -1;
  if (pickedWeek && pickedWeek.summaryRow) {
    highlightIdx = ws.rows.indexOf(pickedWeek.summaryRow);
  }
  var pointRadii = labels.map(function (_, i) { return i === highlightIdx ? 8 : 4; });
  var pointBgs = labels.map(function (_, i) { return i === highlightIdx ? '#FF6B00' : '#4C9C2E'; });

  new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Weekly GMV',
          data: gmv,
          borderColor: '#4C9C2E',
          backgroundColor: 'rgba(76,156,46,0.10)',
          fill: true,
          tension: 0.25,
          pointRadius: pointRadii,
          pointBackgroundColor: pointBgs,
          borderWidth: 2
        },
        {
          label: '4-week rolling avg',
          data: rolling,
          borderColor: '#10593B',
          borderDash: [6, 4],
          tension: 0.25,
          pointRadius: 0,
          fill: false,
          borderWidth: 2
        },
        T ? {
          label: 'Weekly target',
          data: labels.map(function () { return T; }),
          borderColor: '#8C9091',
          borderDash: [2, 4],
          pointRadius: 0,
          fill: false,
          borderWidth: 1.5
        } : null
      ].filter(Boolean)
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'K'; } } }
      }
    }
  });
}

/* Channel economics deliberately omitted from this dashboard. CM stack,
   subscription mix, and weekly P&L will live in the separate TikTok
   performance dashboard alongside Forecasting. */

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

/* ── 5. Videos per SKU — driven by window.SKU_VIDEOS (subscription dashboard) ──
   The current parser emits only latest-week + cumulative columns. When a
   custom week is picked, we display a notice that the table is latest-only. */
function buildVideosPerSKU(weekly, pickedWeek) {
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

  if (pickedWeek) {
    html += '<div class="info-notice" style="margin-bottom:14px">' +
      '<strong>Note:</strong> "Latest Week" columns show the most recent reporting week (Apr 27–May 3). ' +
      'Per-week SKU breakdown for ' + escapeHtml(pickedWeek.label) + ' requires a parser update — pending.' +
      '</div>';
  }

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

/* Resolve the active week from window._appState. Returns:
   { source: 'custom', start, end, label, summaryRow, samplingWeek } or null.

   Matches sampling week → weekly_summary row by INDEX (both arrays are
   chronological and start at the same Monday — Mar 2 2026 = sampling[0] = W1).
   Falls back to a date_range substring match if indices don't line up. */
function pickActiveWeek() {
  var s = window._appState || {};
  if (s.timeRange !== 'custom' || !s.customFrom) return null;

  // Primary source: weekly-archive.js (25 weeks of real KPI snapshots).
  var archive = (window.WEEKLY_ARCHIVE && window.WEEKLY_ARCHIVE.weeks) || [];
  var archiveMatch = archive.find(function (w) { return w.start === s.customFrom; });

  // Build a synthetic "summaryRow" shape that the executive renderers expect
  // (total_gmv + WoW pct), sourced from the archive.
  var summaryRow = null;
  if (archiveMatch) {
    var k = archiveMatch.kpis || {};
    summaryRow = {
      week: archiveMatch.label,
      date_range: archiveMatch.label,
      total_gmv: k.total_gmv,
      total_gmv_wow: k.wow_pct != null ? k.wow_pct / 100 : null,  // wow_pct → fraction
      total_orders: k.total_orders,
      total_orders_wow: null,
    };
  }

  // Pull sampling-week if available (for the Sampling card)
  var samplingWeeks = (window.SAMPLING && window.SAMPLING.weeks) || [];
  var samplingWeek = samplingWeeks.find(function (w) { return w.start === s.customFrom; }) || null;

  return {
    source: 'custom',
    start: archiveMatch ? archiveMatch.start : s.customFrom,
    end:   archiveMatch ? archiveMatch.end   : s.customFrom,
    label: archiveMatch ? archiveMatch.label : s.customFrom,
    summaryRow: summaryRow,
    samplingWeek: samplingWeek,
    archive: archiveMatch
  };
}

function buildSelectedWeekBanner(pickedWeek) {
  if (!pickedWeek) return '';
  var coverageMissing = !pickedWeek.archive;
  var msg = '<strong>Showing data for week of ' + escapeHtml(pickedWeek.label) +
    '</strong> (' + escapeHtml(pickedWeek.start) + ' – ' + escapeHtml(pickedWeek.end) + ').';
  if (coverageMissing) {
    msg += ' <em>This week isn\'t in the archive yet — falling back to latest week values.</em>';
  } else {
    msg += ' Headline KPIs, Age Cohorts, Fresh vs Legacy, and Sampling all reflect this week. ' +
           '<strong>Drill-down tables (top creators, top videos, declining) show latest-week data</strong> — ' +
           'historical per-creator/per-video archives aren\'t wired into the pipeline yet.';
  }
  return '<div class="alert-bar"><div class="alert alert-yellow"><div>' + msg + '</div></div></div>';
}
