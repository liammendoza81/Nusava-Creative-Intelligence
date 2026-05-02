/* =========================================================
   Nusava — Agency View
   Sub-tabs: Overview | Creator Rankings | Evaluation |
             Concentration | Video Performance | Data Table
   ========================================================= */

window.Views = window.Views || {};

window.Views.agency = {

  _currentTab: 'overview',
  _selectedMonth: null,

  render: function (agencyId) {
    this._currentTab = 'overview';
    this._agencyId   = agencyId;

    var agCfg = U.getAgencyConfig(agencyId);
    var raw   = U.getAgencyData(agencyId);

    if (!raw || !raw.months || raw.months.length === 0) {
      document.getElementById('main-content').innerHTML =
        '<div class="placeholder-card" style="margin-top:40px">' +
        '<h3>No data for ' + agCfg.name + '</h3>' +
        '<p>Add monthly data to <code>data/' + agencyId + '.js</code></p></div>';
      return;
    }

    var months = raw.months.map(function (m, i) {
      var em = U.enrich(m);
      em.label  = m.label || ('M' + (i + 1));
      em._month = i;
      return em;
    });

    this._months   = months;
    this._raw      = raw;
    this._agCfg    = agCfg;
    this._selectedMonth = months[months.length - 1].label;

    this._renderShell(agencyId, agCfg, months);
    this._renderTab('overview');
  },

  /* ── Build the outer shell (header + sub-tab bar) ── */
  _renderShell: function (agencyId, agCfg, months) {
    var self   = this;
    var latest = months[months.length - 1];
    var totalGMV = months.reduce(function (s, m) { return s + m.gmv; }, 0);

    var html = '<div class="tab-pane">';

    // Agency header
    html += '<div class="agency-header">';
    html += '<div class="agency-color-dot" style="background:' + agCfg.color + '"></div>';
    html += '<div><h1>' + agCfg.name + '</h1>';
    html += '<div class="agency-meta">' + months.length + ' campaign months · Total GMV ' + U.fmt$(totalGMV) + ' · Latest: ' + latest.period + '</div></div>';
    html += '</div>';

    // Sub-tabs
    var tabs = [
      { id: 'overview',     label: 'Overview'            },
      { id: 'rankings',     label: 'Creator Rankings'    },
      { id: 'evaluation',   label: 'Creator Evaluation'  },
      { id: 'concentration',label: 'Concentration'       },
      { id: 'video',        label: 'Video Performance'   },
      { id: 'gmvlag',       label: 'GMV Lag'             },
      { id: 'incremental',  label: 'Incremental'         },
      { id: 'table',        label: 'Data Table'          }
    ];

    html += '<div class="sub-tab-bar">';
    tabs.forEach(function (t) {
      html += '<button class="sub-tab" data-tab="' + t.id + '">' + t.label + '</button>';
    });
    html += '</div>';

    // Content area
    html += '<div id="agency-tab-content"></div>';
    html += '</div>';

    document.getElementById('main-content').innerHTML = html;

    // Wire up sub-tab clicks
    document.querySelectorAll('.sub-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        self._currentTab = btn.getAttribute('data-tab');
        self._renderTab(self._currentTab);
      });
    });
  },

  /* ── Dispatch to the right sub-tab renderer ── */
  _renderTab: function (tabId) {
    // Highlight active tab
    document.querySelectorAll('.sub-tab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });

    // Kill all charts before re-render
    ['agency-gmv-fees','agency-perf-stack','agency-roi-line','agency-profit-fees',
     'agency-cumulative','agency-scatter','agency-creator-bar','agency-creator-trend',
     'agency-donut','agency-pareto','agency-share-trend','agency-vid-delivery',
     'agency-gpv','agency-vpv','agency-vol-eff',
     'agency-lag-bar','agency-lag-pct',
     'agency-incr-stack','agency-incr-ratio'].forEach(function (id) {
      Charts.kill(id);
    });

    var content = document.getElementById('agency-tab-content');
    if (!content) return;

    switch (tabId) {
      case 'overview':      this._renderOverview(content);      break;
      case 'rankings':      this._renderRankings(content);      break;
      case 'evaluation':    this._renderEvaluation(content);    break;
      case 'concentration': this._renderConcentration(content); break;
      case 'video':         this._renderVideo(content);         break;
      case 'gmvlag':        GmvLag.renderForAgency(this._agencyId, content);      break;
      case 'incremental':   Incremental.renderForAgency(this._agencyId, content); break;
      case 'table':         this._renderTable(content);         break;
      default:              content.innerHTML = '';
    }
  },

  /* ════════════════════════════════════════════════════════
     OVERVIEW SUB-TAB
     ════════════════════════════════════════════════════════ */
  _renderOverview: function (container) {
    var months  = this._months;
    var agId    = this._agencyId;
    var agCfg   = this._agCfg;
    var latest  = months[months.length - 1];
    var gm      = CONFIG.grossMargin;
    var isInternal = (agId === 'internal');
    var costLbl = isInternal ? 'Retainer Cost' : 'Agency Fees';
    var breakEven = U.getBreakEven();

    // Sample costs notice
    var hasSampleCosts = months.some(function (m) { return m.sampleCosts != null; });

    var html = '<div class="tab-pane">';

    // Alerts
    if (agId === 'creatify') {
      html += '<div class="alert-bar"><div class="alert alert-yellow"><div>' +
        '<strong>M6 one-time spike:</strong> palomaashop contributed $103,842 in M6 — a one-time outlier. ' +
        'Underlying M6 trend ex-palomaashop ≈ $278,699. ROAS of ' + U.fmtX(months[5] && months[5].roi) + ' reflects this spike.</div></div></div>';
    }

    if (!hasSampleCosts) {
      html += '<div class="info-notice">Sample product costs not tracked for ' + agCfg.short + '. ROAS is calculated on ' + costLbl.toLowerCase() + ' only.</div>';
    }

    // KPI grid — 5 cards (was 6). Per 2026-05 KPI rationalization:
    // - Dropped "Latest cost" → folded into ROAS subtitle as denominator
    // - Dropped "Total views" → vanity metric, agencies aren't paid on views
    // - Added "Median Post-to-Perf" (TTP for this agency's creators, when weekly data is loaded)
    var totalLatestCost = isInternal && latest.fees === 0 ? (latest.retainerCost || 0) : (latest.cost || 0);
    var costSub = (hasSampleCosts ? ' + ' + U.fmt$(latest.sampleCosts || 0) + ' samples' : '');

    // Per-agency TTP — pulls from window.DATA_WEEKLY (TikTok performance data) if loaded.
    // Filters topVideos to this agency, then computes median age. Falls back to "—" if not.
    var ttpMedian = computeAgencyTTP(agId);

    html += '<div class="kpi-grid">';
    html += kpiCard('Latest GMV', U.fmt$(latest.gmv), latest.period, 'green');
    html += kpiCard('ROAS', U.fmtX(latest.roi),
      'GMV ÷ ' + U.fmt$(totalLatestCost) + ' cost' + costSub + ' · break-even ' + U.fmtX(breakEven),
      latest.roi >= breakEven ? 'green' : 'red');
    html += kpiCard('Performing Creators',
      latest.performing + ' / ' + latest.creators,
      U.fmtPct(latest.perfRate) + ' performing rate',
      U.perfCls(latest.perfRate) === 'text-green' ? 'green' : U.perfCls(latest.perfRate) === 'text-yellow' ? 'yellow' : 'red');
    html += kpiCard('Videos Delivered', U.fmtNum(latest.delivered),
      latest.targetVids + ' target · ' + (latest.delRate >= 1 ? 'hit' : Math.round(latest.delRate * 100) + '% of target'),
      latest.delRate >= 1 ? 'green' : 'orange');
    html += kpiCard('Median Post-to-Perf',
      ttpMedian.value == null ? '—' : ttpMedian.value + 'd',
      ttpMedian.note,
      ttpMedian.value == null ? 'gray' : (ttpMedian.value <= 7 ? 'green' : ttpMedian.value <= 14 ? 'yellow' : 'orange'));
    html += '</div>';

    // KPI legend
    html += buildKPILegend(costLbl, breakEven, gm);

    // Charts: GMV vs Fees, ROI line, Performing Stack, Profit vs Fees
    html += '<div class="chart-grid">';
    html += '<div class="chart-card"><div class="chart-title">GMV vs ' + costLbl + ' vs Gross Profit</div><div class="chart-sub">Monthly comparison at ' + (gm * 100).toFixed(0) + '% gross margin</div><div class="chart-wrap" style="height:260px"><canvas id="agency-gmv-fees"></canvas></div></div>';
    html += '<div class="chart-card"><div class="chart-title">Performing vs Non-Performing Creators</div><div class="chart-sub">Monthly creator roster breakdown</div><div class="chart-wrap" style="height:260px"><canvas id="agency-perf-stack"></canvas></div></div>';
    html += '<div class="chart-card"><div class="chart-title">ROAS (GMV ÷ Fees)</div><div class="chart-sub">Break-even = ' + breakEven.toFixed(2) + 'x at current margin</div><div class="chart-wrap" style="height:240px"><canvas id="agency-roi-line"></canvas></div></div>';
    html += '<div class="chart-card"><div class="chart-title">Net Profit vs ' + costLbl + '</div><div class="chart-sub">At ' + (gm * 100).toFixed(0) + '% gross margin assumption</div><div class="chart-wrap" style="height:240px"><canvas id="agency-profit-fees"></canvas></div></div>';
    html += '</div>';

    // Cumulative GMV
    html += '<div class="chart-grid single">';
    html += '<div class="chart-card"><div class="chart-title">Cumulative GMV</div><div class="chart-sub">Running total across all campaign months</div><div class="chart-wrap" style="height:220px"><canvas id="agency-cumulative"></canvas></div></div>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;

    setTimeout(function () {
      Charts.gmvVsFees('agency-gmv-fees', months, gm);
      Charts.perfStack('agency-perf-stack', months);
      Charts.roiLine('agency-roi-line', months, breakEven);
      Charts.profitVsFees('agency-profit-fees', months, gm);
      Charts.cumulative('agency-cumulative', months);
    }, 50);
  },

  /* ════════════════════════════════════════════════════════
     CREATOR RANKINGS SUB-TAB
     ════════════════════════════════════════════════════════ */
  _renderRankings: function (container) {
    var months    = this._months;
    var raw       = this._raw;
    var self      = this;
    var selLabel  = self._selectedMonth || months[months.length - 1].label;

    var monthOpts = months.map(function (m) {
      return '<option value="' + m.label + '"' + (m.label === selLabel ? ' selected' : '') + '>' + m.label + ' (' + m.period + ')</option>';
    }).join('');

    var html = '<div class="tab-pane">';

    html += '<div class="section-header">';
    html += '<span class="section-title">Creator Rankings</span>';
    html += '<div class="month-select-wrap"><label>Month:</label><select id="rankings-month-select" class="month-select">' + monthOpts + '</select></div>';
    html += '</div>';

    html += '<div id="rankings-content"></div>';
    html += '</div>';

    container.innerHTML = html;

    function renderForMonth(label) {
      var idx       = months.findIndex(function (m) { return m.label === label; });
      var mData     = months[idx];
      var creators  = (raw.topCreatorsByMonth && raw.topCreatorsByMonth[label]) || [];
      var totalGMV  = mData ? mData.gmv : 0;

      var rc = document.getElementById('rankings-content');
      if (!rc) return;

      var rhtml = '';

      if (creators.length === 0) {
        rhtml = '<div class="placeholder-card"><h3>No creator data for ' + label + '</h3><p>Add creator breakdown to <code>topCreatorsByMonth.' + label + '</code></p></div>';
        rc.innerHTML = rhtml;
        return;
      }

      rhtml += '<div class="chart-grid">';
      rhtml += '<div class="chart-card"><div class="chart-title">Creator GMV Rankings — ' + label + '</div><div class="chart-sub">Top contributors sorted by GMV</div><div class="chart-wrap" style="height:' + Math.max(240, creators.length * 32) + 'px"><canvas id="agency-creator-bar"></canvas></div></div>';
      rhtml += '<div class="chart-card"><div class="chart-title">GMV Concentration</div><div class="chart-sub">Top 3 vs rest of roster</div><div class="chart-wrap" style="height:240px"><canvas id="agency-donut"></canvas></div></div>';
      rhtml += '</div>';

      // Top 4 trend lines
      var top4 = (raw.recurringCreators || []).slice(0, 4);
      if (top4.length > 0) {
        var mLabels = months.map(function (m) { return m.label; });
        rhtml += '<div class="chart-grid single">';
        rhtml += '<div class="chart-card"><div class="chart-title">Top Creator Trends</div><div class="chart-sub">Monthly GMV for top recurring creators</div><div class="chart-wrap" style="height:260px"><canvas id="agency-creator-trend"></canvas></div></div>';
        rhtml += '</div>';
      }

      // Rankings table
      var sorted = creators.slice().sort(function (a, b) { return (b.gmv || 0) - (a.gmv || 0); });
      rhtml += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
      rhtml += '<thead><tr><th>#</th><th>Creator</th><th>Username</th><th>GMV</th><th>Share of Month</th></tr></thead><tbody>';
      sorted.forEach(function (cr, i) {
        var share = totalGMV > 0 ? (cr.gmv / totalGMV * 100).toFixed(2) + '%' : '—';
        var rankCls = i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : '';
        rhtml += '<tr>';
        rhtml += '<td><span class="creator-rank ' + rankCls + '">' + (i + 1) + '</span></td>';
        rhtml += '<td>' + (cr.name || cr.username);
        if (cr.flag) rhtml += ' <span class="flag-pill">' + cr.flag + '</span>';
        rhtml += '</td>';
        rhtml += '<td class="text-muted">@' + cr.username + '</td>';
        rhtml += '<td>' + U.fmtFull$(cr.gmv) + '</td>';
        rhtml += '<td>' + share + '</td>';
        rhtml += '</tr>';
      });
      rhtml += '</tbody></table></div></div>';

      rc.innerHTML = rhtml;

      setTimeout(function () {
        Charts.kill('agency-creator-bar');
        Charts.kill('agency-donut');
        Charts.kill('agency-creator-trend');
        Charts.creatorBar('agency-creator-bar', creators, totalGMV);
        Charts.concentrationDonut('agency-donut', creators, totalGMV);
        if (top4.length > 0) {
          Charts.creatorTrend('agency-creator-trend', top4, months.map(function (m) { return m.label; }));
        }
      }, 50);
    }

    renderForMonth(selLabel);

    var sel = document.getElementById('rankings-month-select');
    if (sel) {
      sel.addEventListener('change', function () {
        self._selectedMonth = this.value;
        renderForMonth(this.value);
      });
    }
  },

  /* ════════════════════════════════════════════════════════
     CREATOR EVALUATION SUB-TAB
     ════════════════════════════════════════════════════════ */
  _renderEvaluation: function (container) {
    container.innerHTML = '<div class="tab-pane"></div>';
    var inner = container.querySelector('.tab-pane');
    Views.evaluation._filter = 'all';
    Views.evaluation.render(this._agencyId, inner);
  },

  /* ════════════════════════════════════════════════════════
     CONCENTRATION SUB-TAB
     ════════════════════════════════════════════════════════ */
  _renderConcentration: function (container) {
    var months = this._months;
    var raw    = this._raw;
    var latest = months[months.length - 1];
    var latestCreators = (raw.topCreatorsByMonth && raw.topCreatorsByMonth[latest.label]) || [];

    var html = '<div class="tab-pane">';

    if (latestCreators.length === 0) {
      html += '<div class="placeholder-card"><h3>Creator data needed</h3><p>Add creator breakdown to <code>topCreatorsByMonth</code> in the data file.</p></div>';
      container.innerHTML = html + '</div>';
      return;
    }

    html += '<div class="chart-grid">';
    html += '<div class="chart-card full"><div class="chart-title">Pareto — Creator Contribution</div><div class="chart-sub">Latest month: ' + latest.label + ' (' + latest.period + '). GMV bars + cumulative % line.</div><div class="chart-wrap" style="height:300px"><canvas id="agency-pareto"></canvas></div></div>';
    html += '</div>';

    html += '<div class="chart-grid">';
    html += '<div class="chart-card"><div class="chart-title">GMV Concentration</div><div class="chart-sub">Top 3 vs rest (latest month)</div><div class="chart-wrap" style="height:260px"><canvas id="agency-donut"></canvas></div></div>';
    html += '<div class="chart-card"><div class="chart-title">Top Creator Share Trend</div><div class="chart-sub">Top 1 and Top 3 share of total GMV over time</div><div class="chart-wrap" style="height:260px"><canvas id="agency-share-trend"></canvas></div></div>';
    html += '</div>';

    // Recurring creators table
    var recurring = raw.recurringCreators || [];
    if (recurring.length > 0) {
      html += '<div class="section-header"><span class="section-title">Recurring Creators</span><span class="section-meta">Appeared in multiple campaign months</span></div>';
      html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
      html += '<thead><tr><th>Creator</th><th>Username</th><th>Months Active</th><th>Total GMV</th><th>Avg GMV / Month</th></tr></thead><tbody>';
      recurring.slice().sort(function (a, b) { return (b.totalGMV || 0) - (a.totalGMV || 0); }).forEach(function (cr) {
        var avg = cr.months && cr.months.length > 0 ? cr.totalGMV / cr.months.length : 0;
        html += '<tr><td>' + cr.name + '</td><td class="text-muted">@' + cr.username + '</td>';
        html += '<td>' + (cr.months ? cr.months.join(', ').replace(/\d+/g, function (n) { return 'M' + n; }) : '—') + '</td>';
        html += '<td>' + U.fmtFull$(cr.totalGMV) + '</td>';
        html += '<td>' + U.fmt$(avg) + '</td></tr>';
      });
      html += '</tbody></table></div></div>';
    }

    html += '</div>';
    container.innerHTML = html;

    setTimeout(function () {
      Charts.paretoBar('agency-pareto', latestCreators, latest.gmv);
      Charts.concentrationDonut('agency-donut', latestCreators, latest.gmv);
      Charts.shareTrend('agency-share-trend', months, raw.topCreatorsByMonth);
    }, 50);
  },

  /* ════════════════════════════════════════════════════════
     VIDEO PERFORMANCE SUB-TAB
     ════════════════════════════════════════════════════════ */
  _renderVideo: function (container) {
    var months = this._months;

    var html = '<div class="tab-pane">';

    html += '<div class="chart-grid">';
    html += '<div class="chart-card full"><div class="chart-title">Video Delivery: Delivered vs Target</div><div class="chart-sub">Green = met/exceeded target · Yellow = below target</div><div class="chart-wrap" style="height:260px"><canvas id="agency-vid-delivery"></canvas></div></div>';
    html += '</div>';

    html += '<div class="chart-grid">';
    html += '<div class="chart-card"><div class="chart-title">GMV per Video</div><div class="chart-sub">Average revenue efficiency per shoppable video</div><div class="chart-wrap" style="height:240px"><canvas id="agency-gpv"></canvas></div></div>';
    html += '<div class="chart-card"><div class="chart-title">Views per Video</div><div class="chart-sub">Average reach per shoppable video</div><div class="chart-wrap" style="height:240px"><canvas id="agency-vpv"></canvas></div></div>';
    html += '</div>';

    html += '<div class="chart-grid single">';
    html += '<div class="chart-card"><div class="chart-title">Volume vs Efficiency</div><div class="chart-sub">Videos delivered (x) vs GMV/video ($). Ideal = top-right.</div><div class="chart-wrap" style="height:260px"><canvas id="agency-vol-eff"></canvas></div></div>';
    html += '</div>';

    // Delivery summary table
    html += '<div class="section-header"><span class="section-title">Delivery Summary</span></div>';
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr><th>Month</th><th>Period</th><th>Target</th><th>Delivered</th><th>Delivery Rate</th><th>GMV/Video</th><th>Views/Video</th></tr></thead><tbody>';

    var gpvArr = months.map(function (m) { return m.gpv; });
    var vpvArr = months.map(function (m) { return m.vpv; });
    var bwGpv  = U.bestWorst(gpvArr);
    var bwVpv  = U.bestWorst(vpvArr);

    months.forEach(function (m) {
      var delCls = m.delRate >= 1 ? 'text-green' : m.delRate >= 0.8 ? '' : 'text-red';
      var gpvCls = m.gpv === bwGpv.best ? 'cell-best' : m.gpv === bwGpv.worst ? 'cell-worst' : '';
      var vpvCls = m.vpv === bwVpv.best ? 'cell-best' : m.vpv === bwVpv.worst ? 'cell-worst' : '';

      html += '<tr>';
      html += '<td>' + m.label + '</td>';
      html += '<td class="text-muted">' + m.period + '</td>';
      html += '<td>' + U.fmtNum(m.targetVids) + '</td>';
      html += '<td>' + U.fmtNum(m.delivered) + '</td>';
      html += '<td><span class="' + delCls + '">' + U.fmtPct(m.delRate) + '</span></td>';
      html += '<td><span class="' + gpvCls + '">$' + (m.gpv || 0).toFixed(2) + '</span></td>';
      html += '<td><span class="' + vpvCls + '">' + U.fmtNum(Math.round(m.vpv || 0)) + '</span></td>';
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';

    html += '</div>';
    container.innerHTML = html;

    setTimeout(function () {
      Charts.videoDelivery('agency-vid-delivery', months);
      Charts.gmvPerVideo('agency-gpv', months);
      Charts.viewsPerVideo('agency-vpv', months);
      Charts.volEfficiency('agency-vol-eff', months);
    }, 50);
  },

  /* ════════════════════════════════════════════════════════
     DATA TABLE SUB-TAB
     ════════════════════════════════════════════════════════ */
  _renderTable: function (container) {
    var months    = this._months;
    var agId      = this._agencyId;
    var isInternal = (agId === 'internal');
    var costLbl   = isInternal ? 'Retainer Cost' : 'Agency Fees';
    var gm        = CONFIG.grossMargin;
    var breakEven = U.getBreakEven();

    // Column arrays for best/worst highlighting
    var gmvArr    = months.map(function (m) { return m.gmv; });
    var roiArr    = months.map(function (m) { return m.roi; });
    var perfArr   = months.map(function (m) { return m.perfRate; });
    var gpvArr    = months.map(function (m) { return m.gpv; });

    var bwGmv  = U.bestWorst(gmvArr);
    var bwRoi  = U.bestWorst(roiArr);
    var bwPerf = U.bestWorst(perfArr);
    var bwGpv  = U.bestWorst(gpvArr);

    var html = '<div class="tab-pane">';
    html += '<div class="section-header"><span class="section-title">Full Month-over-Month Data</span><span class="section-meta">At ' + (gm * 100).toFixed(0) + '% gross margin · Break-even = ' + breakEven.toFixed(2) + 'x</span></div>';

    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr>';
    html += '<th>Month</th><th>Period</th><th>' + costLbl + '</th><th>Sample Costs</th><th>Total Cost</th>';
    html += '<th>GMV</th><th>Gross Profit</th><th>Net Profit</th><th>ROAS</th>';
    html += '<th>Creators</th><th>Performing</th><th>Perf Rate</th>';
    html += '<th>Videos</th><th>Target</th><th>Del Rate</th><th>Views</th>';
    html += '<th>GMV/Video</th><th>Views/Video</th><th>GMV/Creator</th>';
    html += '</tr></thead><tbody>';

    months.forEach(function (m) {
      var gmvCls  = m.gmv      === bwGmv.best  ? 'cell-best' : m.gmv      === bwGmv.worst  ? 'cell-worst' : '';
      var roiCls2 = m.roi      === bwRoi.best  ? 'cell-best' : m.roi      === bwRoi.worst  ? 'cell-worst' : '';
      var perfCls = m.perfRate === bwPerf.best ? 'cell-best' : m.perfRate === bwPerf.worst ? 'cell-worst' : '';
      var gpvCls  = m.gpv      === bwGpv.best  ? 'cell-best' : m.gpv      === bwGpv.worst  ? 'cell-worst' : '';

      var hasAlerts = m.alerts && m.alerts.length > 0;

      html += '<tr>';
      html += '<td>' + m.label + (hasAlerts ? ' <span class="flag-pill">spike</span>' : '') + '</td>';
      html += '<td class="text-muted" style="font-size:11px">' + m.period + '</td>';
      html += '<td>' + U.fmt$(isInternal ? (m.retainerCost || 0) : m.fees) + '</td>';
      html += '<td>' + (m.sampleCosts != null ? U.fmt$(m.sampleCosts) : '<span class="text-muted">—</span>') + '</td>';
      html += '<td>' + U.fmt$(m.totalCost) + '</td>';
      html += '<td><span class="' + gmvCls + '">' + U.fmt$(m.gmv) + '</span></td>';
      html += '<td>' + U.fmt$(m.gp) + '</td>';
      html += '<td><span class="' + (m.net >= 0 ? 'text-green' : 'text-red') + '">' + U.fmt$(m.net) + '</span></td>';
      html += '<td><span class="' + roiCls2 + ' ' + U.roiCls(m.roi) + '">' + U.fmtX(m.roi) + '</span></td>';
      html += '<td>' + (m.creators || 0) + '</td>';
      html += '<td>' + (m.performing || 0) + '</td>';
      html += '<td><span class="' + perfCls + ' ' + U.perfCls(m.perfRate) + '">' + U.fmtPct(m.perfRate) + '</span></td>';
      html += '<td>' + U.fmtNum(m.delivered) + '</td>';
      html += '<td>' + U.fmtNum(m.targetVids) + '</td>';
      html += '<td><span class="' + (m.delRate >= 1 ? 'text-green' : '') + '">' + U.fmtPct(m.delRate) + '</span></td>';
      html += '<td>' + U.fmt$(m.views).replace('$', '') + '</td>';
      html += '<td><span class="' + gpvCls + '">$' + (m.gpv || 0).toFixed(2) + '</span></td>';
      html += '<td>' + U.fmtNum(Math.round(m.vpv || 0)) + '</td>';
      html += '<td>' + U.fmt$(m.gpc) + '</td>';
      html += '</tr>';
    });

    // Totals row
    var totFees = months.reduce(function (s, m) { return s + (isInternal ? (m.retainerCost || 0) : m.fees); }, 0);
    var totSamp = months.some(function (m) { return m.sampleCosts != null; })
      ? months.reduce(function (s, m) { return s + (m.sampleCosts || 0); }, 0) : null;
    var totCost = months.reduce(function (s, m) { return s + m.totalCost; }, 0);
    var totGMV  = months.reduce(function (s, m) { return s + m.gmv; }, 0);
    var totGP   = months.reduce(function (s, m) { return s + m.gp; }, 0);
    var totNet  = months.reduce(function (s, m) { return s + m.net; }, 0);
    var totROI  = totCost > 0 ? totGMV / totCost : null;

    html += '<tr style="font-weight:700;background:var(--gray-50);border-top:2px solid var(--gray-200)">';
    html += '<td colspan="2">TOTAL / AVG</td>';
    html += '<td>' + U.fmt$(totFees) + '</td>';
    html += '<td>' + (totSamp != null ? U.fmt$(totSamp) : '—') + '</td>';
    html += '<td>' + U.fmt$(totCost) + '</td>';
    html += '<td>' + U.fmt$(totGMV) + '</td>';
    html += '<td>' + U.fmt$(totGP) + '</td>';
    html += '<td><span class="' + (totNet >= 0 ? 'text-green' : 'text-red') + '">' + U.fmt$(totNet) + '</span></td>';
    html += '<td><span class="' + U.roiCls(totROI) + '">' + U.fmtX(totROI) + '</span></td>';
    html += '<td colspan="10"></td>';
    html += '</tr>';

    html += '</tbody></table></div></div>';
    html += '</div>';

    container.innerHTML = html;
  }
};

/* =========================================================
   Helpers — agency TTP card + KPI legend
   ========================================================= */

// Median post-to-perform (days) for this agency's creators in the latest TikTok week.
// Pulls from window.DATA_WEEKLY (the TikTok Performance dataset). Returns
// { value: <days|null>, note: <subtitle string> }.
function computeAgencyTTP(agencyId) {
  var D = window.DATA_WEEKLY;
  if (!D || !D.topVideos || !D.topVideos.length) {
    return { value: null, note: 'TikTok weekly data not loaded' };
  }
  var ages = D.topVideos
    .filter(function (v) { return v.agency === agencyId && v.age != null; })
    .map(function (v) { return v.age; })
    .sort(function (a, b) { return a - b; });
  if (!ages.length) {
    return { value: null, note: 'No selling videos this week' };
  }
  var mid = Math.floor(ages.length / 2);
  var median = ages.length % 2 ? ages[mid] : Math.round((ages[mid - 1] + ages[mid]) / 2);
  return {
    value: median,
    note: ages.length + ' selling videos this week, week of ' + (D.label || '?')
  };
}

function buildKPILegend(costLbl, breakEven, gm) {
  return '<div class="kpi-legend">' +
    '<div class="kpi-legend-title">What these KPIs mean</div>' +
    '<dl>' +
      '<dt>Latest GMV</dt><dd>Total GMV in the agency\'s most recent reporting month.</dd>' +
      '<dt>ROAS</dt><dd>GMV ÷ all-in agency cost (' + costLbl.toLowerCase() + ' + samples + retainers, where applicable). Break-even = ' + breakEven.toFixed(2) + 'x at ' + (gm * 100).toFixed(0) + '% gross margin.</dd>' +
      '<dt>Performing Creators</dt><dd>Roster size and how many produced any GMV this month. Ratio is the performing rate.</dd>' +
      '<dt>Videos Delivered</dt><dd>Shoppable videos delivered against the contracted target.</dd>' +
      '<dt>Median Post-to-Perf</dt><dd>Median number of days from post to first GMV across this agency\'s selling videos in the most recent TikTok week. Lower = videos converting faster.</dd>' +
    '</dl></div>';
}
