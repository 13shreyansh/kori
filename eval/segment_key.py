#!/usr/bin/env python3
"""Independent answer key for behaviour segments, written from eval/SEGMENTS_SPEC.md (not from the TypeScript).
Usage: python3 eval/segment_key.py app/public/data/customers eval/items
Writes items/segments_dev.jsonl and items/segments_heldout.jsonl.
"""
import json, os, sys, glob, hashlib, statistics, datetime as dt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from keylib import normalise, assign_rkeys

src, out = sys.argv[1], sys.argv[2]
INCOME = {'income_salary', 'income_benefits', 'income_pension', 'tax_refund', 'income_other', 'Salary', 'Other Income'}
SAVINGS = {'transfer_savings', 'invest_deposit', 'Invest Deposit'}
SWEEP = {'salary_sweep', 'Salary Sweep'}
NOT_SPEND = INCOME | SAVINGS | SWEEP | {'transfer_p2p', 'invest_withdraw', 'Invest Withdraw'}
FIXED_CATS = {'housing', 'loan_repayment', 'utilities', 'telecom', 'insurance', 'childcare', 'subscriptions', 'Housing', 'Utilities'}
FIXED_DEFAULT = FIXED_CATS
SURPRISE = {'taxes', 'pharmacy', 'healthcare', 'vehicle_maintenance', 'household_appliances', 'home_improvement', 'pets'}
ESSENTIAL_EVERYDAY = {'groceries', 'public_transport', 'fuel', 'parking'}
WINDOW = 182

def rec_bills(tx, today):
    by = {}
    for t in tx:
        if t['amount'] < 0 and t['category'] not in NOT_SPEND: by.setdefault(t['rkey'], []).append(t)
    out = set()
    for m, ts in by.items():
        ts.sort(key=lambda t: t['date'])
        if len(ts) < 3 or ts[0]['category'] in SURPRISE: continue
        if len(ts) > len({(t['date'].year, t['date'].month) for t in ts}) * 1.3: continue
        gaps = [(ts[i + 1]['date'] - ts[i]['date']).days for i in range(len(ts) - 1)]
        g = statistics.median(gaps)
        cad = 30 if 25 <= g <= 35 else 91 if 80 <= g <= 100 else 7 if 6 <= g <= 8 else 0
        if not cad or statistics.median([abs(x - g) for x in gaps]) > {7: 1, 30: 3, 91: 7}[cad]: continue
        a = [-t['amount'] for t in ts]
        if statistics.pstdev(a) / statistics.fmean(a) > (0.35 if ts[0]['category'] in FIXED_CATS else 0.05): continue
        if (today - ts[-1]['date']).days > cad * 1.8: continue
        out.add(m)
    return out

def features(j):
    c = {k: i for i, k in enumerate(j['columns'])}
    tx = [dict(date=dt.date.fromisoformat(r[c['date']]), amount=float(r[c['amount']]), category=normalise(r[c['category']], r[c['mcc']]),
               merchant=r[c['merchant']], balance=r[c['balance']]) for r in j['tx']]
    assign_rkeys(tx, NOT_SPEND)
    today = max(t['date'] for t in tx)
    rec = rec_bills(tx, today)  # recurrence uses the whole history, like the app
    start = today - dt.timedelta(days=WINDOW - 1)
    w = [t for t in tx if start <= t['date'] <= today]
    months = WINDOW / 30.44
    income = sum(t['amount'] for t in w if t['amount'] > 0 and t['category'] in INCOME)
    pension = sum(t['amount'] for t in w if t['amount'] > 0 and t['category'] == 'income_pension')
    sweep = -sum(t['amount'] for t in w if t['amount'] < 0 and t['category'] in SWEEP)
    saved = -sum(t['amount'] for t in w if t['amount'] < 0 and t['category'] in SAVINGS)
    def basket(t):
        if t['rkey'] in rec: return 'fixed'
        if t['category'] in SURPRISE: return 'surprise'
        if t['category'] in FIXED_DEFAULT: return 'fixed'
        return 'everyday'
    sp = [t for t in w if t['amount'] < 0 and t['category'] not in NOT_SPEND]
    spend = -sum(t['amount'] for t in sp)
    fixed = -sum(t['amount'] for t in sp if basket(t) == 'fixed')
    every = [t for t in sp if basket(t) == 'everyday']
    slips = [t for t in every if t['category'] not in ESSENTIAL_EVERYDAY and -t['amount'] < 20]
    eod = {}
    for t in w:
        if t['balance'] is not None: eod[t['date']] = float(t['balance'])
    ratio = lambda x: x / income if income > 0 else (float('inf') if x > 0 else 0)
    return dict(age=j['age'], income_pm=income / months, pension_share=pension / income if income > 0 else 0,
                sweep_share=sweep / income if income > 0 else 0, savings_rate=saved / income if income > 0 else 0,
                spend_ratio=ratio(spend), fixed_share=ratio(fixed), everyday_pm=len(every) / months,
                slips_pw=len(slips) / (WINDOW / 7), low_balance=(sum(1 for b in eod.values() if b < 100) / len(eod)) if eod else 0)

def segment(f):
    if f['income_pm'] > 0 and f['sweep_share'] >= 0.30: return 'pass_through'
    if f['everyday_pm'] < 10: return 'light_user'
    if f['age'] >= 65 or f['pension_share'] >= 0.5: return 'golden_years'
    if f['age'] <= 25 or f['income_pm'] < 1300: return 'starter'
    if f['spend_ratio'] >= 1.0 or f['low_balance'] >= 0.25: return 'stretched'
    if f['slips_pw'] >= 2.5: return 'grazer'
    if f['savings_rate'] >= 0.05: return 'saver'
    if f['fixed_share'] >= 0.45: return 'fixed_heavy'
    return 'steady'

os.makedirs(out, exist_ok=True)
rows = {'dev': [], 'heldout': []}
for p in sorted(glob.glob(os.path.join(src, 'CUST*.json'))):
    j = json.load(open(p))
    split = 'dev' if int(hashlib.sha1(j['id'].encode()).hexdigest(), 16) % 2 == 0 else 'heldout'
    f = features(j)
    rows[split].append(dict(customer=j['id'], expect=segment(f), features={k: (round(v, 4) if v != float('inf') else 'inf') for k, v in f.items()}))
for s, r in rows.items():
    with open(os.path.join(out, f'segments_{s}.jsonl'), 'w') as fh:
        for x in r: fh.write(json.dumps(x) + '\n')
    print(s, len(r), 'customers')
