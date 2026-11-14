ENTRY Kori / 2026-11-14 23:20 EET / app commit 7b8f6e5 / https://kori-wheat.vercel.app

DONE:
- Rebuilt login, shared bank shell, rule-selected Play/Plan/Month homes, editable receipts, Ask Kori/pinning and “Why this home?”.
- Generated invented transaction histories in the official schema. Current Helsinki dates, Saturday patterns, projections and saving plans come from code and account data.
- Deployed the existing Kori project and rewrote DEMO_SCRIPT.md as real user actions. All acceptance checks pass.

NUMBERS: dev 24/24 engine and rollover tests (measured); deployed 10/10 tests, 0 failures or flaky tests, 58.88 seconds (measured), including 1440×900 and 390px flows. Held-out: not measured; historical model benchmarks were not rerun. Baseline: €600/month → €800/month moves Mikko’s home from November 2030 to November 2029 (measured from the invented ledger).

SCREENSHOTS: [01-login-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/01-login-desktop.png) · [18-aino-phone.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/18-aino-phone.png) · [09-mikko-800-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/09-mikko-800-desktop.png)

REVIEW: PASS, separate 6 Astra spec-fit and build-quality passes. Forecast, date rollover, Ask state, reset, receipt and transfer findings fixed. Build and lint pass; lint warnings remain. Details: [review.md](/Users/shreyansh/Documents/ChatGPT/Junction/kori/artifacts/review.md).

NEXT: Record the live user actions in DEMO_SCRIPT.md.
NEEDS DECISION: none
BLOCKED: none

Spec gaps I filled:
- Used the explicitly permitted grocery trend instead of unverified Bonus rates. No Bonus estimate or original Bonus-threshold receipt is claimed.
- Kept opening balances, goals and scheduled e-invoices as explicit account records alongside transaction rows. An overridden Plan home without a goal offers a goal form.
- Described the implemented merchant/category rules truthfully on “Why this home?”. Gemini selects answer blocks; the local router handles unavailable model responses. No arithmetic comes from generated prose.
- Account actions persist in the test session. No production bank-transfer or booking API was supplied or claimed. Browser verification used the requested headless Chromium because the IAB host was unavailable.

Taste gate on the deployed site:

| Item | Verdict | Screenshot |
| --- | --- | --- |
| 1. Professional product | yes | [03-three-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/03-three-desktop.png) |
| 2. Real working flow | yes | [05-aino-landed-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/05-aino-landed-desktop.png) |
| 3. Start screen, entry login override | yes | [01-login-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/01-login-desktop.png) |
| 4. Working controls and navigation | yes | [16-profile-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/16-profile-desktop.png) |
| 5. Computed numbers and receipts | yes | [06-aino-receipt-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/06-aino-receipt-desktop.png) |
| 6. Screen spec, with choices listed below | yes | [03-three-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/03-three-desktop.png) |
| 7. Specified primary actions | yes | [04-aino-ask-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/04-aino-ask-desktop.png) |
| 8. Plain banking language | yes | [10-mikko-loan-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/10-mikko-loan-desktop.png) |
| 9. Purpose clear at first glance | yes | [03-three-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/03-three-desktop.png) |
| 10. Calm composition | yes | [09-mikko-800-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/09-mikko-800-desktop.png) |
| 11. No default AI decoration | yes | [03-three-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/03-three-desktop.png) |
| 12. Themed surfaces and no horizontal overflow | yes | [21-laura-large-text-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/21-laura-large-text-desktop.png) |
| 13. Deployed desktop and phone E2E | yes | [20-laura-phone.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/20-laura-phone.png) |
| 14. Visible wow moments | yes | [09-mikko-800-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/09-mikko-800-desktop.png) |
| 15. Stable, responsive interaction states | yes | [12b-laura-balance-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/12b-laura-balance-desktop.png) |

Evidence: [deployed results](/Users/shreyansh/Documents/ChatGPT/Junction/kori/artifacts/e2e/results.json), [independent arithmetic](/Users/shreyansh/Documents/ChatGPT/Junction/kori/artifacts/independent-key.json), [contrast checks](/Users/shreyansh/Documents/ChatGPT/Junction/kori/artifacts/contrast.json). All named acceptance images are in screenshots/kori/. Shell measurements confirm matching header, Ask and tab dimensions, Figtree loaded and no horizontal overflow across the customers. Keyboard-only, reduced-motion, label correction, state restoration, partial-transfer Undo and recording-day checks pass.
