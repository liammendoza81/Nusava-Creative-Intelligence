/* =========================================================
   Nusava — Executive View
   Cross-agency summary: KPIs, comparison charts, scorecard
   ========================================================= */

window.Views = window.Views || {};

window.Views.executive = {

  render: function () {
    var gm = CONFIG.grossMargin;
    var agConfigs = CONFIG.agencies;

    // Build enriched month arrays per agency
    var agData = agConfigs.map(function (ag) {
      var raw = U.getAgencyData(ag.id);
      if (!raw || !raw.months || raw.months.length === 0) return null;
      var months = raw.months.map(function (m) {
        var em = U.enrich(m);
        em.label = m.label;
        em._agencyId = ag.id;
        return em;
      });
      var latest = months[months.length - 1];
      var totalFees = months.reduce(function (s, m) { return s + (m.cost || 0); }, 0);
      var totalGMV  = months.reduce(function (s, m) { return s + (m.gmv  || 0); }, 0);
      var overallROI = totalFees > 0 ? totalGMV / totalFees : null;
      var avgPerfRate = months.reduce(function (s, m) { return s + (m.perfRate || 0); }, 0) / months.length;

      return {
        id: ag.id,
        name: ag.name,
        short: ag.short,
        color: ag.color,
        months: months,
        latest: latest,
        totalFees: totalFees,
        totalGMV: totalGMV,
        overallROI: overallROI,
        avgPerfRate: avgPerfRate
      };
    }).filter(Boolean);

    // ── Aggregate KPIs ──
    var totalGMVAll   = agData.reduce(function (s, a) { return s + (a.latest.gmv || 0); }, 0);
    var totalCostAll  = agData.reduce(function (s, a) { return s + (a.latest.totalCost || 0); }, 0);
    var totalCreators = agData.reduce(function (s, a) { return s + (a.latest.creators || 0); }, 0);
    var totalPerf     = agData.reduce(function (s, a) { return s + (a.latest.performing || 0); }, 0);
    var aggPerfRate   = totalCreators > 0 ? totalPerf / totalCreators : 0;

    var bestAg  = agData.slice().sort(function (a, b) { return (b.latest.roi || 0) - (a.latest.roi || 0); })[0];
    var worstAg = agData.slice().sort(function (a, b) { return (a.latest.roi || 0) - (b.latest.roi || 0); })[0];

    // ── Render HTML ──
    var html = '<div class="tab-pane">';

    // Page title
    html += '<div class="page-title"><h1>Executive Overview</h1><div class="subtitle">Cross-agency performance snapshot — all active agencies, latest available month</div></div>';

    // ── Agency Scorecard (top) ──
    html += '<div class="section-header"><span class="section-title">Agency Scorecard</span></div>';
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr><th>Agency</th><th>Active Months</th><th>Total Fees</th><th>Total GMV</th><th>Overall ROI</th><th>Avg Perf Rate</th><th>Latest ROI</th><th>Trend</th></tr></thead><tbody>';

    var roiValues = agData.map(function (a) { return a.overallROI; });
    var bw = U.bestWorst(roiValues);

    agData.forEach(function (ag) {
      var roiCell = ag.overallROI != null
        ? '<span class="' + U.roiCls(ag.overallROI) + '">' + U.fmtX(ag.overallROI) + '</span>'
        : '—';
      var latestRoiCell = ag.latest.roi != null
        ? '<span class="' + U.roiCls(ag.latest.roi) + '">' + U.fmtX(ag.latest.roi) + '</span>'
        : '—';
      var perfCell = '<span class="' + U.perfCls(ag.avgPerfRate) + '">' + U.fmtPct(ag.avgPerfRate) + '</span>';
      var costLabel = ag.id === 'internal' ? 'Retainer Cost' : 'Agency Fees';

      // Trend: compare last two months ROI
      var trend = '—';
      if (ag.months.length >= 2) {
        var prev = ag.months[ag.months.length - 2].roi;
        var curr = ag.latest.roi;
        if (prev != null && curr != null) {
          trend = curr > prev ? '<span class="trend-up">↑</span>' : curr < prev ? '<span class="trend-down">↓</span>' : '<span class="trend-flat">→</span>';
        }
      }

      var roiHighlight = (ag.overallROI === bw.best) ? 'cell-best' : (ag.overallROI === bw.worst) ? 'cell-worst' : '';

      html += '<tr>';
      html += '<td><span class="agency-color-dot" style="background:' + ag.color + ';display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;"></span>' + ag.name + '</td>';
      html += '<td>' + ag.months.length + '</td>';
      html += '<td>' + U.fmt$(ag.totalFees) + '</td>';
      html += '<td>' + U.fmt$(ag.totalGMV) + '</td>';
      html += '<td><span class="' + roiHighlight + '">' + (ag.overallROI != null ? U.fmtX(ag.overallROI) : '—') + '</span></td>';
      html += '<td>' + perfCell + '</td>';
      html += '<td>' + latestRoiCell + '</td>';
      html += '<td>' + trend + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';

    // KPI grid
    html += '<div class="kpi-grid" style="margin-top:24px">';
    html += kpiCard('Total GMV (Latest Month)', U.fmt$(totalGMVAll), 'All agencies combined', 'blue');
    html += kpiCard('Total Cost (Latest Month)', U.fmt$(totalCostAll), 'Fees + sample costs', 'purple');
    html += kpiCard('Best ROI Agency', bestAg ? bestAg.short : '—', bestAg ? U.fmtX(bestAg.latest.roi) + ' ROI' : '', 'green');
    html += kpiCard('Lowest ROI Agency', worstAg ? worstAg.short : '—', worstAg ? U.fmtX(worstAg.latest.roi) + ' ROI' : '', 'red');
    html += kpiCard('Active Creators', totalCreators, 'Across all agencies (latest month)', 'orange');
    html += kpiCard('Aggregate Perf Rate', U.fmtPct(aggPerfRate), totalPerf + ' of ' + totalCreators + ' performing', aggPerfRate >= CONFIG.perfRate.good ? 'green' : aggPerfRate >= CONFIG.perfRate.warn ? 'yellow' : 'red');
    html += '</div>';

    // M6 alert for Creatify
    html += '<div class="alert-bar">';
    html += '<div class="alert alert-yellow"><span class="alert-icon">⚠️</span><div><strong>Creatify M6 One-Time Spike:</strong> palomaashop generated $103,842 in M6 — an outlier/one-time contributor. M6 GMV ($382,541) is inflated by ~27% vs underlying trend. ROI figures for M6 should be interpreted with this context.</div></div>';
    html += '</div>';

    // Agency comparison GMV chart — full width, taller
    html += '<div class="chart-card" style="margin-bottom:24px">';
    html += '<div class="chart-title">GMV by Agency — Month over Month</div>';
    html += '<div class="chart-sub">All agencies, by campaign period. Gaps indicate agency not active in that period.</div>';
    html += '<div class="chart-wrap" style="height:380px;width:100%"><canvas id="exec-agency-gmv"></canvas></div>';
    html += '</div>';

    // ROI multi-line chart
    html += '<div class="chart-grid">';
    html += '<div class="chart-card"><div class="chart-title">ROI Multiple by Agency — Trend</div><div class="chart-sub">GMV ÷ Total Cost. Break-even = ' + U.getBreakEven().toFixed(2) + 'x at ' + (gm * 100).toFixed(0) + '% gross margin.</div><div class="chart-wrap" style="height:260px"><canvas id="exec-roi-lines"></canvas></div></div>';
    html += '<div class="chart-card"><div class="chart-title">Performing Creator Rate by Agency</div><div class="chart-sub">% of creators generating any GMV, by month.</div><div class="chart-wrap" style="height:260px"><canvas id="exec-perf-rate"></canvas></div></div>';
    html += '</div>';

    // GMV Lag cross-agency section
    html += '<div class="section-header" style="margin-top:8px"><span class="section-title">⏱ GMV Lag — Video Time-to-Performance</span><span class="section-meta">How quickly do videos convert after publish?</span></div>';
    html += '<div id="exec-lag-section"></div>';

    // Incremental value cross-agency section
    html += '<div class="section-header" style="margin-top:8px"><span class="section-title">📈 Incremental Value — New vs Legacy GMV</span><span class="section-meta">How much of each agency\'s GMV is from new content vs carryover?</span></div>';
    html += '<div id="exec-incr-section"></div>';

    html += '</div>'; // .tab-pane

    document.getElementById('main-content').innerHTML = html;

    // ── Render Charts ──
    var agDatasets = agData.map(function (ag) {
      return {
        id: ag.id,
        name: ag.short,
        color: ag.color,
        months: ag.months.map(function (m) { return { label: m.label, gmv: m.gmv, roi: m.roi, period: m.period }; })
      };
    });

    setTimeout(function () {
      Charts.agencyComparison('exec-agency-gmv', agDatasets);
      Charts.agencyRoiLines('exec-roi-lines', agDatasets);
      Charts.perfRateComparison('exec-perf-rate', agDatasets.map(function (ag, i) {
        return Object.assign({}, ag, { months: agData[i].months });
      }));

      // GMV Lag + Incremental cross-agency summaries
      var lagEl  = document.getElementById('exec-lag-section');
      var incrEl = document.getElementById('exec-incr-section');
      if (lagEl)  GmvLag.renderCrossAgency(lagEl);
      if (incrEl) Incremental.renderCrossAgency(incrEl);
    }, 50);
  }
};

/* Helper — KPI card HTML */
function kpiCard(label, value, sub, color) {
  return '<div class="kpi-card ' + (color || '') + '">' +
    '<div class="kpi-label">' + label + '</div>' +
    '<div class="kpi-value">' + (value != null ? value : '—') + '</div>' +
    (sub ? '<div class="kpi-sub">' + sub + '</div>' : '') +
    '</div>';
}
