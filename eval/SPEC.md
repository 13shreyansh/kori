# Answer-key rules (what "correct" means)

1. **Spending** = money out (`tx_amount_eur < 0`) excluding savings transfers, MobilePay/person-to-person transfers and income.
2. **Periods** relative to the last date in the data ("today"): last month = previous calendar month; last 3 months =
   the 3 full calendar months before this one; last 12 months = today − 364 days to today.
3. **Bills (fixed, regular)**: same merchant, ≥ 3 payments, at most ~1.3 per active month, median gap 25–35 days
   (monthly), 80–100 (quarterly) or 6–8 (weekly), gaps within ±3 days (monthly), price variation ≤ 35% for
   bill-type categories and ≤ 5% otherwise, last seen within 1.8 cadences. Irregular must-pay categories never count.
4. **Baskets**: bills → fixed; housing, loans, utilities, telecom, insurance, daycare → fixed; taxes, pharmacy,
   healthcare, car repairs, appliances, home repairs, pets → surprise; everything else → everyday.
5. **What-if**: monthly = spend in the last 3 full months ÷ (days/30.44); yearly saving = monthly × cut% × 12.
6. **Surprise buffer**: surprise costs over the last 12 months ÷ 12.
