Implement the README sponsor additions without touching the Junction portal or submitted descriptions.
Use isolated feature work and preserve the current live product until verification passes.
Add real CRACI CI and Gemma card routing through Featherless.
Require regression tests, real provider receipts and deployed desktop/mobile acceptance.
Publish only after independent spec and quality review; keep secrets out of files and logs.

ENTRY Kori Job 02 / 2026-11-14 23:40 EET / app commit 34fed58 / https://kori-wheat.vercel.app

DONE:

- Fixed Laura’s missing text: her data was loaded, but her font was not. The overview now reveals the phones together after every customer’s data and fonts are ready, with retry on failure.
- Tightened Aino’s result gap to the specified module gap at both widths.
- Removed APP_TODAY; an open home updates across Helsinki midnight. Verified the hidden /reset route and exact login footer. Redeployed and re-shot the full customer flow after fresh resets.

NUMBERS: dev 25/25 unit tests and 17/17 deployed browser checks, 69.48 seconds, with 0 console errors in the main flows (measured). Held-out: not rerun. Baseline result gap 63px → 20px at both 1440 and 390 widths (measured).

SCREENSHOTS: [03-three-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/03-three-desktop.png) · [18-aino-phone.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/18-aino-phone.png) · [05-aino-landed-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/05-aino-landed-desktop.png)

REVIEW: PASS, separate gpt-6-astra deployed spec-fit and build-quality review. No blocking findings; lint passes with 20 warnings (measured). [Review](/Users/shreyansh/Documents/ChatGPT/Junction/kori/artifacts/job02/review.md).

NEXT: Review the refreshed shots and record DEMO_SCRIPT.md.
NEEDS DECISION: none
BLOCKED: none

Attachments: [Full desktop and phone screenshots](/Users/shreyansh/Documents/ChatGPT/Junction/kori/artifacts/job02/screenshots.zip) · [Deployed test results](/Users/shreyansh/Documents/ChatGPT/Junction/kori/artifacts/job02/results.json) · [Font-race diagnosis](/Users/shreyansh/Documents/ChatGPT/Junction/kori/artifacts/job02/overview-font-diagnosis-baseline.json).

Spec gaps I filled: plain loading and retry messages for the overview. Verification used the requested headless Chromium because the IAB host was unavailable.

Taste gate rechecked on the deployed site:

| Item | Verdict | Screenshot |
| --- | --- | --- |
| 1. Professional product | yes | [03-three-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/03-three-desktop.png) |
| 2. Real working features | yes | [05-aino-landed-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/05-aino-landed-desktop.png) |
| 3. Login entry override | yes | [01-login-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/01-login-desktop.png) |
| 4. Working controls | yes | [16-profile-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/16-profile-desktop.png) |
| 5. Computed numbers and receipts | yes | [06-aino-receipt-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/06-aino-receipt-desktop.png) |
| 6. Design spec | yes | [03-three-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/03-three-desktop.png) |
| 7. Specified primary actions | yes | [04-aino-ask-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/04-aino-ask-desktop.png) |
| 8. Plain banking copy | yes | [10-mikko-loan-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/10-mikko-loan-desktop.png) |
| 9. Clear purpose | yes | [03-three-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/03-three-desktop.png) |
| 10. Calm composition | yes | [09-mikko-800-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/09-mikko-800-desktop.png) |
| 11. No default AI decoration | yes | [03-three-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/03-three-desktop.png) |
| 12. Themed surfaces; no overflow | yes | [21-laura-large-text-phone.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/21-laura-large-text-phone.png) |
| 13. Full deployed desktop/phone flow | yes | [20-laura-phone.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/20-laura-phone.png) |
| 14. Visible wow moments | yes | [05-aino-landed-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/05-aino-landed-desktop.png) |
| 15. Stable loading and interactions | yes | [03-three-desktop.png](/Users/shreyansh/Documents/ChatGPT/Junction/kori/screenshots/kori/03-three-desktop.png) |
