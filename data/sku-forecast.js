// Auto-generated — per-SKU inventory forecast joining
// sku-videos.js × inventory_*.xlsx × video-lifecycle-by-sku.js.
// Regenerate via: python -m pipeline.parsers.sku_forecast
window.SKU_FORECAST = {
  "generated_at": "2026-05-17T06:41:29",
  "inventory_snapshot": "inventory_2026-05-04.xlsx",
  "lead_time_days": 60,
  "project_weeks": 12,
  "thresholds": {
    "green_dos": 120,
    "yellow_dos": 60
  },
  "skus": [
    {
      "key": "b12-1pack",
      "family": "B12",
      "pack_size": "1-Pack",
      "label": "B12 (1-Pack)",
      "stock_oh": 1148,
      "stock_3pl": 3,
      "stock_total": 1151,
      "gmv_week": 2581.0,
      "units_week": 160.1,
      "avg_unit_price": 16.12,
      "dos_current": 50.2,
      "dos_with_3pl": 50.3,
      "status": "red",
      "reorder_signal": "urgent",
      "projected_units_next_12w": 1921.0,
      "bell_curve_source": "B12 (1-Pack)",
      "raw_skus": [
        {
          "sku": "NUS-LIQVITB12-DRPS-1PK",
          "stock_oh": 830,
          "total_stock": 833,
          "doh_total": 41.6,
          "dsr_used": 20.0,
          "classification": "B"
        },
        {
          "sku": "NUS-LIQ-VITB12-STRBRY-1PK",
          "stock_oh": 318,
          "total_stock": 318,
          "doh_total": 37.1,
          "dsr_used": 8.57,
          "classification": "C"
        },
        {
          "sku": "NUS-B12-RASP-DRPS-1PK",
          "stock_oh": 0,
          "total_stock": 0,
          "doh_total": 0,
          "dsr_used": 0,
          "classification": "C"
        }
      ]
    },
    {
      "key": "b12-2pack",
      "family": "B12",
      "pack_size": "2-Pack",
      "label": "B12 (2-Pack)",
      "stock_oh": 35495,
      "stock_3pl": 4357,
      "stock_total": 39852,
      "gmv_week": 63843.0,
      "units_week": 3028.6,
      "avg_unit_price": 21.08,
      "dos_current": 82.0,
      "dos_with_3pl": 92.1,
      "status": "yellow",
      "reorder_signal": "watch",
      "projected_units_next_12w": 36343.0,
      "bell_curve_source": "B12 \u2014 All Packs",
      "raw_skus": [
        {
          "sku": "NUS-LIQVITB12-DRPS-2PK",
          "stock_oh": 13777,
          "total_stock": 13892,
          "doh_total": 38.6,
          "dsr_used": 360.0,
          "classification": "A"
        },
        {
          "sku": "NUS-LIQVITB12-DRPS-STBRY-2PK",
          "stock_oh": 14853,
          "total_stock": 14893,
          "doh_total": 106.4,
          "dsr_used": 140.0,
          "classification": "A"
        },
        {
          "sku": "NUS-LIQVITB12-DRPS-2PK-GP",
          "stock_oh": 2354,
          "total_stock": 2364,
          "doh_total": 47.3,
          "dsr_used": 50.0,
          "classification": "A"
        },
        {
          "sku": "NUS-LIQVITB12-DRPS-2PK-WB",
          "stock_oh": 871,
          "total_stock": 2307,
          "doh_total": 65.9,
          "dsr_used": 35.0,
          "classification": "A"
        },
        {
          "sku": "NUS-LIQVITB12-DRPS-2PK-BO",
          "stock_oh": 184,
          "total_stock": 2272,
          "doh_total": 90.9,
          "dsr_used": 25.0,
          "classification": "B"
        },
        {
          "sku": "NUS-LIQVITB12-DRPS-RSPBRY-2PK",
          "stock_oh": 1200,
          "total_stock": 1826,
          "doh_total": 91.3,
          "dsr_used": 20.0,
          "classification": "B"
        },
        {
          "sku": "NUS-LIQVITB12-DRPS-2PK-FP",
          "stock_oh": 2256,
          "total_stock": 2298,
          "doh_total": 57.5,
          "dsr_used": 40.0,
          "classification": "A"
        },
        {
          "sku": "NUS-MTHYLB12DRPS-RSBPRY-2PK",
          "stock_oh": 0,
          "total_stock": 0,
          "doh_total": 0,
          "dsr_used": 0,
          "classification": "C"
        }
      ]
    },
    {
      "key": "b12-4pack",
      "family": "B12",
      "pack_size": "4-Pack",
      "label": "B12 (4-Pack)",
      "stock_oh": 2213,
      "stock_3pl": 1,
      "stock_total": 2214,
      "gmv_week": 17777.0,
      "units_week": 551.1,
      "avg_unit_price": 32.26,
      "dos_current": 28.1,
      "dos_with_3pl": 28.1,
      "status": "red",
      "reorder_signal": "urgent",
      "projected_units_next_12w": 6613.0,
      "bell_curve_source": "B12 (4-Pack)",
      "raw_skus": [
        {
          "sku": "NUS-LIQVITB12-DRPS-STBRY-4PK",
          "stock_oh": 1741,
          "total_stock": 1742,
          "doh_total": 58.1,
          "dsr_used": 30.0,
          "classification": "C"
        },
        {
          "sku": "NUS-LIQVITB12-DRPS-4PK",
          "stock_oh": 472,
          "total_stock": 472,
          "doh_total": 49.3,
          "dsr_used": 9.57,
          "classification": "C"
        }
      ]
    },
    {
      "key": "d3k2-2pack",
      "family": "D3K2",
      "pack_size": "2-Pack",
      "label": "D3K2 (2-Pack)",
      "stock_oh": 4886,
      "stock_3pl": 1625,
      "stock_total": 6511,
      "gmv_week": 3648.0,
      "units_week": 171.1,
      "avg_unit_price": 21.32,
      "dos_current": 199.9,
      "dos_with_3pl": 266.4,
      "status": "green",
      "reorder_signal": "ok",
      "projected_units_next_12w": 2053.0,
      "bell_curve_source": "D3K2 \u2014 All Packs",
      "raw_skus": [
        {
          "sku": "NUS-D3K2-LIQ-STBRY-2PK",
          "stock_oh": 1264,
          "total_stock": 1988,
          "doh_total": 26.5,
          "dsr_used": 75.0,
          "classification": "B"
        },
        {
          "sku": "NUS-D3K2-LIQ-PNAPPLE-2PK",
          "stock_oh": 1138,
          "total_stock": 1679,
          "doh_total": 67.2,
          "dsr_used": 25.0,
          "classification": "C"
        },
        {
          "sku": "NUS-D3K2-LIQ-2PK",
          "stock_oh": 1909,
          "total_stock": 1909,
          "doh_total": 127.3,
          "dsr_used": 15.0,
          "classification": "C"
        },
        {
          "sku": "NUS-D3K2-LIQ-VAN-2PK",
          "stock_oh": 575,
          "total_stock": 935,
          "doh_total": 99.2,
          "dsr_used": 9.43,
          "classification": "C"
        },
        {
          "sku": "NUS-D3K2-LIQ-MOCH-2PK",
          "stock_oh": 0,
          "total_stock": 0,
          "doh_total": 0,
          "dsr_used": 0,
          "classification": "C"
        }
      ]
    },
    {
      "key": "d3k2-4pack",
      "family": "D3K2",
      "pack_size": "4-Pack",
      "label": "D3K2 (4-Pack)",
      "stock_oh": 0,
      "stock_3pl": 0,
      "stock_total": 0,
      "gmv_week": 1860.0,
      "units_week": 55.7,
      "avg_unit_price": 33.42,
      "dos_current": 0.0,
      "dos_with_3pl": 0.0,
      "status": "red",
      "reorder_signal": "urgent",
      "projected_units_next_12w": 668.0,
      "bell_curve_source": "D3K2 \u2014 All Packs",
      "raw_skus": [
        {
          "sku": "NUS-D3K2-LIQ-4PK",
          "stock_oh": 0,
          "total_stock": 0,
          "doh_total": 0,
          "dsr_used": 0,
          "classification": "C"
        },
        {
          "sku": "NUS-D3K2-LIQ-PNAPPLE-4PK",
          "stock_oh": 0,
          "total_stock": 0,
          "doh_total": 0,
          "dsr_used": 0,
          "classification": "C"
        },
        {
          "sku": "NUS-D3K2-LIQ-STBRY-4PK",
          "stock_oh": 0,
          "total_stock": 0,
          "doh_total": 0,
          "dsr_used": 0,
          "classification": "C"
        },
        {
          "sku": "NUS-D3K2-LIQ-VAN-4PK",
          "stock_oh": 0,
          "total_stock": 0,
          "doh_total": 0,
          "dsr_used": 0,
          "classification": "C"
        }
      ]
    },
    {
      "key": "wellness-4pack",
      "family": "Wellness",
      "pack_size": "4-Pack",
      "label": "Wellness Bundle (4-Pack)",
      "stock_oh": 1909,
      "stock_3pl": 0,
      "stock_total": 1909,
      "gmv_week": 4036.0,
      "units_week": 121.9,
      "avg_unit_price": 33.12,
      "dos_current": 109.6,
      "dos_with_3pl": 109.6,
      "status": "yellow",
      "reorder_signal": "watch",
      "projected_units_next_12w": 1462.0,
      "bell_curve_source": "Wellness \u2014 All Packs",
      "raw_skus": [
        {
          "sku": "NUS-D3+B12-UR-2PKBD",
          "stock_oh": 1909,
          "total_stock": 1909,
          "doh_total": 0,
          "dsr_used": 0,
          "classification": "C"
        }
      ]
    }
  ]
};
