# Final independent two-pass review

Reviewed 14 November 2026, Helsinki, after the final rollover deployment at https://kori-wheat.vercel.app. Final source commit: `7b8f6e5662ef3f08e225c04b29806cef47446763`. Deployment supplied by implementation owner: `dpl_EYthCCthu13qgaqGR14v9xHXDA3F`.

## Verdict

**Pass for the reviewed product flow and build quality. No unresolved release blocker found in the reviewed scope.** The earlier forecast, reset, interaction and recording-day defects were corrected and regression-tested. Lint still produces warnings; this is not a zero-warning claim. Grocery trend replaces Bonus under the explicit decision in DECISIONS.md.

## Pass one: spec fit

The deployed build implements the shared banking shell, username/PIN login, profile logout, three visibly different homes, payment proofs, editable labels, Ask answers/pinning and the explanation/override screen. The refreshed three-home screenshot shows the game, timeline and calendar within a consistent shell. Aino's unintended warning is gone.

Mikko's selected Saturday action, all three goal markers, the home date and baseline ghosts are visible together in the refreshed timeline screenshot. Laura's transfer action is visible before the move; the cleared calendar, confirmation and zero-point forecast are visible afterward. These resolve the earlier screenshot findings.

The current-date requirement now survives the recording day. I independently ran the deployed recording-day test with the browser clock at 15 November. It verified **+€200 measured** for Saturday savings, **November 2029 measured** after selecting the chip, a Monday first calendar cell and the exact **2 Nov–15 Nov measured** grocery period. The unit tests additionally cover 1 December and verify the Saturday amount, payment count and chip amount.

Accepted documented variation: grocery comparison instead of Bonus thresholds. The stand-in Bonus table is not presented as real data. Do not claim the original €38 Bonus receipt was tested; that feature was replaced under DECISIONS.md.

Screenshots use disabled animations during capture to avoid transient sheet frames; product motion remains enabled. Images inspected across the review passes, with the changed receipt, Ask and Large-text images rechecked during the final UI review:

- `screenshots/kori/03-three-desktop.png`
- `screenshots/kori/09-mikko-800-desktop.png`
- `screenshots/kori/11-laura-short-desktop.png`
- `screenshots/kori/12-laura-fixed-desktop.png`
- `screenshots/kori/12b-laura-balance-desktop.png`
- `artifacts/e2e/recording-day-rollover.png`
- Final `screenshots/kori/06-aino-receipt-desktop.png`, `17-ask-answer-desktop.png` and `21-laura-large-text-phone.png`

Earlier review passes also inspected login, café landing and initial desktop evidence. Final receipt footer spacing is clear, Ask shows its own unselected chips, and Large calendar labels fit within the taller cells. I inspected all six final shell JSON files: header/Ask/tab client heights are **55/63/61 pixels measured**, corresponding to specified outer heights **56/64/62 pixels measured** including their borders; account rows are **44 pixels measured**. Values match across customers at each width. Every file reports Figtree loaded, tabular numerals and no horizontal overflow. The contrast artifact records passing ratios for its tested palette pairs. This is not a claim that every animation frame or every optional screen was independently measured pixel by pixel.

## Pass two: build quality

Independently rerun on the final source:

| Command | Result |
| --- | --- |
| `npm run build --prefix app` | Pass, exit 0 |
| `npm run lint --prefix app` | Pass, exit 0, warnings remain |
| `npm test --prefix app` | **24 tests passed measured**, two files |
| Deployed reviewer regression selection on preceding deployment, separate output directory | **5 deployed tests passed measured** |
| Final deployed embed-guard probe | Pass; three allowed homes, direct/root-frame login required, zero page errors |

Across the review passes, independent browser checks exercise keyboard-only login, guessing, receipt open/close and focus restoration, changing the saving slider, making the transfer and logout. The recording-day check verifies the corrected weekday behavior. Final tests additionally reconcile the runway receipt at **€17.36 measured**, baseline saving receipt at **€600.00 measured** and completed three-round game behavior.

The latest full deployed acceptance report, `artifacts/e2e/results.json`, records **10 passed measured**, **0 failed measured**, **0 flaky measured**, **0 skipped measured**, duration **58.88 seconds measured**. This includes the desktop and phone flows. That complete suite was run by the implementation owner; I inspected its result. On the preceding deployment I independently reran five tests covering receipt relabeling, restored sessions, reduced motion, Bank pagination/search, reset, one-round exit, Ask/pinning/annualization, partial transfers/Undo, all three guessing rounds and runway/baseline receipts. All five passed in **21.5 seconds measured**. The recording-day and keyboard-only tests were independently rerun during the earlier review passes, then passed again in the owner's final full suite. After the final embed-guard deployment, I independently verified all **3 allowed homes measured** under `/three`, login on direct `/embed`, login on `/embed` framed under `/`, **0 account blocks measured** in that disallowed frame, and **0 page errors measured**. Build, lint and all **24 unit tests measured** were independently rerun for this final source commit.

Build output: **2,521 transformed modules measured**; client JavaScript **301.66 kB measured**, gzip **95.46 kB measured**. No bundle-size target was supplied.

Lint warnings remain in legacy components, render-time Date usage, export organization, `lastLabel` mutation during timeline layout and state synchronization. No new blocking diagnostic appeared in the rerun.

## Findings resolved

- Frozen financial clock and date windows: now anchored to current Helsinki date, with explicit dated periods.
- Aino missing Kela income and Mikko duplicate settled salary: covered by forecast regression tests.
- Forbidden visible reset: removed; hidden route and customer-scoped reset tested.
- Fixed Ask slider: independently measured **900 to 910** after ArrowRight; pinning regression passes.
- Incorrect annual subscription multiplication: annualized last-period amount tested at **€281.52 measured**.
- Done falsely claiming three guesses: one-round exit regression passes.
- Partial transfers overwriting state and stale notification deficit: cumulative move, remaining deficit and Undo regressions pass.
- Loan saving streak and failed evidence styling: source corrected; regression covers a missing month.
- Fractional non-currency receipt explanation: source formatting corrected.
- Missing transfer amount/chart movement: animation code added; final endpoint states verified.
- Reanchoring Saturday spending to Sunday evening: actual prior-Saturday anchoring and rebuilt account ledgers now preserve the behavior and receipt evidence.
- Calendar start and grocery labels after rollover: verified on production with a 15 November clock.
- Receipt footer overlap and false rounded label on €16.80: corrected and covered in final full E2E.
- Ask inheriting selected home chips: isolated answer chip state; inspected final answer screenshot and regression result.
- Large calendar month-label overflow: taller cells, final phone screenshot inspected.
- Bank pagination with exhausted search: filtered-result visibility corrected; independently rerun Kela search regression passes.
- Embed bypass outside the intended route: restricted to a same-origin parent at exactly `/three`; final production probe and full-suite regression pass.
- Negative historic savings pots: adjusted generated deposits/withdrawal and added nonnegative-history regression. All current story totals remain covered by the arithmetic suite.

## Remaining limits

No real bank transfer, loan booking or production banking authentication is asserted. The customer data is invented, and the app explicitly identifies the test environment. This review validates the requested banking prototype and recorded user flow. It does not independently certify every taste-gate measurement or unspecified edge case.
