# Personas: written spec (v2, replaces the 8 segments as what the app shows)

Kori shows each customer one of 16 personas: 4 life stages x 4 money styles, plus behaviour traits on top.
Features, window (182 days ending on the last transaction) and thresholds are those of SEGMENTS_SPEC.md.
Implemented in app/src/engine/personas.ts; re-implemented independently in eval/persona_key.py.

## Life stage (first match)
1. golden: age >= 65, or pension share >= 50%
2. starter: age <= 25
3. builder: age <= 39
4. established: everyone else

## Money style (first match, behaviour only)
1. pass_through: income > 0 and sweep share >= 30%
2. tightrope: spend ratio >= 100%, or low-balance share >= 25%
3. saver: savings rate >= 5%
4. steady: everyone else

## Traits (any number)
- taps: >= 2.5 small taps a week
- quiet: < 10 everyday payments a month
- bills: fixed share >= 45% (and finite)
- irregular: income coefficient of variation > 0.35 over the 6 whole calendar months before the month of `today`
  (positive income rows summed per month; population standard deviation / mean; 0 when the mean is 0)

Gender is not in the data and must never be used. Age is used only for life stage.

## Evals
1. Assignment agreement (dev, held-out): stage, style and the trait set must all match the key.
2. Card checks (code, all customers): the persona card must contain at least one number from the customer's
   own data, a next step (a question to ask), at most 45 words in its body, and no blaming words.
3. Swap test (judge): a judge model that did not write the copy sees one customer's numbers and two home
   screens as text: the customer's own and another persona's. It picks the one that fits. Accuracy well above
   50% shows the personalisation is distinct and true to the data. The floor is the same test run with every
   customer shown the same generic card (50% by construction). Judge labels are checked against 20 hand labels.
