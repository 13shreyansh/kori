# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Primary: S-Bank (S-Pankki) customers using S-mobiili on their phone, in daily life (a shop queue, a tram, a kitchen table). 1 in 3 Finnish adults use S-mobiili weekly.
- Evaluator: S-Pankki's Junction 2026 judges, who judge Kori from a recorded video of 2:00 or less, in English. They never use the site live, so every screen must read clearly at video size.

## Product Purpose
Kori is the money tab inside S-mobiili. It is one app with one brand look, and it arranges a fixed set of building blocks differently for each customer, based on age band and how their money moves (never gender). Success: a judge watching the video understands in 10 seconds that today every customer gets the same statement-and-list screen, and that Kori gives each person the app that fits their life.

## Positioning
Personalisation by segment, not per-person generated UI: a fixed library of blocks, picked and ordered by transparent rules from real transaction behaviour, so it scales to 1.7M weekly users at no per-person generation cost. Every computed number carries a receipt (the payments behind it). AI only picks which block answers a question; it never does the maths.

## Operating Context
- Judging criteria (20% each): impact on financial literacy (teaching angle), originality of AI integration, clarity of mobile UX, feasibility, potential to integrate into S-mobiili.
- S-Pankki booth feedback: they loved the "guess what you spent on cafés" game, sliders and what-if scenarios, and "the data supports your gut feelings". Hardest part is personalisation from behaviour (spenders, savers, salary-forwarders), not just age.
- Brief language: chat with your own money; three baskets (mandatory regular, mandatory irregular, everyday spending that slips away); safe-to-spend; what-if; MyData spirit.

## Capabilities and Constraints
- Three invented demo customers with real login/logout (PIN 1234): Aino 21 student (learn: café guess game, Wolt what-if filling an Interrail pot), Mikko 31 (plan: life timeline with saving slider, home-loan readiness), Laura 44 two kids (manage: money calendar, €140 short on the 27th, one-tap move from savings, grocery trend).
- "Why does my Kori look like this?" explains the rules in plain words and lets the person change them.
- Engine also runs on S-Pankki's synthetic challenge data: 393 sampled customers, 3.6M payments.
- Today is the real current date; data is anchored relative to today. Hidden reset route /reset?customer=all.
- No scripted or seeded "play the story" demo. Must load fast.

## Brand Commitments
- The S-mobiili shell stays constant across customers: colours, font, header, tab bar, cards, receipt sheet, Ask Kori bar. Only home modules, their order, the leading tool, tone, text size and density change.
- Name: Kori. Close line used so far: "One bank. A different app for every life."
- It must read as a real shipped Nordic bank product, never a mockup or a developer demo. Owner rejects generic/template UIs.

## Evidence on Hand
- Held-out persona assignment vs independent answer key: 100% agreement (185 customers). Swap test: a separate model picked each person's real home over a decoy 38 of 40 times (on the 16-persona engine). 20% of sampled customers forward most of their salary to another bank.
- No real customer testimonials, adoption numbers or S-Bank endorsement exist; never invent them.

## Product Principles
1. Calm and exact: the bank's calm, with energy spent only on the interactive moments (a guess you can lose, a future you can drag, a month you can fix).
2. Every number has a receipt.
3. Personalise from behaviour and age, never gender; the person has the final say.
4. Prove, don't claim: the real app at work, not a slide.
