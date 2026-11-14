# Metric changes log

Every change to a metric is written here with the evidence, so a score jump can always be traced
to either a better coach or a corrected metric. A metric is only changed after a human read the
failing outputs and judged the metric (not the answer) wrong.

| When | Metric | Change | Evidence |
|---|---|---|---|
| Sat 14:00 | `language` | Finnish detector missed real Finnish ("Vakaa suunnittelija. Viimeisen 3 kuukauden aikana…") | Read the failing output: it is fluent Finnish. Widened the word list. |
| Sat 14:00 | `teaches` (concepts) | Concept answers are scored on whether they include a personal example with the customer's own number, instead of a keyword match | "Explain compound interest" answer contained a personal € example but no keyword. Personal examples are the design goal for concepts. |
| Sat 14:00 | split design | Fixed sets (safety, Finnish, concepts, off-topic) had the SAME questions in dev and held-out | Leak found before any tuning on held-out. Now dev uses set A and held-out uses different questions (set B). Baseline re-run after the fix. |
