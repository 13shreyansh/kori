# What already exists, and where Kori differs

Researched Sat 14 Nov 2026.

| Product | What it does | Gap Kori fills |
|---|---|---|
| bunq Finn (since Dec 2023; Claude on Bedrock) | Answers spending and support questions, routes to humans, no account actions | General Q&A, no teaching model |
| Revolut AIR (UK, Apr 2026) | "Where's my money going?", "How much can I save?", cancels subscriptions, freezes cards | Action-oriented, also shows stock prices (Kori deliberately refuses picks) |
| Starling Assistant (Mar 2026, Gemini) | Agentic: creates savings pots and transfers | Acts on money; Kori stays read-only and explains |
| FintNet (open source, PSD2 sandboxes) | Claude Haiku with 7 deterministic tools, "code computes every figure", shows the tool trail | Closest prior art for grounding. Kori goes further: every number in the sentence is tappable and opens its payments |
| ai-finance-coach (open source) | Self-hosted, LLM never sees raw bank data, deterministic analytics | Same privacy idea; no pedagogy, desktop |
| Ray finance (open source) | "CFO personality", daily score, achievements | Gamified, US-centric, gives recommendations |

## So "chat with your bank data, with tools doing the maths" is table stakes. Kori's distinct parts

1. **S-Pankki's three baskets as the teaching model**, on the home screen and in every answer.
2. **Surprise costs made predictable**: last year's irregular must-pays become a monthly buffer inside safe-to-spend.
3. **Receipts in the sentence**: each € figure is a chip that opens the formula and the exact payments.
4. **Guess first**: the user estimates a habit before seeing it. Being wrong is the lesson.
5. **Totals-only privacy**: the LLM sees tool summaries, never raw payments (MyData spirit).
6. **Finnish answers** and Statistics Finland benchmarks.
7. **Verified quality**: independent answer key, held-out questions, human spot checks.
