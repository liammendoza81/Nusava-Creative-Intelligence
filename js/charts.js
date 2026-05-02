/* =========================================================
   Nusava Creator Intelligence Platform — Chart Helpers
   All functions use Chart.js 4.4.0 loaded globally.
   ========================================================= */

window.Charts = (function () {

  var instances = {};

  /* Destroy an existing chart by canvas ID */
  function kill(id) {
    if (instances[id]) {
      instances[id].destroy();
      delete instances[id];
    }
  }

  /* Get 2D context from canvas ID */
  function ctx(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    return el.getContext('2d');
  }

  /* Common chart defaults */
  var FONT = "'Segoe UI', -apple-system, sans-serif";
  var BLUE  = '#0284c7';
  var GREEN = '#10b981';
  var RED   = '#ef4444';
  var YEL   = '#f59e0b';
  var PURP  = '#8b5cf6';
  var ORNG  = '#f97316';

  var PALETTE = [BLUE, GREEN, PURP, ORNG, YEL, RED,
                 '#06b6d4', '#ec4899', '#14b8a6', '#a855f7'];

  function alpha(hex, a) {
    var r = parseInt(hex.slice(1,3),16),
        g = parseInt(hex.slice(3,5),16),
        b = parseInt(hex.slice(5,7),16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  /* ── GMV vs Fees (bar + line combo) ── */
  function gmvVsFees(canvasId, months, margin) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;
    margin = margin != null ? margin : CONFIG.grossMargin;

    var labels  = months.map(function(m) { return m.label || m.period; });
    var gmvs    = months.map(function(m) { return m.gmv || 0; });
    var fees    = months.map(function(m) { return m.cost || 0; });
    var gps     = months.map(function(m) { return (m.gmv || 0) * margin; });

    instances[canvasId] = new Chart(c, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'GMV', data: gmvs, backgroundColor: alpha(BLUE, .7), borderRadius: 4 },
          { label: 'Gross Profit', data: gps, backgroundColor: alpha(GREEN, .6), borderRadius: 4 },
          { label: 'Fees/Cost', data: fees, backgroundColor: alpha(RED, .5), borderRadius: 4 },
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': $' + ctx.raw.toLocaleString(); } } }
        },
        scales: {
          y: { ticks: { callback: function(v) { return '$' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v); }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Performing creators stacked (performing vs non-performing) ── */
  function perfStack(canvasId, months) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;

    var labels  = months.map(function(m) { return m.label || m.period; });
    var perf    = months.map(function(m) { return m.performing || 0; });
    var nonperf = months.map(function(m) { return (m.creators || 0) - (m.performing || 0); });

    instances[canvasId] = new Chart(c, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Performing', data: perf, backgroundColor: alpha(GREEN, .75), borderRadius: 4, stack: 'a' },
          { label: 'Non-Performing', data: nonperf, backgroundColor: alpha(RED, .35), borderRadius: 4, stack: 'a' }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } } },
        scales: {
          x: { stacked: true, ticks: { font: { size: 11 } }, grid: { display: false } },
          y: { stacked: true, ticks: { font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── ROI Line chart ── */
  function roiLine(canvasId, months, breakEven) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;
    breakEven = breakEven || U.getBreakEven();

    var labels = months.map(function(m) { return m.label || m.period; });
    var rois   = months.map(function(m) { return m.roi != null ? parseFloat(m.roi.toFixed(2)) : null; });
    var be     = months.map(function() { return breakEven; });

    instances[canvasId] = new Chart(c, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'GMV/Fees Multiple',
            data: rois,
            borderColor: BLUE,
            backgroundColor: alpha(BLUE, .1),
            fill: true,
            tension: .35,
            pointRadius: 5,
            pointBackgroundColor: BLUE
          },
          {
            label: 'Break-Even (' + breakEven.toFixed(2) + 'x)',
            data: be,
            borderColor: RED,
            borderDash: [6, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + (ctx.raw != null ? ctx.raw.toFixed(2) + 'x' : '—'); } } }
        },
        scales: {
          y: { ticks: { callback: function(v) { return v + 'x'; }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Profit vs Fees (net profit line vs cost bars) ── */
  function profitVsFees(canvasId, months, margin) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;
    margin = margin != null ? margin : CONFIG.grossMargin;

    var labels = months.map(function(m) { return m.label || m.period; });
    var nets   = months.map(function(m) { return parseFloat(((m.gmv * margin) - (m.cost || 0)).toFixed(2)); });
    var fees   = months.map(function(m) { return m.cost || 0; });

    instances[canvasId] = new Chart(c, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Net Profit', data: nets, backgroundColor: nets.map(function(v) { return v >= 0 ? alpha(GREEN, .7) : alpha(RED, .7); }), borderRadius: 4 },
          { label: 'Fees/Cost', data: fees, backgroundColor: alpha(PURP, .4), borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': $' + ctx.raw.toLocaleString(); } } } },
        scales: {
          y: { ticks: { callback: function(v) { return '$' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v); }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Cumulative GMV line ── */
  function cumulative(canvasId, months) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;

    var labels = months.map(function(m) { return m.label || m.period; });
    var cum = [], total = 0;
    months.forEach(function(m) { total += (m.gmv || 0); cum.push(parseFloat(total.toFixed(2))); });

    instances[canvasId] = new Chart(c, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cumulative GMV',
          data: cum,
          borderColor: GREEN,
          backgroundColor: alpha(GREEN, .12),
          fill: true,
          tension: .3,
          pointRadius: 5,
          pointBackgroundColor: GREEN
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return 'Cumulative GMV: $' + ctx.raw.toLocaleString(); } } }
        },
        scales: {
          y: { ticks: { callback: function(v) { return '$' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v); }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Scatter: GMV vs ROI by month ── */
  function scatterRoi(canvasId, months, margin) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;
    margin = margin != null ? margin : CONFIG.grossMargin;

    var points = months.map(function(m) {
      return { x: m.gmv || 0, y: m.roi || 0, label: m.label };
    });

    instances[canvasId] = new Chart(c, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Month',
          data: points,
          backgroundColor: points.map(function(p) { return p.y >= CONFIG.roi.excellent ? alpha(GREEN,.7) : p.y >= CONFIG.roi.good ? alpha(YEL,.7) : alpha(RED,.7); }),
          pointRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                return (ctx.raw.label || '') + ' — GMV: $' + ctx.raw.x.toLocaleString() + ' | ROI: ' + ctx.raw.y.toFixed(2) + 'x';
              }
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'GMV ($)', font: { size: 11 } }, ticks: { callback: function(v) { return '$' + (v>=1000?(v/1000).toFixed(0)+'K':v); }, font: { size: 11 } } },
          y: { title: { display: true, text: 'ROI Multiple', font: { size: 11 } }, ticks: { callback: function(v) { return v + 'x'; }, font: { size: 11 } } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Creator horizontal bar chart ── */
  function creatorBar(canvasId, creators, totalGMV) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !creators || creators.length === 0) return null;

    var sorted = creators.slice().sort(function(a, b) { return (a.gmv || 0) - (b.gmv || 0); });
    var labels = sorted.map(function(cr) { return cr.name || cr.username || '?'; });
    var values = sorted.map(function(cr) { return cr.gmv || 0; });

    instances[canvasId] = new Chart(c, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'GMV',
          data: values,
          backgroundColor: values.map(function(v, i) { return alpha(PALETTE[i % PALETTE.length], .75); }),
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function(ctx) { return 'GMV: $' + ctx.raw.toLocaleString(); } } }
        },
        scales: {
          x: { ticks: { callback: function(v) { return '$' + (v>=1000?(v/1000).toFixed(0)+'K':v); }, font: { size: 11 } } },
          y: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Creator trend lines (multi-line) ── */
  function creatorTrend(canvasId, creators, monthLabels) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !creators || creators.length === 0) return null;

    var datasets = creators.map(function(cr, i) {
      return {
        label: cr.name || cr.username,
        data: cr.monthlyGMV || [],
        borderColor: PALETTE[i % PALETTE.length],
        backgroundColor: alpha(PALETTE[i % PALETTE.length], .1),
        fill: false,
        tension: .3,
        pointRadius: 4
      };
    });

    instances[canvasId] = new Chart(c, {
      type: 'line',
      data: { labels: monthLabels || [], datasets: datasets },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': $' + (ctx.raw||0).toLocaleString(); } } } },
        scales: {
          y: { ticks: { callback: function(v) { return '$' + (v>=1000?(v/1000).toFixed(0)+'K':v); }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Concentration donut ── */
  function concentrationDonut(canvasId, creators, totalGMV) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !creators || creators.length === 0) return null;

    var sorted = creators.slice().sort(function(a, b) { return (b.gmv||0) - (a.gmv||0); });
    var top3   = sorted.slice(0, 3);
    var top3GMV = top3.reduce(function(s, cr) { return s + (cr.gmv||0); }, 0);
    var other  = (totalGMV || 0) - top3GMV;

    var labels = top3.map(function(cr) { return cr.name || cr.username; }).concat(['Others']);
    var values = top3.map(function(cr) { return cr.gmv || 0; }).concat([Math.max(0, other)]);

    instances[canvasId] = new Chart(c, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: [BLUE, GREEN, PURP, YEL, ORNG, RED].map(function(col) { return alpha(col, .8); }),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        cutout: '60%',
        plugins: {
          legend: { position: 'right', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.label + ': $' + ctx.raw.toLocaleString() + ' (' + ((ctx.raw / (totalGMV||1)) *100).toFixed(2) + '%)'; } } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Pareto bar (cumulative %) ── */
  function paretoBar(canvasId, creators, totalGMV) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !creators || creators.length === 0) return null;

    var sorted = creators.slice().sort(function(a, b) { return (b.gmv||0) - (a.gmv||0); });
    var labels  = sorted.map(function(cr) { return (cr.name || cr.username || '?').substring(0, 14); });
    var values  = sorted.map(function(cr) { return cr.gmv || 0; });
    var total   = totalGMV || values.reduce(function(s,v) { return s+v; }, 0);
    var cum = [], running = 0;
    values.forEach(function(v) { running += v; cum.push(parseFloat(((running / total) *100).toFixed(2))); });

    instances[canvasId] = new Chart(c, {
      data: {
        labels: labels,
        datasets: [
          { type: 'bar',  label: 'GMV', data: values, backgroundColor: alpha(BLUE, .7), borderRadius: 4, yAxisID: 'y' },
          { type: 'line', label: 'Cumulative %', data: cum, borderColor: ORNG, borderWidth: 2, pointRadius: 4, fill: false, tension: .2, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } }
        },
        scales: {
          y:  { ticks: { callback: function(v) { return '$' + (v>=1000?(v/1000).toFixed(0)+'K':v); }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          y1: { position: 'right', min: 0, max: 100, ticks: { callback: function(v) { return v + '%'; }, font: { size: 11 } }, grid: { display: false } },
          x:  { ticks: { font: { size: 10 }, maxRotation: 35 }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Share trend (stacked area, top creators share over time) ── */
  function shareTrend(canvasId, monthData, topCreatorsByMonth) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !monthData || monthData.length === 0) return null;

    // Build datasets: top1, top3, others
    var labels = monthData.map(function(m) { return m.label || m.period; });
    var top1Share = [], top3Share = [];

    monthData.forEach(function(m, i) {
      var key = m.label || ('M' + (i+1));
      var creators = (topCreatorsByMonth && topCreatorsByMonth[key]) || [];
      var total = m.gmv || 1;
      var sorted = creators.slice().sort(function(a, b) { return (b.gmv||0) - (a.gmv||0); });
      top1Share.push(sorted[0] ? parseFloat(((sorted[0].gmv / total) *100).toFixed(2)) : 0);
      var t3 = sorted.slice(0, 3).reduce(function(s, cr) { return s + (cr.gmv||0); }, 0);
      top3Share.push(parseFloat(((t3 / total) *100).toFixed(2)));
    });

    instances[canvasId] = new Chart(c, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Top 1 Creator %', data: top1Share, borderColor: RED, backgroundColor: alpha(RED, .1), fill: true, tension: .3, pointRadius: 4 },
          { label: 'Top 3 Creators %', data: top3Share, borderColor: PURP, backgroundColor: alpha(PURP, .08), fill: true, tension: .3, pointRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + ctx.raw + '%'; } } } },
        scales: {
          y: { min: 0, max: 100, ticks: { callback: function(v) { return v + '%'; }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Agency comparison: grouped GMV bars ── */
  function agencyComparison(canvasId, agencyDatasets) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !agencyDatasets || agencyDatasets.length === 0) return null;

    // agencyDatasets = [{ id, name, color, months: [{label, gmv}] }]
    // Collect all month labels
    var allLabels = [];
    agencyDatasets.forEach(function(ag) {
      (ag.months || []).forEach(function(m) {
        var lbl = m.label || m.period;
        if (allLabels.indexOf(lbl) === -1) allLabels.push(lbl);
      });
    });

    var datasets = agencyDatasets.map(function(ag) {
      var map = {};
      (ag.months || []).forEach(function(m) { map[m.label || m.period] = m.gmv || 0; });
      return {
        label: ag.name || ag.id,
        data: allLabels.map(function(l) { return map[l] || null; }),
        backgroundColor: alpha(ag.color || BLUE, .75),
        borderColor: ag.color || BLUE,
        borderWidth: 0,
        borderRadius: 5,
        spanGaps: false,
        categoryPercentage: 0.85,
        barPercentage: 0.95
      };
    });

    instances[canvasId] = new Chart(c, {
      type: 'bar',
      data: { labels: allLabels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: FONT, size: 12 }, boxWidth: 14, padding: 20 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + (ctx.raw != null ? '$' + ctx.raw.toLocaleString() : '—'); } } }
        },
        scales: {
          y: { ticks: { callback: function(v) { return '$' + (v>=1000?(v/1000).toFixed(0)+'K':v); }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 12 }, maxRotation: 0 }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Video delivery bars ── */
  function videoDelivery(canvasId, months) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;

    var labels    = months.map(function(m) { return m.label || m.period; });
    var delivered = months.map(function(m) { return m.delivered || 0; });
    var target    = months.map(function(m) { return m.targetVids || 0; });

    instances[canvasId] = new Chart(c, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Delivered', data: delivered, backgroundColor: delivered.map(function(d, i) { return d >= target[i] ? alpha(GREEN,.7) : alpha(YEL,.7); }), borderRadius: 4 },
          { label: 'Target', data: target, backgroundColor: alpha(BLUE, .2), borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } } },
        scales: {
          y: { ticks: { font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── GMV per video ── */
  function gmvPerVideo(canvasId, months) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;

    var labels = months.map(function(m) { return m.label || m.period; });
    var gpvs   = months.map(function(m) { return m.delivered > 0 ? parseFloat((m.gmv / m.delivered).toFixed(2)) : 0; });

    instances[canvasId] = new Chart(c, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'GMV / Video',
          data: gpvs,
          borderColor: PURP,
          backgroundColor: alpha(PURP, .1),
          fill: true,
          tension: .3,
          pointRadius: 5,
          pointBackgroundColor: PURP
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false },
          tooltip: { callbacks: { label: function(ctx) { return 'GMV/Video: $' + ctx.raw.toFixed(2); } } } },
        scales: {
          y: { ticks: { callback: function(v) { return '$' + v.toFixed(0); }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Views per video ── */
  function viewsPerVideo(canvasId, months) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;

    var labels = months.map(function(m) { return m.label || m.period; });
    var vpvs   = months.map(function(m) { return m.delivered > 0 ? Math.round(m.views / m.delivered) : 0; });

    instances[canvasId] = new Chart(c, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Views / Video',
          data: vpvs,
          backgroundColor: alpha(ORNG, .7),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false },
          tooltip: { callbacks: { label: function(ctx) { return 'Views/Video: ' + ctx.raw.toLocaleString(); } } } },
        scales: {
          y: { ticks: { callback: function(v) { return v >= 1000 ? (v/1000).toFixed(0)+'K' : v; }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Volume vs Efficiency scatter ── */
  function volEfficiency(canvasId, months) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;

    var points = months.map(function(m) {
      return {
        x: m.delivered || 0,
        y: m.delivered > 0 ? parseFloat((m.gmv / m.delivered).toFixed(2)) : 0,
        label: m.label || m.period
      };
    });

    instances[canvasId] = new Chart(c, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Months',
          data: points,
          backgroundColor: PALETTE.map(function(col) { return alpha(col, .75); }),
          pointRadius: 9
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function(ctx) { return (ctx.raw.label || '') + ' — ' + ctx.raw.x + ' videos · $' + ctx.raw.y.toFixed(2) + '/video'; } } }
        },
        scales: {
          x: { title: { display: true, text: 'Videos Delivered', font: { size: 11 } }, ticks: { font: { size: 11 } } },
          y: { title: { display: true, text: 'GMV / Video ($)', font: { size: 11 } }, ticks: { callback: function(v) { return '$' + v; }, font: { size: 11 } } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Agency ROI multi-line ── */
  function agencyRoiLines(canvasId, agencyDatasets) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !agencyDatasets || agencyDatasets.length === 0) return null;

    var allLabels = [];
    agencyDatasets.forEach(function(ag) {
      (ag.months || []).forEach(function(m) {
        var lbl = m.label || m.period;
        if (allLabels.indexOf(lbl) === -1) allLabels.push(lbl);
      });
    });

    var breakEven = U.getBreakEven();

    var datasets = agencyDatasets.map(function(ag) {
      var map = {};
      (ag.months || []).forEach(function(m) { map[m.label || m.period] = m.roi || null; });
      return {
        label: ag.name || ag.id,
        data: allLabels.map(function(l) { return map[l] != null ? parseFloat(map[l].toFixed(2)) : null; }),
        borderColor: ag.color || BLUE,
        backgroundColor: 'transparent',
        tension: .3,
        pointRadius: 5,
        fill: false,
        spanGaps: false
      };
    });

    datasets.push({
      label: 'Break-Even (' + breakEven.toFixed(2) + 'x)',
      data: allLabels.map(function() { return breakEven; }),
      borderColor: RED,
      borderDash: [6, 4],
      borderWidth: 1.5,
      pointRadius: 0,
      fill: false
    });

    instances[canvasId] = new Chart(c, {
      type: 'line',
      data: { labels: allLabels, datasets: datasets },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + (ctx.raw != null ? ctx.raw.toFixed(2) + 'x' : '—'); } } } },
        scales: {
          y: { ticks: { callback: function(v) { return v + 'x'; }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Performing rate grouped bar (one group per month, agency bars) ── */
  function perfRateComparison(canvasId, agencyDatasets) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !agencyDatasets || agencyDatasets.length === 0) return null;

    var allLabels = [];
    agencyDatasets.forEach(function(ag) {
      (ag.months || []).forEach(function(m) {
        var lbl = m.label || m.period;
        if (allLabels.indexOf(lbl) === -1) allLabels.push(lbl);
      });
    });

    var datasets = agencyDatasets.map(function(ag) {
      var map = {};
      (ag.months || []).forEach(function(m) {
        map[m.label || m.period] = m.creators > 0 ? parseFloat(((m.performing / m.creators) *100).toFixed(2)) : null;
      });
      return {
        label: ag.name || ag.id,
        data: allLabels.map(function(l) { return map[l] != null ? map[l] : null; }),
        backgroundColor: alpha(ag.color || BLUE, .7),
        borderRadius: 4
      };
    });

    instances[canvasId] = new Chart(c, {
      type: 'bar',
      data: { labels: allLabels, datasets: datasets },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + (ctx.raw != null ? ctx.raw.toFixed(2) + '%' : '—'); } } } },
        scales: {
          y: { min: 0, max: 100, ticks: { callback: function(v) { return v + '%'; }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── GMV Decay: stacked bar — time buckets per month ── */
  function decayBuckets(canvasId, months) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;

    var labels   = months.map(function(m) { return m.label; });
    var buckets  = ['d0_7','d8_14','d15_30','d31_60','d61plus'];
    var bLabels  = ['Days 0–7','Days 8–14','Days 15–30','Days 31–60','Days 61+'];
    var colors   = [BLUE, GREEN, YEL, ORNG, PURP];

    var datasets = buckets.map(function(b, i) {
      return {
        label: bLabels[i],
        data:  months.map(function(m) { return m.buckets ? (m.buckets[b] || 0) : 0; }),
        backgroundColor: alpha(colors[i], .75),
        borderRadius: 3,
        stack: 'a'
      };
    });

    instances[canvasId] = new Chart(c, {
      type: 'bar',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': $' + (ctx.raw||0).toLocaleString(); } } }
        },
        scales: {
          x: { stacked: true, ticks: { font: { size: 11 } }, grid: { display: false } },
          y: { stacked: true, ticks: { callback: function(v) { return '$'+(v>=1000?(v/1000).toFixed(0)+'K':v); }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── GMV Decay: cumulative % curve ── */
  function cumulativeCurve(canvasId, agencyRows) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !agencyRows || agencyRows.length === 0) return null;

    // agencyRows = [{ name, color, pcts: [pct_d7, pct_d14, pct_d30, pct_d60, pct_d90] }]
    var xLabels = ['Day 7','Day 14','Day 30','Day 60','Day 90+'];

    var datasets = agencyRows.map(function(ag) {
      return {
        label: ag.name,
        data: ag.pcts,
        borderColor: ag.color || BLUE,
        backgroundColor: 'transparent',
        tension: .35,
        pointRadius: 5,
        fill: false
      };
    });

    // 80% reference line
    datasets.push({
      label: '80% captured',
      data: xLabels.map(function() { return 80; }),
      borderColor: RED,
      borderDash: [5,4],
      borderWidth: 1.5,
      pointRadius: 0,
      fill: false
    });

    instances[canvasId] = new Chart(c, {
      type: 'line',
      data: { labels: xLabels, datasets: datasets },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + (ctx.raw!=null?ctx.raw.toFixed(2) + '%':'—'); } } }
        },
        scales: {
          y: { min: 0, max: 100, ticks: { callback: function(v) { return v+'%'; }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Incremental: stacked bar new vs legacy GMV ── */
  function incrementalStack(canvasId, months) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;

    var labels  = months.map(function(m) { return m.label; });
    var newGMV  = months.map(function(m) { return m.new_gmv  || 0; });
    var legGMV  = months.map(function(m) { return m.legacy_gmv || 0; });

    instances[canvasId] = new Chart(c, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'New Contract GMV', data: newGMV, backgroundColor: alpha(BLUE, .75), borderRadius: 4, stack: 'a' },
          { label: 'Legacy Carryover',  data: legGMV, backgroundColor: alpha(ORNG, .55), borderRadius: 4, stack: 'a' }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': $' + (ctx.raw||0).toLocaleString(); } } }
        },
        scales: {
          x: { stacked: true, ticks: { font: { size: 11 } }, grid: { display: false } },
          y: { stacked: true, ticks: { callback: function(v) { return '$'+(v>=1000?(v/1000).toFixed(0)+'K':v); }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } }
        }
      }
    });
    return instances[canvasId];
  }

  /* ── Incremental ratio line: % that is new GMV over time ── */
  function incrementalRatio(canvasId, months) {
    kill(canvasId);
    var c = ctx(canvasId);
    if (!c || !months || months.length === 0) return null;

    var labels = months.map(function(m) { return m.label; });
    var ratios  = months.map(function(m) {
      var total = (m.new_gmv || 0) + (m.legacy_gmv || 0);
      return total > 0 ? parseFloat(((m.new_gmv / total) *100).toFixed(2)) : null;
    });

    instances[canvasId] = new Chart(c, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '% New Contract GMV',
            data: ratios,
            borderColor: BLUE,
            backgroundColor: alpha(BLUE, .1),
            fill: true,
            tension: .3,
            pointRadius: 5,
            pointBackgroundColor: BLUE
          },
          {
            label: '50% reference',
            data: labels.map(function() { return 50; }),
            borderColor: ORNG,
            borderDash: [5,4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top', labels: { font: { family: FONT, size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + (ctx.raw!=null?ctx.raw.toFixed(2) + '%':'—'); } } }
        },
        scales: {
          y: { min: 0, max: 100, ticks: { callback: function(v) { return v+'%'; }, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
    return instances[canvasId];
  }

  return {
    instances: instances,
    kill: kill,
    ctx: ctx,
    gmvVsFees: gmvVsFees,
    perfStack: perfStack,
    roiLine: roiLine,
    profitVsFees: profitVsFees,
    cumulative: cumulative,
    scatterRoi: scatterRoi,
    creatorBar: creatorBar,
    creatorTrend: creatorTrend,
    concentrationDonut: concentrationDonut,
    paretoBar: paretoBar,
    shareTrend: shareTrend,
    agencyComparison: agencyComparison,
    agencyRoiLines: agencyRoiLines,
    perfRateComparison: perfRateComparison,
    videoDelivery: videoDelivery,
    gmvPerVideo: gmvPerVideo,
    viewsPerVideo: viewsPerVideo,
    volEfficiency: volEfficiency,
    decayBuckets: decayBuckets,
    cumulativeCurve: cumulativeCurve,
    incrementalStack: incrementalStack,
    incrementalRatio: incrementalRatio
  };

})();
