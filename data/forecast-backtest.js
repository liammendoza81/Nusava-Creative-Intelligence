// Auto-generated — bell-curve forecast accuracy backtest.
// Tests each historical cohort's wk-0 anchor + bell curve prediction
// against actuals at horizons 1, 2, 4, and 8 weeks ahead.
// Regenerate via: python -m pipeline.parsers.forecast_backtest
window.FORECAST_BACKTEST = {
  "generated_at": "2026-05-17T07:24:25",
  "horizons": [
    1,
    2,
    4,
    8
  ],
  "n_cohorts_tested": 60,
  "methods": {
    "pct": "wk0 anchor \u00d7 winners %-of-lifetime curve ratio (current)",
    "dollar": "n_videos \u00d7 cohort-mean $/video curve (no anchor)",
    "corrected": "pct method \u00d7 learned bias correction factor"
  },
  "by_horizon": [
    {
      "horizon": 1,
      "n_cohorts": 56,
      "mean_abs_err_pct": 191.7,
      "median_abs_err_pct": 49.0,
      "wape_pct": 42.9,
      "mean_signed_err_pct": 169.0,
      "correction_factor": 0.372
    },
    {
      "horizon": 2,
      "n_cohorts": 51,
      "mean_abs_err_pct": 111.4,
      "median_abs_err_pct": 51.9,
      "wape_pct": 51.1,
      "mean_signed_err_pct": 60.8,
      "correction_factor": 0.622
    },
    {
      "horizon": 4,
      "n_cohorts": 43,
      "mean_abs_err_pct": 88.2,
      "median_abs_err_pct": 60.6,
      "wape_pct": 60.7,
      "mean_signed_err_pct": 32.3,
      "correction_factor": 0.756
    },
    {
      "horizon": 8,
      "n_cohorts": 31,
      "mean_abs_err_pct": 70.7,
      "median_abs_err_pct": 67.3,
      "wape_pct": 69.9,
      "mean_signed_err_pct": -19.0,
      "correction_factor": 1.235
    }
  ],
  "by_horizon_pct": [
    {
      "horizon": 1,
      "n_cohorts": 56,
      "mean_abs_err_pct": 191.7,
      "median_abs_err_pct": 49.0,
      "wape_pct": 42.9,
      "mean_signed_err_pct": 169.0,
      "correction_factor": 0.372
    },
    {
      "horizon": 2,
      "n_cohorts": 51,
      "mean_abs_err_pct": 111.4,
      "median_abs_err_pct": 51.9,
      "wape_pct": 51.1,
      "mean_signed_err_pct": 60.8,
      "correction_factor": 0.622
    },
    {
      "horizon": 4,
      "n_cohorts": 43,
      "mean_abs_err_pct": 88.2,
      "median_abs_err_pct": 60.6,
      "wape_pct": 60.7,
      "mean_signed_err_pct": 32.3,
      "correction_factor": 0.756
    },
    {
      "horizon": 8,
      "n_cohorts": 31,
      "mean_abs_err_pct": 70.7,
      "median_abs_err_pct": 67.3,
      "wape_pct": 69.9,
      "mean_signed_err_pct": -19.0,
      "correction_factor": 1.235
    }
  ],
  "by_horizon_dollar": [
    {
      "horizon": 1,
      "n_cohorts": 56,
      "mean_abs_err_pct": 1077.3,
      "median_abs_err_pct": 256.7,
      "wape_pct": 160.1,
      "mean_signed_err_pct": 1062.7,
      "correction_factor": 0.086
    },
    {
      "horizon": 2,
      "n_cohorts": 51,
      "mean_abs_err_pct": 1797.5,
      "median_abs_err_pct": 256.5,
      "wape_pct": 164.2,
      "mean_signed_err_pct": 1780.2,
      "correction_factor": 0.053
    },
    {
      "horizon": 4,
      "n_cohorts": 43,
      "mean_abs_err_pct": 1213.5,
      "median_abs_err_pct": 188.5,
      "wape_pct": 162.5,
      "mean_signed_err_pct": 1191.8,
      "correction_factor": 0.077
    },
    {
      "horizon": 8,
      "n_cohorts": 31,
      "mean_abs_err_pct": 492.1,
      "median_abs_err_pct": 111.6,
      "wape_pct": 138.7,
      "mean_signed_err_pct": 463.2,
      "correction_factor": 0.178
    }
  ],
  "by_horizon_corrected": [
    {
      "horizon": 1,
      "n_cohorts": 56,
      "mean_abs_err_pct": 89.8,
      "median_abs_err_pct": 57.1,
      "wape_pct": 63.3,
      "mean_signed_err_pct": 0.1,
      "correction_factor": 0.999
    },
    {
      "horizon": 2,
      "n_cohorts": 51,
      "mean_abs_err_pct": 79.7,
      "median_abs_err_pct": 65.0,
      "wape_pct": 66.4,
      "mean_signed_err_pct": -0.0,
      "correction_factor": 1.0
    },
    {
      "horizon": 4,
      "n_cohorts": 43,
      "mean_abs_err_pct": 69.0,
      "median_abs_err_pct": 53.2,
      "wape_pct": 65.9,
      "mean_signed_err_pct": 0.0,
      "correction_factor": 1.0
    },
    {
      "horizon": 8,
      "n_cohorts": 31,
      "mean_abs_err_pct": 77.5,
      "median_abs_err_pct": 59.6,
      "wape_pct": 66.1,
      "mean_signed_err_pct": -0.0,
      "correction_factor": 1.0
    }
  ],
  "correction_factors": {
    "1": 0.372,
    "2": 0.622,
    "4": 0.756,
    "8": 1.235
  },
  "by_sku": [
    {
      "key": "b12-1pack",
      "label": "B12 (1-Pack)",
      "family": "B12",
      "n_cohorts": 25,
      "by_horizon": [
        {
          "horizon": 1,
          "n_cohorts": 24,
          "mean_abs_err_pct": 37.2,
          "median_abs_err_pct": 27.4,
          "wape_pct": 37.1,
          "mean_signed_err_pct": 13.6,
          "correction_factor": 0.881
        },
        {
          "horizon": 2,
          "n_cohorts": 23,
          "mean_abs_err_pct": 49.9,
          "median_abs_err_pct": 47.2,
          "wape_pct": 45.7,
          "mean_signed_err_pct": -3.5,
          "correction_factor": 1.036
        },
        {
          "horizon": 4,
          "n_cohorts": 21,
          "mean_abs_err_pct": 56.7,
          "median_abs_err_pct": 56.0,
          "wape_pct": 59.8,
          "mean_signed_err_pct": -7.4,
          "correction_factor": 1.08
        },
        {
          "horizon": 8,
          "n_cohorts": 17,
          "mean_abs_err_pct": 53.9,
          "median_abs_err_pct": 61.1,
          "wape_pct": 70.8,
          "mean_signed_err_pct": -37.8,
          "correction_factor": 1.608
        }
      ],
      "by_horizon_dollar": [
        {
          "horizon": 1,
          "n_cohorts": 24,
          "mean_abs_err_pct": 290.4,
          "median_abs_err_pct": 207.2,
          "wape_pct": 146.8,
          "mean_signed_err_pct": 280.0,
          "correction_factor": 0.263
        },
        {
          "horizon": 2,
          "n_cohorts": 23,
          "mean_abs_err_pct": 591.8,
          "median_abs_err_pct": 192.5,
          "wape_pct": 150.4,
          "mean_signed_err_pct": 581.6,
          "correction_factor": 0.147
        },
        {
          "horizon": 4,
          "n_cohorts": 21,
          "mean_abs_err_pct": 554.0,
          "median_abs_err_pct": 285.5,
          "wape_pct": 158.0,
          "mean_signed_err_pct": 545.1,
          "correction_factor": 0.155
        },
        {
          "horizon": 8,
          "n_cohorts": 17,
          "mean_abs_err_pct": 590.6,
          "median_abs_err_pct": 249.7,
          "wape_pct": 143.8,
          "mean_signed_err_pct": 577.8,
          "correction_factor": 0.148
        }
      ]
    },
    {
      "key": "b12-4pack",
      "label": "B12 (4-Pack)",
      "family": "B12",
      "n_cohorts": 9,
      "by_horizon": [
        {
          "horizon": 1,
          "n_cohorts": 8,
          "mean_abs_err_pct": 52.2,
          "median_abs_err_pct": 56.1,
          "wape_pct": 55.0,
          "mean_signed_err_pct": -7.1,
          "correction_factor": 1.077
        },
        {
          "horizon": 2,
          "n_cohorts": 8,
          "mean_abs_err_pct": 91.9,
          "median_abs_err_pct": 78.9,
          "wape_pct": 78.0,
          "mean_signed_err_pct": 20.3,
          "correction_factor": 0.832
        },
        {
          "horizon": 4,
          "n_cohorts": 7,
          "mean_abs_err_pct": 62.7,
          "median_abs_err_pct": 80.3,
          "wape_pct": 56.9,
          "mean_signed_err_pct": -10.8,
          "correction_factor": 1.121
        },
        {
          "horizon": 8,
          "n_cohorts": 4,
          "mean_abs_err_pct": 69.1,
          "median_abs_err_pct": 89.7,
          "wape_pct": 63.1,
          "mean_signed_err_pct": -21.0,
          "correction_factor": 1.267
        }
      ],
      "by_horizon_dollar": [
        {
          "horizon": 1,
          "n_cohorts": 8,
          "mean_abs_err_pct": 1512.4,
          "median_abs_err_pct": 1141.3,
          "wape_pct": 207.6,
          "mean_signed_err_pct": 1495.1,
          "correction_factor": 0.063
        },
        {
          "horizon": 2,
          "n_cohorts": 8,
          "mean_abs_err_pct": 4377.2,
          "median_abs_err_pct": 2206.6,
          "wape_pct": 212.3,
          "mean_signed_err_pct": 4360.7,
          "correction_factor": 0.022
        },
        {
          "horizon": 4,
          "n_cohorts": 7,
          "mean_abs_err_pct": 3188.4,
          "median_abs_err_pct": 242.4,
          "wape_pct": 168.6,
          "mean_signed_err_pct": 3172.0,
          "correction_factor": 0.031
        },
        {
          "horizon": 8,
          "n_cohorts": 4,
          "mean_abs_err_pct": 224.5,
          "median_abs_err_pct": 227.3,
          "wape_pct": 74.0,
          "mean_signed_err_pct": 189.6,
          "correction_factor": 0.345
        }
      ]
    },
    {
      "key": "b12-all",
      "label": "B12 \u2014 All Packs",
      "family": "B12",
      "n_cohorts": 3,
      "by_horizon": [
        {
          "horizon": 1,
          "n_cohorts": 3,
          "mean_abs_err_pct": 172.3,
          "median_abs_err_pct": 100.9,
          "wape_pct": 129.2,
          "mean_signed_err_pct": 172.3,
          "correction_factor": 0.367
        },
        {
          "horizon": 2,
          "n_cohorts": 2,
          "mean_abs_err_pct": 215.9,
          "median_abs_err_pct": 215.9,
          "wape_pct": 62.4,
          "mean_signed_err_pct": 170.8,
          "correction_factor": 0.369
        },
        {
          "horizon": 4,
          "n_cohorts": 1,
          "mean_abs_err_pct": 64.2,
          "median_abs_err_pct": 64.2,
          "wape_pct": 64.2,
          "mean_signed_err_pct": 64.2,
          "correction_factor": 0.609
        },
        {
          "horizon": 8,
          "n_cohorts": 1,
          "mean_abs_err_pct": 71.0,
          "median_abs_err_pct": 71.0,
          "wape_pct": 71.0,
          "mean_signed_err_pct": -71.0,
          "correction_factor": 3.454
        }
      ],
      "by_horizon_dollar": [
        {
          "horizon": 1,
          "n_cohorts": 3,
          "mean_abs_err_pct": 1015.8,
          "median_abs_err_pct": 346.3,
          "wape_pct": 536.2,
          "mean_signed_err_pct": 1015.8,
          "correction_factor": 0.09
        },
        {
          "horizon": 2,
          "n_cohorts": 2,
          "mean_abs_err_pct": 2701.7,
          "median_abs_err_pct": 2701.7,
          "wape_pct": 303.2,
          "mean_signed_err_pct": 2701.7,
          "correction_factor": 0.036
        },
        {
          "horizon": 4,
          "n_cohorts": 1,
          "mean_abs_err_pct": 379.2,
          "median_abs_err_pct": 379.2,
          "wape_pct": 379.2,
          "mean_signed_err_pct": 379.2,
          "correction_factor": 0.209
        },
        {
          "horizon": 8,
          "n_cohorts": 1,
          "mean_abs_err_pct": 18.5,
          "median_abs_err_pct": 18.5,
          "wape_pct": 18.5,
          "mean_signed_err_pct": 18.5,
          "correction_factor": 0.844
        }
      ]
    },
    {
      "key": "d3k2-all",
      "label": "D3K2 \u2014 All Packs",
      "family": "D3K2",
      "n_cohorts": 10,
      "by_horizon": [
        {
          "horizon": 1,
          "n_cohorts": 9,
          "mean_abs_err_pct": 171.6,
          "median_abs_err_pct": 44.4,
          "wape_pct": 65.8,
          "mean_signed_err_pct": 160.7,
          "correction_factor": 0.384
        },
        {
          "horizon": 2,
          "n_cohorts": 8,
          "mean_abs_err_pct": 163.2,
          "median_abs_err_pct": 80.8,
          "wape_pct": 70.6,
          "mean_signed_err_pct": 154.4,
          "correction_factor": 0.393
        },
        {
          "horizon": 4,
          "n_cohorts": 7,
          "mean_abs_err_pct": 84.4,
          "median_abs_err_pct": 75.8,
          "wape_pct": 73.7,
          "mean_signed_err_pct": 28.8,
          "correction_factor": 0.776
        },
        {
          "horizon": 8,
          "n_cohorts": 4,
          "mean_abs_err_pct": 52.8,
          "median_abs_err_pct": 51.4,
          "wape_pct": 50.2,
          "mean_signed_err_pct": -52.8,
          "correction_factor": 2.118
        }
      ],
      "by_horizon_dollar": [
        {
          "horizon": 1,
          "n_cohorts": 9,
          "mean_abs_err_pct": 448.2,
          "median_abs_err_pct": 188.2,
          "wape_pct": 143.5,
          "mean_signed_err_pct": 421.6,
          "correction_factor": 0.192
        },
        {
          "horizon": 2,
          "n_cohorts": 8,
          "mean_abs_err_pct": 286.5,
          "median_abs_err_pct": 119.5,
          "wape_pct": 103.4,
          "mean_signed_err_pct": 250.1,
          "correction_factor": 0.286
        },
        {
          "horizon": 4,
          "n_cohorts": 7,
          "mean_abs_err_pct": 144.6,
          "median_abs_err_pct": 79.6,
          "wape_pct": 90.5,
          "mean_signed_err_pct": 78.7,
          "correction_factor": 0.56
        },
        {
          "horizon": 8,
          "n_cohorts": 4,
          "mean_abs_err_pct": 47.3,
          "median_abs_err_pct": 37.6,
          "wape_pct": 56.9,
          "mean_signed_err_pct": -13.3,
          "correction_factor": 1.154
        }
      ]
    },
    {
      "key": "wellness-all",
      "label": "Wellness \u2014 All Packs",
      "family": "Wellness",
      "n_cohorts": 13,
      "by_horizon": [
        {
          "horizon": 1,
          "n_cohorts": 12,
          "mean_abs_err_pct": 613.6,
          "median_abs_err_pct": 211.0,
          "wape_pct": 112.0,
          "mean_signed_err_pct": 602.6,
          "correction_factor": 0.142
        },
        {
          "horizon": 2,
          "n_cohorts": 10,
          "mean_abs_err_pct": 205.9,
          "median_abs_err_pct": 70.8,
          "wape_pct": 78.6,
          "mean_signed_err_pct": 143.9,
          "correction_factor": 0.41
        },
        {
          "horizon": 4,
          "n_cohorts": 7,
          "mean_abs_err_pct": 215.3,
          "median_abs_err_pct": 79.8,
          "wape_pct": 86.9,
          "mean_signed_err_pct": 193.6,
          "correction_factor": 0.341
        },
        {
          "horizon": 8,
          "n_cohorts": 5,
          "mean_abs_err_pct": 143.3,
          "median_abs_err_pct": 70.2,
          "wape_pct": 64.7,
          "mean_signed_err_pct": 83.8,
          "correction_factor": 0.544
        }
      ],
      "by_horizon_dollar": [
        {
          "horizon": 1,
          "n_cohorts": 12,
          "mean_abs_err_pct": 2848.3,
          "median_abs_err_pct": 431.4,
          "wape_pct": 304.9,
          "mean_signed_err_pct": 2832.6,
          "correction_factor": 0.034
        },
        {
          "horizon": 2,
          "n_cohorts": 10,
          "mean_abs_err_pct": 3534.6,
          "median_abs_err_pct": 553.6,
          "wape_pct": 327.5,
          "mean_signed_err_pct": 3512.3,
          "correction_factor": 0.028
        },
        {
          "horizon": 4,
          "n_cohorts": 7,
          "mean_abs_err_pct": 2405.2,
          "median_abs_err_pct": 137.0,
          "wape_pct": 284.6,
          "mean_signed_err_pct": 2381.0,
          "correction_factor": 0.04
        },
        {
          "horizon": 8,
          "n_cohorts": 5,
          "mean_abs_err_pct": 822.2,
          "median_abs_err_pct": 75.1,
          "wape_pct": 136.4,
          "mean_signed_err_pct": 762.6,
          "correction_factor": 0.116
        }
      ]
    }
  ],
  "cohort_detail": [
    {
      "cohort_week_end": "2026-05-08",
      "sku_label": "Wellness \u2014 All Packs",
      "family": "Wellness",
      "n_videos": 108,
      "wk0_gmv": 386.0,
      "predicted": {
        "1": 1301.0,
        "2": 208.0,
        "4": 364.0,
        "8": 260.0
      },
      "predicted_dollar": {
        "1": 5422.0,
        "2": 3710.0,
        "4": 3547.0,
        "8": 3082.0
      },
      "actual": {
        "1": 0.0,
        "2": 0.0,
        "4": 0.0,
        "8": 0.0
      }
    },
    {
      "cohort_week_end": "2026-05-08",
      "sku_label": "B12 (1-Pack)",
      "family": "B12",
      "n_videos": 1001,
      "wk0_gmv": 2711.0,
      "predicted": {
        "1": 3936.0,
        "2": 1628.0,
        "4": 1258.0,
        "8": 520.0
      },
      "predicted_dollar": {
        "1": 17147.0,
        "2": 12703.0,
        "4": 12753.0,
        "8": 7798.0
      },
      "actual": {
        "1": 0.0,
        "2": 0.0,
        "4": 0.0,
        "8": 0.0
      }
    },
    {
      "cohort_week_end": "2026-05-01",
      "sku_label": "B12 (1-Pack)",
      "family": "B12",
      "n_videos": 890,
      "wk0_gmv": 2292.0,
      "predicted": {
        "1": 3328.0,
        "2": 1376.0,
        "4": 1064.0,
        "8": 440.0
      },
      "predicted_dollar": {
        "1": 15246.0,
        "2": 11294.0,
        "4": 11339.0,
        "8": 6933.0
      },
      "actual": {
        "1": 2401.0,
        "2": 0.0,
        "4": 0.0,
        "8": 0.0
      }
    },
    {
      "cohort_week_end": "2026-05-01",
      "sku_label": "D3K2 \u2014 All Packs",
      "family": "D3K2",
      "n_videos": 295,
      "wk0_gmv": 240.0,
      "predicted": {
        "1": 355.0,
        "2": 251.0,
        "4": 75.0,
        "8": 53.0
      },
      "predicted_dollar": {
        "1": 643.0,
        "2": 354.0,
        "4": 133.0,
        "8": 201.0
      },
      "actual": {
        "1": 41.0,
        "2": 0.0,
        "4": 0.0,
        "8": 0.0
      }
    },
    {
      "cohort_week_end": "2026-05-01",
      "sku_label": "Wellness \u2014 All Packs",
      "family": "Wellness",
      "n_videos": 64,
      "wk0_gmv": 158.0,
      "predicted": {
        "1": 533.0,
        "2": 85.0,
        "4": 149.0,
        "8": 106.0
      },
      "predicted_dollar": {
        "1": 3213.0,
        "2": 2198.0,
        "4": 2102.0,
        "8": 1827.0
      },
      "actual": {
        "1": 41.0,
        "2": 0.0,
        "4": 0.0,
        "8": 0.0
      }
    },
    {
      "cohort_week_end": "2026-04-24",
      "sku_label": "B12 (1-Pack)",
      "family": "B12",
      "n_videos": 1147,
      "wk0_gmv": 3565.0,
      "predicted": {
        "1": 5177.0,
        "2": 2140.0,
        "4": 1655.0,
        "8": 684.0
      },
      "predicted_dollar": {
        "1": 19648.0,
        "2": 14555.0,
        "4": 14613.0,
        "8": 8935.0
      },
      "actual": {
        "1": 5136.0,
        "2": 1640.0,
        "4": 0.0,
        "8": 0.0
      }
    },
    {
      "cohort_week_end": "2026-04-24",
      "sku_label": "Wellness \u2014 All Packs",
      "family": "Wellness",
      "n_videos": 113,
      "wk0_gmv": 506.0,
      "predicted": {
        "1": 1709.0,
        "2": 273.0,
        "4": 478.0,
        "8": 341.0
      },
      "predicted_dollar": {
        "1": 5673.0,
        "2": 3882.0,
        "4": 3711.0,
        "8": 3225.0
      },
      "actual": {
        "1": 3275.0,
        "2": 1197.0,
        "4": 0.0,
        "8": 0.0
      }
    },
    {
      "cohort_week_end": "2026-04-24",
      "sku_label": "D3K2 \u2014 All Packs",
      "family": "D3K2",
      "n_videos": 409,
      "wk0_gmv": 221.0,
      "predicted": {
        "1": 327.0,
        "2": 232.0,
        "4": 69.0,
        "8": 49.0
      },
      "predicted_dollar": {
        "1": 892.0,
        "2": 491.0,
        "4": 184.0,
        "8": 278.0
      },
      "actual": {
        "1": 66.0,
        "2": 0.0,
        "4": 0.0,
        "8": 0.0
      }
    },
    {
      "cohort_week_end": "2026-04-24",
      "sku_label": "B12 \u2014 All Packs",
      "family": "B12",
      "n_videos": 75,
      "wk0_gmv": 159.0,
      "predicted": {
        "1": 229.0,
        "2": 97.0,
        "4": 75.0,
        "8": 32.0
      },
      "predicted_dollar": {
        "1": 1402.0,
        "2": 1092.0,
        "4": 1013.0,
        "8": 607.0
      },
      "actual": {
        "1": 53.0,
        "2": 20.0,
        "4": 0.0,
        "8": 0.0
      }
    },
    {
      "cohort_week_end": "2026-04-17",
      "sku_label": "Wellness \u2014 All Packs",
      "family": "Wellness",
      "n_videos": 90,
      "wk0_gmv": 292.0,
      "predicted": {
        "1": 986.0,
        "2": 157.0,
        "4": 276.0,
        "8": 197.0
      },
      "predicted_dollar": {
        "1": 4518.0,
        "2": 3092.0,
        "4": 2956.0,
        "8": 2569.0
      },
      "actual": {
        "1": 31.0,
        "2": 0.0,
        "4": 0.0,
        "8": 0.0
      }
    },
    {
      "cohort_week_end": "2026-04-17",
      "sku_label": "B12 (1-Pack)",
      "family": "B12",
      "n_videos": 721,
      "wk0_gmv": 939.0,
      "predicted": {
        "1": 1363.0,
        "2": 564.0,
        "4": 436.0,
        "8": 180.0
      },
      "predicted_dollar": {
        "1": 12351.0,
        "2": 9149.0,
        "4": 9186.0,
        "8": 5617.0
      },
      "actual": {
        "1": 1120.0,
        "2": 300.0,
        "4": 0.0,
        "8": 0.0
      }
    },
    {
      "cohort_week_end": "2026-04-10",
      "sku_label": "B12 (1-Pack)",
      "family": "B12",
      "n_videos": 649,
      "wk0_gmv": 2428.0,
      "predicted": {
        "1": 3525.0,
        "2": 1457.0,
        "4": 1127.0,
        "8": 466.0
      },
      "predicted_dollar": {
        "1": 11117.0,
        "2": 8236.0,
        "4": 8268.0,
        "8": 5056.0
      },
      "actual": {
        "1": 2211.0,
        "2": 1174.0,
        "4": 403.0,
        "8": 0.0
      }
    }
  ]
};
