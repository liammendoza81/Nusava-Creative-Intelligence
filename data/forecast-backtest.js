// Auto-generated — bell-curve forecast accuracy backtest.
// Tests each historical cohort's wk-0 anchor + bell curve prediction
// against actuals at horizons 1, 2, 4, and 8 weeks ahead.
// Regenerate via: python -m pipeline.parsers.forecast_backtest
window.FORECAST_BACKTEST = {
  "generated_at": "2026-05-17T06:53:14",
  "horizons": [
    1,
    2,
    4,
    8
  ],
  "n_cohorts_tested": 60,
  "by_horizon": [
    {
      "horizon": 1,
      "n_cohorts": 56,
      "mean_abs_err_pct": 191.7,
      "median_abs_err_pct": 49.0,
      "wape_pct": 42.9,
      "mean_signed_err_pct": 169.0
    },
    {
      "horizon": 2,
      "n_cohorts": 51,
      "mean_abs_err_pct": 111.4,
      "median_abs_err_pct": 51.9,
      "wape_pct": 51.1,
      "mean_signed_err_pct": 60.8
    },
    {
      "horizon": 4,
      "n_cohorts": 43,
      "mean_abs_err_pct": 88.2,
      "median_abs_err_pct": 60.6,
      "wape_pct": 60.7,
      "mean_signed_err_pct": 32.3
    },
    {
      "horizon": 8,
      "n_cohorts": 31,
      "mean_abs_err_pct": 70.7,
      "median_abs_err_pct": 67.3,
      "wape_pct": 69.9,
      "mean_signed_err_pct": -19.0
    }
  ],
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
          "mean_signed_err_pct": 13.6
        },
        {
          "horizon": 2,
          "n_cohorts": 23,
          "mean_abs_err_pct": 49.9,
          "median_abs_err_pct": 47.2,
          "wape_pct": 45.7,
          "mean_signed_err_pct": -3.5
        },
        {
          "horizon": 4,
          "n_cohorts": 21,
          "mean_abs_err_pct": 56.7,
          "median_abs_err_pct": 56.0,
          "wape_pct": 59.8,
          "mean_signed_err_pct": -7.4
        },
        {
          "horizon": 8,
          "n_cohorts": 17,
          "mean_abs_err_pct": 53.9,
          "median_abs_err_pct": 61.1,
          "wape_pct": 70.8,
          "mean_signed_err_pct": -37.8
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
          "mean_signed_err_pct": -7.1
        },
        {
          "horizon": 2,
          "n_cohorts": 8,
          "mean_abs_err_pct": 91.9,
          "median_abs_err_pct": 78.9,
          "wape_pct": 78.0,
          "mean_signed_err_pct": 20.3
        },
        {
          "horizon": 4,
          "n_cohorts": 7,
          "mean_abs_err_pct": 62.7,
          "median_abs_err_pct": 80.3,
          "wape_pct": 56.9,
          "mean_signed_err_pct": -10.8
        },
        {
          "horizon": 8,
          "n_cohorts": 4,
          "mean_abs_err_pct": 69.1,
          "median_abs_err_pct": 89.7,
          "wape_pct": 63.1,
          "mean_signed_err_pct": -21.0
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
          "mean_signed_err_pct": 172.3
        },
        {
          "horizon": 2,
          "n_cohorts": 2,
          "mean_abs_err_pct": 215.9,
          "median_abs_err_pct": 215.9,
          "wape_pct": 62.4,
          "mean_signed_err_pct": 170.8
        },
        {
          "horizon": 4,
          "n_cohorts": 1,
          "mean_abs_err_pct": 64.2,
          "median_abs_err_pct": 64.2,
          "wape_pct": 64.2,
          "mean_signed_err_pct": 64.2
        },
        {
          "horizon": 8,
          "n_cohorts": 1,
          "mean_abs_err_pct": 71.0,
          "median_abs_err_pct": 71.0,
          "wape_pct": 71.0,
          "mean_signed_err_pct": -71.0
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
          "mean_signed_err_pct": 160.7
        },
        {
          "horizon": 2,
          "n_cohorts": 8,
          "mean_abs_err_pct": 163.2,
          "median_abs_err_pct": 80.8,
          "wape_pct": 70.6,
          "mean_signed_err_pct": 154.4
        },
        {
          "horizon": 4,
          "n_cohorts": 7,
          "mean_abs_err_pct": 84.4,
          "median_abs_err_pct": 75.8,
          "wape_pct": 73.7,
          "mean_signed_err_pct": 28.8
        },
        {
          "horizon": 8,
          "n_cohorts": 4,
          "mean_abs_err_pct": 52.8,
          "median_abs_err_pct": 51.4,
          "wape_pct": 50.2,
          "mean_signed_err_pct": -52.8
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
          "mean_signed_err_pct": 602.6
        },
        {
          "horizon": 2,
          "n_cohorts": 10,
          "mean_abs_err_pct": 205.9,
          "median_abs_err_pct": 70.8,
          "wape_pct": 78.6,
          "mean_signed_err_pct": 143.9
        },
        {
          "horizon": 4,
          "n_cohorts": 7,
          "mean_abs_err_pct": 215.3,
          "median_abs_err_pct": 79.8,
          "wape_pct": 86.9,
          "mean_signed_err_pct": 193.6
        },
        {
          "horizon": 8,
          "n_cohorts": 5,
          "mean_abs_err_pct": 143.3,
          "median_abs_err_pct": 70.2,
          "wape_pct": 64.7,
          "mean_signed_err_pct": 83.8
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
      "actual": {
        "1": 2211.0,
        "2": 1174.0,
        "4": 403.0,
        "8": 0.0
      }
    }
  ]
};
