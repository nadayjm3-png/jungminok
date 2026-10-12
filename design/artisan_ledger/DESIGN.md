---
name: Artisan Ledger
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#51443a'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#837469'
  outline-variant: '#d5c3b6'
  surface-tint: '#835425'
  primary: '#6f4315'
  on-primary: '#ffffff'
  primary-container: '#8b5a2b'
  on-primary-container: '#ffddc2'
  inverse-primary: '#f9ba82'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#3636c4'
  on-tertiary: '#ffffff'
  tertiary-container: '#5052dd'
  on-tertiary-container: '#e2e0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc1'
  primary-fixed-dim: '#f9ba82'
  on-primary-fixed: '#2e1500'
  on-primary-fixed-variant: '#683d0f'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-numeric-lg:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  label-numeric-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-numeric-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is crafted for independent cafe owners, roasters, and store managers navigating inventory, sales margins, and real-time P&L. It bridges the gap between warm hospitality and analytical rigor.

### Personality & Aesthetic
- **Tactile Precision:** Combines the warmth of specialty coffee craftsmanship with the calm authority of financial SaaS.
- **Editorial Modernism:** Light, clean surfaces balanced by roasted amber accents, avoiding cold generic enterprise dashboards or overly rustic aesthetics.
- **Cognitive Clarity:** Dense financial data (inventory counts, unit yields, margins) is structured for immediate comprehension under bright kitchen lighting or behind the counter on POS/tablet screens.

## Colors

The palette balances roasted coffee notes with analytical financial states.

### Palette Architecture
- **Primary (`#8B5A2B`):** Roasted Espresso. Anchors navigation, active states, key headers, and core action buttons.
- **Secondary (`#D97706`):** Warm Amber. Highlights critical real-time operations, daily alerts, and key summary metric callouts.
- **Tertiary (`#6366F1`):** Forecast Indigo. Reserved strictly for projection values, estimated end-of-month stock, and prospective margins to differentiate actuals from forecasts.
- **Neutrals (`#0F172A`, `#334155`, `#64748B`, `#F8FAFC`, `#FFFFFF`):** Slate and Zinc foundations. Backgrounds use crisp off-white (`#F8FAFC`) with pure white card tiers (`#FFFFFF`) to maintain data contrast.
- **Status Accents:**
  - **Success / Positive Margin:** Emerald (`#10B981`)
  - **Alert / Low Stock / Deficit:** Crimson (`#EF4444`)
  - **Warning / Near Expiry:** Amber (`#F59E0B`)

### Rules of Application
- Actual metrics use neutral deep charcoal (`#0F172A`) paired with espresso accents. Projected metrics always carry an Indigo indicator or soft purple background badge.
- Critical thresholds (e.g., milk stock below safety level) override default neutrals with high-contrast alert red.

## Typography

The typography pairs neutral grotesque Korean/Latin body text (`Inter` / system fallbacks like `Pretendard`) with monospaced precision for numbers (`JetBrains Mono`).

### Layout & Sizing Guidance
- **Financial & Quantity Metrics:** Quantities, ingredient units (`g`, `ml`, `shots`, `bags`), and currency (`₩`) use tabular figures via `JetBrains Mono` to prevent layout shift during updates and align decimal places across table columns.
- **Unit Hierarchy:** Suffixes (`원`, `kg`, `%`) must sit at 80% scale relative to their parent numbers and use muted slate (`#64748B`).

## Layout & Spacing

A structured responsive framework accommodates POS/tablet screens (landscape and portrait) and desktop monitors behind the bar.

### Layout System
- **Desktop (≥1280px):** 12-column fluid grid. Collapsible left navigation drawer (260px fixed width), 2rem margins, 1.5rem gutters.
- **Tablet (768px - 1279px):** 8-column layout. Navigation folds into an icon rail (72px) or a top navigation header. Gutters set to 1rem.
- **Mobile (<768px):** 4-column layout with 1rem margin. Global navigation collapses to an off-canvas drawer or persistent bottom dock.

### Spacing Principles
- Density matches operational flow: high-density table views use `space-sm` for row cell vertical padding, while top-level KPI cards utilize `space-lg` to create clear visual separation.

## Elevation & Depth

Visual hierarchy uses clean tonal layers combined with low-contrast borders rather than deep dramatic drops.

### Elevation Architecture
- **Base Canvas:** Tinted off-white (`#F8FAFC`). No shadow.
- **Level 1 (Cards, KPI blocks, Tables):** Solid white (`#FFFFFF`) with a 1px border (`#E2E8F0`). Flat elevation by default; hover states apply a subtle warm-tinted shadow (`0 2px 6px -1px rgba(139, 90, 43, 0.06), 0 1px 4px -1px rgba(15, 23, 42, 0.04)`).
- **Level 2 (Dropdowns, Popovers, Filter Menus):** Pure white with shadow (`0 8px 20px -4px rgba(15, 23, 42, 0.10)`), bordered with `#CBD5E1`.
- **Level 3 (Modals & Slide-over Drawers):** Backdrop overlay (`rgba(15, 23, 42, 0.45)`) combined with elevated container (`0 20px 25px -5px rgba(15, 23, 42, 0.15)`).

## Shapes

The interface uses standard rounded corners (`0.5rem` / 8px) to soften analytical density while maintaining structure.

### Application Rules
- **Base Components:** Form controls, table card containers, and standard buttons use `0.5rem` (8px).
- **KPI Summary Cards & Modals:** Use `rounded-lg` (`1rem` / 16px) for an approachable container frame.
- **Tags, Status Badges, and Filter Pills:** Use full pill rounding (`9999px`) to distinguish categorical indicators from actionable buttons.

## Components

### Buttons
- **Primary:** Background `#8B5A2B`, text `#FFFFFF`. On hover: `#704822`. Focused: 2px ring with `#D97706`.
- **Secondary:** Surface `#FFFFFF`, border 1px solid `#CBD5E1`, text `#334155`. On hover: `#F1F5F9`.
- **Destructive:** Surface `#FEF2F2`, border 1px solid `#FCA5A5`, text `#DC2626`.

### KPI Summary Cards
- Header displaying label and metric category.
- Large numeric value (`JetBrains Mono`, 24px) paired with unit indicator (`g`, `₩`).
- Dual badge indicator:
  - **Actual:** Neutral background (`#F1F5F9`), text `#334155`.
  - **Forecast / Projected:** Indigo background (`#EEF2FF`), text `#4F46E5` with "예상" (Forecast) prefix label.
- Micro-trend arrow (green `+` for profit, red `-` for waste/cost overruns).

### Data Tables
- Header row fixed at 40px height with uppercase muted slate text (`#64748B`), uppercase tracking, 11px font size.
- Body rows separated by 1px subtle divider lines (`#F1F5F9`). Alternating zebra backgrounds are avoided; row hover is highlighted with subtle `#F8FAFC`.
- All financial, unit volume, and stock counts must align to the right and use `JetBrains Mono`. Product names and ingredient categories align left.

### Form Inputs & Selects
- 38px standard height, white background, 1px border (`#CBD5E1`), 8px rounded corners.
- Suffix adornments for input units (`원`, `g`, `ml`, `ea`) fixed inside right padding in `#94A3B8`.
- Focus state activates an espresso border (`#8B5A2B`) and a warm amber glow ring.

### File Dropzone (Excel / POS Sync)
- Dashed border (2px dashed `#CBD5E1`) over `#F8FAFC`.
- Drag-hover transition turns the border to primary amber (`#D97706`) and the background to `#FFFBEB`.
- Supported file badges and sample file download link anchored directly below the icon indicator.

### Alert Banners
- Top-anchored or in-card notifications with an icon on the left, message text in the center, and dismiss/action controls on the right.
- Urgent (stock-out) uses light red (`#FEF2F2`) with red border (`#F87171`).
- Informative sync warnings use warm amber (`#FFFBEB`) with amber border (`#FCD34D`).