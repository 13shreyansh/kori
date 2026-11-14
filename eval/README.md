# Kori evals and hill climbing

The goal is to improve the coach on what S-Pankki judges (financial literacy, AI originality, mobile clarity,
feasibility, S-mobiili fit) without fooling ourselves. Four guard rails:

1. **Independent answer key.** `make_items.py` recomputes every expected number in plain Python from the raw
   transactions, following the written rules in `SPEC.md`. It shares no code with the app, so an engine bug can't
   grade itself as correct.
2. **Dev vs held-out.** Customers are split by id hash. Dev uses question wording A; held-out uses different wording
   and different safety/Finnish/concept questions (B). Tuning only ever looks at dev. Held-out runs are checkpoints,
   logged in `HELDOUT_LEDGER.md`, including when a held-out item got "burned" by being read.
3. **No trading one goal for another.** Hill climbing (`hill_climb.ts`) adopts a candidate only if the macro score
   (every question kind weighted equally) rises AND no rubric group drops more than 2 points.
4. **Humans check the metrics.** Each hill-climb writes a stratified spot-check sheet. Grade it, then
   `agreement.ts` reports where the automatic checks disagree with a person. Metric fixes go in `METRICS_LOG.md`
   with the evidence.

## Checks per answer

| Group (S-Pankki criterion) | Checks |
|---|---|
| Correct & trustworthy (feasibility) | right intent; the expected number appears; **grounded**: every € and % in the text has a receipt (tap-to-verify) |
| Financial literacy (pedagogy) | teaches (a lesson, basket framing, or a personal example for concepts); actionable next step |
| Mobile clarity | ≤ 75 words; average sentence ≤ 24 words |
| Safe & kind | no shaming words; refuses investment/loan/gambling picks and points to an adviser; steers off-topic back |
| S-mobiili fit | answers Finnish questions in Finnish |

## Commands

```bash
python3 eval/make_items.py app/public/data/customers eval/items --per-split 40   # rebuild items + answer key
npx --prefix app tsx eval/run_eval.ts --split dev                                # score the offline coach
GEMINI_API_KEY=... npx --prefix app tsx eval/run_eval.ts --split dev --provider gemini --limit 120   # cached
npx --prefix app tsx eval/hill_climb.ts [--checkpoint]                           # try eval/variants/*.json
npx --prefix app tsx eval/agreement.ts eval/spotcheck/<sheet>.csv                # metric vs human
```

Gemini calls are cached by (model, full request) in `eval/cache/`, so re-scoring a variant costs nothing and
`--limit` samples every question kind evenly to cap tokens.

## Honest status

- On the synthetic stand-in data the offline coach is near the ceiling on dev (it's deterministic and the data is
  clean). That is not proof of quality: the real S-Pankki file, held-out wording and human grading are the real tests.
- Hill-climbing targets that matter next: Gemini prompt variants (Finnish fluency, pedagogy, brevity) and
  paraphrase robustness, scored on cached runs.
