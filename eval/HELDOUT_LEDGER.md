# Held-out ledger

The held-out split is only run at checkpoints, never inside the tuning loop. Every run is logged here.
If we ever fix something by reading a held-out failure, that held-out item is "burned" and noted.

| # | When | Version | Score | Notes |
|---|---|---|---|---|
| 0 | Sat 14:00 | baseline (before any tuning) | 72.3% | Honest starting point. |
| 1 | Sat 14:10 | grounding receipts, Finnish layer, zero-spend answers | 96.4% | Revealed a phrasing gap: baskets and subscriptions paraphrases scored 0% on intent. I read those two phrasings, so they are burned. Fix: a separate dev robustness set written from scratch (eval/items/robust.jsonl), not by copying held-out wording. |
