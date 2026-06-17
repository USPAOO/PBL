---
name: 校园二手
description: 让闲置流动起来的校园社区二手交易平台
colors:
  primary: "#0f857b"
  primary-light: "#e3f4f1"
  primary-mid: "#14a393"
  primary-deep: "#0a6b63"
  accent-success: "#389e0d"
  accent-danger: "#e84749"
  accent-warning: "#d89614"
  neutral-bg: "#eef3f2"
  neutral-surface: "#ffffff"
  neutral-muted: "#f0f5f3"
  neutral-border: "#dce8e6"
  ink-primary: "#1a2422"
  ink-secondary: "#586562"
  placeholder-tint: "#6db5a8"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  page: "24px"
  section: "28px"
  gutter: "20px"
  card-padding: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-mid}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-goods:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card-padding}"
  input-search:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
---

# Design System: 校园二手

## 1. Overview

**Creative North Star: "The Campus Bulletin Board"（校园布告栏）**

This system treats the app as a digital campus bulletin board — upgraded for mobile, but still local, approachable, and full of discovery. Like 闲鱼's familiar second-hand rhythm, scoped to one school community. Surfaces are friendly and efficient: rounded cards, clear prices, obvious next actions. Youthful energy lives in hero moments and accent color, not in promo banners or fake urgency.

The system explicitly rejects PRODUCT.md's anti-references: no cheap marketplace promo aesthetics, no unmodified generic Ant Design template as the final identity, no SaaS hero metrics or gradient text gimmicks.

**Key Characteristics:**

- **Campus-local trust** — seller names, order status, and chat are first-class; decoration never hides friction.
- **Friendly & efficient** — Ant Design Vue primitives with consistent 12px card radius, hover lift, and readable Chinese type.
- **Hybrid elevation** — sticky header with light shadow; cards flat at rest, lift on hover.
- **Warm evolution path** — Warm Campus Teal primary with hue-172 tinted neutrals; no generic Ant Design blue.
- **Energy without noise** — hero gradients allowed in one banner per page; nowhere else.

## 2. Colors

A campus marketplace palette centered on **Warm Campus Teal** — hue 172 with teal-tinted neutrals for subconscious cohesion across surfaces.

### Primary

- **Warm Campus Teal** (#0f857b / oklch(50% 0.11 172)): Primary actions, nav brand icon, chat bubbles (sender), hero banner gradient start.
- **Teal Wash** (#e3f4f1): Image placeholders, assistant chat bubbles, light tints behind icons.
- **Teal Mid** (#14a393): Hero gradient end, primary hover.
- **Teal Deep** (#0a6b63): Active/pressed states.

### Secondary

- **Campus Green** (#52c41a): Success states, positive confirmations. Used sparingly; not a second brand color.

### Tertiary

- **Deal Red** (#ff4d4f): Price text, destructive actions, sale urgency — functional only, never as decorative promo red backgrounds.
- **Notice Amber** (#faad14): Warnings and pending states.

### Neutral

- **Page Canvas** (#eef3f2): App background behind content (`--bg-page`), teal-tinted neutral.
- **Surface White** (#ffffff): Cards, header, login card, chat panels.
- **Muted Fill** (#f0f5f3): Image fallbacks, chat input areas, empty thumbnails.
- **Divider Line** (#dce8e6): Order footers, cart separators, list dividers.
- **Ink Primary** (#1a2422): Headings, body text, nav labels.
- **Ink Secondary** (#586562): Seller names, timestamps, footer taglines.
- **Placeholder Tint** (#6db5a8): Icon color on teal-tinted image placeholders.

### Named Rules

**The Warm Campus Teal Rule.** The primary accent is Warm Campus Teal (#0f857b). Do not reintroduce Ant Design blue or unrelated accent hues on product surfaces.

**The One Promo Surface Rule.** Full-width gradient hero banners appear once per page (home search hero, login backdrop wash). No countdown timers, no screaming red sale strips, no stacked promo bands.

## 3. Typography

**Display Font:** System UI stack with PingFang SC / Microsoft YaHei (Chinese-first)
**Body Font:** Same stack — no separate display pairing yet
**Label Font:** Same stack at 12–13px for metadata

**Character:** Clear, mobile-readable, zero decorative serif. Feels like a campus utility app: confident headings, comfortable body, small secondary text for seller and time metadata.

### Hierarchy

- **Display** (600, 28px, 1.3): Login title, home hero headline ("发现校园好物").
- **Headline** (600, 22px, 1.4): Page titles (`.page-title`), section headers.
- **Title** (700, 18px, 1.4): Brand wordmark ("校园二手"), card titles, nav emphasis.
- **Body** (400, 16px, 1.5): Form labels, descriptions, chat messages. Max line length 65–75ch in prose blocks.
- **Label** (400, 12px, 1.4): Seller names, order meta, status tags, footer fine print.

### Named Rules

**The Chinese-First Rule.** All UI copy is Chinese. Line heights stay generous (≥1.4) for mixed CJK/Latin. Never below 16px for primary interactive labels on mobile.

## 4. Elevation

Hybrid model: structural depth for chrome, interactive lift for cards.

The sticky header uses a hairline shadow (`0 1px 4px rgba(0,0,0,0.08)`) to separate navigation from scrolling content. Cards and goods tiles are flat at rest on the page canvas; hover adds lift via `translateY(-4px)` and `--shadow`. Login modal uses a deeper shadow to signal overlay context. No nested card-in-card elevation stacks.

### Shadow Vocabulary

- **Header hairline** (`0 1px 4px rgba(0, 0, 0, 0.08)`): Sticky top nav only.
- **Card hover** (`0 2px 12px rgba(0, 0, 0, 0.08)`): Goods cards, agent recommendation cards on hover (`--shadow`).
- **Modal lift** (`0 8px 32px rgba(0, 0, 0, 0.12)`): Login card, elevated dialogs.

### Named Rules

**The Flat-Until-Touch Rule.** Surfaces do not carry shadow at rest except the header. Depth appears on hover, focus, or modal elevation — never as default card decoration.

## 5. Components

Friendly and efficient — Ant Design Vue as the foundation, campus personality through spacing, copy, and selective color.

### Buttons

- **Shape:** Medium rounding (8px Ant default / `{rounded.md}`)
- **Primary:** `{colors.primary}` fill, white label, 40px height on forms (`size="large"`), full-width on login submit
- **Ghost:** Primary text + primary border, used for "发布" in header — visible but not competing with nav
- **Hover / Focus:** Ant Design default state transitions; no custom bounce or scale effects

### Chips

- **Style:** `a-tag` with `color="default"` for "已售" overlay on goods cards; 4px radius, 12px type
- **State:** Absolute positioned top-right on card; does not replace price or title

### Cards / Containers

- **Corner Style:** 12px (`{rounded.lg}` / `--radius`) for goods and order cards; 16px for hero banner and login card
- **Background:** White surface on gray page canvas
- **Shadow Strategy:** None at rest; `--shadow` on `.goods-card:hover`
- **Border:** Ant Design card default hairline; order footers use `#f0f0f0` top border
- **Internal Padding:** 16–24px; page container `max-width: 1200px`, padding 24px

### Inputs / Fields

- **Style:** Ant Design `a-input` / `a-input-search`, large size on hero search and login
- **Focus:** Ant Design primary ring — do not suppress focus visibility
- **Error / Disabled:** Ant Design defaults; pair with `message.warning` / `message.error` toasts

### Navigation

- **Style:** Horizontal `a-menu` in white sticky header, 64px height, brand left / nav center / actions right
- **Typography:** 18px bold brand, standard menu item weight for tabs (首页, 购物车, 我的订单, 购物助手, 消息)
- **Active:** Ant Design selected key underline; cart shows `a-badge` count
- **Mobile:** Responsive grid on goods (`xs=12`); nav collapses per Ant breakpoints — improve in future `adapt` pass

### Goods Card (signature)

- **Cover:** 1:1 image or blue gradient placeholder with picture icon
- **Meta:** Title (content), price in Deal Red (`.price-text`), seller in secondary ink
- **Interaction:** Whole card clickable; hover lift; "已售" tag when `status === 2`

### Hero Banner (signature)

- **Shape:** 16px radius, full content width inside page container
- **Fill:** `linear-gradient(135deg, var(--primary), var(--primary-mid))` — the one allowed bold gradient band per home page
- **Content:** White display heading + search input with prefix icon

## 6. Do's and Don'ts

Concrete guardrails derived from PRODUCT.md and the extracted codebase.

### Do:

- **Do** use `--bg-page` (#f0f2f5) behind white content surfaces for clear tonal layering.
- **Do** show seller username and price on every goods card — trust through clarity.
- **Do** keep primary flows (browse → detail → cart → checkout) reachable within the top nav and obvious CTAs.
- **Do** use hover lift on interactive cards only (`transform 0.2s`, `--shadow`).
- **Do** maintain WCAG 2.1 AA contrast; bump `--text-secondary` if it falls below 4.5:1 on tinted backgrounds.
- **Do** honor `prefers-reduced-motion` when adding animations — crossfade or instant state change.

### Don't:

- **Don't** use **廉价电商风**: full-screen promotions, screaming red/yellow sale banners, countdown timers, fake urgency, cluttered category grids.
- **Don't** ship **Generic Ant Design defaults** as the final identity — unmodified blue on gray with zero campus character is a starting point only.
- **Don't** use **SaaS marketing clichés**: hero metrics, gradient text (`background-clip: text`), glass cards, numbered section eyebrows (01 · 02 · 03).
- **Don't** add side-stripe borders (`border-left` > 1px colored accent) on cards or alerts.
- **Don't** nest cards inside cards — one surface level per content block.
- **Don't** use Deal Red (#ff4d4f) as large background fills — prices and destructive actions only.
- **Don't** add gradient hero bands to every page — one promo surface per view maximum.
