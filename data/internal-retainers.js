/* =========================================================
   Nusava — Internal Retainers Data
   No agency fee — use retainerCost as cost denominator.
   ========================================================= */

window.DATA_INTERNAL = {

  months: [
    { label: 'M1', period: 'Jan 1–31 2025', fees: 0, retainerCost: 8500,  sampleCosts: null, targetVids: 120, delivered: 89,  views: 1847203, creators: 6, performing: 5, gmv: 67234  },
    { label: 'M2', period: 'Feb 1–28 2025', fees: 0, retainerCost: 9200,  sampleCosts: null, targetVids: 120, delivered: 94,  views: 2341847, creators: 6, performing: 6, gmv: 89421  },
    { label: 'M3', period: 'Mar 1–31 2025', fees: 0, retainerCost: 9200,  sampleCosts: null, targetVids: 120, delivered: 108, views: 3241847, creators: 7, performing: 6, gmv: 112847 }
  ],

  topCreatorsByMonth: {
    M1: [
      { username: 'nusava_official',  name: 'Brand Account',     gmv: 22840.00 },
      { username: 'alexfit_life',     name: 'Alex Martinez',     gmv: 18420.50 },
      { username: 'jenna_wellness',   name: 'Jenna Park',        gmv: 12340.80 },
      { username: 'coachmarkduncan',  name: 'Mark Duncan',       gmv: 7840.20  },
      { username: 'sarah_unboxes',    name: 'Sarah Chen',        gmv: 4240.50  },
      { username: 'rickyreviews_',    name: 'Ricky Okonkwo',     gmv: 1552.00  }
    ],
    M2: [
      { username: 'nusava_official',  name: 'Brand Account',     gmv: 29420.00 },
      { username: 'alexfit_life',     name: 'Alex Martinez',     gmv: 24840.80 },
      { username: 'jenna_wellness',   name: 'Jenna Park',        gmv: 16240.60 },
      { username: 'coachmarkduncan',  name: 'Mark Duncan',       gmv: 10820.40 },
      { username: 'sarah_unboxes',    name: 'Sarah Chen',        gmv: 6340.20  },
      { username: 'rickyreviews_',    name: 'Ricky Okonkwo',     gmv: 1759.00  }
    ],
    M3: [
      { username: 'nusava_official',  name: 'Brand Account',     gmv: 38240.00 },
      { username: 'alexfit_life',     name: 'Alex Martinez',     gmv: 31840.50 },
      { username: 'jenna_wellness',   name: 'Jenna Park',        gmv: 20340.80 },
      { username: 'coachmarkduncan',  name: 'Mark Duncan',       gmv: 13420.60 },
      { username: 'sarah_unboxes',    name: 'Sarah Chen',        gmv: 7340.10  },
      { username: 'rickyreviews_',    name: 'Ricky Okonkwo',     gmv: 1465.00  },
      { username: 'thefitcoachpro',   name: 'thefitcoachpro',    gmv: 200.00   }
    ]
  },

  recurringCreators: [
    { username: 'nusava_official', name: 'Brand Account',  totalGMV: 90500.00, months: [1,2,3],
      monthlyGMV: [22840.00, 29420.00, 38240.00] },
    { username: 'alexfit_life',    name: 'Alex Martinez',  totalGMV: 75101.80, months: [1,2,3],
      monthlyGMV: [18420.50, 24840.80, 31840.50] },
    { username: 'jenna_wellness',  name: 'Jenna Park',     totalGMV: 48922.20, months: [1,2,3],
      monthlyGMV: [12340.80, 16240.60, 20340.80] },
    { username: 'coachmarkduncan', name: 'Mark Duncan',    totalGMV: 32081.20, months: [1,2,3],
      monthlyGMV: [7840.20, 10820.40, 13420.60] },
    { username: 'sarah_unboxes',   name: 'Sarah Chen',     totalGMV: 17920.80, months: [1,2,3],
      monthlyGMV: [4240.50, 6340.20, 7340.10] },
    { username: 'rickyreviews_',   name: 'Ricky Okonkwo',  totalGMV: 4776.00,  months: [1,2,3],
      monthlyGMV: [1552.00, 1759.00, 1465.00] }
  ],

  /* Creator evaluation for M3 (latest) — mostly ADVANCE, 1 REVIEW */
  creatorEvaluation: [
    { name: 'Brand Account',   username: 'nusava_official',  videos_current: 32, gmv_current: 38240.00, gmv_prev1: 29420.00, gmv_prev2: 22840.00 },
    { name: 'Alex Martinez',   username: 'alexfit_life',     videos_current: 28, gmv_current: 31840.50, gmv_prev1: 24840.80, gmv_prev2: 18420.50 },
    { name: 'Jenna Park',      username: 'jenna_wellness',   videos_current: 24, gmv_current: 20340.80, gmv_prev1: 16240.60, gmv_prev2: 12340.80 },
    { name: 'Mark Duncan',     username: 'coachmarkduncan',  videos_current: 22, gmv_current: 13420.60, gmv_prev1: 10820.40, gmv_prev2: 7840.20  },
    { name: 'Sarah Chen',      username: 'sarah_unboxes',    videos_current: 20, gmv_current: 7340.10,  gmv_prev1: 6340.20,  gmv_prev2: 4240.50  },
    { name: 'Ricky Okonkwo',   username: 'rickyreviews_',    videos_current: 11, gmv_current: 1465.00,  gmv_prev1: 1759.00,  gmv_prev2: 1552.00  },
    { name: 'thefitcoachpro',  username: 'thefitcoachpro',   videos_current: 6,  gmv_current: 200.00,   gmv_prev1: 0,        gmv_prev2: 0        }
  ]
};
