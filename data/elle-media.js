/* =========================================================
   Nusava — Elle Media Agency Data
   ========================================================= */

window.DATA_ELLE = {

  months: [
    { label: 'M1', period: 'Jan 1–31 2025', fees: 16500, sampleCosts: 1200, targetVids: 450, delivered: 312, views: 2847103, creators: 15, performing: 4,  gmv: 41293  },
    { label: 'M2', period: 'Feb 1–28 2025', fees: 16500, sampleCosts: 1500, targetVids: 450, delivered: 387, views: 4129847, creators: 15, performing: 6,  gmv: 67841  },
    { label: 'M3', period: 'Mar 1–31 2025', fees: 22000, sampleCosts: 1800, targetVids: 600, delivered: 441, views: 5847203, creators: 20, performing: 8,  gmv: 89423  }
  ],

  topCreatorsByMonth: {
    M1: [
      { username: 'ellevibe_shop',   name: 'Sofia Morales',   gmv: 12840.00 },
      { username: 'trendsbytrish',   name: 'Trish Nakamura',  gmv: 9620.50  },
      { username: 'hausofharvey',    name: 'Harvey Brooks',   gmv: 7241.30  },
      { username: 'luxelootfinder',  name: 'luxelootfinder',  gmv: 4380.20  },
      { username: 'findsbyfrankie',  name: 'Frankie Diaz',    gmv: 3840.70  },
      { username: 'glambygio',       name: 'Gio Russo',       gmv: 2240.30  },
      { username: 'shopwithmiley',   name: 'shopwithmiley',   gmv: 1130.00  }
    ],
    M2: [
      { username: 'ellevibe_shop',   name: 'Sofia Morales',   gmv: 21940.00 },
      { username: 'trendsbytrish',   name: 'Trish Nakamura',  gmv: 16420.80 },
      { username: 'hausofharvey',    name: 'Harvey Brooks',   gmv: 11840.60 },
      { username: 'luxelootfinder',  name: 'luxelootfinder',  gmv: 7340.40  },
      { username: 'findsbyfrankie',  name: 'Frankie Diaz',    gmv: 5820.30  },
      { username: 'glambygio',       name: 'Gio Russo',       gmv: 3240.90  },
      { username: 'shopwithmiley',   name: 'shopwithmiley',   gmv: 1238.00  }
    ],
    M3: [
      { username: 'ellevibe_shop',   name: 'Sofia Morales',   gmv: 28940.00 },
      { username: 'trendsbytrish',   name: 'Trish Nakamura',  gmv: 22140.50 },
      { username: 'hausofharvey',    name: 'Harvey Brooks',   gmv: 14820.40 },
      { username: 'luxelootfinder',  name: 'luxelootfinder',  gmv: 9842.60  },
      { username: 'findsbyfrankie',  name: 'Frankie Diaz',    gmv: 7340.30  },
      { username: 'glambygio',       name: 'Gio Russo',       gmv: 4241.20  },
      { username: 'shopwithmiley',   name: 'shopwithmiley',   gmv: 2098.00  }
    ]
  },

  recurringCreators: [
    { username: 'ellevibe_shop',  name: 'Sofia Morales',  totalGMV: 63720.00, months: [1,2,3],
      monthlyGMV: [12840.00, 21940.00, 28940.00] },
    { username: 'trendsbytrish',  name: 'Trish Nakamura', totalGMV: 48181.80, months: [1,2,3],
      monthlyGMV: [9620.50, 16420.80, 22140.50] },
    { username: 'hausofharvey',   name: 'Harvey Brooks',  totalGMV: 33902.30, months: [1,2,3],
      monthlyGMV: [7241.30, 11840.60, 14820.40] },
    { username: 'luxelootfinder', name: 'luxelootfinder', totalGMV: 21563.20, months: [1,2,3],
      monthlyGMV: [4380.20, 7340.40, 9842.60] },
    { username: 'findsbyfrankie', name: 'Frankie Diaz',   totalGMV: 17001.30, months: [1,2,3],
      monthlyGMV: [3840.70, 5820.30, 7340.30] }
  ],

  /* Creator evaluation for M3 (latest) */
  creatorEvaluation: [
    { name: 'Sofia Morales',  username: 'ellevibe_shop',   videos_current: 24, gmv_current: 28940.00, gmv_prev1: 21940.00, gmv_prev2: 12840.00 },
    { name: 'Trish Nakamura', username: 'trendsbytrish',   videos_current: 22, gmv_current: 22140.50, gmv_prev1: 16420.80, gmv_prev2: 9620.50  },
    { name: 'Harvey Brooks',  username: 'hausofharvey',    videos_current: 20, gmv_current: 14820.40, gmv_prev1: 11840.60, gmv_prev2: 7241.30  },
    { name: 'luxelootfinder', username: 'luxelootfinder',  videos_current: 21, gmv_current: 9842.60,  gmv_prev1: 7340.40,  gmv_prev2: 4380.20  },
    { name: 'Frankie Diaz',   username: 'findsbyfrankie',  videos_current: 15, gmv_current: 7340.30,  gmv_prev1: 5820.30,  gmv_prev2: 3840.70  },
    { name: 'Gio Russo',      username: 'glambygio',       videos_current: 12, gmv_current: 4241.20,  gmv_prev1: 3240.90,  gmv_prev2: 2240.30  },
    { name: 'shopwithmiley',  username: 'shopwithmiley',   videos_current: 6,  gmv_current: 2098.00,  gmv_prev1: 1238.00,  gmv_prev2: 1130.00  },
    { name: 'melissashops_',  username: 'melissashops_',   videos_current: 9,  gmv_current: 0,        gmv_prev1: 0,        gmv_prev2: 0        }
  ]
};
