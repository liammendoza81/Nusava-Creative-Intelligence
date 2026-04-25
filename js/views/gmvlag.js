/* =========================================================
   Nusava — GMV Lag / Time-to-Performance
   Data module + render helpers called from agency.js and
   executive.js. Not a standalone view.

   TO REPLACE WITH LIVE DATA:
   Each month entry needs a `buckets` object:
   {
     label: 'M1', period: '...', total_videos: 497,
     buckets: { d0_7: 45230, d8_14: 28400, d15_30: 24180,
                d31_60: 12340, d61plus: 5692 }
   }
   Source: TikTok Shop Creator Center → Affiliate Performance
           → Video Report, summed into 5 post-publish windows.
   ========================================================= */

window.GmvLag = (function () {

  /* ── Sample data (replace with real video export) ── */
  var DATA = {
    creatify: {
      color: '#0284c7',
      cumPcts: [38.0, 62.0, 82.5, 93.8, 100],
      months: [
        { label:'M1', period:'Apr 8–Jun 9',   total_videos:497,  buckets:{ d0_7:44020,  d8_14:27800, d15_30:22140, d31_60:14320, d61plus:7562  }},
        { label:'M2', period:'Jun 25–Jul 29', total_videos:802,  buckets:{ d0_7:17340,  d8_14:11280, d15_30:9840,  d31_60:6210,  d61plus:3501  }},
        { label:'M3', period:'Jul 29–Aug 31', total_videos:1225, buckets:{ d0_7:33400,  d8_14:21840, d15_30:18200, d31_60:11080, d61plus:5770  }},
        { label:'M4', period:'2 Sep–6 Oct',   total_videos:997,  buckets:{ d0_7:42340,  d8_14:27120, d15_30:22480, d31_60:12940, d61plus:6552  }},
        { label:'M5', period:'22 Oct–21 Nov', total_videos:964,  buckets:{ d0_7:50820,  d8_14:32140, d15_30:26400, d31_60:15220, d61plus:8879  }},
        { label:'M6', period:'23 Nov–18 Jan', total_videos:2515, buckets:{ d0_7:148400, d8_14:91640, d15_30:74180, d31_60:42800, d61plus:25521 }},
        { label:'M7', period:'9 Jan–15 Feb',  total_videos:1083, buckets:{ d0_7:63280,  d8_14:41820, d15_30:33140, d31_60:19460, d61plus:9729  }}
      ]
    },
    thc: {
      color: '#8b5cf6',
      cumPcts: [39.8, 64.5, 83.9, 94.5, 100],
      months: [
        { label:'M1', period:'Nov 1–30 2024', total_videos:612, buckets:{ d0_7:35480, d8_14:21840, d15_30:17420, d31_60:9840,  d61plus:4840 }},
        { label:'M2', period:'Dec 1–31 2024', total_videos:748, buckets:{ d0_7:53420, d8_14:33280, d15_30:26140, d31_60:14020, d61plus:7722 }},
        { label:'M3', period:'Jan 1–31 2025', total_videos:891, buckets:{ d0_7:70880, d8_14:44280, d15_30:35140, d31_60:18920, d61plus:9714 }},
        { label:'M4', period:'Feb 1–28 2025', total_videos:934, buckets:{ d0_7:80320, d8_14:49180, d15_30:38420, d31_60:21480, d61plus:12447}}
      ]
    },
    elle: {
      color: '#f97316',
      cumPcts: [32.1, 56.4, 78.2, 92.1, 100],
      months: [
        { label:'M1', period:'Jan 1–31 2025', total_videos:312, buckets:{ d0_7:13640, d8_14:8820,  d15_30:8140,  d31_60:6240,  d61plus:4453 }},
        { label:'M2', period:'Feb 1–28 2025', total_videos:387, buckets:{ d0_7:22040, d8_14:14820, d15_30:13840, d31_60:9840,  d61plus:7301 }},
        { label:'M3', period:'Mar 1–31 2025', total_videos:441, buckets:{ d0_7:29640, d8_14:19820, d15_30:18140, d31_60:12480, d61plus:9343 }}
      ]
    },
    internal: {
      color: '#10b981',
      cumPcts: [28.2, 50.5, 73.0, 89.4, 100],
      months: [
        { label:'M1', period:'Jan 1–31 2025', total_videos:89,  buckets:{ d0_7:18820, d8_14:14280, d15_30:15420, d31_60:11840, d61plus:6872  }},
        { label:'M2', period:'Feb 1–28 2025', total_videos:94,  buckets:{ d0_7:25120, d8_14:18840, d15_30:20140, d31_60:14820, d61plus:10501 }},
        { label:'M3', period:'Mar 1–31 2025', total_videos:108, buckets:{ d0_7:31840, d8_14:24480, d15_30:25420, d31_60:18240, d61plus:12867 }}
      ]
    }
  };

  var BUCKET_KEYS   = ['d0_7','d8_14','d15_30','d31_60','d61plus'];
  var BUCKET_LABELS = ['Days 0–7','Days 8–14','Days 15–30','Days 31–60','Days 61+'];

  function getAgencyData(agencyId) {
    return DATA[agencyId] || null;
  }

  function bucketTotals(months) {
    var totals = {};
    BUCKET_KEYS.forEach(function(k) {
      totals[k] = months.reduce(function(s,m){ return s+(m.buckets[k]||0); },0);
    });
    return totals;
  }

  /* ── Render inside an agency sub-tab container ── */
  function renderForAgency(agencyId, container) {
    var agData = DATA[agencyId];
    if (!agData) {
      container.innerHTML = '<div class="placeholder-card"><div class="ph-icon">📊</div>' +
        '<h3>No Lag Data</h3><p>Add time-bucket data for this agency in <code>js/views/gmvlag.js</code></p></div>';
      return;
    }

    var months  = agData.months;
    var totals  = bucketTotals(months);
    var grand   = BUCKET_KEYS.reduce(function(s,k){ return s+totals[k]; },0);
    var pct7    = grand > 0 ? (totals.d0_7/grand*100).toFixed(1) : 0;
    var pct14   = grand > 0 ? ((totals.d0_7+totals.d8_14)/grand*100).toFixed(1) : 0;
    var pct30   = grand > 0 ? ((totals.d0_7+totals.d8_14+totals.d15_30)/grand*100).toFixed(1) : 0;
    var totalVids = months.reduce(function(s,m){ return s+(m.total_videos||0); },0);
    var avgGpv  = totalVids > 0 ? grand/totalVids : 0;

    var html = '<div class="tab-pane">';

    html += '<div class="alert alert-yellow" style="margin-bottom:16px"><span class="alert-icon">⚠️</span>' +
      '<div><strong>Sample Data:</strong> Buckets estimated from monthly totals using typical supplement decay curves. ' +
      'Replace with TikTok Shop video-level export in <code>js/views/gmvlag.js → DATA.' + agencyId + '</code></div></div>';

    // KPIs
    html += '<div class="kpi-grid">';
    html += kpiCard('GMV Captured — Day 7',  pct7  + '%', U.fmt$(totals.d0_7)  + ' of ' + U.fmt$(grand), 'blue');
    html += kpiCard('GMV Captured — Day 14', pct14 + '%', 'Cumulative days 0–14', 'blue');
    html += kpiCard('GMV Captured — Day 30', pct30 + '%', 'Cumulative days 0–30', pct30 >= 80 ? 'green' : 'yellow');
    html += kpiCard('Slow Burn (Day 31+)',    (100-pct30) + '%', U.fmt$(totals.d31_60+totals.d61plus) + ' after day 30', 'orange');
    html += kpiCard('Avg GMV / Video', '$'+avgGpv.toFixed(2), totalVids.toLocaleString()+' total videos tracked', 'purple');
    html += '</div>';

    // Charts
    html += '<div class="chart-grid">';
    html += '<div class="chart-card"><div class="chart-title">GMV by Time Bucket — Month over Month</div>' +
      '<div class="chart-sub">Total GMV split by days-since-publish window, stacked per contract month</div>' +
      '<div class="chart-wrap" style="height:280px"><canvas id="agency-lag-bar"></canvas></div></div>';
    html += '<div class="chart-card"><div class="chart-title">Avg GMV Split by Time Window</div>' +
      '<div class="chart-sub">Where does the typical dollar come from across all months?</div>' +
      '<div class="chart-wrap" style="height:280px"><canvas id="agency-lag-pct"></canvas></div></div>';
    html += '</div>';

    // Table
    html += '<div class="section-header"><span class="section-title">Month-by-Month Breakdown</span></div>';
    html += '<div class="table-card"><div class="table-scroll"><table class="data-table">';
    html += '<thead><tr><th>Month</th><th>Period</th><th>Videos</th>' +
      BUCKET_LABELS.map(function(l){ return '<th>'+l+'</th>'; }).join('') +
      '<th>Total</th><th>% by Day 7</th><th>% by Day 30</th></tr></thead><tbody>';

    months.forEach(function(m) {
      var tot = BUCKET_KEYS.reduce(function(s,k){ return s+(m.buckets[k]||0); },0);
      var p7  = tot > 0 ? (m.buckets.d0_7/tot*100).toFixed(1) : '—';
      var p30 = tot > 0 ? ((m.buckets.d0_7+m.buckets.d8_14+m.buckets.d15_30)/tot*100).toFixed(1) : '—';
      html += '<tr><td><strong>'+m.label+'</strong></td>';
      html += '<td class="text-muted" style="font-size:11px">'+m.period+'</td>';
      html += '<td>'+(m.total_videos||0).toLocaleString()+'</td>';
      BUCKET_KEYS.forEach(function(k){ html += '<td>'+U.fmt$(m.buckets[k]||0)+'</td>'; });
      html += '<td><strong>'+U.fmt$(tot)+'</strong></td>';
      html += '<td>'+p7+'%</td><td>'+p30+'%</td></tr>';
    });
    // Totals row
    html += '<tr style="font-weight:700;background:var(--gray-50);border-top:2px solid var(--gray-200)">';
    html += '<td colspan="2">TOTAL</td><td>'+totalVids.toLocaleString()+'</td>';
    BUCKET_KEYS.forEach(function(k){ html += '<td>'+U.fmt$(totals[k])+'</td>'; });
    html += '<td>'+U.fmt$(grand)+'</td><td>'+pct7+'%</td><td>'+pct30+'%</td></tr>';
    html += '</tbody></table></div></div></div>';

    container.innerHTML = html;

    setTimeout(function() {
      Charts.decayBuckets('agency-lag-bar', months);

      // Avg % horizontal bar
      Charts.kill('agency-lag-pct');
      var c = Charts.ctx('agency-lag-pct');
      if (c) {
        var avgPcts = BUCKET_KEYS.map(function(k){ return grand > 0 ? parseFloat((totals[k]/grand*100).toFixed(1)) : 0; });
        Charts.instances['agency-lag-pct'] = new Chart(c, {
          type: 'bar',
          data: {
            labels: BUCKET_LABELS,
            datasets: [{ data: avgPcts,
              backgroundColor: ['#0284c7','#10b981','#f59e0b','#f97316','#8b5cf6'].map(function(x){ return x+'cc'; }),
              borderRadius: 5 }]
          },
          options: {
            indexAxis: 'y', responsive: true,
            plugins: { legend: { display: false },
              tooltip: { callbacks: { label: function(ctx){ return ctx.raw.toFixed(1)+'% of lifetime GMV'; } } } },
            scales: {
              x: { min:0, max:100, ticks:{ callback:function(v){ return v+'%'; }, font:{size:11} }, grid:{color:'rgba(0,0,0,.05)'} },
              y: { ticks:{ font:{size:11} }, grid:{ display:false } }
            }
          }
        });
      }
    }, 50);
  }

  /* ── Cross-agency cumulative curve for Executive view ── */
  function renderCrossAgency(container) {
    var html = '<div class="chart-grid">';

    html += '<div class="chart-card"><div class="chart-title">Cumulative GMV Capture Curve — All Agencies</div>' +
      '<div class="chart-sub">% of a video\'s lifetime GMV captured by each day checkpoint. Higher = faster converting content.</div>' +
      '<div class="chart-wrap" style="height:260px"><canvas id="exec-lag-curve"></canvas></div></div>';

    // Summary mini-table
    html += '<div class="chart-card"><div class="chart-title">Time-to-80% GMV by Agency</div>' +
      '<div class="chart-sub">How many days until 80% of a video\'s total GMV is captured</div>' +
      '<div style="margin-top:12px">';

    var rows = Object.keys(DATA).map(function(id) {
      var ag     = DATA[id];
      var agCfg  = U.getAgencyConfig(id);
      // Find first checkpoint where cumPcts >= 80
      var checkpoints = [7,14,30,60,90];
      var idx80 = ag.cumPcts.findIndex(function(p){ return p >= 80; });
      var days80 = idx80 >= 0 ? 'By day ' + checkpoints[idx80] : 'After day 90';
      var pct30  = ag.cumPcts[2];
      return { name: agCfg ? agCfg.short : id, color: ag.color, days80: days80, pct7: ag.cumPcts[0], pct30: pct30 };
    });

    html += '<table class="data-table">';
    html += '<thead><tr><th>Agency</th><th>% by Day 7</th><th>% by Day 30</th><th>80% captured</th></tr></thead><tbody>';
    rows.forEach(function(r) {
      html += '<tr>';
      html += '<td><span style="display:inline-flex;align-items:center;gap:6px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:'+r.color+'"></span>'+r.name+'</span></td>';
      html += '<td>'+r.pct7.toFixed(1)+'%</td>';
      html += '<td><span class="'+(r.pct30>=80?'text-green':r.pct30>=65?'':'text-red')+'">'+r.pct30.toFixed(1)+'%</span></td>';
      html += '<td>'+r.days80+'</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';
    html += '</div>';

    container.innerHTML = html;

    setTimeout(function() {
      var curveRows = Object.keys(DATA).map(function(id) {
        var ag    = DATA[id];
        var agCfg = U.getAgencyConfig(id);
        return { name: agCfg ? agCfg.short : id, color: ag.color, pcts: ag.cumPcts };
      });
      Charts.cumulativeCurve('exec-lag-curve', curveRows);
    }, 50);
  }

  return {
    getAgencyData:    getAgencyData,
    renderForAgency:  renderForAgency,
    renderCrossAgency: renderCrossAgency
  };

})();
