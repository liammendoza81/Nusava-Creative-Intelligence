/* =========================================================
   Nusava Creator Intelligence Platform — Utilities
   ========================================================= */

window.U = (function () {

  /* ── Formatting helpers ── */

  function fmt$(n) {
    if (n == null || isNaN(n)) return '—';
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000)    return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  }

  function fmtFull$(n) {
    if (n == null || isNaN(n)) return '—';
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtPct(n) {
    // 2-decimal cap on every percentage. Input is a fraction (0–1) by default,
    // but values >1 are treated as already-scaled (e.g. "18.0999" → "18.10%").
    if (n == null || isNaN(n)) return '—';
    var pct = Math.abs(n) <= 1 ? n * 100 : n;
    return pct.toFixed(2) + '%';
  }

  function fmtX(n) {
    if (n == null || isNaN(n)) return '—';
    return n.toFixed(2) + 'x';
  }

  function fmtNum(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-US');
  }

  /* ── Color class helpers ── */

  function roiCls(roi) {
    if (roi == null || isNaN(roi)) return '';
    if (roi >= CONFIG.roi.excellent) return 'text-green';
    if (roi >= CONFIG.roi.good)      return 'text-yellow';
    if (roi >= 1)                    return '';
    return 'text-red';
  }

  function roiColor(roi) {
    if (roi == null || isNaN(roi)) return CONFIG.agencies[0].color;
    if (roi >= CONFIG.roi.excellent) return CONFIG.green || '#10b981';
    if (roi >= CONFIG.roi.good)      return '#f59e0b';
    if (roi >= 1)                    return '#64748b';
    return '#ef4444';
  }

  function perfCls(rate) {
    if (rate == null || isNaN(rate)) return '';
    if (rate >= CONFIG.perfRate.good) return 'text-green';
    if (rate >= CONFIG.perfRate.warn) return 'text-yellow';
    return 'text-red';
  }

  /* ── Enrich a month data object with derived fields ── */
  function enrich(m) {
    if (!m) return m;
    var gm = (m._grossMargin != null ? m._grossMargin : CONFIG.grossMargin);
    // For Internal Retainers: fees=0, use retainerCost as the cost denominator
    var cost = (m.retainerCost != null && m.retainerCost > 0) ? m.retainerCost : (m.fees || 0);
    var totalCost = cost + (m.sampleCosts || 0);

    var roi       = totalCost > 0 ? m.gmv / totalCost : null;
    var gp        = m.gmv * gm;
    var net       = gp - totalCost;
    var netROI    = totalCost > 0 ? net / totalCost : null;
    var gpv       = m.delivered > 0 ? m.gmv / m.delivered : 0;   // GMV per video
    var vpv       = m.delivered > 0 ? m.views / m.delivered : 0;  // views per video
    var gpc       = m.creators > 0  ? m.gmv / m.creators : 0;    // GMV per creator
    var gpp       = m.performing > 0 ? m.gmv / m.performing : 0;  // GMV per performing creator
    var perfRate  = m.creators > 0  ? m.performing / m.creators : 0;
    var delRate   = m.targetVids > 0 ? m.delivered / m.targetVids : 0;

    return Object.assign({}, m, {
      cost: cost,
      totalCost: totalCost,
      roi: roi,
      gp: gp,
      net: net,
      netROI: netROI,
      gpv: gpv,
      vpv: vpv,
      gpc: gpc,
      gpp: gpp,
      perfRate: perfRate,
      delRate: delRate
    });
  }

  /* ── Evaluate a creator — returns ADVANCE / REVIEW / DROP ── */
  function evaluateCreator(creator) {
    /*
      creator = {
        username, name,
        videos_current,    // shoppable videos this month
        gmv_current,       // GMV this month
        gmv_prev1,         // GMV last month
        gmv_prev2,         // GMV month before that
        gmv_prev3          // GMV 3 months ago (optional)
      }
    */
    var rules   = CONFIG.evaluation;
    var videos  = creator.videos_current || 0;
    var gmvNow  = creator.gmv_current || 0;
    var rolling = (creator.gmv_current || 0)
                + (creator.gmv_prev1  || 0)
                + (creator.gmv_prev2  || 0);

    var meetsVideos  = videos  >= rules.minVideos;
    var meetsGMVNow  = gmvNow  >= rules.minGMV_monthly;
    var meetsRolling = rolling >= rules.minGMV_rolling3m;
    var meetsGMV     = meetsGMVNow || meetsRolling;

    var status, reasons = [], score = 0;

    if (meetsVideos) score += 50;
    if (meetsGMVNow)  score += 30;
    if (meetsRolling) score += 20;

    if (meetsVideos && meetsGMV) {
      status = 'ADVANCE';
      reasons.push('Meets video volume (' + videos + ' videos ≥ ' + rules.minVideos + ' required)');
      if (meetsGMVNow)  reasons.push('Current month GMV ' + fmtFull$(gmvNow) + ' meets threshold');
      if (meetsRolling && !meetsGMVNow) reasons.push('Rolling 3-month GMV ' + fmtFull$(rolling) + ' meets threshold');
    } else if (!meetsVideos && meetsGMV) {
      status = 'REVIEW';
      reasons.push('Insufficient videos: ' + videos + ' (need ≥ ' + rules.minVideos + ')');
      reasons.push('GMV qualifies (' + fmtFull$(meetsGMVNow ? gmvNow : rolling) + ')');
    } else if (meetsVideos && !meetsGMV) {
      status = 'REVIEW';
      reasons.push('Good video volume (' + videos + ' videos), but low GMV');
      reasons.push('Current: ' + fmtFull$(gmvNow) + ' · Rolling 3-month: ' + fmtFull$(rolling));
    } else {
      status = 'DROP';
      reasons.push('Insufficient videos: ' + videos + ' (need ≥ ' + rules.minVideos + ')');
      reasons.push('Insufficient GMV: ' + fmtFull$(gmvNow) + ' this month, ' + fmtFull$(rolling) + ' rolling 3-month');
    }

    return { status: status, reasons: reasons, score: score };
  }

  /* ── Break-even multiple ── */
  function getBreakEven() {
    return 1 / CONFIG.grossMargin;
  }

  /* ── Best/worst for table cell highlighting ── */
  function bestWorst(arr) {
    var valid = arr.filter(function(v) { return v != null && !isNaN(v); });
    if (valid.length < 2) return { best: valid[0], worst: valid[0] };
    return {
      best:  Math.max.apply(null, valid),
      worst: Math.min.apply(null, valid)
    };
  }

  /* ── Get the data object for an agency ID ── */
  function getAgencyData(agencyId) {
    var map = {
      'creatify': window.DATA_CREATIFY,
      'thc':      window.DATA_THC,
      'elle':     window.DATA_ELLE,
      'internal': window.DATA_INTERNAL
    };
    return map[agencyId] || null;
  }

  /* ── Get the agency config entry ── */
  function getAgencyConfig(agencyId) {
    return CONFIG.agencies.find(function(a) { return a.id === agencyId; }) || CONFIG.agencies[0];
  }

  /* ── Cost label depending on agency type ── */
  function costLabel(agencyId) {
    return agencyId === 'internal' ? 'Retainer Cost' : 'Agency Fees';
  }

  /* ── Enrich all months in an agency dataset ── */
  function enrichAll(data) {
    if (!data || !data.months) return [];
    return data.months.map(function(m, i) {
      var em = enrich(m);
      em.label = m.label || ('M' + (i + 1));
      return em;
    });
  }

  return {
    fmt$: fmt$,
    fmtFull$: fmtFull$,
    fmtPct: fmtPct,
    fmtX: fmtX,
    fmtNum: fmtNum,
    roiCls: roiCls,
    roiColor: roiColor,
    perfCls: perfCls,
    enrich: enrich,
    enrichAll: enrichAll,
    evaluateCreator: evaluateCreator,
    getBreakEven: getBreakEven,
    bestWorst: bestWorst,
    getAgencyData: getAgencyData,
    getAgencyConfig: getAgencyConfig,
    costLabel: costLabel
  };
})();
