# Kori Job 02 independent review

Verdict: PASS for Job 02. No release-blocking finding in the reviewed changes.

Reviewed source commit `34fed584896794b87c15e79ab9b53bb3d3a8463b` and the deployed application at https://kori-wheat.vercel.app on 14 November 2026, approximately 23:37 EET. The review used headless Chromium as authorized for this job. No source files were edited.

## Pass one: spec fit on the deployed application

Read AGENTS.md, DECISIONS.md, DESIGN-DIRECTION.md, DESIGN-FLOOR.md and TASTE-GATE.md. Compared the deployed login, overview and café result with the prescribed Figtree type, banking shell, colours, spacing and state behavior.

- The overview renders all three customers with text, balances and their distinct lead blocks. Laura's account line, weekday labels, calendar dates and warning are fully painted. Figtree is loaded in every frame. A cold-font interception kept Laura's account and calendar in the DOM but prevented the overview from revealing any phone until the font was ready. This supports the font-paint diagnosis, rather than missing account data.
- The café landing has both markers, the difference label and payment rows. The measured label-to-paragraph gap is 20px at both tested widths, matching the Roomy module gap. The result no longer has the reported empty band.
- The login footer has the exact prescribed two lines, measured 12px font size, 500 weight, specified secondary spruce colour and 28px clearance. The independent deployed checks passed at both desktop and phone widths. No reset button or reset link appears in the profile.
- The real current Helsinki date appeared in Laura's account greeting. The deployed midnight test advanced an already-open home from Saturday 14 November to Sunday 15 November and moved the shortfall marker from the 26th to the 27th. The unit regression also advances financial dates without reimporting the module.
- Shared shell dimensions measured 56px header, 64px Ask bar and 62px tab bar for all three customers. No horizontal overflow was measured in any overview phone. The phone-width result has no desktop bezel or fake status bar.

Visually inspected the freshly generated acceptance images `screenshots/kori/03-three-desktop.png` and `screenshots/kori/05-aino-landed-desktop.png`, plus independent live captures:

- `artifacts/job02/reviewer-three.png`
- `artifacts/job02/reviewer-login.png`
- `artifacts/job02/reviewer-aino-result.png`
- `artifacts/job02/reviewer-aino-phone.png`
- `artifacts/job02/overview-held-font.png`

The grocery-basket alternative to Bonus remains an authorized decision. This review does not claim verification of an S Group Bonus table.

## Pass two: build quality and regressions

Independently reran the following commands from `app/` against the reviewed source:

| Check | Measured result |
| --- | --- |
| `npm run build` | Pass |
| `npm run lint` | Exit 0, 20 warnings, no errors |
| `npm test` | 25 tests passed |
| `npx playwright test tests/job02.spec.ts --reporter=list --output=../artifacts/job02/reviewer-test-output` | 7 tests passed in 10.2 seconds |

The deployed regression run covered delayed font readiness, the café gap at both widths, account-fetch failure with successful retry, open-session midnight rollover, and footer/hidden-reset rules at both widths. Independent live navigation recorded zero console errors and zero page exceptions. Raw browser measurements are in `artifacts/job02/reviewer-observations.json`.

Read the readiness, error/retry, date and spacing changes. The overview validates message origin and source frame before accepting readiness. Failed or timed-out account loading offers recovery; retry remounts the child frames. Date polling and focus/visibility listeners are cleaned up. The date helper caches only the current second, rather than freezing the module's initial day.

Flagged but not blocking: lint warnings remain, including existing hook, purity, export and arithmetic warnings. The review establishes the requested Job 02 behavior and does not treat a successful build as proof of every unchanged product feature. The owner runs the complete video-flow suite separately. No physical-device test was performed by this reviewer.
