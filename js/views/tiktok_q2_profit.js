// Q2 Profit Matrix — 4 forecast scenarios × 6 ROAS scenarios = 24-cell CM grid.
(function () {
  var u = window.Utils;

  function render(root, data) {
    var m = data.q2_profit_matrix;
    if (!m || !m.available) {
      root.innerHTML = '<div class="empty-state"><h3>Q2 profit matrix unavailable</h3>'
        + '<p>Requires the Profitability Calculator + forecast scenarios. '
        + 'Re-run <code>/weekly-tiktok-dashboard</code>.</p></div>';
      return;
    }

    root.innerHTML = '';
    root.appendChild(u.el('h2', { class: 'section-title' }, 'Q2 Profit Matrix'));
    root.appendChild(u.el('p', { class: 'section-sub' },
      'Q2 contribution margin (April actual + ' + m.n_forecast_weeks + '-week May/Jun projection) '
      + 'under each forecast scenario × ROAS scenario. Bottom-line cash number = CM after retainer. '
      + 'Cells in red show net cash burn for the quarter.'));

    // Anchor numbers strip
    var grid = u.el('div', { class: 'stat-grid' });
    grid.appendChild(makeStat('April actual CM after ads',
      coloredCurrency(m.april_cm_after_ads), 'W5–W8 sum (B12 + D3K2 only)'));
    grid.appendChild(makeStat('April actual CM after retainer',
      coloredCurrency(m.april_cm_after_retainer), 'Net of weekly retainers'));
    grid.appendChild(makeStat('Weekly retainer (covered)',
      u.fmtCurrency(m.weekly_retainer_total) + '/wk',
      m.weekly_retainer_excluded > 0
        ? 'Excludes ' + u.fmtCurrency(m.weekly_retainer_excluded) + '/wk for ' + m.families_excluded_from_retainer.join(', ')
        : 'B12 + D3K2 retainer load'));
    grid.appendChild(makeStat(
      'Recommended (' + m.recommended.scenario + ' × ' + m.recommended.roas + 'x)',
      coloredCurrency(m.recommended.q2_cm_after_retainer),
      'Q2 CM after retainer at central case'));
    root.appendChild(grid);

    // The two matrices
    var afterAdsCard = u.el('div', { class: 'card' });
    afterAdsCard.innerHTML = '<div class="card-header"><h3 class="card-title">Q2 CM AFTER ADS — by forecast scenario × ROAS</h3>'
      + '<p class="card-sub">April actual CM ($' + Math.round(m.april_cm_after_ads).toLocaleString() + ') + 10-wk May/Jun projection. '
      + 'Excludes weekly retainer load (separate row below).</p></div>'
      + buildMatrixTable(m, "q2_cm_after_ads");
    root.appendChild(afterAdsCard);

    var afterRetainerCard = u.el('div', { class: 'card' });
    afterRetainerCard.innerHTML = '<div class="card-header"><h3 class="card-title">Q2 CM AFTER RETAINER — fully loaded</h3>'
      + '<p class="card-sub">CM after ads minus ' + u.fmtCurrency(m.weekly_retainer_total) + '/wk × ' + m.n_forecast_weeks + ' weeks ($'
      + (Math.round(m.weekly_retainer_total * m.n_forecast_weeks)).toLocaleString() + ' total retainer over the projection period). '
      + 'This is the bottom-line cash number for Q2 from this channel.</p></div>'
      + buildMatrixTable(m, "q2_cm_after_retainer");
    root.appendChild(afterRetainerCard);

    // Per-family CM contribution (May+June projection only) at recommended ROAS
    var familyCard = u.el('div', { class: 'card' });
    familyCard.innerHTML = '<div class="card-header"><h3 class="card-title">May+June projected CM by family</h3>'
      + '<p class="card-sub">How each family contributes to the projected May+Jun CM under each (scenario, ROAS) cell. '
      + 'D3K2 stays negative across nearly all cells — structural unit-economics issue.</p></div>'
      + buildFamilyTable(m);
    root.appendChild(familyCard);

    // Break-even analysis
    var beCard = u.el('div', { class: 'card' });
    beCard.innerHTML = '<div class="card-header"><h3 class="card-title">Break-even read</h3></div>'
      + buildBreakEven(m);
    root.appendChild(beCard);
  }

  function makeStat(label, value, sub) {
    var d = u.el('div', { class: 'stat' });
    d.innerHTML = '<div class="stat-label">' + label + '</div>'
      + '<div class="stat-value">' + value + '</div>'
      + '<div class="stat-sub">' + (sub == null ? '' : sub) + '</div>';
    return d;
  }

  function coloredCurrency(v) {
    var color = v >= 0 ? 'var(--success)' : 'var(--danger)';
    return '<span style="color:' + color + '">' + u.fmtCurrency(v) + '</span>';
  }

  function buildMatrixTable(m, key) {
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell"><thead><tr>'
      + '<th class="left">Forecast scenario</th>';
    m.roas_scenarios.forEach(function (r) {
      html += '<th>' + r.toFixed(1) + 'x ROAS</th>';
    });
    html += '</tr></thead><tbody>';
    m.forecast_scenarios.forEach(function (s) {
      html += '<tr><td class="left"><strong>' + u.escapeHtml(s.replace('_', ' ')) + '</strong></td>';
      m.roas_scenarios.forEach(function (r) {
        var v = m.grand_matrix[s][r.toFixed(1)][key];
        var cls = v < 0 ? 'cell-danger-bg' : (v > 0 ? 'cell-success-bg' : '');
        // Highlight the recommended cell
        var isRec = (s === m.recommended.scenario && Math.abs(r - m.recommended.roas) < 0.01);
        var border = isRec ? ' style="border:2px solid var(--primary); font-weight:700"' : '';
        html += '<td class="' + cls + '"' + border + '>' + u.fmtCurrency(v) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function buildFamilyTable(m) {
    // Show the family rows × ROAS for the recommended scenario only
    var s = m.recommended.scenario;
    var html = '<div class="tbl-wrap"><table class="tbl numeric-cell"><thead><tr>'
      + '<th class="left">Family (May+Jun proj.)</th>'
      + '<th>Ref ROAS</th>'
      + '<th>Ref CM/unit</th>';
    m.roas_scenarios.forEach(function (r) {
      html += '<th>' + r.toFixed(1) + 'x</th>';
    });
    html += '</tr></thead><tbody>';
    m.family_rows.forEach(function (fr) {
      html += '<tr><td class="left"><strong>' + u.escapeHtml(fr.family) + '</strong></td>'
        + '<td>' + fr.ref_roas.toFixed(2) + 'x</td>'
        + '<td>' + u.fmtCurrency(fr.ref_cm_per_unit, { decimals: 2 }) + '/u</td>';
      m.roas_scenarios.forEach(function (r) {
        var v = fr.matrix[s][r.toFixed(1)];
        var cls = v < 0 ? 'cell-danger-bg' : (v > 0 ? 'cell-success-bg' : '');
        html += '<td class="' + cls + '">' + u.fmtCurrency(v) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>'
      + '<p class="card-sub" style="margin-top:8px">Forecast scenario: <code>' + s + '</code>. Switch the Forecast tab toggle to compare scenarios.</p></div>';
    return html;
  }

  function buildBreakEven(m) {
    var totalRetainer = m.weekly_retainer_total * m.n_forecast_weeks;
    var aprilLoss = -m.april_cm_after_retainer;  // positive number = magnitude of loss
    var aprilDeficit = aprilLoss > 0 ? aprilLoss : 0;
    var totalToCover = totalRetainer + aprilDeficit;

    // Find the lowest ROAS at which any scenario clears 0
    var bestScenarioRoas = null;
    var bestScenarioCm = -Infinity;
    m.forecast_scenarios.forEach(function (s) {
      m.roas_scenarios.forEach(function (r) {
        var v = m.grand_matrix[s][r.toFixed(1)].q2_cm_after_retainer;
        if (v > bestScenarioCm) {
          bestScenarioCm = v;
          bestScenarioRoas = { scenario: s, roas: r, value: v };
        }
      });
    });

    var html = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">'
      + '<div>'
      + '<h4 style="margin:0 0 8px">What it takes to break even on Q2</h4>'
      + '<ul style="margin:0; padding-left:22px; line-height:1.6">'
      + '<li>April actual CM after retainer: <strong>' + u.fmtCurrency(m.april_cm_after_retainer) + '</strong>'
      + (aprilDeficit > 0 ? ' — already a deficit to dig out of' : ' — running positive') + '</li>'
      + '<li>10-wk retainer load: <strong>' + u.fmtCurrency(totalRetainer) + '</strong></li>'
      + '<li>Total CM-after-ads needed to clear $0 Q2: <strong>' + u.fmtCurrency(totalToCover) + '</strong></li>'
      + '</ul>'
      + '</div>'
      + '<div>'
      + '<h4 style="margin:0 0 8px">Best cell in the matrix</h4>'
      + '<p style="margin:0 0 4px"><strong>' + bestScenarioRoas.scenario + ' × ' + bestScenarioRoas.roas.toFixed(1) + 'x</strong>: '
      + coloredCurrency(bestScenarioRoas.value) + ' Q2 CM after retainer</p>'
      + '<p class="card-sub" style="margin:0">'
      + (bestScenarioRoas.value < 0
          ? 'No (forecast × ROAS) combination in the modeled space breaks even on Q2 — the channel is structurally cash-negative at current retainer level + unit economics. Action levers: cut retainers, fix D3K2 unit economics, or raise sale prices.'
          : 'This scenario delivers positive Q2 cash flow.')
      + '</p>'
      + '</div>'
      + '</div>';

    return html;
  }

  window.Views = window.Views || {};
  window.Views.tiktok_q2_profit = { render: render };
})();
