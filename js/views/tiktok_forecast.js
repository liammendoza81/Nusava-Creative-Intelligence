// GMV & DSR Forecast view — forward 10-week projection per SKU.
// Supports a live scenario toggle (TRIMMED_MEAN / CONSERVATIVE / TRAILING4_MEAN / HOLD_LATEST).
(function () {
  var u = window.Utils;

  // Module state — current scenario for this view (persists during session)
  var state = { scenario: null };

  function render(root, data) {
    var fc = data.forecast;
    if (!fc.scenarios || !fc.default_scenario) {
      // Legacy data file — fall back to flat single-scenario render
      return renderLegacy(root, fc);
    }
    if (!state.scenario || !fc.scenarios[state.scenario]) {
      state.scenario = fc.default_scenario;
    }

    root.innerHTML = '';
    root.appendChild(u.el('h2', { class: 'section-title' }, 'GMV & DSR Forecast'));
    root.appendChild(u.el('p', { class: 'section-sub' },
      'Forward 10-week projection per SKU. Toggle the scenario to see how the forecast changes — '
      + 'production default is Trimmed Mean (drops the weakest of the last 4 weeks; applies decay only on sustained directional trends).'));

    // Scenario toggle bar
    var toggleBar = buildToggleBar(fc, function (newScenario) {
      state.scenario = newScenario;
      render(root, data);
    });
    root.appendChild(toggleBar);

    // Method note for current scenario
    var meta = fc.scenario_meta && fc.scenario_meta[state.scenario];
    if (meta) {
      var noteCard = u.el('div', { class: 'callout' });
      noteCard.innerHTML = '<p><strong>' + u.escapeHtml(meta.label) + '.</strong> ' + u.escapeHtml(meta.note) + '</p>';
      root.appendChild(noteCard);
    }

    var current = fc.scenarios[state.scenario];

    // Grand-total trend chart
    var trendCard = u.el('div', { class: 'card' });
    trendCard.innerHTML = '<div class="card-header">'
      + '<div><h3 class="card-title">Grand-total GMV: actuals + forecast</h3>'
      + '<p class="card-sub">First 4 columns are actuals (left of the dashed line). Last 10 are projected under the selected scenario.</p></div>'
      + '</div>'
      + '<div class="chart-wrap tall"><canvas id="forecast-grand-canvas"></canvas></div>';
    root.appendChild(trendCard);

    // Top 5 SKUs trend
    var topCard = u.el('div', { class: 'card' });
    topCard.innerHTML = '<div class="card-header"><h3 class="card-title">Top 5 SKUs — actual + forecast</h3></div>'
      + '<div class="chart-wrap tall"><canvas id="forecast-top-canvas"></canvas></div>';
    root.appendChild(topCard);

    // Per-SKU forecast table
    var tblCard = u.el('div', { class: 'card' });
    tblCard.innerHTML = '<div class="card-header"><h3 class="card-title">All SKUs — GMV &amp; DSR forecast (' + u.escapeHtml((meta && meta.label) || state.scenario) + ')</h3></div>'
      + buildForecastTable(fc, current);
    root.appendChild(tblCard);

    requestAnimationFrame(function () {
      renderGrandChart(fc, current);
      renderTopChart(fc, current);
    });
  }

  function buildToggleBar(fc, onChange) {
    var wrap = u.el('div', { class: 'card', style: 'padding: 12px 20px; margin-bottom: 16px;' });
    wrap.innerHTML = '<div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">'
      + '<strong style="font-size:13px; color:#6b7280;">Forecast scenario:</strong>'
      + '<div id="scenario-buttons" style="display:flex; gap:6px; flex-wrap:wrap;"></div>'
      + '<span id="scenario-grand-total" style="margin-left:auto; font-size:12px; color:#6b7280;"></span>'
      + '</div>';
    var btnHost = wrap.querySelector('#scenario-buttons');
    fc.scenario_order.forEach(function (name) {
      var meta = fc.scenario_meta[name] || { label: name };
      var btn = document.createElement('button');
      btn.className = 'scenario-btn' + (name === state.scenario ? ' active' : '');
      btn.textContent = meta.label;
      btn.onclick = function () { onChange(name); };
      btnHost.appendChild(btn);
    });
    // Show grand-total side-by-side
    var sumNote = wrap.querySelector('#scenario-grand-total');
    var grand4wk = {};
    fc.scenario_order.forEach(function (name) {
      var gt = fc.scenarios[name].grand_total.gmv_series;
      var nA = fc.actual_weeks.length;
      grand4wk[name] = 0;
      for (var i = 0; i < 4; i++) grand4wk[name] += (gt[nA + i] || 0);
    });
    sumNote.innerHTML = 'Q2 4-wk: '
      + fc.scenario_order.map(function (n) {
          var meta = fc.scenario_meta[n];
          return '<strong>' + (meta ? meta.label.split(' ')[0] : n) + '</strong> ' + u.fmtCurrencyCompact(grand4wk[n]);
        }).join(' &middot; ');
    return wrap;
  }

  function buildForecastTable(fc, current) {
    var allWeeks = fc.all_weeks;
    var nActuals = fc.actual_weeks.length;
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell">';
    html += '<thead class="two-row"><tr class="group">'
      + '<th rowspan="2" class="left">Product</th>'
      + '<th rowspan="2" class="left">Flavor</th>'
      + '<th rowspan="2" class="left">Metric</th>'
      + '<th colspan="' + nActuals + '">◀  ACTUALS  ▶</th>'
      + '<th colspan="' + (allWeeks.length - nActuals) + '">◀  FORECAST  ▶</th>'
      + '</tr><tr>';
    for (var i = 0; i < allWeeks.length; i++) {
      html += '<th>' + u.escapeHtml(allWeeks[i]) + '</th>';
    }
    html += '</tr></thead><tbody>';

    function renderRowPair(r, isFamily, isGrand) {
      var cls = isGrand ? 'grand-total' : (isFamily ? 'subtotal' : '');
      html += '<tr class="' + cls + '"><td class="left" rowspan="2">' + u.escapeHtml(r.product) + '</td>'
        + '<td class="left" rowspan="2">' + u.escapeHtml(r.flavor || '') + '</td>'
        + '<td class="left">GMV</td>';
      for (var i = 0; i < r.gmv_series.length; i++) {
        var dim = i >= nActuals ? ' style="color:#6b7280"' : '';
        html += '<td' + dim + '>' + u.fmtCurrency(r.gmv_series[i]) + '</td>';
      }
      html += '</tr><tr class="' + cls + '">';
      html += '<td class="left">DSR</td>';
      for (var j = 0; j < r.dsr_series.length; j++) {
        var dim2 = j >= nActuals ? ' style="color:#6b7280"' : '';
        html += '<td' + dim2 + '>' + u.fmtNumber(r.dsr_series[j], { decimals: 1 }) + '</td>';
      }
      html += '</tr>';
    }

    var byFamily = {};
    current.rows.forEach(function (r) { (byFamily[r.product] = byFamily[r.product] || []).push(r); });
    Object.keys(byFamily).sort().forEach(function (fam) {
      byFamily[fam].forEach(function (r) { renderRowPair(r, false, false); });
      var ft = current.family_totals.find(function (f) {
        return (f.product || '').indexOf(fam) !== -1;
      });
      if (ft) renderRowPair(ft, true, false);
      html += '<tr class="divider"><td colspan="' + (3 + allWeeks.length) + '"></td></tr>';
    });
    if (current.grand_total) renderRowPair(current.grand_total, false, true);

    html += '</tbody></table></div>';
    return html;
  }

  function renderGrandChart(fc, current) {
    var canvas = document.getElementById('forecast-grand-canvas');
    if (!canvas || !window.Chart) return;
    if (canvas._chart) { canvas._chart.destroy(); canvas._chart = null; }
    var nA = fc.actual_weeks.length;
    var actuals = current.grand_total.gmv_series.slice(0, nA);
    var forecasts = current.grand_total.gmv_series.slice(nA);
    var actualsPadded = actuals.concat(forecasts.map(function () { return null; }));
    var forecastsPadded = actuals.map(function (_, i) {
      return i === nA - 1 ? actuals[i] : null;
    }).concat(forecasts);

    canvas._chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: fc.all_weeks,
        datasets: [
          {
            label: 'Actual',
            data: actualsPadded,
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.15)',
            tension: 0.25, pointRadius: 4, borderWidth: 2.5, fill: true,
          },
          {
            label: 'Forecast',
            data: forecastsPadded,
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderDash: [6, 4],
            tension: 0.25, pointRadius: 4, borderWidth: 2.5, fill: true,
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
              if (ctx.parsed.y == null) return null;
              return ctx.dataset.label + ': ' + window.Utils.fmtCurrency(ctx.parsed.y);
            } }
          }
        }
      }
    });
  }

  function renderTopChart(fc, current) {
    var canvas = document.getElementById('forecast-top-canvas');
    if (!canvas || !window.Chart) return;
    if (canvas._chart) { canvas._chart.destroy(); canvas._chart = null; }
    var top = current.rows.slice().sort(function (a, b) {
      var ag = (a.gmv_series[0] || 0) + (a.gmv_series[1] || 0) + (a.gmv_series[2] || 0) + (a.gmv_series[3] || 0);
      var bg = (b.gmv_series[0] || 0) + (b.gmv_series[1] || 0) + (b.gmv_series[2] || 0) + (b.gmv_series[3] || 0);
      return bg - ag;
    }).slice(0, 5);

    var palette = ['#0284c7', '#6366f1', '#16a34a', '#d97706', '#dc2626'];
    canvas._chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: fc.all_weeks,
        datasets: top.map(function (r, i) {
          return {
            label: r.product + ' / ' + (r.flavor || '(unattributed)'),
            data: r.gmv_series,
            borderColor: palette[i],
            backgroundColor: palette[i] + '22',
            tension: 0.25,
            pointRadius: 3,
            borderWidth: 2,
          };
        })
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true,
               ticks: { callback: function (v) { return window.Utils.fmtCurrencyCompact(v); } } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
          tooltip: {
            callbacks: { label: function (ctx) {
              return ctx.dataset.label + ': ' + window.Utils.fmtCurrency(ctx.parsed.y);
            } }
          }
        }
      }
    });
  }

  // === Legacy fallback for older data files without the scenarios envelope ===
  function renderLegacy(root, fc) {
    root.innerHTML = '';
    root.appendChild(u.el('h2', { class: 'section-title' }, 'GMV & DSR Forecast'));
    root.appendChild(u.el('p', { class: 'section-sub' },
      'Re-run /weekly-tiktok-dashboard to enable the scenario toggle.'));
  }

  window.Views = window.Views || {};
  window.Views.tiktok_forecast = { render: render };
})();
