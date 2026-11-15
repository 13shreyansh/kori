---
name: Kori
description: The money tab inside S-mobiili; one bank look, a different home for every life.
colors:
  spruce: "#0e3b2a"
  mint: "#bfe8cc"
  action-green: "#007a3d"
  action-green-deep: "#00652f"
  mark-green: "#00a651"
  green-tint: "#e6f4ea"
  green-tint-2: "#cde9d5"
  ground: "#f3f6f2"
  surface: "#ffffff"
  surface-sunk: "#edf2ec"
  line: "#dde5de"
  line-soft: "#e8eee9"
  ink: "#10241b"
  ink-2: "#4a5d53"
  ink-3: "#5f7067"
  warn-tint: "#fff1d0"
  warn-600: "#b86e00"
  warn-text: "#6b4200"
  bell-amber: "#ffb547"
  neg-600: "#b3261e"
  basket-fixed: "#0e3b2a"
  basket-surprise: "#f0a63a"
  basket-slips: "#36b26b"
  stage: "#e4eae3"
  bezel: "#141a17"
  lp-spruce: "#0c3a2b"
  lp-spruce-2: "#0f4533"
  lp-chalk: "#f4f7f2"
  lp-chalk-2: "#c5d6cb"
  lp-chalk-3: "#9cb5a6"
  lp-paper: "#f3f6f1"
  lp-ink: "#0f241a"
  lp-ink-2: "#44594d"
  lp-line: "#d6e0d8"
  dot-statement: "#6f8f7f"
  style-steady: "#8fd3a8"
  style-saver: "#e4ef9a"
  style-tightrope: "#f4b04a"
  style-pass-through: "#ff8f70"
typography:
  lp-display:
    fontFamily: "Schibsted Kori, Figtree Variable, system-ui, sans-serif"
    fontSize: "clamp(40px, 5.2vw, 82px)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  lp-headline:
    fontFamily: "Schibsted Kori, Figtree Variable, system-ui, sans-serif"
    fontSize: "clamp(32px, 3.6vw, 56px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  lp-numeral:
    fontFamily: "Schibsted Kori, Figtree Variable, system-ui, sans-serif"
    fontSize: "clamp(40px, 4vw, 64px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  lp-statement:
    fontFamily: "Schibsted Kori, Figtree Variable, system-ui, sans-serif"
    fontSize: "clamp(22px, 2.2vw, 34px)"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  lp-lede:
    fontFamily: "Schibsted Kori, Figtree Variable, system-ui, sans-serif"
    fontSize: "clamp(18px, 1.45vw, 22px)"
    fontWeight: 400
    lineHeight: 1.5
  lp-body:
    fontFamily: "Schibsted Kori, Figtree Variable, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  lp-label:
    fontFamily: "Schibsted Kori, Figtree Variable, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.5
  app-balance:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "calc(38px * var(--text-scale))"
    fontWeight: 750
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  app-guess:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "calc(44px * var(--text-scale))"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  app-title:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "calc(22px * var(--text-scale))"
    fontWeight: 700
    lineHeight: "calc(28px * var(--text-scale))"
    letterSpacing: "-0.01em"
  app-module-title:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "calc(19px * var(--text-scale))"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  app-body:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "calc(16px * var(--text-scale))"
    fontWeight: 400
    lineHeight: "calc(24px * var(--text-scale))"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  app-small:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "calc(14px * var(--text-scale))"
    fontWeight: 400
    lineHeight: "calc(20px * var(--text-scale))"
  app-micro:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "calc(12px * var(--text-scale))"
    fontWeight: 500
    lineHeight: "calc(16px * var(--text-scale))"
rounded:
  proof: "4px"
  cell: "8px"
  input: "12px"
  safe-band: "16px"
  module: "20px"
  sheet: "24px"
  band: "28px"
  screen: "44px"
  device: "56px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  lp-gutter: "clamp(16px, 4vw, 56px)"
  lp-section: "112px"
components:
  button-primary:
    backgroundColor: "{colors.action-green}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.action-green-deep}"
    textColor: "{colors.surface}"
  button-primary-disabled:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink-3}"
  button-quiet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
    height: "48px"
  button-quiet-hover:
    backgroundColor: "{colors.surface-sunk}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "7px 12px"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.green-tint}"
    textColor: "{colors.action-green}"
  brand-band:
    backgroundColor: "{colors.spruce}"
    textColor: "{colors.surface}"
    rounded: "{rounded.band}"
    padding: "2px 20px 16px"
  module:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.module}"
    padding: "16px"
  module-game:
    backgroundColor: "{colors.green-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.module}"
    padding: "20px"
  ask-field:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.pill}"
    height: "48px"
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    height: "62px"
  tab-active-pill:
    backgroundColor: "{colors.green-tint}"
    textColor: "{colors.action-green}"
    rounded: "{rounded.pill}"
    width: "56px"
    height: "32px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
  lp-bar-cta:
    backgroundColor: "{colors.lp-chalk}"
    textColor: "{colors.lp-spruce}"
    rounded: "{rounded.pill}"
    padding: "9px 18px"
  lp-switch-on:
    backgroundColor: "{colors.lp-chalk}"
    textColor: "{colors.lp-spruce}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
  lp-field:
    backgroundColor: "{colors.lp-spruce-2}"
    textColor: "{colors.lp-chalk}"
    rounded: "{rounded.band}"
    padding: "24px 24px 20px"
---

# Design System: Kori

## Overview

**Creative North Star: "Spruce Ledger"**

Kori is Nordic data journalism wearing a bank's calm. One deep spruce green owns the top of every surface: the full-bleed first viewport of the landing and the brand band at the top of every phone screen. Under the spruce sits a pale green-grey daylight ground with white, near-flat cards. Type is a large, tight grotesk for statements and figures, and a round, plain sans for the app's working text. The only ornament is data itself: dots, bars, a calendar grid, a dotted proof underline.

The landing (route `/`) argues like a newspaper data feature: a 72-82px sentence-case headline in chalk on spruce, a 393-dot field that re-sorts from one grey "statement" block into four money-style rows, then live phones and plain rule lists separated by 2px ink rules. The app (S-mobiili shell, Figtree) is an Operate surface: one spruce band carrying greeting, balance and safe-to-spend, then modules on the ground, an Ask Kori field and a five-tab bar. The shell is pixel-identical for every customer; only modules, order, tone, text size and density change.

Density is set per person through `--text-scale` presets (Roomy 1.0625, Regular 1, Compact 0.9375, Large 1.1875) that also move row height (60/56/48/64) and module gap and padding (20/16/12/20). Energy goes only into the interactive moments (a guess you can lose, a future you can drag, a month you can fix) and the landing's single dot re-sort.

**Key Characteristics:**
- Spruce owns the first viewport (landing) and the top band (app); everything below is daylight.
- Chalk-white type on spruce, deep green ink on light; one action green.
- Data marks are the only ornament; no gradients, glass, glow or illustration.
- Large grotesk numerals and sentence-case statements, tabular figures for all money.
- Pill controls, borderless near-flat cards, one surface per tool.
- Every computed number carries a dotted proof underline that opens its receipt.

## Colors

A two-temperature palette: deep spruce for identity and headline moments, pale green-grey daylight for work, with one action green and a small set of data hues that only ever mark data.

### Primary
- **Spruce** (spruce): the app's brand band (status bar, header, balance band) and the fixed-costs basket bar. White text on it reads 12.5:1.
- **Landing Spruce** (lp-spruce) and **Raised Spruce** (lp-spruce-2): the landing's full-bleed hero, problem strip, close and footer; the raised tone is the dot-field panel. Landing Spruce is a near-twin of app Spruce (see drift note in Do's and Don'ts).
- **Action Green** (action-green): primary buttons, links, active tab, selected chip, proof underline on light ground, focus ring, positive incoming amounts with a leading `+`. Hover and pressed go to **Deep Action Green** (action-green-deep).

### Secondary
- **Mint** (mint): secondary text and the proof underline on the spruce band; the avatar ground in the header (spruce initials).
- **Mark Green** (mark-green): non-text marks only: slider fill, progress fill, income marks, the landing's dotted underline on "Every number opens its receipts".
- **Green Tint** (green-tint) and **Pressed Tint** (green-tint-2): Aino's game panel, selected states, the active-tab pill, proof press; text selection.

### Tertiary
- **Warning family**: Warm Paper (warn-tint) for the shortfall banner and flagged calendar day, Amber (warn-600) for its border and icon, Brown (warn-text) for text on it. **Bell Amber** (bell-amber) is the notification dot only on spruce.
- **Basket hues**: fixed bills are Spruce (basket-fixed), surprises Amber (basket-surprise), everyday spending that slips away Leaf (basket-slips). Bars and 12px rounded keys only.
- **Money-style hues** (landing dot field): Steady pale green, Saver chartreuse, Tight months amber, Pay moves on coral. Before sorting every dot is Statement Grey (dot-statement). Saver chartreuse doubles as the landing focus ring and selection colour.
- **Below Zero** (neg-600): below-zero amounts and form errors only.

### Neutral
- **Ground** (ground): app background behind modules. **Paper** (lp-paper): landing light sections.
- **Surface** (surface): modules, sheets, Ask bar, tab bar.
- **Sunk** (surface-sunk): inputs, slider track, Ask field, past calendar days, disabled buttons.
- **Line** (line) and **Soft Line** (line-soft): quiet-button and chip borders; row dividers and bar borders. **Landing Line** (lp-line): rule-list dividers.
- **Ink** (ink), **Ink 2** (ink-2), **Ink 3** (ink-3): primary, secondary and tertiary text in the app; Ink 3 holds 4.5:1 on Ground. Landing uses **Landing Ink** (lp-ink) and **Landing Ink 2** (lp-ink-2) on Paper.
- **Chalk** (lp-chalk), **Chalk 2** (lp-chalk-2), **Chalk 3** (lp-chalk-3): landing text on spruce: headline, lede and nav, captions and axis labels.
- **Stage** (stage) and **Bezel** (bezel): desktop page around the phone, device frame.

### Named Rules
**The Spruce Top Rule.** Spruce owns the top of the surface: the landing's first viewport, the app's status bar, header and balance band. Below that line, surfaces are daylight. Spruce never becomes a card colour mid-page in the app.

**The Green Means Act Rule.** Action Green is for actions, current selection and state. Money leaving is Ink, never red; red is only below zero and errors. No per-customer colours.

**The Data Hue Rule.** Basket and money-style hues mark data (bars, dots, keys) and nothing else: never a button, a heading or a card ground.

**The White Label Rule.** White text sits on Action Green (5.45:1), never on Mark Green (3.19:1).

## Typography

**Display Font (landing):** Schibsted Grotesk, self-hosted as "Schibsted Kori" from `/fonts/schibsted-latin.woff2` (variable 400-900), falling back to Figtree Variable, system-ui.
**Body Font (app):** Figtree Variable (300-900) via `@fontsource-variable/figtree`, `font-display: block`, falling back to system-ui.

**Character:** Schibsted is a newsroom grotesk: tight, heavy and confident at headline size, which is what makes the landing read as a data feature. Figtree is round and plain, close to S Group's own temperament, and carries the whole phone app.

### Hierarchy
- **Landing Display** (lp-display): the hero headline, max 13ch. The close line uses the same voice at clamp(40px, 5vw, 80px), max 16ch.
- **Landing Headline** (lp-headline): section heads, max 18ch.
- **Landing Numeral** (lp-numeral): proof figures in the scale grid, in Landing Spruce, tabular.
- **Landing Statement** (lp-statement): the problem paragraph on spruce, max 32ch. The receipt claim uses a 28-42px bold line with a 3px dotted Mark Green underline.
- **Landing Lede / Body / Label** (lp-lede, lp-body, lp-label): lede max 34em; section ledes 19px; person copy 17px; captions 13.5px in Chalk 3.
- **App Balance** (app-balance): the balance in the spruce band. The single largest number on any app screen except the guess.
- **App Guess** (app-guess): the live number in the guess game only.
- **App Title** (app-title): lead-module sentence, sheet titles, game question.
- **App Module Title** (app-module-title): module headings.
- **App Body / Small / Micro**: rows and body; secondary lines and the account name (14px, 72% white on spruce); tab labels and legal print. Safe-to-spend value is 20px 700.

### Named Rules
**The Sentence Leads Rule.** Inside an app module the largest type is a sentence, except the live guess number. Figures earn display size only in the spruce band (balance) and on the landing (headline numerals, scale grid); there they are the world's native device.

**The Tabular Money Rule.** Every amount and date uses `tabular-nums lining-nums`. The landing turns them off for prose and back on for numerals and the dot field.

**The Sentence Case Rule.** No uppercase tracked labels, no labels above headings. Headings use `text-wrap: balance`.

## Layout

**App.** On viewports 900px and wider the app sits in a 414 x 836 device frame (56 radius, 12 bezel) on Stage; the screen is 390 x 812 (44 radius), scaled down when the viewport is under 884 high. Under 900px the app fills `100dvh` with safe-area padding. Stack from the top: status bar 47, header 56, scrolling content (16 gutter), Ask Kori bar 64 (Kori tab only), tab bar 62. The balance band breaks out of the content padding (`margin: -16px -16px gap`) so spruce runs edge to edge from the status bar down, ending in 28px bottom corners. Modules stack with the preset gap. Spacing steps are 4, 8, 12, 16, 20, 24, 32, 40. Touch targets are at least 44 x 44.

**Landing.** Full-bleed sections with a fluid gutter (lp-gutter). The hero is a two-column grid (copy 1fr, dot field 1.08fr, gap up to 72) at up to 980px tall, collapsing to one column under 1080px. Light sections open with 112px top padding; the close sits 128px below with 112px padding. People, rules and scale use three equal columns, one column under 1080px. Under 640px secondary nav links hide and SVG chart text is enlarged (17-22px) so it survives the scaled viewBox. Live phones are scaled iframes of `/embed` (0.82, 1 at 1400px+, 0.8 on phones).

## Elevation & Depth

Depth comes from tone, not shadow: spruce over daylight, Surface over Ground, Raised Spruce over Landing Spruce. App modules are borderless with a near-invisible whisper (`0 1px 2px rgba(16,36,27,.06)`) that separates white from the pale ground; nested tools and Ask-sheet blocks drop even that. Real shadows belong to objects that physically sit above the screen.

### Shadow Vocabulary
- **Card whisper** (`box-shadow: 0 1px 2px rgba(16,36,27,0.06)`): app modules only.
- **Sheet** (`box-shadow: 0 -8px 32px rgba(16,36,27,0.16)`): receipt, Ask and profile sheets.
- **Thumb** (`box-shadow: 0 1px 3px rgba(16,36,27,0.30)`): slider thumb.
- **Device** (stacked frame shadow in index.css) and **Landing phone** (`0 30px 60px -28px rgba(12,58,43,0.45)`): device frames only.

### Named Rules
**The One Surface Rule.** A tool inside a card or sheet is not a second card: no border, shadow, ground or padding on nested modules.

## Shapes

Everything a finger presses is a full pill (999): buttons, chips, the Ask field, the tab pill, the landing switch and CTAs. Containers are softly rounded: modules 20, sheets 24 on top, the spruce band and the landing dot-field panel 28 (20 on phones). Small data cells and inputs are tighter (8 and 12); the proof press highlight is 4. Basket bars are 14-high pills split by 3px gaps; basket keys are 12px squares with 4px corners. Data marks are circles (3.6r dots, 9r rings with a thin leader line). Landing rule lists and the scale grid use straight 2px Ink top rules and 1px Landing Line dividers instead of boxes.

## Components

### Buttons
- **Shape:** full pill (999), 48 high in the app, 56 on the landing.
- **Primary:** Action Green, white 600 label, 0 24 padding; hover and pressed Deep Action Green in 120ms. Disabled: Sunk ground, Ink 3 label. A ring spinner sits left of the label while loading.
- **Quiet:** Surface ground, 1px Line, Ink label; pressed Sunk.
- **Text button:** Action Green 600, no ground, 44 hit area.
- **Landing nav CTA:** Chalk pill with Landing Spruce label (9 18), hover pure white. The secondary hero link is a Chalk underlined text link (offset 5, 1px).
- **Focus:** 2px solid Action Green, 2px offset in the app; 2px Saver chartreuse, 3px offset on the landing.

### Chips
- **Style:** 36 high pill, 1px Line, 14px 600.
- **State:** selected takes Green Tint ground with Action Green border and text.

### Cards / Containers
- **Corner Style:** 20.
- **Background:** Surface; Aino's game panel is Green Tint with 20 padding, a slider track of 24% spruce and a thumb with a 2px spruce ring.
- **Shadow Strategy:** card whisper only (see Elevation).
- **Border:** none.
- **Internal Padding:** preset pad (20 / 16 / 12).

### Inputs / Fields
- **Ask Kori field:** 48 high Sunk pill, Ink 3 placeholder "Ask Kori about your money", 36 circle send button (white arrow on Action Green, disabled look until text).
- **Slider:** 6 high pill track, Mark Green fill, 28 white thumb with thumb shadow, 44 hit area.

### Navigation
- **Header:** 56 high on Spruce, Kori basket mark and wordmark in white, white bell (Bell Amber dot when something needs attention), 36 Mint avatar with spruce initials. Icon-button hover is 10% white.
- **Tab bar:** five equal tabs on Surface with a Soft Line top border, 24 icon over a 12px label, inactive Ink 2. Active tab: Action Green icon and label, 56 x 32 Green Tint pill behind the icon.
- **Landing bar:** absolute over the hero, Chalk 2 links turning Chalk on hover, Chalk CTA pill.

### Brand band (signature)
The spruce band that opens every Kori home: greeting in Mint (15px), account name at 72% white, the 38px balance, then a ruled safe-to-spend row (1px 14% white top rule, Mint 600 label left, 20px 700 value right, 70% white note under it) and further account rows on the same rule. Proof underlines on the band switch to Mint.

### Proof line (signature)
Any computed number is a text-styled button with a 1.5px dotted underline (Action Green on light, Mint on spruce), 4px offset. Pressed: Green Tint (or 12% white on spruce) with 4 radius. It opens the receipt sheet, whose total equals the tapped number.

### Three baskets
A 14-high segmented pill bar in the three basket hues, then rows with a 12px key, label and small note, and a 17px 700 proof amount; a 17px 600 verdict sentence leads.

### Dot field (landing signature)
A Raised Spruce panel (28 radius) with a title, a two-option pill switch ("One app" / "Their money"; on state Chalk with spruce text) and an SVG of 393 dots. Unsorted: one uniform Statement Grey block. Sorted: four money-style rows by age, dots fill with their style hue over 0.8s while moving on `cubic-bezier(0.16,1,0.3,1)` over 1.1s, staggered 9ms; axes fade in after 0.5s, the three demo-customer rings and labels after 1.1s. Labels use a 5px spruce paint-order stroke to stay legible over dots. Reduced motion removes the transition.

## Do's and Don'ts

### Do:
- **Do** start every app home with the spruce band and every landing with a full-bleed spruce first viewport.
- **Do** keep the shell (band, header, Ask bar, tab bar, type, colours, radii, proof line) identical for every customer; vary only modules, order, tone and the `--text-scale` preset.
- **Do** put a dotted proof underline on every computed number and make its receipt total equal it.
- **Do** use data marks (dots, bars, calendar cells, rules) as the only ornament, coloured only from the basket and money-style hues.
- **Do** set money and dates in tabular lining figures.
- **Do** use Action Green (#007a3d family) under any white label.

### Don't:
- **Don't** use gradients, glass, glow or coloured side stripes on cards.
- **Don't** add uppercase tracked labels, eyebrows or kickers above headings.
- **Don't** use red for ordinary spending or give a customer their own colour theme.
- **Don't** use a serif or hairline-editorial type, or any app font other than Figtree.
- **Don't** nest a card inside a card or sheet; the inner tool loses its surface.
- **Don't** use sparkle, wand, robot or brain icons, emoji, or unicode glyphs as icons.
- **Don't** let sheets or overlays escape the device frame on desktop.
