# Junction 2026 rules for Codex (shared by every entry, dated Sat 14 Nov 19:45)

Goal: win the sponsor prizes at Junction 2026. Final deadline Sun 15 Nov 10:00 Helsinki.
Shreyansh decides taste and direction. The Chief (Claude) writes each job. You decide how to build it.

## Work rules
- Work only inside this entry's folder. Do not read other entries.
- Read only what the job needs. The entry AGENTS.md and STATUS.md carry the context.
- Before you build, write a 5-line paraphrase of the goal, scope and acceptance cases at the top of STATUS.md.
- Prove it works on the real artifact: the live URL, a real browser, real data. "It compiles" is not done.
- Every bug you find becomes a regression test before you move on.
- Label every number as measured, inferred or guess.
- For any UI work, read ../DESIGN-FLOOR.md, this entry's DESIGN.md (the shipped visual system) and DESIGN-DIRECTION.md first.
- Before reporting, have a separate reviewer (6 Astra) run two passes, one on spec fit and one on build quality. It reruns the quality commands itself.

## Allowed without asking
Create repos under 13shreyansh, Vercel projects and env vars, API keys on his signed-in accounts, dataset downloads, deploys to this entry's own Vercel project or VPS.

## Never without "APPROVED BY SHREYANSH" in the job
Discord posts, video uploads, portal submissions, purchases, deletions, messages to people. Never write a key or password into a file, log or reply.

## End every job by overwriting STATUS.md, with your final reply the same text
```
ENTRY / time / commit / live URL
DONE: up to 3 bullets
NUMBERS: dev / held-out / baseline, each labelled measured, inferred or guess
SCREENSHOTS: 2-3 paths (desktop first screen, 390px first screen, key moment)
REVIEW: reviewer verdict in one line, plus what it flagged
NEXT: the next goal you propose
NEEDS DECISION: a taste or direction question, or "none"
BLOCKED: or "none"
```

## Browser and tools
- Do not use sub-agents unless necessary.
- Use Codex's inbuilt browser for all web, account and UI actions. Use IAB through cua_repl. Never open, attach to or control Shreyansh's personal browser windows or profiles. Do not launch an external browser as a workaround.
- Local tools remain appropriate when necessary for coding, builds, tests, SSH and secret-safe operations.

## Real product, never a scripted demo (Shreyansh, Sat 21:46 — applies to every entry)
- The site is a professional, real product. No "Play the story" mode, no auto-appearing cards, no seeded events that fire by themselves, no "demo" banners on the main flow.
- Entry: a clean start screen with one small "Try the demo account" option that drops you into a normal account (e.g. Hotel Aurora). No password fields. Inside, everything behaves like the real thing.
- Every step of the video is done by a real user action on the live site (typing, speaking, uploading, clicking). Videos are recorded by an agent (Manus) actually using the live site, so the full flow must really work end to end.
- Prove it: an end-to-end browser test (Playwright, headless Chromium) runs the whole video flow on the DEPLOYED URL as a user would, at 1440x900 and 390 px, and saves screenshots. That test is the acceptance check.
- Sample inputs a tester needs (e.g. a whiteboard photo) live at a separate unlinked /samples path, never inside the product UI.

## Exact spec and taste gate (Shreyansh, Sat 22:10 — applies to every entry)
- DESIGN-DIRECTION.md is the exact screen spec written by the Chief: placement, sizes, colours, fonts, copy, states. Where DESIGN.md records a later shipped visual decision (spruce header and brand band), DESIGN.md wins on look. Follow it exactly; engineering is yours. Where it is silent, pick the plainest consistent option and list it under "Spec gaps I filled" in STATUS.md.
- Before reporting, loop on the DEPLOYED site until every item in ../kit/TASTE-GATE.md is a yes: build, deploy, run the E2E test, look at every screenshot, fix, repeat. Report each item's yes/no with its screenshot in STATUS.md.


# Entry: S-Pankki "Personal Economic Trainer" — Kori (dated Sat 14 Nov 22:35)

Why it exists: S-mobiili has 1.7M weekly users in very different lives, yet every banking app shows them the same screens. S-Bank's hardest problem (booth): personalisation for very different groups. Kori is a money tab inside S-mobiili where the whole app arranges itself for each person, from age and spending behaviour (never gender), using a fixed set of building blocks.
The judge: S-Pankki, from a 2:00 video only (no live pitch). 20% each: financial learning, originality of AI integration, clarity of mobile UX, feasibility, fit into S-mobiili. They loved at the booth: the "guess what you spent on cafés" game, spending sliders / what-if scenarios, "the data supports your gut feeling", many small nice details.
Wins if: in 2 minutes a judge sees one app, one brand, three visibly different homes: Aino 21 (learn by playing: guess game + what-if slider), Mikko 31 (plan the future: life timeline whose goal dates move with a saving slider, ending in home-loan readiness; the main wow), Laura 44 (stay ahead of the month: money calendar, shortfall warning with one-tap fix, S Group Bonus progress), plus a real "Why this home?" screen explaining how it works.
Hard constraints: every number computed by code from the customer's transactions in S-Bank's dataset schema; the AI only phrases words, never numbers; every number opens a receipt (the payments behind it). The three demo customers are invented: generate their transaction histories in the official schema (realistic Finnish merchants, S Group stores). Login: an S-mobiili-style login with user name and PIN is required here (Shreyansh's call, overrides the root "no password fields" rule for this entry); demo customers aino / mikko / laura, PIN 1234 printed in small print on the login screen. Log out from the profile menu.
Existing code: github.com/13shreyansh/kori (React app in app/, engine in app/src/engine incl. segments; evals in eval/). Live Vercel project "kori" (https://kori-wheat.vercel.app); pushes do NOT auto-deploy, deploy with the Vercel CLI. Real-schema data: github.com/13shreyansh/kori-spankki-data. GEMINI_API_KEY is in Vercel env. Sponsor brief: ../context/spankki.md.
Design: DESIGN.md (shipped visual system: colours, type, shell look; wins on look) and DESIGN-DIRECTION.md (exact, binding for behaviour, data, copy and layout; its white-header look is superseded). Decisions: DECISIONS.md.
