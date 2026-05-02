/* =========================================================
   Nusava — Incremental Value / Legacy vs Current Contract
   Data module + render helpers called from agency.js and
   executive.js. Not a standalone view.

   TO REPLACE WITH LIVE DATA:
   Each month entry needs:
   {
     label: 'M1', period: '...', total_gmv: 115842,
     new_gmv: 98420,      // from videos published THIS contract
     legacy_gmv: 17422,   // from videos in PRIOR contracts still converting
     new_videos: 420,
     legacy_videos: 77
   }
   Source: TikTok Shop video report filtered by publish-date
           vs contract-period boundaries.
   ========================================================= */

window.Incremental = (function () {

  /* ── Sample data (replace with real export) ── */
  var DATA = {
    creatify: {
      color: '#0284c7',
      months: [
        { label:'M1', period:'Apr 8–Jun 9',   total_gmv:115842, new_gmv:115842, legacy_gmv:0,     new_videos:497,  legacy_videos:0   },
        { label:'M2', period:'Jun 25–Jul 29', total_gmv:48171,  new_gmv:35240,  legacy_gmv:12931, new_videos:742,  legacy_videos:60  },
        { label:'M3', period:'Jul 29–Aug 31', total_gmv:90290,  new_gmv:72180,  legacy_gmv:18110, new_videos:1180, legacy_videos:45  },
        { label:'M4', period:'2 Sep–6 Oct',   total_gmv:111432, new_gmv:92840,  legacy_gmv:18592, new_videos:950,  legacy_videos:47  },
        { label:'M5', period:'22 Oct–21 Nov', total_gmv:133459, new_gmv:108420, legacy_gmv:25039, new_videos:910,  legacy_videos:54  },
        { label:'M6', period:'23 Nov–18 Jan', total_gmv:382541, new_gmv:330420, legacy_gmv:52121, new_videos:2380, legacy_videos:135 },
        { label:'M7', period:'9 Jan–15 Feb',  total_gmv:167429, new_gmv:130840, legacy_gmv:36589, new_videos:1020, legacy_videos:63  }
      ]
    },
    thc: {
      color: '#8b5cf6',
      months: [
        { label:'M1', period:'Nov 1–30 2024', total_gmv:89420,  new_gmv:89420,  legacy_gmv:0,     new_videos:612, legacy_videos:0  },
        { label:'M2', period:'Dec 1–31 2024', total_gmv:134582, new_gmv:114840, legacy_gmv:19742, new_videos:702, legacy_videos:46 },
        { label:'M3', period:'Jan 1–31 2025', total_gmv:178934, new_gmv:148200, legacy_gmv:30734, new_videos:840, legacy_videos:51 },
        { label:'M4', period:'Feb 1–28 2025', total_gmv:201847, new_gmv:163480, legacy_gmv:38367, new_videos:880, legacy_videos:54 }
      ]
    },
    elle: {
      color: '#f97316',
      months: [
        { label:'M1', period:'Jan 1–31 2025', total_gmv:41293, new_gmv:41293, legacy_gmv:0,     new_videos:312, legacy_videos:0  },
        { label:'M2', period:'Feb 1–28 2025', total_gmv:67841, new_gmv:56240, legacy_gmv:11601, new_videos:365, legacy_videos:22 },
        { label:'M3', period:'Mar 1–31 2025', total_gmv:89423, new_gmv:72840, legacy_gmv:16583, new_videos:418, legacy_videos:23 }
      ]
    },
    internal: {
      color: '#10b981',
      months: [
        { label:'M1', period:'Jan 1–31 2025', total_gmv:67234,  new_gmv:67234,  legacy_gmv:0,     new_videos:89,  legacy_videos:0 },
        { label:'M2', period:'Feb 1–28 2025', total_gmv:89421,  new_gmv:74280,  legacy_gmv:15141, new_videos:88,  legacy_videos:6 },
        { label:'M3', period:'Mar 1–31 2025', total_gmv:112847, new_gmv:91840,  legacy_gmv:21007, new_videos:101, legacy_videos:7 }
      ]
    }
  };

  function getSignal(npVal, isFirst) {
    if (isFirst) return { label: '▶ Baseline',           cls: 'text-muted' };
    if (npVal >= 0.80) return { label: '🟢 Strong incremental', cls: 'text-green'  };
    if (npVal >= 0.65) return { label: '🟡 Healthy mix',        cls: ''            };
    if (npVal >= 0.50) return { label: '🟠 Legacy-heavy',       cls: 'text-yellow' };
    return               { label: '🔴 Coasting on legacy',  cls: 'text-red'    };
  }

  /* ── Render inside an agency sub-tab container ── */
  function renderForAgency(agencyId, container) {
    var agData = DATA[agencyId];
    if (!agData) {
      container.innerHTML = '<div class="placeholder-card"><div class="ph-icon">📈</div>' +
        '<h3>No Incremental Data</h3><p>Add period data for this agency in <code>js/views/incremental.js</code></p></div>';
      return;
    }

    var months      = agData.months;
    var totalNew    = months.reduce(function(s,m){ return s+m.new_gmv;    },0);
    var totalLegacy = months.reduce(function(s,m){ return s+m.legacy_gmv; },0);
    var totalAll    = totalNew + totalLegacy;
    var avgNewPct   = totalAll > 0 ? (totalNew/totalAll*100).toFixed(2) : 0;
    var latest      = months[months.length-1];
    var latestNewPct = latest.total_gmv > 0 ? (latest.new_gmv/latest.total_gmv*100).toFixed(2) : 0;
    var bestMonth   = months.slice().sort(function(a,b){ var pa=a.total_gmv>0?a.new_gmv/a.total_gmv:0, pb=b.total_gmv>0?b.new_gmv/b.total_gmv:0; return pb-pa; })[0];

    var html = '<div class="tab-pane">';

    html += '<div class="alert alert-yellow" style="margin-bottom:16px"><span class="alert-icon">⚠️</span>' +
      '<div><strong>Sample Data:</strong> New vs Legacy split is estimated from typical TikTok Shop carryover patterns (~12–22%). ' +
      'Replace with real data in <code>js/views/incremental.js → DATA.' + agencyId + '</code></div></div>';

    // KPIs
    html += '<div class="kpi-grid">';
    html += kpiCard('Total New Contract GMV', U.fmt$(totalNew),    avgNewPct+'% of all GMV', 'blue');
    html += kpiCard('Total Legacy Carryover', U.fmt$(totalLegacy), (100-avgNewPct)+'% carryover from prior periods', 'orange');
    html += kpiCard('Latest Month New %',     latestNewPct+'%',    latest.label+': '+U.fmt$(latest.new_gmv)+' new GMV', latestNewPct>=75?'green':latestNewPct>=50?'yellow':'red');
    html += kpiCard('Best Incremental Month', bestMonth.label,     (bestMonth.total_gmv>0?(bestMonth.new_gmv/bestMonth.total_gmv*100).toFixed(2):'0')+'% new GMV', 'green');
    html += '</div>';

    // Charts
    html += '<div class="chart-grid">';
    html += '<div class="chart-card"><div class="chart-title">New Contract vs Legacy Carryover GMV</div>' +
      '<div class="chart-sub">How much each month\'s GMV came from fresh content vs older videos still converting</div>' +
      '<div class="chart-wrap" style="height:260px"><canvas id="agency-incr-stack"></canvas></div></div>';
    html += '<div class="chart-card"><div class="chart-title">% New Contract GMV Over Time</div>' +
      '<div class="chart-sub">Above 50% = new content dominant. Below 50% = legacy-heavy month.</div>' +
      '<div class="chart-wrap" style="height:260px"><canvas id="agency-incr-ratio"></canvas></div></div>';
    html += '</div>';

    // Table
    html += '<div class="section-header"><span class="section-title">Month-by-Month Breakdown</span></div>';
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr><th>Month</th><th>Period</th><th>New Videos</th><th>Legacy Videos</th>' +
      '<th>New GMV</th><th>Legacy GMV</th><th>Total GMV</th><th>% New</th><th>Signal</th></tr></thead><tbody>';

    months.forEach(function(m, i) {
      var npVal   = m.total_gmv > 0 ? m.new_gmv/m.total_gmv : 0;
      var sig     = getSignal(npVal, i===0);
      html += '<tr>';
      html += '<td><strong>'+m.label+'</strong></td>';
      html += '<td class="text-muted" style="font-size:11px">'+m.period+'</td>';
      html += '<td>'+(m.new_videos||0).toLocaleString()+'</td>';
      html += '<td>'+(m.legacy_videos||0).toLocaleString()+'</td>';
      html += '<td>'+U.fmt$(m.new_gmv)+'</td>';
      html += '<td>'+U.fmt$(m.legacy_gmv)+'</td>';
      html += '<td><strong>'+U.fmt$(m.total_gmv)+'</strong></td>';
      html += '<td>'+(m.total_gmv>0?(m.new_gmv/m.total_gmv*100).toFixed(2)+'%':'—')+'</td>';
      html += '<td><span class="'+sig.cls+'">'+sig.label+'</span></td>';
      html += '</tr>';
    });
    html += '<tr style="font-weight:700;background:var(--gray-50);border-top:2px solid var(--gray-200)">';
    html += '<td colspan="2">TOTAL</td>';
    html += '<td>'+months.reduce(function(s,m){return s+(m.new_videos||0);},0).toLocaleString()+'</td>';
    html += '<td>—</td>';
    html += '<td>'+U.fmt$(totalNew)+'</td><td>'+U.fmt$(totalLegacy)+'</td><td>'+U.fmt$(totalAll)+'</td>';
    html += '<td>'+avgNewPct+'%</td><td></td></tr>';
    html += '</tbody></table></div></div></div>';

    container.innerHTML = html;

    setTimeout(function() {
      Charts.incrementalStack('agency-incr-stack', months);
      Charts.incrementalRatio('agency-incr-ratio', months);
    }, 50);
  }

  /* ── Cross-agency incremental summary for Executive view ── */
  function renderCrossAgency(container) {
    var html = '<div class="chart-grid">';

    html += '<div class="chart-card"><div class="chart-title">Incremental New GMV % — All Agencies</div>' +
      '<div class="chart-sub">Latest month: % of GMV that came from new contract videos (vs legacy carryover). Higher = more incremental value from new spend.</div>' +
      '<div class="chart-wrap" style="height:240px"><canvas id="exec-incr-bar"></canvas></div></div>';

    // Summary table
    html += '<div class="chart-card"><div class="chart-title">Incremental Value Summary</div>' +
      '<div class="chart-sub">New vs legacy split across all contract months per agency</div>' +
      '<div style="margin-top:12px"><table class="data-table">';
    html += '<thead><tr><th>Agency</th><th>Total New GMV</th><th>Total Legacy</th><th>Avg New %</th><th>Latest Signal</th></tr></thead><tbody>';

    Object.keys(DATA).forEach(function(id) {
      var ag      = DATA[id];
      var agCfg   = U.getAgencyConfig(id);
      var months  = ag.months;
      var totNew  = months.reduce(function(s,m){return s+m.new_gmv;},0);
      var totLeg  = months.reduce(function(s,m){return s+m.legacy_gmv;},0);
      var totAll  = totNew + totLeg;
      var avgPct  = totAll > 0 ? (totNew/totAll*100).toFixed(2) : 0;
      var latest  = months[months.length-1];
      var latPct  = latest.total_gmv > 0 ? latest.new_gmv/latest.total_gmv : 0;
      var sig     = getSignal(latPct, months.length === 1);
      html += '<tr>';
      html += '<td><span style="display:inline-flex;align-items:center;gap:6px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:'+ag.color+'"></span>'+(agCfg?agCfg.short:id)+'</span></td>';
      html += '<td>'+U.fmt$(totNew)+'</td>';
      html += '<td>'+U.fmt$(totLeg)+'</td>';
      html += '<td><strong>'+avgPct+'%</strong></td>';
      html += '<td><span class="'+sig.cls+'">'+sig.label+'</span></td>';
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';
    html += '</div>';

    container.innerHTML = html;

    setTimeout(function() {
      Charts.kill('exec-incr-bar');
      var c = Charts.ctx('exec-incr-bar');
      if (!c) return;
      var agNames = [], agPcts = [], agColors = [];
      Object.keys(DATA).forEach(function(id) {
        var ag    = DATA[id];
        var agCfg = U.getAgencyConfig(id);
        var lat   = ag.months[ag.months.length-1];
        var pct   = lat.total_gmv > 0 ? parseFloat((lat.new_gmv/lat.total_gmv*100).toFixed(2)) : 0;
        agNames.push(agCfg ? agCfg.short : id);
        agPcts.push(pct);
        agColors.push(ag.color+'cc');
      });
      Charts.instances['exec-incr-bar'] = new Chart(c, {
        type: 'bar',
        data: { labels: agNames, datasets: [{ label:'% New GMV (Latest Month)', data: agPcts,
          backgroundColor: agColors, borderRadius: 6 }] },
        options: {
          responsive: true,
          plugins: { legend:{ display:false },
            tooltip:{ callbacks:{ label:function(ctx){ return ctx.raw.toFixed(1)+'% new contract GMV'; } } } },
          scales: {
            y: { min:0, max:100, ticks:{ callback:function(v){return v+'%';}, font:{size:11} }, grid:{color:'rgba(0,0,0,.05)'} },
            x: { ticks:{ font:{size:11} }, grid:{ display:false } }
          }
        }
      });
    }, 50);
  }

  return {
    renderForAgency:   renderForAgency,
    renderCrossAgency: renderCrossAgency
  };

})();
