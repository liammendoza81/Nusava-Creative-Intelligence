/* =========================================================
   Nusava Creator Intelligence Platform — Agency Insights
   ---------------------------------------------------------
   Aggregated executive narrative across all 4 agencies.
   Reads each agency's enriched monthly data and surfaces:
     - KPI strip: total agency GMV, total fees, blended ROI
     - Per-agency latest-month performance table
     - Performance vs targets (perf rate, delivery rate)
     - Top creators (by GMV) across the platform
     - Action callouts (under-performing agencies, ROI flags)
   ========================================================= */

(function () {

  function render() {
    var main = document.getElementById('main-content');
    if (!main) return;

    var agencies = (CONFIG.agencies || []).map(function (ag) {
      var rawData = U.getAgencyData(ag.id);
      var months = U.enrichAll(rawData);
      var latest = months.length ? months[months.length - 1] : null;
      var totalGMV = months.reduce(function (s, m) { return s + (m.gmv || 0); }, 0);
      var totalCost = months.reduce(function (s, m) { return s + (m.totalCost || 0); }, 0);
      var totalNet = months.reduce(function (s, m) { return s + (m.net || 0); }, 0);
      var blendedROI = totalCost > 0 ? totalGMV / totalCost : null;
      return {
        config: ag,
        months: months,
        latest: latest,
        totalGMV: totalGMV,
        totalCost: totalCost,
        totalNet: totalNet,
        blendedROI: blendedROI
      };
    });

    // KPI totals across all agencies
    var sumGMV = agencies.reduce(function (s, a) { return s + a.totalGMV; }, 0);
    var sumCost = agencies.reduce(function (s, a) { return s + a.totalCost; }, 0);
    var sumNet = agencies.reduce(function (s, a) { return s + a.totalNet; }, 0);
    var blendedROI = sumCost > 0 ? sumGMV / sumCost : null;
    var totalCreators = agencies.reduce(function (s, a) {
      return s + (a.latest ? (a.latest.creators || 0) : 0);
    }, 0);
    var totalPerf = agencies.reduce(function (s, a) {
      return s + (a.latest ? (a.latest.performing || 0) : 0);
    }, 0);
    var blendedPerfRate = totalCreators > 0 ? totalPerf / totalCreators : 0;

    main.innerHTML =
      '<div class="page-title">' +
        '<h1>Agency Insights</h1>' +
        '<div class="subtitle">Aggregated executive read across all ' + agencies.length + ' agencies.</div>' +
      '</div>' +

      buildKPIStrip(sumGMV, sumCost, sumNet, blendedROI, totalCreators, totalPerf, blendedPerfRate) +
      buildLegend() +

      '<div class="section-header"><div class="section-title">Per-Agency Latest Month</div></div>' +
      buildAgencyTable(agencies) +

      '<div class="section-header"><div class="section-title">Action Callouts</div></div>' +
      buildActions(agencies, blendedROI);
  }

  // 4 cards (was 6). Dropped: "Total agency GMV" + "Total agency cost" — both folded
  // into the Net Contribution + Blended ROAS subtitles since they're the inputs, not
  // the answer. Per 2026-05 KPI rationalization.
  function buildKPIStrip(sumGMV, sumCost, sumNet, blendedROI, totalCreators, totalPerf, blendedPerfRate) {
    return '<div class="kpi-grid">' +
      kpiCard('Net Contribution', U.fmt$(sumNet),
        'GMV ' + U.fmt$(sumGMV) + ' × GM − cost ' + U.fmt$(sumCost),
        sumNet >= 0 ? 'green' : 'red') +
      kpiCard('Blended ROAS', U.fmtX(blendedROI),
        'GMV ÷ ' + U.fmt$(sumCost) + ' cost · break-even ' + U.fmtX(U.getBreakEven()),
        blendedROI != null && blendedROI >= CONFIG.roi.excellent
          ? 'green' : (blendedROI >= CONFIG.roi.good ? 'yellow' : 'red')) +
      kpiCard('Active Creators', U.fmtNum(totalCreators),
        'Across all agencies, latest month', 'gray') +
      kpiCard('Performing Rate', U.fmtPct(blendedPerfRate),
        'Performing ÷ active (latest month)',
        blendedPerfRate >= CONFIG.perfRate.good ? 'green' : (blendedPerfRate >= CONFIG.perfRate.warn ? 'yellow' : 'red')) +
    '</div>';
  }

  function buildLegend() {
    return '<div class="kpi-legend">' +
      '<div class="kpi-legend-title">What these KPIs mean</div>' +
      '<dl>' +
        '<dt>Net Contribution</dt><dd>Cumulative across all agencies × all months: gross profit (GMV × gross-margin) minus all-in agency cost. The single bottom-line cash number for the agency program.</dd>' +
        '<dt>Blended ROAS</dt><dd>Cumulative GMV ÷ cumulative cost across all agencies. Break-even = 1 ÷ gross margin.</dd>' +
        '<dt>Active Creators</dt><dd>Total contracted creators across all agencies in the latest reporting month.</dd>' +
        '<dt>Performing Rate</dt><dd>Performing creators ÷ active creators in the latest month — the share of paid roster that produced any GMV.</dd>' +
      '</dl></div>';
  }

  function kpiCard(label, value, sub, color) {
    return '<div class="kpi-card ' + (color || '') + '">' +
      '<div class="kpi-label">' + escapeHtml(label) + '</div>' +
      '<div class="kpi-value">' + value + '</div>' +
      '<div class="kpi-sub">' + escapeHtml(sub || '') + '</div>' +
      '</div>';
  }

  function buildAgencyTable(agencies) {
    var html = '<div style="background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden;margin-bottom:24px">' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<thead><tr style="background:var(--gray-50);text-align:right">' +
          '<th style="text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-500)">Agency</th>' +
          '<th style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-500)">Latest GMV</th>' +
          '<th style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-500)">Cost</th>' +
          '<th style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-500)">Net</th>' +
          '<th style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-500)">ROAS</th>' +
          '<th style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-500)">Creators</th>' +
          '<th style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-500)">Performing</th>' +
          '<th style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-500)">Perf rate</th>' +
        '</tr></thead><tbody>';

    agencies.forEach(function (a) {
      var l = a.latest;
      if (!l) return;
      html += '<tr style="text-align:right;border-top:1px solid var(--gray-100)">' +
        '<td style="text-align:left;padding:10px 14px"><span class="agency-dot" style="background:' + a.config.color + ';margin-right:8px"></span><strong>' + escapeHtml(a.config.short) + '</strong></td>' +
        '<td style="padding:10px 14px">' + U.fmt$(l.gmv) + '</td>' +
        '<td style="padding:10px 14px">' + U.fmt$(l.totalCost) + '</td>' +
        '<td class="' + (l.net >= 0 ? 'text-green' : 'text-red') + '" style="padding:10px 14px;font-weight:600">' + U.fmt$(l.net) + '</td>' +
        '<td class="' + U.roiCls(l.roi) + '" style="padding:10px 14px;font-weight:600">' + U.fmtX(l.roi) + '</td>' +
        '<td style="padding:10px 14px">' + U.fmtNum(l.creators) + '</td>' +
        '<td style="padding:10px 14px">' + U.fmtNum(l.performing) + '</td>' +
        '<td class="' + U.perfCls(l.perfRate) + '" style="padding:10px 14px;font-weight:600">' + U.fmtPct(l.perfRate) + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function buildActions(agencies, blendedROI) {
    var actions = [];

    agencies.forEach(function (a) {
      if (!a.latest) return;
      // ROI flag
      if (a.latest.roi != null && a.latest.roi < 1) {
        actions.push({
          severity: 'high',
          agency: a.config.short,
          color: a.config.color,
          headline: a.config.short + ' ROAS below 1.0x in latest month (' + U.fmtX(a.latest.roi) + ')',
          detail: 'GMV ' + U.fmt$(a.latest.gmv) + ' on cost ' + U.fmt$(a.latest.totalCost) +
                  ' = net ' + U.fmt$(a.latest.net) + '. Below break-even — review fee structure or pause.'
        });
      } else if (a.latest.roi != null && a.latest.roi < U.getBreakEven()) {
        actions.push({
          severity: 'medium',
          agency: a.config.short,
          color: a.config.color,
          headline: a.config.short + ' below break-even ROAS (' + U.fmtX(a.latest.roi) + ')',
          detail: 'Generates revenue but doesn\'t clear gross-margin break-even (' + U.fmtX(U.getBreakEven()) +
                  ' at ' + Math.round(CONFIG.grossMargin * 100) + '% GM). Net contribution: ' + U.fmt$(a.latest.net) + '.'
        });
      }
      // Performance rate flag
      if (a.latest.perfRate < CONFIG.perfRate.warn && a.latest.creators >= 5) {
        actions.push({
          severity: 'medium',
          agency: a.config.short,
          color: a.config.color,
          headline: a.config.short + ' performing-creator rate at ' + U.fmtPct(a.latest.perfRate),
          detail: a.latest.performing + ' of ' + a.latest.creators + ' creators active in latest month. Below warn threshold (' +
                  U.fmtPct(CONFIG.perfRate.warn) + '). Consider creator review.'
        });
      }
      // Delivery rate flag
      if (a.latest.delRate < 0.7 && a.latest.targetVids > 0) {
        actions.push({
          severity: 'medium',
          agency: a.config.short,
          color: a.config.color,
          headline: a.config.short + ' video delivery at ' + U.fmtPct(a.latest.delRate),
          detail: a.latest.delivered + ' of ' + a.latest.targetVids + ' targeted videos delivered.'
        });
      }
    });

    if (!actions.length) {
      return '<div style="background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:24px;text-align:center;color:var(--gray-500);margin-bottom:24px">' +
        'No critical actions across the agency portfolio this month.' +
        '</div>';
    }

    var html = '<div style="margin-bottom:24px">';
    actions.forEach(function (a) {
      var sevColor = a.severity === 'high' ? 'var(--red)' : 'var(--yellow)';
      var sevBg = a.severity === 'high' ? '#fef2f2' : '#fffbeb';
      html += '<div style="background:' + sevBg + ';border-left:4px solid ' + sevColor + ';padding:12px 16px;border-radius:6px;margin-bottom:10px">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">' +
          '<span class="agency-dot" style="background:' + a.color + '"></span>' +
          '<strong style="color:var(--gray-900)">' + escapeHtml(a.headline) + '</strong>' +
          '<span style="margin-left:auto;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:' + sevColor + ';font-weight:600">' + a.severity + '</span>' +
        '</div>' +
        '<div style="font-size:13px;color:var(--gray-500);line-height:1.5">' + escapeHtml(a.detail) + '</div>' +
        '</div>';
    });
    html += '</div>';
    return html;
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
  window.Views.agency_insights = { render: render };

})();
