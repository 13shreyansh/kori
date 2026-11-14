# Kori: exact screen spec (Fable for Claude, Sat 14 Nov 22:45; reviewed by Claude)

For Codex. Build exactly this. Read `/mnt/project-files/Junction/plan/DESIGN-FLOOR.md` as the floor under it. Where this file and your habit disagree, this file wins. Where a value is missing, ask, do not invent.

Mode: Operate (a task surface inside a bank app). Colour strategy: Restrained, with one Committed surface (the login screen).

---

## 0. The product in one line

Kori is the money tab inside S-mobiili. It is one app with one look, and it arranges a fixed set of building blocks differently for each customer, based on age band and on how their money moves.

"Today" in the app is the real current date (no frozen clock; Shreyansh's rule). The dates and numbers in section 4 are written as of Saturday 14 November 2026: the data generator anchors every transaction relative to today, so on any day the same relative story holds (e.g. "11 days to payday" stays true by moving payday with today). The video is recorded on Sun 15 Nov, so check the numbers on that date.

---

## 1. Direction contract

**Thesis.** A bank app earns trust by being calm and exact. Kori keeps the bank's calm and spends all its energy in three places: a guess you can lose, a future you can drag, and a month you can fix. Everything else is quiet.

**The world.** S-mobiili on a phone in daylight: a shop queue, a tram, a kitchen table. White surfaces on a faintly green-grey ground, deep spruce text, one action green. Pill buttons, flat bordered cards, no shadows inside the app. It should read as a shipped Nordic bank app from the first frame.

**Signature element: the proof line.** Every number that Kori computed carries a fine dotted green underline. Tapping it opens the receipt sheet, which lists the payments behind the number and ends in a total equal to the number tapped. This is the same on every screen for every customer, and it is what makes the playful parts trustworthy.

**The spine made visible.** The three homes have three different shapes: Aino's is a tall green panel with a slider (a game), Mikko's is a vertical rail with markers (a timeline), Laura's is a grid (a calendar). The header, the account line, the Ask Kori bar, the tab bar, the type, the colours, the radii and the proof line are identical in all three.

**Risk taken.** Three structurally different homes can read as three apps. The shell constants above are the counterweight, so they must be pixel-identical across customers. The second risk is that a restrained bank look reads as plain on video, so the three wow interactions get all the motion budget and nothing else moves.

---

## 2. Tokens

### 2.1 Font

**Figtree** (variable, weights 400 to 700), self-hosted through `@fontsource-variable/figtree`. One family for everything. Reason: round, friendly and plain, close in temperament to S Group's own type, and not on the banned list. Never fall back visibly: `font-family: "Figtree Variable", system-ui, sans-serif` with `font-display: block` on first load of the login screen.

All money and dates: `font-variant-numeric: tabular-nums lining-nums`. Check in the browser that digits do not shift width while a number counts. If Figtree's tabular figures fail that check, render animated numbers with the `RollingNumber` component (each digit in an inline-block slot `0.62em` wide, centred).

### 2.2 Type scale (fixed rem, 1rem = 16px)

| Token | Size / line | Weight | Used for |
|---|---|---|---|
| `t-display` | 34 / 38 | 700 | the live number in the guess game only |
| `t-title` | 22 / 28 | 700 | the lead module's sentence, sheet titles |
| `t-head` | 18 / 24 | 600 | module headings |
| `t-body` | 16 / 24 | 400 | body, rows |
| `t-body-strong` | 16 / 24 | 600 | amounts in rows, button labels |
| `t-small` | 14 / 20 | 400 | secondary lines |
| `t-micro` | 12 / 16 | 500 | tab labels, calendar weekday letters, legal print |

Letter-spacing: `-0.01em` on `t-display` and `t-title`, `0` elsewhere. No uppercase labels anywhere. Headings use `text-wrap: balance`.

**Text size presets** (a multiplier on the whole scale through `--text-scale` on the app root):

| Preset | `--text-scale` | Row height | Module gap | Who |
|---|---|---|---|---|
| Roomy | 1.0625 | 60 | 20 | Aino |
| Regular | 1 | 56 | 16 | Mikko |
| Compact | 0.9375 | 48 | 12 | Laura |
| Large | 1.1875 | 64 | 20 | age 65+ (rule exists, no demo customer) |

### 2.3 Colour (every colour, with its job)

| Token | Hex | Job |
|---|---|---|
| `ground` | `#F3F6F2` | app background behind modules |
| `surface` | `#FFFFFF` | modules, header, tab bar, sheets |
| `surface-sunk` | `#EDF2EC` | input fields, slider track, calendar past days |
| `line` | `#DDE5DE` | 1px module borders, input borders |
| `line-soft` | `#E8EEE9` | dividers between rows |
| `ink` | `#10241B` | primary text, icons |
| `ink-2` | `#4A5D53` | secondary text |
| `ink-3` | `#5F7067` | tertiary text, placeholders (4.5:1 on `ground`) |
| `green-600` | `#007A3D` | primary buttons, links, active tab, proof-line underline, focus ring |
| `green-700` | `#00652F` | pressed and hover state of `green-600` |
| `green-500` | `#00A651` | non-text marks only: slider fill, funded rail, income marks, progress fill |
| `green-tint` | `#E6F4EA` | Aino's game panel, selected states, icon backplates |
| `green-tint-2` | `#CDE9D5` | pressed state of `green-tint`, text selection |
| `spruce` | `#0E3B2A` | login screen ground, device status text is not affected |
| `spruce-text-2` | `#B7CDBF` | secondary text on `spruce` |
| `warn-tint` | `#FFF1D0` | shortfall banner ground, the flagged calendar day |
| `warn-600` | `#B86E00` | warning icon, flagged-day border, gap band in the guess game |
| `warn-text` | `#6B4200` | text on `warn-tint` |
| `neg-600` | `#B3261E` | below-zero amounts, the below-zero part of the balance line, form errors |
| `neg-tint` | `#FCE9E7` | form error ground |
| `stage` | `#E4EAE3` | desktop page around the phone |
| `bezel` | `#141A17` | device frame |

Rules: green is for actions, current selection and state only. Money leaving is `ink`, never red. Red is only for below zero and errors. Positive incoming amounts are `green-600` with a leading `+`. No gradients anywhere. No per-customer colours.

Browser surfaces: `::selection { background:#CDE9D5; color:#10241B }`, `caret-color:#007A3D`, focus ring `2px solid #007A3D` with `2px` offset on every focusable element (`:focus-visible`), underline offset `4px`. Inside the device frame hide scrollbars (`scrollbar-width:none`). On a real phone leave the native ones.

### 2.4 Spacing, radii, elevation

- Spacing steps: 4, 8, 12, 16, 20, 24, 32, 40. Screen gutter 16. Module inner padding 16 (Compact: 12; Roomy: 20).
- Radii: 8 (chips, calendar cells), 12 (inputs), 16 (modules), 24 (sheet top corners), 999 (buttons, pills, avatars).
- Elevation: modules are flat, `1px solid line`, no shadow. Only three things cast a shadow: sheets (`0 -8px 32px rgba(16,36,27,.16)`), the slider thumb (`0 1px 3px rgba(16,36,27,.30)`), and the device frame (`0 30px 60px -20px rgba(16,36,27,.35), 0 8px 20px rgba(16,36,27,.12)`).
- Touch targets at least 44 x 44.

### 2.5 Controls (one vocabulary, used everywhere)

- **Primary button:** height 48, radius 999, `green-600` ground, white `t-body-strong`, padding 0 24. Hover and pressed `green-700`. Disabled: `surface-sunk` ground, `ink-3` text. Loading: label stays, a 16px ring spinner sits left of it, button not clickable.
- **Quiet button:** same shape, `surface` ground, `1px line`, `ink` text. Pressed `surface-sunk`.
- **Text button:** `green-600` `t-body-strong`, no ground, 44 high hit area.
- **Chip (toggle):** height 36, radius 999, `1px line`, `t-small` 600. Selected: `green-tint` ground, `green-600` border and text, a 16px check icon on the left.
- **Slider:** track 6 high, radius 999, `surface-sunk`; fill `green-500`; thumb 28 circle, white, `1px line`, thumb shadow; hit area 44. Keyboard: arrows move one step, Shift+arrow ten steps. Stepped sliders show tick dots 4px on the track.
- **Proof line** (`<ProofNumber>`): the number is a `<button>` styled as text, `text-decoration: underline dotted #007A3D 1.5px`, offset 4px, same colour and weight as the surrounding text. Pressed: `green-tint` ground with radius 4. `aria-label="€87, show the payments behind this"`.
- **Payment row:** height per density preset. Left: 36 circle, `surface-sunk`, merchant initial in `ink-2` 600 (no logos). Middle: merchant `t-body`, under it date and category `t-small ink-2`. Right: amount `t-body-strong`, tabular. Divider `line-soft` inset 52 from the left.

### 2.6 Icons

Lucide, stroke 1.75, size 24 (20 inside rows and chips), colour `ink` unless stated. Used icons: `shopping-basket`, `landmark`, `receipt`, `percent`, `home`, `coffee`, `bike`, `plane`, `car`, `house`, `zap`, `calendar`, `triangle-alert`, `check`, `chevron-right`, `chevron-down`, `x`, `arrow-up`, `log-out`, `info`, `type`, `globe`, `life-buoy`, `undo-2`, `bell`. Do not use `sparkles`, `wand`, `bot`, `brain`, `trophy`, `flame`, `star`. No emoji and no unicode glyphs as icons.

**Kori mark:** authored SVG, 28 x 28: a basket seen from the side, drawn as a `green-600` rounded trapezoid outline (stroke 2.25) with one arc handle above it. Next to it the word "Kori" in Figtree 700, 20px, `ink`. No S-Bank logo or wordmark anywhere.

### 2.7 Motion

| Token | Value | Used for |
|---|---|---|
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | everything |
| `d-press` | 120ms | pressed states |
| `d-state` | 200ms | chips, rows, banners swapping |
| `d-sheet` | 320ms | sheets rising, list unfolding |
| `d-land` | 900ms | the guess game landing only |
| `d-glide` | 700ms | a chip moving Mikko's slider, Laura's balance line redraw |

No page-load choreography. No entrance animation on modules. Direct manipulation (dragging a slider) has no easing: positions follow the pointer in the same frame. With `prefers-reduced-motion: reduce`, every animation becomes an instant state change, and numbers swap without counting.

---

## 3. Shared shell (identical for every customer)

### 3.1 How it appears on desktop and on a phone

- **Viewport 900px wide or more (the video, 1440 x 900):** the page is `stage` colour, nothing else on it. Centred both ways: a device frame 414 x 836, radius 56, colour `bezel`, 12px bezel, device shadow. The screen inside is exactly **390 x 812**, radius 44, `overflow:hidden`. If the viewport is under 884 high, scale the frame with `transform: scale(min(1, (100vh - 48px) / 836))`. A 110 x 30 black pill sits centred 11px from the top of the screen. The status bar is 47 high: real clock at left (`H.mm`, 15px 600, x=28), and at right three authored SVG glyphs (signal, wifi, battery) in the status colour. Status colour is `ink` on light screens and white on the login screen. A home-indicator bar 134 x 5, radius 999, `ink` at 30% opacity, sits 8px from the bottom. All sheets and overlays are positioned inside the screen element, never the browser window.
- **Viewport under 900px wide (a real phone):** no frame, no fake status bar, no pill. The app fills `100dvh`, with `env(safe-area-inset-*)` padding on header and tab bar.
- **`/three` route (video hook and close):** three device frames side by side on `stage`, gap 60, centred (total 1362 wide at 1440). Each frame holds a live, fully interactive instance of the app, signed in as aino, mikko and laura from left to right (`/embed?customer=…`, which skips login; this parameter works only inside `/three`). No captions, no labels.

### 3.2 Screen layout (inside 390 x 812)

From the top: status bar 47, header 56, scrolling content, Ask Kori bar 64 (Kori tab only), tab bar 62, home-indicator zone 21. That leaves **562px** of content on the Kori tab.

### 3.3 Header (56 high, `surface`, 1px `line-soft` bottom border)

- Left at x=16: the Kori mark and the word "Kori".
- Right at x=16 from the edge: a 36 circle avatar button, `green-tint` ground, initials in `green-600` 14px 700 (AK, ML, LN). It opens the profile sheet. `aria-label="Profile and settings"`.
- Left of the avatar, 8px gap: a 44 x 44 `bell` icon button. It opens a plain "Notifications" sheet listing computed items (for Laura: "On Thu 26 Nov you'll be €140 short"; empty state for others: "Nothing needs you right now. Kori will tell you here when a bill or a balance does."). A 8px `warn-600` dot on the bell only when the list is not empty.
- On pushed screens (Why this home, Bank details) the left side becomes a 44 x 44 `chevron-left` back button and the screen title in `t-head`, centred.

### 3.4 Bottom tab bar (62 high, `surface`, 1px `line-soft` top border)

Five tabs, equal width, icon 24 above a `t-micro` label. Inactive: `ink-2`. Active: `green-600` icon and label, and the icon gets a 56 x 32 `green-tint` pill behind it. This mirrors S-mobiili, with Kori taking the centre slot.

| Order | Label | Icon | What it shows |
|---|---|---|---|
| 1 | Home | `home` | Greeting, the account line, the latest 5 payments, the Bonus row. All reused components. |
| 2 | Purchases | `receipt` | This month's payments at S Group shops, grouped by shop, each group a proof-line total. |
| 3 | **Kori** | `shopping-basket` | The personalised home. **The app opens here after login.** |
| 4 | Bank | `landmark` | Accounts list, then all payments, newest first, with a search field. |
| 5 | Benefits | `percent` | The Bonus progress block at full size. |

Build order: Kori first and completely. Then Bank, then the other three. **A tab that is not built is removed from the bar. Never ship a tab that leads to a placeholder.**

### 3.5 Ask Kori bar (64 high, `surface`, 1px `line-soft` top border, Kori tab only)

A single field, 48 high, radius 999, `surface-sunk`, 16 gutters. Placeholder `ink-3`: **"Ask Kori about your money"**. On the right inside the field a 36 circle send button (`arrow-up` icon, white on `green-600`), disabled look until there is text. No icon on the left. No sparkle.

**On focus:** the Ask sheet rises to 88% of the screen height. Its top holds the same field (focused). Under it, three suggestion rows for this customer (plain rows with a `chevron-right`, no bubbles):

| Customer | Suggestions |
|---|---|
| Aino | "How much did I spend on Wolt in October?" · "Can I afford a €79 festival ticket before payday?" · "What do my subscriptions cost in a year?" |
| Mikko | "What do my Saturday nights out cost?" · "What if I save €900 a month?" · "When could I buy the car?" |
| Laura | "What goes out before payday?" · "What has hockey cost us this year?" · "What did we spend on groceries in October?" |

**On submit:** the sheet content becomes an answer page, not a conversation.
1. The question as `t-title` at the top, with an `x` close button.
2. Loading: three skeleton lines (`surface-sunk`, radius 4, a slow opacity pulse 1.2s), for as long as the call takes.
3. The answer: one sentence in `t-body` with a proof-line number in it, then **one building block from the library** rendered with the parameters the question asked for (a receipt list, the payday runway with the ticket subtracted, the plan timeline set to €900, the coming-up list).
4. Under the block: quiet button **"Add to my Kori"**. It pins that block as the second module on the customer's home (kept in session). After pinning it reads "On your Kori" with a check and is disabled.

How it works underneath: the language model receives the question and returns only `{ block, params }` from a fixed list. Code computes every number from the transactions. The model writes no numbers and no prose. If the call fails or times out after 6s, fall back to a local keyword router with the same output shape.

States: nothing matched → "Kori can't answer that from your payments yet. It can count, compare and plan with what is in your accounts." followed by the three suggestions. Network error with no fallback match → "Kori couldn't be reached. Your accounts are fine. Try again." with a "Try again" text button.

### 3.6 Receipt sheet (the proof behind every number)

Opens from any proof line. Bottom sheet inside the screen, `surface`, top radius 24, max height 86%, scrim `rgba(16,36,27,.40)`. Rises in `d-sheet`. Close by the `x`, by tapping the scrim, by Escape, or by dragging down. Focus is trapped while open and returns to the number that opened it.

Top to bottom:
1. Grabber: 36 x 4, radius 999, `line`, 8px from the top.
2. Title `t-title`: what the number is, in words. Example: "Cafés in October".
3. One line `t-small ink-2`: the rule. Example: "16 card payments, 1 to 31 October, places Kori labelled as cafés."
4. For derived numbers only, a "How this is counted" list before the payments: each step is a row with a label left and an amount right. Example for Aino's "€17 a day": "In your account today €212.35" / "Phone bill, 20 Nov −€14.90" / "Spotify, 18 Nov −€6.49" / "Free until payday €190.96" / "Days until 25 Nov 11" / "Per day €17.36".
5. Payment rows, newest first, scrolling.
6. A dashed rule (`1px dashed line`), then a total row pinned to the sheet bottom: "Total" left, the sum right in `t-head` 700. **The total must equal the tapped number before rounding**, and when the tapped number was rounded the line under it says so: "Shown on your Kori as €87".
7. Text button under the total: "Wrong label? Fix it". It turns each row's category into a tappable chip, changing one recomputes every number in the app.

Empty state (a number that is zero): "No payments match this yet."

### 3.7 Login screen (the one Committed surface)

Full screen, `spruce` ground, white status bar text. No tab bar, no header.

- At y=120, centred: the Kori mark at 44px in white, with "Kori" in white 28px 700 beside it.
- At y=196, centred, `t-body`, `spruce-text-2`: "Your money, arranged for your life."
- At y=280, a white panel, 16 gutters, radius 16, padding 20:
  - Label "User ID" (`t-small` 600, `ink`), field 52 high, radius 12, `1px line`, `autocapitalize="none"`, the last used ID is prefilled.
  - 16 gap. Label "PIN", then four cells 52 x 56, radius 12, `1px line`, gap 12, left aligned. A typed digit shows as a 12px `ink` dot. The active cell has a `green-600` 2px border. It is one hidden `input` with `inputmode="numeric"`, `maxlength=4`, `autocomplete="off"`.
  - 24 gap. Primary button, full width: "Log in". Enter submits. Typing the fourth digit does not submit by itself.
  - 12 gap. Centred text button: "Forgot your PIN?" It opens a small sheet: "In S-mobiili you would reset your PIN with your bank codes. In this test environment the PIN is 1234."
- At the bottom, 28px above the home indicator, centred, `t-micro`, `spruce-text-2`, two lines: "Test environment" / "Demo customers: aino, mikko, laura · PIN 1234".

States:
- Unknown user: field border `neg-600`, under it on `neg-tint` with radius 8 and padding 8 12: "We don't know that user ID. The demo customers are aino, mikko and laura."
- Wrong PIN: cells shake 6px three times in 240ms and clear, message: "That PIN doesn't match. Try again."
- Loading: button shows the spinner for a minimum of 500ms, then the screen cross-fades (200ms) to the Kori tab, where that customer's home first shows as a skeleton in its own shape (panel, rail or grid) for 300ms.

### 3.8 Profile sheet and Log out

Opens from the avatar. Bottom sheet, 70% height.

1. Row at the top: 56 avatar, name in `t-head` ("Aino Korhonen"), under it `t-small ink-2` "Customer ID aino · S-Bank customer since 2023" (Mikko 2019, Laura 2008).
2. A list of rows (56 high, icon left, label, `chevron-right`):
   - `info` **Why this home?** → pushes the screen in section 7.
   - `type` **Text size** → inline segmented control: Compact, Regular, Roomy, Large. The app updates at once.
   - `globe` **Language** → value "English" in `ink-2`, opens a sheet with "English" selected and "Suomi" and "Svenska" marked "Coming to this test build" and disabled.
   - `life-buoy` **Help and contact** → a sheet with S-Bank customer service copy: "Chat and phone service are in S-mobiili under Help. This test build has no live service."
3. 16 gap, then a full-width quiet button with a `log-out` icon: **"Log out"**. One tap, no confirmation dialog. The screen cross-fades (200ms) to the login screen with the user ID field emptied and focused. Session state for that customer (guesses made, pinned blocks, the transfer) is kept in `sessionStorage` per customer, so logging back in restores it. No reset button in the product. For re-recording takes, an unlinked `/reset?customer=aino|mikko|laura|all` route clears that customer's session state and redirects to login.

---

## 4. Demo data (every number on screen is computed from this)

Write the transactions so that the code, with no special cases, produces the numbers below. The copy in section 5 is template output. If a computed value differs from this spec, fix the data, never hard-code the copy.

Money format: euro sign first, dot decimals (`€87.40`), whole euros in sentences (`€87`), cents in rows and totals. Dates: `8 May`, `Thu 26 Nov`, `November 2029`.

### Aino Korhonen, 21 (user ID `aino`)
- Current account "Käyttötili" `FI·· 4471`: **€212.35**. Savings pot "Interrail", target €900: **€60.00**.
- Income: wages from "Kahvila Sävy Oy" on the 25th (about €620, varies), study grant from Kela on the 4th (€279.38).
- **Cafés in October: 16 payments, €87.40.** Espresso House 5.60, 5.60, 6.90, 5.60, 4.90, 6.90 · Robert's Coffee 4.80, 4.80, 5.20, 4.80 · Fazer Café 7.40, 6.20 · Café Regatta 5.50 · Paulig Kulma 4.50, 4.50 · Kahvila Sävy 4.20. Twelve of them are under €6.
- **Wolt, last 8 full weeks (19 Sep to 13 Nov): 28 orders, €470.40.** So 3.5 orders a week and €16.80 an order. In October: 15 orders, €252.00.
- Before payday (Wed 25 Nov): Spotify €6.49 on 18 Nov, phone bill (Elisa) €14.90 on 20 Nov.
- Subscriptions in October: Spotify 6.49, Netflix 9.99, iCloud 0.99, HBO Max 5.99 = €23.46.
- Fill the rest of three months with groceries (Alepa, S-market), HSL, rent €480 on the 2nd, and small card payments so that 71% of her card payments are under €10.

### Mikko Lahtinen, 31 (user ID `mikko`)
- Current account `FI·· 2093`: **€2,318.60**. "ASP account" (first-home saver): **€6,400.00**.
- Salary: €3,150.00 net from "Nordkode Oy" on the 15th, every month since October 2025 (14 payments).
- Transfers to savings, May to October 2026: 550, 650, 600, 600, 500, 700. Average **€600 a month**. One transfer every month since December 2025 (11 months).
- Goals, in this order: **Japan trip €3,200**, **Car €8,000**, **Own home €24,000** (10% of a €240,000 home). The ASP balance counts toward the home only.
- **Saturday nights out:** card payments labelled bar, restaurant, taxi or late food between Saturday 18:00 and Sunday 05:00, over the last 12 Saturdays (22 Aug to 7 Nov): 31 payments, **€1,104.00**. That is €92 a Saturday and **€398.67 a month** (×52/12).
- Lunches out on weekdays, last 12 weeks: 47 payments, avg €12.90.
- No late or failed payments in 12 months. S Group purchases this month: €118.40.

### Laura Nieminen, 44 (user ID `laura`)
- "Household account" `FI·· 8810`: **€1,817.35**. "Savings": **€2,300.00**.
- Salary: €2,840.00 from "Espoon kaupunki" on the 27th.
- Everyday spending (groceries, fuel, pharmacy, small purchases), last 90 days: €3,060.00, so **€34 a day**.
- Known payments ahead (recurring payees detected from 3 or more past months, plus e-invoices):

| Date | What | Amount |
|---|---|---|
| Mon 16 Nov | Electricity, Helen | −€96.75 |
| Wed 18 Nov | Hockey season fee, Kiekko-Espoo juniors | −€145.00 |
| Fri 20 Nov | Home loan payment | −€890.00 |
| Mon 23 Nov | Afternoon club, City of Espoo | −€120.00 |
| Tue 24 Nov | School trip, class 6B (e-invoice, not yet approved) | −€85.00 |
| Thu 26 Nov | Car insurance | −€212.60 |
| Fri 27 Nov | Salary | +€2,840.00 |
| Tue 1 Dec | Internet and phones, DNA | −€64.80 |
| Thu 3 Dec | Home insurance | −€38.20 |
| Sat 5 Dec | Hockey tournament fee | −€40.00 |

- Projection: balance on day d = today's balance + known items up to d − €34 for each day after today. On **Thu 26 Nov that is exactly −€140.00** (1,817.35 − 1,549.35 − 12 × 34). On Fri 27 Nov it is +€2,666.00.
- **S Group purchases 1 to 14 Nov: €262.00.** Groceries elsewhere this month: €214.30 in 5 payments. Her Friday shop at Prisma averages €85.
- Bonus levels live in one config file, `bonusLevels.ts`: 1% from €50, 2% from €300, 2.5% from €500, 3% from €700, 4% from €900, 5% from €1,500. **These are stand-in values. Mark the file `// replace with S Group's published table`.**

---

## 5. The three homes

All three start with the same first block, the **account line**, and end with the same last line, the **why link**. In between is where they differ.

**Account line (all customers):** a `surface` module, padding 16.
- Line 1, `t-small ink-2`: the greeting (differs by tone, below).
- Line 2: account name `t-body` left ("Käyttötili · FI·· 4471"), balance right in `t-head` 700. The balance is not a proof line, tapping the row opens the Bank tab on that account.
- Laura and Mikko get a second account row under a `line-soft` divider.

**Why link (all customers):** centred text button under the last module, 24 above the Ask bar: "Why does my Kori look like this?" It pushes the screen in section 7.

---

### 5.1 Aino: learn by playing (layout "Play", Roomy, casual tone)

Greeting: "Hi Aino. 11 days to payday."

Order: account line → **guess game (lead)** → what-if → payday runway → where October went → why link.

#### Module A2: Guess game, lead size

A `green-tint` panel (no border), radius 16, padding 20, full width. It is the only tinted module in the app, which is how the Play layout is recognised at a glance.

**State "ask":**
- Heading `t-title`: "What did you spend on cafés in October?"
- 20 gap. The live guess in `t-display`, left aligned: "€40". It starts at "€0" with the hint under it in `t-small ink-2`: "Drag to guess. No peeking."
- 12 gap. Slider, range 0 to 200, step 5. Under the track, `t-micro ink-2`: "€0" left and "€200" right.
- 20 gap. Primary button, full width: "Lock in €40" (the label follows the guess). Disabled at €0 with the label "Make a guess".

**The landing (after tapping "Lock in"), step by step:**
1. 0ms: the button fades out and collapses (200ms). The slider stops accepting input. The thumb becomes a hollow 20px ring (`ink-2`, 2px) fixed at the guess (20% of the track), with a `t-micro` label under it: "You: €40".
2. 200ms: a solid `green-600` 20px dot appears on top of the ring and travels to the real value (43.7% of the track) in `d-land` (900ms, `ease-out`). In the same 900ms the `t-display` number counts from 40 to 87 with the same easing, and the track between the ring and the dot fills with `warn-600` at 35% opacity.
3. 1100ms: a `t-micro` label "Real: €87" settles under the dot, and a `t-small` 600 `warn-text` label "+€47" appears centred above the filled gap.
4. 1250ms: the result text and the payments unfold under the slider (height from 0, `d-sheet`), rows appearing 30ms apart.

**State "result":**
- `t-title`: "€87. That's €47 more than it felt like." ("€87" is a proof line.)
- `t-body ink-2`: "12 of your 16 café payments were under €6. Small ones are the ones memory drops."
- The first 5 café payments as payment rows on `surface` with radius 12, then a text button "See all 16 payments" (opens the receipt sheet).
- Two buttons side by side: primary "Next guess: food delivery", quiet "Done".

**Result copy by outcome** (computed, `diff = actual − guess`):
- Guess within 10% of the real value: "€87. You guessed €85. Your gut was right, and the data agrees."
- Guess too low: as above.
- Guess too high (for example €120): "€87. That's €33 less than you feared."

**Rounds:** cafés (€87.40) → food delivery in October (€252.00, range 0 to 400) → subscriptions in October (€23.46, range 0 to 100). After round 3 the panel settles into state "done": `t-head` "Three guesses in. You were closest on subscriptions." and one line per round: category, "You €40", "Real €87" (proof line). A text button "Play again next month" is disabled with the sub-line "New guesses on 1 December."

#### Module A3: What-if, Wolt and Interrail

`surface` module.
- Heading `t-head`: "What if you ordered Wolt a bit less?"
- `t-small ink-2`: "You order about 3.5 times a week, €16.80 a time." (both numbers are proof lines)
- Stepped slider "Fewer orders a week", values 0, 1, 2, 3, starts at 0. The value shows right of the label in `t-head`.
- A date track under it: a horizontal line 8 from each side, "Today" at the left end and "June 2027" marked by a tick with a `plane` icon at 45% of the width (the track spans 14 Nov 2026 to 31 Jan 2028). A `green-600` 14px dot marks the day the Interrail pot is full. When the slider moves, the dot glides to its new place in `d-state` and the line from Today to the dot is `green-500`.
- Result sentence `t-body`, changing with the slider:

| Fewer orders | Weekly amount | Pot full | Sentence |
|---|---|---|---|
| 0 | €0 | never | "Your Interrail pot has €60 of €900. At this pace it stays there." (no dot) |
| 1 | €17 | 30 Oct 2027 | "1 fewer a week is €17 a week. The pot is full on 30 October 2027. Too late for June." |
| 2 | €34 | 8 May 2027 | "2 fewer a week is €34 a week. The pot is full on 8 May. Interrail in June works." |
| 3 | €50 | 13 Mar 2027 | "3 fewer a week is €50 a week. The pot is full on 13 March, with spring to spare." |

Maths: weekly amount = round(n × average order). Weeks = ceil((target − pot) ÷ weekly amount). Date = today + weeks × 7.
- Button (only when n > 0), primary: "Move €34 every Monday". After the tap, in place: a `check` icon and "Every Monday, €34 goes to Interrail. First one on 16 Nov." with a text button "Undo".

#### Module A4: Payday runway
- `t-head`: "€17 a day until payday" (proof line on €17, opening the "How this is counted" sheet from 3.6).
- `t-small ink-2`: "€190.96 is free until Wed 25 Nov, after your phone bill and Spotify."
- A row of 11 day cells (one per day until payday), 24 wide, 8 high, radius 4, `surface-sunk`, with small `ink` squares on the 18th and 20th marking the two bills. No animation.

#### Module A5: Where October went
- `t-head`: "October in three lines"
- Three rows, each: category icon in a 36 `green-tint` circle, name, a proof-line total on the right, and under the name a bar 6 high whose length is the share of the largest of the three. Rows: Food delivery €252, Groceries (computed), Cafés €87. Tapping a total opens its receipt sheet.

---

### 5.2 Mikko: plan the future (layout "Plan", Regular, plain tone)

Greeting: "Good evening, Mikko." (by clock: morning before 12, afternoon before 18)

Order: account line (current account, ASP account) → **plan timeline (lead)** → home loan readiness → Saturday nights → quick guess row → Bonus row → why link.

#### Module M2: Plan timeline, lead size

`surface` module, padding 16. Its three parts stack: sentence, saving control, rail.

**Sentence (top):**
- `t-title`: "Own home in November 2030."
- Under it, `t-small`: at the baseline "At €600 a month, the pace of your last 6 months." (€600 is a proof line listing the six transfers). Away from the baseline it changes, see the steps.

**Saving control** (this part is `position: sticky; top: 0` inside the scroll area, `surface` ground with a `line-soft` bottom border, so it stays visible while the rail scrolls):
- Row: label `t-body` "I put aside each month" left, value `t-head` 700 right: "€600".
- Slider, range 400 to 1,200, step 10, starting at the computed baseline (600). A 2 x 12 `ink-3` tick on the track marks the baseline permanently.
- Chips under it, wrapping: **"Halve Saturday nights out · +€200"** and **"Two fewer lunches out a week · +€110"**. Chip amounts are computed: Saturday nights €398.67 a month ÷ 2 = €199.33, rounded to the nearest €10. Lunches: 2 × €12.90 × 52 ÷ 12 = €111.80, rounded to €110.

**Rail:**
- Height 387 (16 top pad, 74 months × 4.8px, 16 bottom pad). It covers November 2026 to December 2032.
- Year labels ("2027" … "2032") in `t-micro ink-3` in a 40-wide left column, each at its January. A 2px `line` vertical rail at x=56. A "Today" label and a 10px `ink` dot at the top of the rail.
- Three goal markers on the rail, each at `y = 16 + monthsFromNow × 4.8`:
  - marker: 32 circle centred on the rail, `green-tint` ground, 18px icon in `green-600` (`plane`, `car`). The home marker is `green-600` with a white `house` icon.
  - label to the right at x=84: name in `t-body-strong`, under it `t-small ink-2` "May 2027 · €3,200".
  - If two labels would be closer than 52px, the later label moves down to keep 52px and a 1px `line` leader joins it to its marker.
- The rail between Today and the home marker is 3px `green-500`. Below the home marker it stays `line`.
- Tapping a goal label opens a receipt-style sheet: "Japan trip. €3,200. Filled first, before the car and the home. At €600 a month that takes 6 months." with the list of months and amounts.

**Timeline maths:** goals fill one after another in order, from monthly saving. Japan needs 3,200, the car 8,000, the home 24,000 − 6,400 = 17,600. Month a goal is reached = ceil(cumulative need ÷ monthly amount) months after November 2026.

| Monthly | Japan | Car | Own home |
|---|---|---|---|
| €400 | Jul 2027 | Mar 2029 | Nov 2032 |
| **€600 (baseline)** | **May 2027** | **Jun 2028** | **Nov 2030** |
| **€800** | **Mar 2027** | **Jan 2028** | **Nov 2029** |
| €1,200 | Feb 2027 | Sep 2027 | Nov 2028 |

**The wow, step by step (dragging):**
1. Finger or mouse down on the thumb: nothing else changes.
2. While dragging, in the same frame as the pointer: the value ("€600" → "€610" → …) updates, all three markers slide up the rail to their new positions, their date lines tick over by month, and the green part of the rail shortens. No easing and no delay while the pointer is down.
3. The moment the value leaves the baseline, a ghost stays at each baseline position: a hollow 10px ring (`ink-3`, 1.5px) on the rail, joined to its moved marker by a 1px dashed `ink-3` line along the rail.
4. The sentence updates live. At €800: `t-title` "Own home in November 2029." and under it in `green-600` `t-small` 600: "12 months sooner than at €600." Below the baseline (say €500): "Own home in September 2031." and in `ink-2`: "10 months later than at €600."
5. On release the markers settle with one 200ms `ease-out` onto the exact month positions.

**The wow, step by step (the chip):**
1. Tap "Halve Saturday nights out · +€200". The chip becomes selected.
2. The thumb glides from 600 to 800 in `d-glide` (700ms, `ease-out`). Everything in step 2 to 4 above follows the thumb during the glide, so the three markers visibly rise together and the home marker travels 58px, from November 2030 to November 2029.
3. The line under the sentence becomes: "Halving Saturday nights out frees about €200 a month. Your own home arrives a year earlier." ("€200" is a proof line that opens the 31 Saturday-night payments, titled "Saturday nights out, last 12 weeks", with the count-up: "€1,104.00 over 12 Saturdays" / "€92 a Saturday" / "€398.67 a month" / "Half of that €199.33".)
4. Tapping the chip again glides back. Chips add up (both on: €910). Dragging the slider by hand deselects the chips.

- Under the rail, a primary button appears only when the value differs from the baseline: "Save €800 a month from December". After the tap, in place: "From 1 December, €800 moves to savings on each payday. Your plan now shows November 2029." with "Undo". The baseline tick moves to 800 and the ghosts disappear.

#### Module M3: Home loan readiness (the calm ending)

`surface` module. Always present in the Plan layout. Its content is computed, it never slides in.
- `t-head`: "You're ready to talk about a home loan"
- Three rows, each a `check` icon in a 24 `green-tint` circle and a `t-body` line with a proof line:
  - "Steady salary for **14 months**"
  - "Saved every month for **11 months**"
  - "**€6,400** of the €24,000 you need is already in your ASP account"
- `t-small ink-2`: "A loan talk now tells you what price range fits you, before the deposit is finished. It commits you to nothing."
- Primary button: "Book a home loan talk". It opens a sheet "Home loan talk with S-Bank" with three time slots as rows (computed as the next three weekdays at 16.30) and the line "In this test build no booking is sent." Choosing one shows "Tue 17 Nov, 16.30. We'd confirm this by message in S-mobiili."
- Text button: "What the bank looks at" → a sheet listing the three checks and their rules.
- Other states: a check that fails shows a hollow ring and plain words ("Salary has arrived for 4 months. Banks usually want to see 6."), and the heading becomes "Getting ready for a home loan talk" with no primary button.

#### Module M4: Saturday nights
- `t-head`: "Saturday nights cost you about €400 a month" (proof line).
- 12 bars in a row, one per Saturday, 16 wide, gap 10, max height 64, `green-500`, heights proportional to that Saturday's total. Under each `t-micro ink-3` the day ("22.8"). Tapping a bar opens that night's payments.
- `t-small ink-2`: "The biggest was 17 October: €164."  (make the data produce this)

#### Module M5: Quick guess row (the guess game at row size)
One row, 56 high: `t-body` "Guess: lunches out in October", `chevron-right`. It expands in place into the same slider, landing and result as Aino's game, on `surface` instead of `green-tint`, with `t-title` instead of `t-display`.

#### Module M6: Bonus row
One row: `percent` icon, "S Group Bonus: €118 this month, 1% level", `chevron-right` to the Benefits tab.

---

### 5.3 Laura: stay ahead of the month (layout "Month", Compact, brisk tone)

Greeting: "Laura · Saturday 14 November"

Order: account line (Household account, Savings) → **month calendar with the shortfall fix (lead)** → balance ahead → coming up → Bonus progress → quick guess row → why link.

#### Module L2: Month calendar, lead size

`surface` module, padding 12.
- `t-head`: "The next four weeks"
- Weekday row: M T W T F S S in `t-micro ink-3`, centred over the columns.
- Grid: 7 columns × 4 rows, Monday 9 November to Sunday 6 December. Cell 48 wide × 46 high, gap 2, radius 8.
  - Date number top-left of the cell, `t-small` 600. The 1st of a month also shows "Dec" in `t-micro ink-3`.
  - Marks along the bottom of the cell, 4 gap: money going out is a 6px `ink` square, money coming in is a 6px `green-500` circle. Two items show two marks, three or more show two marks and "+".
  - Past days (9 to 13 Nov): `surface-sunk` ground, `ink-3` number.
  - Today (14): a 1.5px `ink` border.
  - **The shortfall day (26): `warn-tint` ground, 1.5px `warn-600` border, and a 12px `triangle-alert` icon in `warn-600` top-right.**
  - Selected day (after a tap): `green-tint` ground, `green-600` border. Tapping a day scrolls the Coming up list to that day and highlights its rows for 1.2s.
- Legend under the grid, `t-micro ink-2`: a square "going out", a circle "coming in".

**Shortfall fix, attached to the bottom of the same module** (a `warn-tint` band, radius 12, padding 12, 12 above it):
- Row: `triangle-alert` 20px `warn-600`, then `t-body-strong warn-text`: "On Thu 26th you'll be €140 short." ("€140" is a proof line opening the count: balance today, the six payments, "12 days of everyday spending at €34", result −€140.00.)
- `t-small warn-text`: "Car insurance goes out the day before your salary comes in."
- Buttons: primary **"Move €140 from Savings"**, and a text button "Choose amount" (opens a sheet with an amount field prefilled 140 and a slider up to the Savings balance).

**The wow, step by step:**
1. Tap "Move €140 from Savings". The button shows the spinner for 600ms.
2. The band's ground changes from `warn-tint` to `green-tint` (`d-state`) and its content swaps to: a `check` icon in `green-600`, `t-body-strong ink` "Moved. The 26th is covered.", `t-small ink-2` "€140 from Savings to your Household account, just now.", and a text button "Undo" (available for the session).
3. At the same time: the 26th cell loses its `warn-tint`, border and icon (`d-state`). In the account line, Household counts from €1,817.35 to €1,957.35 and Savings from €2,300.00 to €2,160.00 (600ms). The bell dot disappears.
4. In the Balance ahead module the whole line lifts by €140 in `d-glide` (700ms): the red segment under zero rises to touch the zero line, and its label changes from "−€140 on Thu 26" to "€0 on Thu 26".
5. Undo reverses all four.

If the projection is never below zero, the band is `surface-sunk` and reads: "Nothing falls short in the next four weeks. Lowest point: €212 on Thu 26."

#### Module L3: Balance ahead
`surface` module, padding 12.
- `t-head`: "Balance ahead"
- A step line, 334 wide × 72 high, one step per day for the same 28 days. Line 2px `ink`. A dashed 1px `ink-3` zero line with the label "€0" at the right. Any part of the line under zero is `neg-600` and the area between it and zero is `neg-tint`. Today is a 1px `line` vertical with "Today" under it. The salary day shows a 6px `green-500` circle on the line with "+€2,840" above it. The lowest point has an 8px dot and a label: "−€140 on Thu 26" in `neg-600` `t-small` 600.
- `t-micro ink-2` under it: "Known payments plus €34 a day of everyday spending, your 90-day average." ("€34" is a proof line.)
- Sweeping a finger or the mouse along the chart shows a vertical hairline and a small label with that day's date and projected balance.

#### Module L4: Coming up
`surface` module, rows 48 high, grouped under day headings (`t-small` 600 `ink-2`, "Mon 16 Nov").
- Row: a 28 circle with a category icon, the name, the amount right. Incoming amounts are `green-600` with "+".
- The school trip row carries a quiet button 32 high: **"Approve"**. After the tap: a `check` and "Approved" in `green-600`, with the sub-line "Pays on Tue 24 Nov."
- The car insurance row has a `warn-600` `triangle-alert` 16px before the amount until the fix is made.
- Shows items through Fri 27 Nov, then a text button "Show December".
- Module heading `t-head`: "Coming up", and beside it in `t-small ink-2`: "6 payments before payday, €1,549.35" (proof line).

#### Module L5: Bonus progress, full size
`surface` module.
- `t-head`: "€38 more at S-Market reaches the next Bonus level" (proof line on €38: "S Group purchases 1 to 14 Nov €262.00" / "Next level €300.00" / "To go €38.00").
- A level track: a horizontal bar 8 high, radius 999, `surface-sunk`, filled `green-500` to 262 ÷ 300 of the segment between the 1% and 2% ticks. Ticks with labels under them in `t-micro`: "€50 · 1%", "€300 · 2%", "€500 · 2.5%". The current level label is `green-600` 600.
- `t-body ink-2`: "That lifts your Bonus from 1% to 2% on everything this month, about €3.38 more. Your Friday shop is usually around €85, so you'll get there without buying anything extra."
- `t-small ink-2`: "You also bought €214 of groceries elsewhere this month." (proof line)

#### Module L6: Quick guess row
Same as M5: "Guess: groceries in October".

---

## 6. Building-block library and the rules that pick

Nothing is generated per customer. On login, `assignHome(customer)` computes the signals, picks one layout, and returns an ordered list of block IDs with a size (`lead`, `full`, `row`), a tone and a text preset. The same function serves the "Why this home?" screen.

### 6.1 Signals (all computed from 12 months of transactions)

| Signal | How it is computed | Aino | Mikko | Laura |
|---|---|---|---|---|
| Age band | from the customer record: 18–24, 25–39, 40–64, 65+ | 18–24 | 25–39 | 40–64 |
| Steady income | same payer 6+ months in a row, amounts within 10% | no (2 sources, ±22%) | yes (14 months) | yes |
| Fixed bills a month | recurring payees seen 3+ months, plus e-invoices | 2 | 4 | 9 |
| Household signal | 2+ recurring payees labelled school, daycare or children's sport | no | no | yes (3) |
| Saving rate | transfers to own savings ÷ income, 6 months | 2% | 19% | 4% |
| Has a goal or savings product | pot, ASP or savings account with deposits | 1 pot | ASP | savings |
| Small-payment share | card payments under €10 ÷ all card payments | 71% | 38% | 29% |
| Projected shortfall | balance ahead below zero in the next 28 days | no | no | yes, 26 Nov |
| Salary forwarded | 70%+ of salary leaves to an outside account within 3 days | no | no | no |

### 6.2 Layout rule (first match wins)

1. **Month:** household signal is yes, or fixed bills a month is 6 or more.
2. **Plan:** steady income is yes, and saving rate is 10% or more, and has a goal or savings product.
3. **Play:** age band is 18–24, or small-payment share is 50% or more.
4. Otherwise: **Month**.

Age band then sets the voice and size, whatever the layout: 18–24 casual and Roomy, 25–39 plain and Regular, 40–64 brisk and Compact, 65+ calm and Large. Gender is never read. The customer can override the layout and text size in "Why this home?".

### 6.3 Blocks

| ID | Block | Play (Aino) | Plan (Mikko) | Month (Laura) | Shown when |
|---|---|---|---|---|---|
| `account-line` | Account line | 1 | 1 | 1 | always |
| `guess` | Guess game | 2, lead | 5, row | 6, row | 10+ card payments in a category last month |
| `what-if` | What-if slider with date track | 3, full | inside the timeline | not shown | a habit category above €100 a month and a goal |
| `payday-runway` | Per-day amount until payday | 4, full | not shown | not shown | balance under 1× monthly income |
| `where-it-went` | Category lines / Saturday bars | 5, full | 4, full (Saturday variant) | not shown | always available |
| `plan-timeline` | Life timeline with saving control | not shown | 2, lead | not shown | Plan layout |
| `loan-readiness` | Home loan readiness | not shown | 3, full | not shown | a home goal or ASP account exists |
| `month-calendar` | Four-week calendar | not shown | not shown | 2, lead | Month layout |
| `shortfall-fix` | Shortfall warning and one-tap move | attaches under the account line for anyone | same | inside the calendar | projected shortfall is yes |
| `balance-ahead` | Step line of the next 28 days | not shown | not shown | 3, full | Month layout |
| `coming-up` | Upcoming payments list | not shown | not shown | 4, full | fixed bills a month is 3 or more |
| `bonus` | S Group Bonus progress | not shown | 6, row | 5, full | S Group purchases over €50 this month |
| `why-link` | "Why does my Kori look like this?" | last | last | last | always |

A block pinned from Ask Kori is inserted at position 2 for that customer, at `full` size.

Tone is a lookup, not generation: every sentence in section 5 exists as a template with three voice variants (casual, plain, brisk) in `copy.ts`. Example, the shortfall line: casual "Heads up: on Thu 26th you'll be €140 short." · plain "On Thursday 26 November you'll be €140 short." · brisk "On Thu 26th you'll be €140 short."

---

## 7. "Why this home?" (the how-it-works moment, a real screen)

A pushed full screen (header with back button, title "Why this home?"). Reached from the profile sheet and from the why link at the bottom of every home. Content scrolls, `ground` background, sections are `surface` modules. Everything on it is rendered from the output of `assignHome`, so it is different and true for each customer. Copy below is Mikko's.

**Top (no module, 16 gutters):**
- `t-title`: "Your Kori is built from the same blocks as everyone's."
- `t-body ink-2`: "Kori has 13 building blocks and 3 home layouts. Your age band and the way your money moves decide which blocks you get, in what order, and how they talk to you. Nothing on your home is written or drawn for you by AI."

**Module 1, `t-head` "What Kori looked at":** a list of rows, label left, value right as a proof line.
- "Age band" · "25–39"
- "Steady income" · "14 months from the same employer"
- "Fixed bills a month" · "4"
- "Children's fees and school payments" · "none found"
- "Share of income you save" · "19%"
- "Savings or goal" · "ASP account"
- "Card payments under €10" · "38%"
- `t-small ink-2` under the list: "Kori does not look at gender, at who you pay as a person, or at anything outside your S-Bank accounts."

**Module 2, `t-head` "What that chose":**
- `t-body`: "Steady income, saving 19% and an ASP account point to the **Plan** layout."
- A vertical strip of the customer's blocks in order, each a 40-high row with its number, name and size: "1 Account line" / "2 Plan timeline · leads" / "3 Home loan readiness" / "4 Saturday nights" / "5 Guess game · small" / "6 Bonus · small". The lead row has a `green-tint` ground.
- Row "Voice" · "Plain" and row "Text size" · "Regular".

**Module 3, `t-head` "Change it":**
- Segmented control "Lead with": **Play · Plan · Month** (current one selected). Choosing another re-runs the layout with that override, the home is rebuilt at once from the same blocks, and the strip above reorders with a 200ms slide. A text button "Back to Kori's choice" appears when overridden.
- Segmented control "Text size": Compact · Regular · Roomy · Large.

**Module 4, `t-head` "Where AI is used, and where it is not":** three rows, each a `t-body-strong` label and a `t-small ink-2` line.
- "Reading your payments" · "A language model labels each merchant and spots patterns such as a Saturday night out or a monthly fee. You can correct any label from a receipt."
- "Ask Kori" · "The model turns your question into a lookup and picks one of the 13 blocks to answer with. It does no arithmetic and writes no numbers."
- "Never AI" · "Choosing your layout (fixed rules, shown above). Every number (counted from your payments, tap any dotted number to see them). Moving money (only you)."

**Footer line, `t-small ink-2`, centred:** "Building this home used 0 AI calls. Asking Kori uses 1 per question. Layout rules version 1."

Per-customer first line of Module 2:
- Aino: "Irregular income, 71% of your card payments under €10 and the 18–24 age band point to the **Play** layout."
- Laura: "9 fixed bills a month and 3 children's payees point to the **Month** layout."

---

## 8. The video path (every beat is a real action on the live app)

| Time | Screen | Action |
|---|---|---|
| 0:00–0:10 | `/three` | Three live phones side by side. Scroll each a little. |
| 0:10–0:35 | Login → Aino | Type `aino`, `1234`, Log in. Drag the guess to €40, Lock in, the dot lands on €87, payments unfold. Tap "€87" (receipt sheet), close. Scroll to the what-if, step the slider to 2. |
| 0:35–1:10 | Profile → Log out → Mikko | Avatar, Log out, type `mikko`. Drag the saving slider up and down so the three markers move. Tap "Halve Saturday nights out". Tap "€200" (receipt sheet), close. Scroll to "You're ready to talk about a home loan". |
| 1:10–1:35 | Log out → Laura | Type `laura`. The calendar with the 26th flagged. Tap "Move €140 from Savings", the day clears and the balance line lifts. Scroll to Bonus. |
| 1:35–1:50 | Laura → Why this home? | Tap the why link. Scroll the four modules. Switch "Lead with" to Plan and back. |
| 1:50–2:00 | `/three` | The three phones again. Title added in the edit: "One bank. A different app for every life." |

---

## 9. Do not

- No S-Bank logo, wordmark or the letter-S mark. No real customer data.
- No scripted, story or autoplay mode. No "next step" key. Nothing happens without a tap, a drag or a key press.
- No card, banner or tip that appears by itself. Every module is in the layout from first paint, and only its content state changes.
- No hard-coded numbers in copy. Every figure is a template slot filled from the transactions.
- No chat bubbles, no avatars for Kori, no typing dots, no streamed text. Ask Kori returns a page with a block.
- No sparkle, wand, robot or brain icons. No emoji. No unicode glyphs as icons. No "AI" badge on modules.
- No gradients, glass, glow, coloured side stripes on cards, or shadows on modules.
- No eyebrow or kicker labels above headings. No uppercase tracked labels.
- No hero-metric tiles (big number, small label). The largest type in a module is always a sentence, except the live guess number.
- No progress rings, no streaks, no badges, no confetti, no points.
- No red for ordinary spending. No per-customer colour themes. No gender signal anywhere in code or copy.
- No font other than Figtree, and no fluid type.
- No placeholder screens, lorem ipsum, "coming soon" tabs or dead buttons. Cut what is not built.
- No browser-window sheets or tooltips escaping the device frame on desktop.
- No horizontal scrolling at 390px. No text overflow at any text-size preset.

---

## 10. Acceptance screenshots Codex must produce

Save to `screenshots/kori/` as PNG. Desktop means a 1440 x 900 viewport, phone means 390 x 844 with no frame.

1. `01-login-desktop.png`: login screen in the device frame, empty.
2. `02-login-error-desktop.png`: wrong PIN state.
3. `03-three-desktop.png`: `/three`, all three homes at the top of their scroll.
4. `04-aino-ask-desktop.png`: guess game, slider at €40, before locking in.
5. `05-aino-landed-desktop.png`: after the landing, both markers, "+€47", payments unfolded.
6. `06-aino-receipt-desktop.png`: receipt sheet for "Cafés in October", total €87.40.
7. `07-aino-whatif-desktop.png`: what-if at 2 fewer, dot at 8 May.
8. `08-mikko-baseline-desktop.png`: timeline at €600, home at November 2030.
9. `09-mikko-800-desktop.png`: Saturday chip selected, €800, home at November 2029, ghosts visible.
10. `10-mikko-loan-desktop.png`: home loan readiness module.
11. `11-laura-short-desktop.png`: calendar with the 26th flagged and the warning band.
12. `12-laura-fixed-desktop.png`: after the move, band green, balance line at €0.
13. `13-laura-bonus-desktop.png`: Bonus progress module.
14. `14-why-mikko-desktop.png` and `15-why-laura-desktop.png`: the "Why this home?" screen for two customers.
15. `16-profile-desktop.png`: profile sheet with Log out.
16. `17-ask-answer-desktop.png`: Ask Kori answer page for "What if I save €900 a month?".
17. `18-aino-phone.png`, `19-mikko-phone.png`, `20-laura-phone.png`: each home at 390 wide, no frame.
18. `21-laura-large-text-phone.png`: Laura's home with text size Large, nothing overflowing.

Checks to run and report with the screenshots:
- The receipt total equals the tapped number for these six: Aino €87, Aino €17 a day, Mikko €600, Mikko €200, Laura €140, Laura €38.
- Changing one café payment's label in the receipt sheet changes the €87 on the home.
- Header, tab bar, Ask bar and account line measure the same height and position for all three customers.
- Keyboard only: log in, play the guess, open and close a receipt, move Mikko's slider, make Laura's move, log out.
- `prefers-reduced-motion`: the three wow interactions still reach their end states.
- Contrast: every text pair at 4.5:1 or better, every mark at 3:1 or better.
