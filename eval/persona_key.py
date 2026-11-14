#!/usr/bin/env python3
"""Independent answer key for the 16 personas (eval/PERSONAS_SPEC.md). Reuses the segment features from segment_key.py.
Usage: python3 eval/persona_key.py app/public/data/customers eval/items
"""
import json, os, sys, glob, hashlib, datetime as dt, statistics
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from keylib import normalise
src, out = sys.argv[1], sys.argv[2]

def income_cv(j):
    c = {k: i for i, k in enumerate(j['columns'])}
    rows = [(r[c['date']], float(r[c['amount']]), normalise(r[c['category']], r[c['mcc']])) for r in j['tx']]
    today = max(r[0] for r in rows)
    y, m = int(today[:4]), int(today[5:7])
    months = []
    for k in range(1, 7):
        mm = m - k; yy = y
        while mm <= 0: mm += 12; yy -= 1
        months.append(f'{yy:04d}-{mm:02d}')
    INCOME = {'income_salary', 'income_benefits', 'income_pension', 'tax_refund', 'income_other'}
    by = {k: 0.0 for k in months}
    for d, a, cat in rows:
        if a > 0 and cat in INCOME and d[:7] in by: by[d[:7]] += a
    xs = list(by.values()); mu = sum(xs) / len(xs)
    return 0.0 if mu <= 0 else statistics.pstdev(xs) / mu

def persona(f, cv):
    if f['age'] >= 65 or f['pension_share'] >= 0.5: stage = 'golden'
    elif f['age'] <= 25: stage = 'starter'
    elif f['age'] <= 39: stage = 'builder'
    else: stage = 'established'
    if f['income_pm'] > 0 and f['sweep_share'] >= 0.30: style = 'pass_through'
    elif f['spend_ratio'] >= 1.0 or f['low_balance'] >= 0.25: style = 'tightrope'
    elif f['savings_rate'] >= 0.05: style = 'saver'
    else: style = 'steady'
    traits = []
    if f['slips_pw'] >= 2.5: traits.append('taps')
    if f['everyday_pm'] < 10: traits.append('quiet')
    if f['fixed_share'] != float('inf') and f['fixed_share'] >= 0.45: traits.append('bills')
    if cv > 0.35: traits.append('irregular')
    return stage, style, traits

if __name__ == '__main__':
    from segment_key import features
    rows = {'dev': [], 'heldout': []}
    for p in sorted(glob.glob(os.path.join(src, 'CUST*.json'))):
        j = json.load(open(p))
        split = 'dev' if int(hashlib.sha1(j['id'].encode()).hexdigest(), 16) % 2 == 0 else 'heldout'
        stage, style, traits = persona(features(j), income_cv(j))
        rows[split].append(dict(customer=j['id'], stage=stage, style=style, traits=traits))
    for s, r in rows.items():
        with open(os.path.join(out, f'personas_{s}.jsonl'), 'w') as fh:
            for x in r: fh.write(json.dumps(x) + '\n')
        print(s, len(r), 'customers')
