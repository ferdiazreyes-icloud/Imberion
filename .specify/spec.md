# Spec — USG Pricing Decision Engine (MVP)

## What It Does

A B2B pricing decision engine that transforms sell-in data into actionable pricing recommendations by distributor segment, territory, and SKU for USG Mexico.

## Users

- **Primary**: Product Economics / Pricing / Commercial Excellence teams at USG
- **Secondary**: Commercial leadership, channel leadership, finance, regional sales teams

## Core Modules

### 1. Overview Dashboard
- 6 KPIs: revenue, volume, avg net price, avg elasticity, modeled coverage, avg rebate
- Drill-down by category, segment (oro/plata/bronce), territory

### 2. History / Descriptive Elasticities
- Price and volume trends over time
- Historical elasticities with statistical confidence
- Price-volume scatter visualization

### 3. Predictive Pricing / Scenario Simulator
- Interactive price change slider (-20% to +20%)
- Price-volume-margin curves with real cost-based margin calculation
- Save and compare scenarios
- Drill-down from portfolio → category → segment → territory → SKU
- Multi-scenario comparison (2-4 side-by-side) with automatic ranking
- Best scenario recommendation by objective (maximize margin, volume, or revenue)
- Integrated analytics engine (predict_scenario + confidence_scorer)

### 4. Recommendations
- Actionable pricing recommendations by segment/territory/SKU
- Three action types: increase, protect, decrease
- Each recommendation includes rationale and confidence level
- Export to CSV and executive summary JSON

### 5. Passthrough & Rebates
- List price to net price waterfall by segment
- Rebate analysis by category
- Price component evolution over time

## Data Domain (Mock)

- 86 SKUs across 10 categories
- 75 real distributors in 3 segments (oro/plata/bronce) — from distribuidores_por_estado_corregido.xlsx
- 29 territories across 6 regions in Mexico
- 24 months of sell-in transactions (Jan 2024 - Dec 2025)
- Pre-computed elasticities by category, SKU, segment, and territory
