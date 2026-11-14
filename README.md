# Kori

One bank. A different app for every life.

Kori is a money tab designed for S-mobiili. A fixed rule chooses Play, Plan or Month from age and transaction behaviour. The bank shell stays the same. The lead tool, module order, voice and text density change. Customers can inspect and override the choice in “Why this home?”.

The production build is https://kori-wheat.vercel.app. The three invented customers are available through the login screen. `/three` contains live interactive instances. `/embed?customer=...` skips login only when embedded. The unlinked `/reset?customer=aino|mikko|laura|all` clears session actions.

## Run and verify

```sh
cd app
npm install
npm run generate
npm run dev
npm run build
npm run lint
npm test
BASE_URL=https://kori-wheat.vercel.app npm run test:e2e
```

Generate the independent cent-arithmetic key from the official-column CSV files before changing financial expectations:

```sh
python3 app/scripts/independent_key.py > artifacts/independent-key.json
```

The Vercel project is `kori`, under `13shreyanshs-projects`, with Root Directory `app`. Deploy from the repository root with `npx vercel deploy --prod --yes`. A Git push does not deploy this project.

## Data and calculations

`app/scripts/generate_customers.py` writes twenty-four months of invented Finnish transactions per customer in the sponsor's original CSV columns and category/type vocabulary. The compact JSON is an adapter of those rows, matching the existing `data/prepare_data.py` convention. Account openings, goals and scheduled e-invoices are customer/account records alongside the transaction history. No real customer data is used.

`app/src/banking/finance.ts` adapts the existing model and computes totals, rules, recurring items, forecasts and source receipts. Each financial proof shows its payments and any derivation. Corrections update the session's transaction labels and recompute the home.

The synthetic story anchors to the real Helsinki date. Weekly Saturday-night patterns stay on actual Saturdays. The calendar starts on the current week's Monday. Tests cover the recording date and a month boundary. Source dates and stable transaction indices keep the underlying ledger auditable after reanchoring.

`app/api/route.js` sends only the question to Gemini and accepts a block identifier plus parameters copied from the question. Arithmetic and wording templates stay in code. A timeout or unavailable model uses the local router. No API key enters the client bundle or receipts.

Bonus rates and cooperative eligibility have not been connected. The approved fallback shows the grocery basket and its S Group purchase receipts. It does not quote an estimated Bonus.

Savings actions, approvals, plans and corrections persist per customer in session storage. They are working actions in the test account, with no connection to a banking transfer or booking API. The loan appointment sheet states that no booking is sent.

## Evidence

`artifacts/independent-key.json` contains the independently recomputed fixture values. `artifacts/e2e/` contains deployed test results and screenshots. `screenshots/kori/` contains the named design acceptance images. `artifacts/review.md` records the independent spec and build-quality review. `DEMO_SCRIPT.md` is the two-minute path of real user actions.

The older coach/persona evaluation code remains in `eval/` as historical work. Its benchmark results are not measurements of this rebuilt home selector.
