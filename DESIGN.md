# DESIGN.md: Tnalp UI system

Single source of truth for visual decisions. Implementation lives in `frontend/src/index.css` (the "store polish" blocks at the bottom). When CSS and this doc disagree, fix both.

## Principles

- Green brand on near-white ground; cards do the separating, not lines.
- One accent per card: price **or** CTA, never both shouting.
- Whitespace over dividers: one `hr.soft-divider` per section max.
- Every interactive element: visible hover, active and `:focus-visible` states.

## Tokens

### Color

| Token | Value | Use |
| --- | --- | --- |
| `brand` | `#1B4D3E` | navbar, links, breadcrumb, focus ring |
| `brand-btn` | `#427147` | `.btn-primary` override |
| `accent-star` | `#e2a400` | rating stars only |
| `bg` | `#F8FAF8` | page background |
| `surface` | `#ffffff` | cards, footer |
| `text` | `#1f2937` | headings, product names |
| `text-body` | `#374151` | descriptions, body |
| `text-muted` | `#6b7280` | subtitles, metadata, review counts |
| `border` | `#e5e7eb` | card borders, dividers |
| `border-strong` | `#d1d5db` | inputs, steppers |
| `error` | `#b91c1c` on `#fef2f2`, border `#fecaca` | form error box |
| `warn` | `#b45309` | low-stock note |
| `danger` | `#dc3545` | cart badge, trash hover |

### Typography

| Role | Size / weight | Class |
| --- | --- | --- |
| Page title | 2rem / 700 | `.page-title`, `.product-title-lg` |
| Auth title | 1.75rem / 700 | `.auth-title` |
| Price (detail) | 1.65rem / 700 | `.product-price-lg` |
| Price (card) | 1.125rem / 700 | `.product-price` |
| Product title | 1rem / 600, 2-line clamp | `.product-title` |
| Body / description | 0.95rem | `.product-desc`, `.legal-text` |
| Metadata | 0.9rem | `.product-category`, `.product-availability` |
| Small / reviews | 0.85rem | `.rating-text`, `.review-date` |

Prices: `฿` + number, bold, **no** "Price:" label.

### Radius

Cards 12px · inputs/stepper 8px · images 8–12px · search pill 21px · hint boxes 10px

### Spacing

Containers 1140px (`.product-page`, `.cart-page`); auth card 440px centered.
Card padding 1–1.25rem; detail panel 28×32px; section gap 56px (`.reviews-section`); page top pad 56px (auth).

## Components

| Component | Class | Notes |
| --- | --- | --- |
| Product card | `.product-card` | white, border, hover lift −2px + shadow; image `aspect-ratio: 1/1` + `object-fit: cover`; CTA pinned bottom via `mt-auto` |
| CTA button | `.btn-cta` | full width, 48px, primary green or `outline-light` (green outline) as secondary |
| Card button | `.btn-product` | full width, 42px |
| Quantity stepper | `.qty-stepper` | `−  n  +`, 44px hit areas, clamp 1..stock, disabled at bounds |
| Search | `.search-form` | pill, 42px, grows to 480px max in navbar |
| Auth card | `.auth-card` | 440px, 32px padding, subtle shadow; title + subtitle + error slot |
| Order summary | `.order-summary` | sticky `top: 90px` ≥ lg; label/value rows, divider, bold total |
| Review item | `.review-item` | author + stars left, date right (`13 Oct 2026` via `en-GB`), comment below |
| Rating line | `.rating` | stars + `4.5 · 8 reviews` in muted; product page: stars + `4.5 (8 reviews)` scroll link |
| Navbar | `.navbar` | min-height 64px, brand `Tnalp`, pill search, cart icon + count badge; active page underlined (`.active-signin`) |
| Footer | `.site-footer` | white, border-top, 28px vertical padding, brand + nav links + copyright |

## Patterns

- **Stock states**: `In stock · N available` badge; `Low stock: only N left` (amber, ≤5); `Out of stock` disables CTA.
- **Breadcrumb**: `Products / {category} / {name}`; category links to `/search?category=`.
- **Forms**: label always visible; placeholder is an example, never the label; inline error box with text + colour (`role=alert`); submit disables + reads `Signing in…` / `Creating account…`; `autocomplete` set (`email`, `current-password`, `new-password`, `name`).
- **Cart math**: unit price (`฿450 each`) and line total (`฿900`) both shown; summary shows Subtotal, Shipping "At checkout", Total.
- **Demo honesty**: payment is manual slip review; Terms/Privacy pages state the demo scope plainly.

## Accessibility

- `:focus-visible` outline 2px `#1B4D3E`, offset 2px: buttons, inputs, links.
- Icon-only buttons carry `aria-label` (`Increase quantity`, `Remove item`, `Show password`).
- Targets ≥ 40px (steppers, remove, nav links).
- Errors are text + colour, never colour alone.

## Grid / breakpoints

Bootstrap grid, `Row`/`Col`: product grid 1 / 2 (sm) / 3 (md) / 4 (lg) columns; product detail and cart split ~58/42 at `lg`; below `lg` everything stacks; auth card drops border and shadow under 576px.
