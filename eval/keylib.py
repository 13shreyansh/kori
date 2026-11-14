"""Shared helpers for the Python answer keys (written from SPEC.md, independent of the TypeScript).

normalise(): the real S-Pankki file uses broad categories ('Transportation', 'Health', ...) plus an MCC.
We map them to the fine-grained keys the spec talks about (taxi, fuel, pharmacy...). The table lists every
MCC seen in the real file's profile (data/profile.json), so nothing is guessed from ranges.

assign_rkeys(): the recurrence grouping key from SPEC.md §3. Bill payments in the real file have no merchant,
so they are grouped by category; a category group that appears more than 1.3 times a month is split into
clusters of similar amounts (a new cluster starts when one amount is over 1.25x the previous one).
"""
MCC = {
    **{m: 'groceries' for m in ('5411', '5499', '5422', '5451')},
    **{m: 'restaurants_cafes' for m in ('5812', '5814', '5813')},
    '5542': 'fuel', '5541': 'fuel', '7523': 'parking', '4111': 'public_transport', '4121': 'taxi',
    '5912': 'pharmacy', '8011': 'healthcare', '8099': 'healthcare', '8021': 'healthcare',
    **{m: 'entertainment' for m in ('7922', '7999', '7832', '7991', '7996')},
    '5200': 'home_improvement', '5251': 'home_improvement', '5732': 'electronics', '5734': 'electronics', '5712': 'furniture',
    '5941': 'sports', '5651': 'clothing', '5691': 'clothing', '5999': 'online_shopping', '5942': 'hobbies', '5945': 'hobbies',
    **{m: 'travel' for m in ('4722', '4511', '7011', '7512')},
}
REAL = {'Groceries': 'groceries', 'Restaurants': 'restaurants_cafes', 'Transportation': 'public_transport', 'Utilities': 'utilities',
        'Entertainment': 'entertainment', 'Health': 'healthcare', 'Home & Tech': 'electronics', 'Housing': 'housing', 'Lifestyle': 'clothing',
        'Travel': 'travel', 'Salary': 'income_salary', 'Other Income': 'income_other', 'Invest Deposit': 'invest_deposit',
        'Salary Sweep': 'salary_sweep', 'Invest Withdraw': 'invest_withdraw'}
LABEL = {'housing': 'Rent & housing', 'utilities': 'Electricity & water'}

def normalise(category, mcc):
    if category in REAL:
        if category in ('Groceries', 'Housing', 'Salary', 'Other Income', 'Invest Deposit', 'Salary Sweep', 'Invest Withdraw'):
            return REAL[category]
        return MCC.get(mcc or '', REAL[category])
    return category

def assign_rkeys(tx, excluded):
    """Sets t['rkey'] on every spending row. `excluded` = categories that are not spending."""
    groups = {}
    for t in tx:
        t['rkey'] = t['merchant'] or ('CAT:' + t['category'])
        if t['amount'] < 0 and t['category'] not in excluded: groups.setdefault(t['rkey'], []).append(t)
    for k, ts in groups.items():
        if not k.startswith('CAT:'): continue
        months = len({(t['date'].year, t['date'].month) for t in ts})
        if len(ts) <= months * 1.3: continue
        cluster, n = [], 0
        for t in sorted(ts, key=lambda t: t['amount']):
            if cluster and cluster[-1]['amount'] / t['amount'] > 1.25:
                n += 1
            cluster.append(t); t['rkey'] = f'{k}~{n}'
