# Held-out ledger

The held-out split is only run at checkpoints, never inside the tuning loop. Every run is logged here.
If we ever fix something by reading a held-out failure, that held-out item is "burned" and noted.

| # | When | Version | Score | Notes |
|---|---|---|---|---|
| 0 | Sat 14:00 | baseline (before any tuning) | 72.3% | Honest starting point. |
| 1 | Sat 14:10 | grounding receipts, Finnish layer, zero-spend answers | 96.4% | Revealed a phrasing gap: baskets and subscriptions paraphrases scored 0% on intent. I read those two phrasings, so they are burned. Fix: a separate dev robustness set written from scratch (eval/items/robust.jsonl), not by copying held-out wording. |
| 2 | Sat 16:30 | engine adapted to real S-Pankki categories, salary-forwarder and light-user behaviour in the stand-in data, new coach intents (salary moved out, small taps, where to cut back) | 97.5% | Honest number for this checkpoint. The only failing kind was baskets (0%), the phrasing already burned at #1. Fixed it afterwards (a question naming "surprises" alongside fixed and everyday went to the surprise answer), giving 99.5%, but that 2-point gain is on a burned item and does not count as evidence. |
| S1 | Sat 16:30 | behaviour segments, first held-out run (eval/segment_eval.ts) | 100% spec agreement (109 customers) | Planted truth: salary forwarders 16/16 recalled at 100% precision, light users 11/11 at 100%, retirees 5/5 at 83% precision (one 65+ couple), students 10/10 at 71% precision (starter also covers young workers, by design). 8 segments used, largest 25%. Spot check of 6 cards: 5 fit; one 25-year-old earning €3,584 got "every euro counts", so the starter card copy now depends on income (copy change only, rules unchanged). |
