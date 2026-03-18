# Constitution — USG Pricing Decision Engine

## Identity

Motor de decisión de precios B2B para el canal de distribuidores nacionales de USG en México.

## Immutable Principles

1. **Decision-first, not report-first**: Every view must lead to an actionable recommendation, not just a dashboard.
2. **B2B-native**: The system reflects sell-in pricing to distributors — not B2C retail logic.
3. **Multi-level drill-down**: Every critical view can be opened by channel, territory, segment, distributor, and SKU.
4. **Backward + forward looking**: The system shows both historical analysis and predictive scenarios.
5. **Actionability over complexity**: Prefer working MVPs over perfect architectures.
6. **Explicit confidence**: Every prediction shows its confidence level — never hide uncertainty.
7. **Modularity**: Elasticities are the entry point, not the limit of the product.

## Non-Negotiable Constraints

- Data quality must be explicit — the system clearly shows when a reading is reliable and when it's not.
- Price net = list price - discount - rebate. This formula is sacred.
- Recommendations must always include rationale: elasticity, margin, volume, sensitivity.
- The system must operate with partial datasets without errors.
