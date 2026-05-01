// Q2 Scenarios view — FLOOR / TARGET / STRETCH status table + projection chart.
(function () {
  var u = window.Utils;

  function statusClass(s) {
    var l = (s || '').toLowerCase();
    if (l.indexOf('ahead') !== -1) return 'status-ahead';
    if (l.indexOf('on track') !== -1) return 'status-track';
    if (l.indexOf('at risk') !== -1) return 'status-risk';
    if (l.indexOf('off track') !== -1) return 'status-off';
    return '';
  }

  function render(root, data) {
    var sc = data.scenarios;
    root.innerHTML = '';
    root.appendChild(u.el('h2', { class: 'section-title' }, 'Q2 2026 Scenarios'));
    root.appendChild(u.el('p', { class: 'section-sub' },
      'Comparing actual run-rate (Q2 to date) + our forward forecast against the FLOOR / TARGET / STRETCH plan.'));

    // KPI strip
    var grid = u.el('div', { class: 'stat-grid' });
    sc.summary.forEach(function (s) {
      var color = statusClass(s.status);
      var card = u.el('div', { class: 'stat' });
      card.innerHTML = '<div class="stat-label">' + s.scenario + '</div>'
        + '<div class="stat-value">' + u.fmtCurrencyCompact(s.scenario_total) + '</div>'
        + '<div class="stat-sub"><span class="scenario-status ' + color + '">' + s.status + '</span></div>';
      grid.appendChild(card);
    });
    root.appendChild(grid);

    // Projection chart
    var chartCard = u.el('div', { class: 'card' });
    chartCard.innerHTML = '<div class="card-header"><h3 class="card-title">Q2 projection vs scenario plan</h3>'
      + '<p class="card-sub">Bars: scenario plan total · Marker: our projected Q2 total based on the current forecast.</p></div>'
      + '<div class="chart-wrap"><canvas id="scenario-canvas"></canvas></div>';
    root.appendChild(chartCard);

    // Monthly plan breakdown
    var planCard = u.el('div', { class: 'card' });
    planCard.innerHTML = '<div class="card-header"><h3 class="card-title">Q2 plan — monthly breakdown</h3>'
      + '<p class="card-sub">Plan totals by month for each scenario, from the originally-set Q2 plan.</p></div>'
      + buildPlanMonthlyTable(sc);
    root.appendChild(planCard);

    // Forecast monthly comparison
    if (sc.monthly_by_forecast && Object.keys(sc.monthly_by_forecast).length) {
      var fcCard = u.el('div', { class: 'card' });
      fcCard.innerHTML = '<div class="card-header"><h3 class="card-title">Projected monthly — by forecast scenario</h3>'
        + '<p class="card-sub">April is locked actual ($' + Math.round(sc.april_actual).toLocaleString() + '). '
        + 'May = sum of forecast weeks 0-4 (May Wk1–Wk5). June = forecast weeks 5-9 (Jun Wk1–Wk5).</p></div>'
        + buildForecastMonthlyTable(sc);
      root.appendChild(fcCard);
    }

    // Plan vs Forecast comparison (production = TRIMMED_MEAN)
    if (sc.monthly_by_forecast && sc.monthly_by_forecast.TRIMMED_MEAN) {
      var compareCard = u.el('div', { class: 'card' });
      compareCard.innerHTML = '<div class="card-header"><h3 class="card-title">Plan vs production forecast (Trimmed mean) — monthly $ gap</h3>'
        + '<p class="card-sub">Each cell = our projected month minus that scenario\'s plan month. '
        + 'Positive = ahead. Negative = behind.</p></div>'
        + buildGapMonthlyTable(sc);
      root.appendChild(compareCard);
    }

    // Detail table (existing)
    var tblCard = u.el('div', { class: 'card' });
    tblCard.innerHTML = '<div class="card-header"><h3 class="card-title">Scenario status detail</h3></div>'
      + buildScenarioTable(sc);
    root.appendChild(tblCard);

    requestAnimationFrame(function () { renderChart(sc); });
  }

  function buildPlanMonthlyTable(sc) {
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell">'
      + '<thead><tr>'
      + '<th class="left">Scenario</th>'
      + '<th>April</th>'
      + '<th>May</th>'
      + '<th>June</th>'
      + '<th>Q2 Total</th>'
      + '<th>Anchor / wk</th>'
      + '<th>Decay / wk</th>'
      + '<th class="left">Anchor method</th>'
      + '</tr></thead><tbody>';
    sc.summary.forEach(function (s) {
      html += '<tr><td class="left"><strong>' + u.escapeHtml(s.scenario) + '</strong></td>'
        + '<td>' + u.fmtCurrency(s.plan_april) + '</td>'
        + '<td>' + u.fmtCurrency(s.plan_may) + '</td>'
        + '<td>' + u.fmtCurrency(s.plan_june) + '</td>'
        + '<td><strong>' + u.fmtCurrency(s.scenario_total) + '</strong></td>'
        + '<td>' + u.fmtCurrency(s.jun_anchor_per_week) + '</td>'
        + '<td>' + u.fmtPct(s.decay_per_week) + '</td>'
        + '<td class="left">' + u.escapeHtml(s.anchor_method) + '</td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function buildForecastMonthlyTable(sc) {
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell">'
      + '<thead><tr>'
      + '<th class="left">Forecast scenario</th>'
      + '<th>April (actual)</th>'
      + '<th>May (proj)</th>'
      + '<th>June (proj)</th>'
      + '<th>Q2 Total</th>'
      + '<th>vs FLOOR</th>'
      + '<th>vs TARGET</th>'
      + '<th>vs STRETCH</th>'
      + '</tr></thead><tbody>';
    var floorTotal = (sc.summary.find(function (s) { return s.scenario === 'FLOOR'; }) || {}).scenario_total || 0;
    var targetTotal = (sc.summary.find(function (s) { return s.scenario === 'TARGET'; }) || {}).scenario_total || 0;
    var stretchTotal = (sc.summary.find(function (s) { return s.scenario === 'STRETCH'; }) || {}).scenario_total || 0;
    var order = ['TRIMMED_MEAN', 'CONSERVATIVE', 'TRAILING4_MEAN', 'HOLD_LATEST'];
    var labels = {
      TRIMMED_MEAN: 'Trimmed mean (production)',
      CONSERVATIVE: 'Conservative (worst case)',
      TRAILING4_MEAN: 'Trailing 4-wk mean (flat)',
      HOLD_LATEST: 'Hold W8 flat (upper)',
    };
    order.forEach(function (name) {
      var m = sc.monthly_by_forecast[name];
      if (!m) return;
      var isProduction = (name === 'TRIMMED_MEAN');
      var rowClass = isProduction ? ' class="grand-total"' : '';
      var gapFloor = m.q2_total - floorTotal;
      var gapTarget = m.q2_total - targetTotal;
      var gapStretch = m.q2_total - stretchTotal;
      html += '<tr' + rowClass + '><td class="left"><strong>' + u.escapeHtml(labels[name] || name) + '</strong></td>'
        + '<td>' + u.fmtCurrency(m.april) + '</td>'
        + '<td>' + u.fmtCurrency(m.may) + '</td>'
        + '<td>' + u.fmtCurrency(m.june) + '</td>'
        + '<td><strong>' + u.fmtCurrency(m.q2_total) + '</strong></td>'
        + '<td>' + signedCurrency(gapFloor) + '</td>'
        + '<td>' + signedCurrency(gapTarget) + '</td>'
        + '<td>' + signedCurrency(gapStretch) + '</td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function buildGapMonthlyTable(sc) {
    var prod = sc.monthly_by_forecast.TRIMMED_MEAN;
    if (!prod) return '';
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell">'
      + '<thead><tr>'
      + '<th class="left">Plan scenario</th>'
      + '<th>April</th>'
      + '<th>May Δ</th>'
      + '<th>June Δ</th>'
      + '<th>Q2 Total Δ</th>'
      + '<th class="left">Status</th>'
      + '</tr></thead><tbody>';
    sc.summary.forEach(function (s) {
      var aprilDelta = prod.april - s.plan_april;
      var mayDelta = prod.may - s.plan_may;
      var juneDelta = prod.june - s.plan_june;
      var q2Delta = prod.q2_total - s.scenario_total;
      var statusCls = statusClass(s.status);
      html += '<tr><td class="left"><strong>' + u.escapeHtml(s.scenario) + '</strong> ($'
        + Math.round(s.scenario_total).toLocaleString() + ')</td>'
        + '<td>' + signedCurrency(aprilDelta) + '</td>'
        + '<td>' + signedCurrency(mayDelta) + '</td>'
        + '<td>' + signedCurrency(juneDelta) + '</td>'
        + '<td><strong>' + signedCurrency(q2Delta) + '</strong></td>'
        + '<td class="left"><span class="scenario-status ' + statusCls + '">' + u.escapeHtml(s.status) + '</span></td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function signedCurrency(v) {
    if (v === 0) return '<span class="wow-flat">—</span>';
    var cls = v > 0 ? 'wow-pos' : 'wow-neg';
    var sign = v > 0 ? '+' : '';
    return '<span class="' + cls + '">' + sign + window.Utils.fmtCurrency(v) + '</span>';
  }

  function buildScenarioTable(sc) {
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell">'
      + '<thead><tr>'
      + '<th class="left">Scenario</th>'
      + '<th>Plan Total</th>'
      + '<th>Anchor / wk</th>'
      + '<th>Decay / wk</th>'
      + '<th>Actual Q2 to date</th>'
      + '<th>Projected Q2 Total</th>'
      + '<th>Gap vs Plan</th>'
      + '<th>Gap %</th>'
      + '<th class="left">Status</th>'
      + '</tr></thead><tbody>';
    sc.summary.forEach(function (s) {
      var statusCls = statusClass(s.status);
      html += '<tr><td class="left"><strong>' + u.escapeHtml(s.scenario) + '</strong></td>'
        + '<td>' + u.fmtCurrency(s.scenario_total) + '</td>'
        + '<td>' + u.fmtCurrency(s.jun_anchor_per_week) + '</td>'
        + '<td>' + u.fmtPct(s.decay_per_week) + '</td>'
        + '<td>' + u.fmtCurrency(s.actual_q2_to_date) + '</td>'
        + '<td>' + u.fmtCurrency(s.projected_q2_total) + '</td>'
        + '<td>' + (s.gap_vs_scenario >= 0 ? '<span class="wow-pos">' : '<span class="wow-neg">')
        + (s.gap_vs_scenario >= 0 ? '+' : '') + u.fmtCurrency(s.gap_vs_scenario) + '</span></td>'
        + '<td>' + u.wowCell(s.gap_pct) + '</td>'
        + '<td class="left"><span class="scenario-status ' + statusCls + '">' + u.escapeHtml(s.status) + '</span></td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function renderChart(sc) {
    var canvas = document.getElementById('scenario-canvas');
    if (!canvas || !window.Chart) return;
    var labels = sc.summary.map(function (s) { return s.scenario; });
    var planData = sc.summary.map(function (s) { return s.scenario_total; });
    var actualData = sc.summary.map(function (s) { return s.actual_q2_to_date; });
    var projectedRemainder = sc.summary.map(function (s) { return s.projected_q2_remainder; });

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Plan total',
            data: planData,
            backgroundColor: 'rgba(156, 163, 175, 0.45)',
            borderColor: 'rgba(75, 85, 99, 0.7)',
            borderWidth: 1.5,
            borderDash: [4, 4],
            type: 'bar',
            order: 3,
          },
          {
            label: 'Actual Q2 to date',
            data: actualData,
            backgroundColor: 'rgba(2, 132, 199, 0.85)',
            borderRadius: 4,
            stack: 'projection',
            order: 1,
          },
          {
            label: 'Projected remainder',
            data: projectedRemainder,
            backgroundColor: 'rgba(99, 102, 241, 0.65)',
            borderRadius: 4,
            stack: 'projection',
            order: 2,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true,
               ticks: { callback: function (v) { return window.Utils.fmtCurrencyCompact(v); } } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
          tooltip: {
            callbacks: { label: function (ctx) {
              return ctx.dataset.label + ': ' + window.Utils.fmtCurrency(ctx.parsed.y);
            } }
          }
        }
      }
    });
  }

  window.Views = window.Views || {};
  window.Views.tiktok_scenarios = { render: render };
})();
