# Spec — USG Pricing Decision Engine (MVP)

## What It Does

A B2B pricing decision engine that transforms sell-in data into actionable pricing recommendations by distributor segment, territory, and SKU for USG Mexico.

## Users

- **Primary**: Product Economics / Pricing / Commercial Excellence teams at USG
- **Secondary**: Commercial leadership, channel leadership, finance, regional sales teams

## Core Modules

### 1. Overview Dashboard
- 6 responsive KPIs with count-up animation and color-coded accent dots
- Lollipop chart for revenue by category (horizontal, sorted, direct values)
- Donut chart for volume by segment with values inside slices and emoji labels (🥇🥈🥉)
- Dot plot for revenue by territory (horizontal, direct values)

### 2. History / Descriptive Elasticities
- Area+line trends with dual Y-axis, smooth curves, endLabels on last data point
- Bubble scatter (price vs volume) with auto-fit axes and size encoding
- Elasticities table with editorial styling and ConfidenceDot indicators

### 3. Predictive Pricing / Scenario Simulator
- **Manual (Artisanal)**: Interactive price change slider (-20% to +20%), price-volume-margin curves
- **Excel Upload**: Client uploads planned price changes, system evaluates and suggests improvements
- **Auto-Optimization**: System finds optimal prices per product given objective and price range
- Save and compare scenarios
- Drill-down from portfolio → category → segment → territory → SKU
- Multi-scenario comparison (2-4 side-by-side) with automatic ranking
- Best scenario recommendation by objective (maximize margin, volume, or revenue)
- Integrated analytics engine (predict_scenario + confidence_scorer + suggest_improvements)

### 4. Recommendations
- Actionable pricing recommendations by segment/territory/SKU
- Three action types: increase, protect, decrease
- Each recommendation includes rationale and confidence level
- Export to CSV and executive summary JSON

### 5. Passthrough & Rebates
- Grouped bars for price decomposition by segment (net price, discount, rebate)
- Horizontal bars for rebate % by category with direct value labels
- Progress bars for rebate/discount % by segment with emoji labels
- Temporal waterfall: stacked bars (Neto + Rebate + Descuento = Lista) with reference line and vertical price labels

## Global Filters

All modules share a multi-select filter bar:
- **Segmento**: oro, plata, bronce (multi-select)
- **Territorio**: 29 states (multi-select, searchable)
- **Categoría**: 10 product categories (multi-select, searchable)
- **Distribuidor**: 75 real distributors (multi-select, searchable, cascades from territory and segment)
- All filters support multiple selections via comma-separated values
- Distributor list filters by territory via branch locations (not a single assignment)

## Visual Design

Inspired by Lomska "100 Vizzes" editorial style:
- **Chart library**: ECharts 5 with custom BaseChart wrapper (SSR-safe)
- **Color palette**: navy `#2B4C7E`, coral `#D85A4A`, blue `#5B8DB8`, gray `#C4C9CF`
- **Typography**: Inter font, 13px for tables, direct data labels on charts
- **Chart types**: lollipop, donut, dot plot, temporal waterfall, bubble scatter, area+line
- **Tables**: editorial styling (no uppercase headers), ConfidenceDot (● high/medium/low), SegmentLabel (🥇🥈🥉)
- **Cards**: borderless, clean white backgrounds
- **KPIs**: responsive sizing, color-coded accent dots, count-up animation

## Data Domain (Mock)

- 86 SKUs across 10 categories
- 75 real distributors in 3 segments (oro/plata/bronce) — from distribuidores_por_estado_corregido.xlsx
- 29 territories across 6 regions in Mexico
- Distributors mapped to territories via branches (sucursales) per state
- 24 months of sell-in transactions (Jan 2024 - Dec 2025)
- Pre-computed elasticities by category, SKU, segment, and territory
