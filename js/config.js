/* =========================================================
   Nusava Creator Intelligence Platform — Configuration
   =========================================================

   CRUVA API INTEGRATION
   ---------------------
   When the Cruva API is available:
   1. Set CRUVA_API_KEY to your real key below
   2. Set CRUVA_BASE_URL to the correct endpoint
   3. In js/app.js, find the "CRUVA INTEGRATION POINT" comment
      blocks and replace the static DATA_* references with
      fetch() calls to the Cruva API endpoints, then call
      the appropriate Views.* render function with the response.

   Example fetch pattern (add to app.js):
   ----------------------------------------
   async function loadAgencyData(agencyId) {
     if (!CONFIG.CRUVA_API_KEY) {
       // fall back to static file data
       return window['DATA_' + agencyId.toUpperCase()];
     }
     const res = await fetch(
       CONFIG.CRUVA_BASE_URL + '/agency/' + agencyId + '/performance',
       { headers: { 'X-API-Key': CONFIG.CRUVA_API_KEY } }
     );
     return res.json();
   }
   ========================================================= */

window.CONFIG = {
  brand: 'Nusava',

  // ── Cruva API (replace null with real key when available) ──
  CRUVA_API_KEY: null, // 'your-api-key-here'
  CRUVA_BASE_URL: 'https://api.cruva.com/v1',

  // ── Financial ──
  grossMargin: 0.40,

  // ── Creator Evaluation Rules (configurable) ──
  evaluation: {
    minVideos: 20,          // shoppable videos in current month
    minGMV_monthly: 100,    // minimum GMV current month ($)
    minGMV_rolling3m: 500,  // OR minimum GMV in last 3 months ($)
  },

  // ── GMV thresholds for tier classification ──
  creatorTiers: {
    top: 10000,   // >$10K/month = Top Tier
    mid: 1000,    // $1K-$10K/month = Mid Tier
    // below $1K  = Long Tail
  },

  // ── ROI thresholds ──
  roi: {
    excellent: 5, // >=5x = green
    good: 3,      // 3-5x = yellow
    // below 1x  = red (below break-even)
  },

  // ── Performing creator rate thresholds ──
  perfRate: {
    good: 0.50, // >=50% = green
    warn: 0.25, // 25-50% = yellow
    // <25%     = red
  },

  // ── Agency registry ──
  agencies: [
    { id: 'creatify', name: 'Creator Circle (Creatify)', short: 'Creatify',  color: '#0284c7', active: true },
    { id: 'thc',      name: 'THC',                       short: 'THC',       color: '#8b5cf6', active: true },
    { id: 'elle',     name: 'Elle Media',                short: 'Elle Media',color: '#f97316', active: true },
    { id: 'internal', name: 'Internal Retainers',        short: 'Internal',  color: '#10b981', active: true },
  ]
};
