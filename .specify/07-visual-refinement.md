# Visual Refinement — USG Pricing Decision Engine

## Date: 2026-03-18

## Objective

Radical visual upgrade for USG client demo. Transform the MVP from a functional prototype into an impressive, brand-aligned analytics dashboard.

---

## Design References

- **Brand Identity:** USG Mexico corporate site (usg.com/es-MX)
- **Chart Style:** Tableau — clean, professional data visualization
- **Theme:** Dual mode (light + dark) with toggle

---

## Changes Implemented

### 1. USG Brand Color System

| Token | Light Value | Dark Value | Usage |
|-------|------------|------------|-------|
| `--usg-red` | `#A6192E` | `#A6192E` | Primary accent, active states, CTA buttons |
| `--usg-dark` | `#1B2A33` | `#1B2A33` | Sidebar background, headings |
| `--bg-primary` | `#F5F6F8` | `#0F1A21` | Page background |
| `--bg-secondary` | `#FFFFFF` | `#162028` | Card backgrounds |
| `--text-primary` | `#1B2A33` | `#E8EBED` | Primary text |
| `--text-secondary` | `#54585A` | `#A0A8AE` | Secondary text |
| `--text-tertiary` | `#8C939A` | `#6B757C` | Labels, hints |

### 2. Typography

- **Font:** Inter (matches USG corporate site)
- **Weights:** 300–800
- **Source:** Google Fonts CDN
- **Antialiasing:** Enabled for crisp rendering

### 3. Tableau-Inspired Chart Palette

| Name | Color | Usage |
|------|-------|-------|
| Steel Blue | `#4E79A7` | Revenue, primary metrics, price |
| Orange | `#F28E2B` | Secondary metrics, territory charts |
| Coral Red | `#E15759` | Negative values, rebates, decrease |
| Teal | `#76B7B2` | Margin, tertiary metrics |
| Green | `#59A14F` | Volume, positive values |
| Gold | `#EDC948` | Warnings, discount, protect |
| Lavender | `#B07AA1` | Auxiliary data series |

Segment-specific colors:
- Oro: `#D4A843`
- Plata: `#8C939A`
- Bronce: `#B5651D`

### 4. Dual Theme System

- CSS custom properties for all colors, shadows, borders
- `data-theme="dark"` attribute on `<html>` element
- Toggle button in sidebar (Moon/Sun icons)
- Theme persisted in localStorage via Zustand

### 5. Animations

| Animation | Duration | Usage |
|-----------|----------|-------|
| `fadeInUp` | 500ms ease-out | Cards, KPI cards on mount |
| `fadeIn` | 400ms ease-out | Filters, headers |
| `countUp` | 1200ms cubic ease-out | KPI numeric values |
| `stagger` | 50ms increments | KPI card grid (cascading entrance) |
| Card hover | 200ms ease | Subtle lift + shadow on hover |

### 6. Component Updates

| Component | Changes |
|-----------|---------|
| **Sidebar** | Dark background (#1B2A33), USG red active state, theme toggle, version bump |
| **Card** | Theme-aware backgrounds, hover lift animation, smooth shadow transitions |
| **Badge** | RGBA-based colors for transparency, works in both themes |
| **Select** | Theme-aware input styling |
| **KPICard** | Animated counter (count-up effect), styled change badges |
| **GlobalFilters** | Theme-aware container |
| **Charts** | Tableau palette, gradient fills, improved tooltips, theme-aware grid lines |
| **Tables** | Theme-aware headers, hover row highlights |
| **Loading states** | Branded dots with USG red color |

### 7. Recharts Overrides

Global CSS overrides for consistent chart styling:
- Grid lines use `--border-secondary`
- Axis text uses `--text-tertiary` + Inter font
- Tooltips match card styling (rounded, shadow, themed background)
- Legend text uses `--text-secondary`

---

## Files Modified

| File | Type |
|------|------|
| `src/app/globals.css` | Complete rewrite — theme system, animations, scrollbar, Recharts overrides |
| `src/app/layout.tsx` | Theme-aware main background, `suppressHydrationWarning` |
| `src/components/providers.tsx` | Added `ThemeApplier` component |
| `src/hooks/useTheme.ts` | **New** — Zustand theme store with localStorage persistence |
| `src/lib/chart-theme.ts` | **New** — Tableau palette, tooltip/axis/grid config |
| `src/components/layout/sidebar.tsx` | Dark sidebar, USG branding, theme toggle |
| `src/components/ui/card.tsx` | Theme variables, hover animations |
| `src/components/ui/badge.tsx` | RGBA-based variants for both themes |
| `src/components/ui/select.tsx` | Theme-aware input styling |
| `src/components/charts/kpi-card.tsx` | Animated counter, themed badges |
| `src/components/filters/global-filters.tsx` | Theme-aware container |
| `src/app/page.tsx` | Tableau palette, gradient bars, donut chart, animations |
| `src/app/history/page.tsx` | Tableau colors, themed tables, animations |
| `src/app/simulator/page.tsx` | USG-red accents, gradient areas, themed inputs |
| `src/app/recommendations/page.tsx` | Action colors, themed metrics, USG buttons |
| `src/app/passthrough/page.tsx` | Themed progress bars, gradient areas |

---

## Post-Deploy Fix: KPI Card Overflow

**Issue:** Large numeric values (e.g. `$334,795,123`, `1,873,234 unidades`) overflowed KPI card boundaries on production.

**Fix:** Compact number formatting with automatic abbreviation:

| Value | Before | After |
|-------|--------|-------|
| `$334,795,123` | Truncated / overflow | `$334.8M` |
| `1,873,234 unidades` | Wrapped / overflow | `1,873.2K unidades` |
| `$185.77` | `$185.77` | `$185.77` (no change) |
| `-2` | `-2` | `-2` (no change) |
| `100.0 %` | `100.0 %` | `100.0%` |

Rules:
- Values >= 1M display as `X.XM`
- Values >= 10K display as `X.XK`
- Smaller values display normally
- Unit labels rendered as separate elements with `shrink-0`
- Card has `overflow-hidden` and values have `truncate` as safety net

---

## Post-Deploy Fix: Simulator Not Working

**Issue:** The Simulator page loaded but displayed no curve — the slider and controls appeared but no data rendered.

**Root cause:** HTTP method mismatch between frontend and backend.

| Layer | Expected | Actual |
|-------|----------|--------|
| Backend endpoint | `@router.post("/simulator/quick-simulate")` | POST |
| Frontend call | `fetchAPI(url)` (no method specified) | GET (default) |
| Result | 405 Method Not Allowed | Silent failure, empty curve |

**Fix (2 changes):**

1. `backend/app/api/simulator.py` line 192: Changed `@router.post` to `@router.get` — this is a read-only query, GET is the correct HTTP method
2. `backend/app/api/simulator.py` line 225: Changed `.one()` to `.one_or_none()` with safe fallback — prevents 500 crash when no transaction data matches the filters
3. `backend/tests/test_api.py` line 141: Updated test from `client.post()` to `client.get()` to match

**Impact:** The simulator now generates the price-volume-margin curve correctly when the user moves the slider.

---

## Verification

- Frontend build: Passed (all 6 routes generated, no warnings)
- Backend tests: 12/12 passing
- KPI card overflow: Fixed and verified on production
- Simulator quick-simulate: Fixed POST→GET mismatch, verified on production
- No breaking changes to API contracts or data flow
