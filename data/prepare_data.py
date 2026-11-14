#!/usr/bin/env python3
"""Turn S-Pankki's tx_junction_transactions.csv into compact files the Kori app loads.

Usage: python3 prepare_data.py <dir with the 4 CSVs> <out dir> [--sample 400]
Streams the 346 MB CSV once (stdlib only). Writes:
  profile.json            column/value profile (categories, types, MCCs, date formats, samples)
  customers/<id>.json     full transactions for a stratified sample of customers
  monthly_agg.csv.gz      customer_id,month,category,mcc,spend,income,count for ALL customers
"""
import csv, gzip, json, os, re, sys, random, collections, datetime as dt

src, out = sys.argv[1], sys.argv[2]
n_sample = int(sys.argv[sys.argv.index('--sample') + 1]) if '--sample' in sys.argv else 400
os.makedirs(os.path.join(out, 'customers'), exist_ok=True)

MON = {m: i + 1 for i, m in enumerate('JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split())}
def parse_date(s):
    s = (s or '').strip()
    if not s: return None
    m = re.match(r'^(\d{1,2})([A-Za-z]{3})(\d{2,4})', s)  # SAS 26MAY26 / 26MAY2026:..
    if m:
        y = int(m.group(3)); y = y + 2000 if y < 100 else y
        return dt.date(y, MON[m.group(2).upper()], int(m.group(1))).isoformat()
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})', s)
    if m: return s[:10]
    m = re.match(r'^(\d{1,2})\.(\d{1,2})\.(\d{4})', s)
    if m: return dt.date(int(m.group(3)), int(m.group(2)), int(m.group(1))).isoformat()
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})', s)
    if m: return dt.date(int(m.group(3)), int(m.group(1)), int(m.group(2))).isoformat()
    return None
def num(s):
    try: return float(str(s).replace(',', '.').replace(' ', ''))
    except: return None

tx_path = os.path.join(src, 'tx_junction_transactions.csv')
with open(tx_path, 'rb') as f:
    head = f.read(200)
if head.startswith(b'version https://git-lfs'):
    sys.exit('tx_junction_transactions.csv is only a Git LFS pointer; download the real file first')

custs = list(csv.DictReader(open(os.path.join(src, 'tx_customers_junction.csv'), encoding='utf-8-sig')))
age = {c['customer_id']: int(c['customer_age']) for c in custs}
post = {c['customer_id']: c['customer_postal_code'] for c in custs}
mtg = set()
try:
    for r in csv.DictReader(open(os.path.join(src, 'mtg_tx_customer_link_and_final_mtg_infio.csv'), encoding='utf-8-sig')):
        mtg.add(r['customer_id'])
except FileNotFoundError: pass

# stratified sample: by age band, always include mortgage customers up to 1/4 of the sample
random.seed(2026)
bands = collections.defaultdict(list)
for cid, a in age.items(): bands[min(a // 10, 7)].append(cid)
sample = set(random.sample(sorted(mtg), min(len(mtg), n_sample // 4)))
per = max(1, (n_sample - len(sample)) // len(bands))
for b in sorted(bands): sample.update(random.sample(sorted(bands[b]), min(per, len(bands[b]))))

prof = dict(rows=0, columns=None, category=collections.Counter(), category_sum=collections.defaultdict(float),
            transaction_type=collections.Counter(), type_sign=collections.defaultdict(lambda: [0, 0]),
            mcc=collections.Counter(), mcc_cat=collections.defaultdict(collections.Counter),
            date_examples=[], ts_examples=[], raw_samples=[], bad_dates=0, min_date=None, max_date=None,
            merchants=set(), customers=set(), accounts=set())
agg = collections.defaultdict(lambda: [0.0, 0.0, 0])
per_cust = collections.defaultdict(list)

with open(tx_path, encoding='utf-8-sig', newline='') as f:
    rd = csv.DictReader(f)
    prof['columns'] = rd.fieldnames
    for i, r in enumerate(rd):
        prof['rows'] += 1
        if i < 25 or random.random() < 2e-5:
            if len(prof['raw_samples']) < 60: prof['raw_samples'].append(r)
        if len(prof['date_examples']) < 10 and r.get('tx_date') not in prof['date_examples']:
            prof['date_examples'].append(r.get('tx_date')); prof['ts_examples'].append(r.get('tx_timestamp'))
        d = parse_date(r.get('tx_date')) or parse_date(r.get('tx_timestamp'))
        if not d: prof['bad_dates'] += 1; continue
        prof['min_date'] = min(prof['min_date'] or d, d); prof['max_date'] = max(prof['max_date'] or d, d)
        amt = num(r.get('tx_amount_eur')) or 0.0
        cat = r.get('category') or ''; ty = r.get('transaction_type') or ''; mcc = r.get('mcc_code') or ''
        cid = r.get('customer_id')
        prof['category'][cat] += 1; prof['category_sum'][cat] += amt
        prof['transaction_type'][ty] += 1; prof['type_sign'][ty][0 if amt < 0 else 1] += 1
        prof['mcc'][mcc] += 1; prof['mcc_cat'][mcc][cat] += 1
        if len(prof['merchants']) < 2_000_000: prof['merchants'].add(r.get('merchant_id'))
        prof['customers'].add(cid); prof['accounts'].add(r.get('bank_account_id'))
        a = agg[(cid, d[:7], cat, mcc)]
        if amt < 0: a[0] += -amt
        else: a[1] += amt
        a[2] += 1
        if cid in sample:
            per_cust[cid].append([d, (r.get('tx_timestamp') or '')[-8:], round(amt, 2), num(r.get('balance_after_eur')),
                                  cat, ty, r.get('merchant_id') or '', mcc, r.get('bank_account_id') or ''])
        if prof['rows'] % 500000 == 0: print(prof['rows'], 'rows', file=sys.stderr)

# sign convention check: if most amounts are positive, spend may be positive; record it
pos = sum(v[1] for v in prof['type_sign'].values()); neg = sum(v[0] for v in prof['type_sign'].values())
profile = dict(rows=prof['rows'], columns=prof['columns'], bad_dates=prof['bad_dates'], min_date=prof['min_date'],
               max_date=prof['max_date'], n_customers=len(prof['customers']), n_accounts=len(prof['accounts']),
               n_merchants=len(prof['merchants']), positive_amounts=pos, negative_amounts=neg,
               category=[[k, v, round(prof['category_sum'][k], 2)] for k, v in prof['category'].most_common()],
               transaction_type=[[k, v, prof['type_sign'][k]] for k, v in prof['transaction_type'].most_common()],
               mcc=[[k, v, prof['mcc_cat'][k].most_common(3)] for k, v in prof['mcc'].most_common(400)],
               date_examples=prof['date_examples'], ts_examples=prof['ts_examples'], raw_samples=prof['raw_samples'])
json.dump(profile, open(os.path.join(out, 'profile.json'), 'w'), indent=1, ensure_ascii=False)

cols = ['date', 'time', 'amount', 'balance', 'category', 'type', 'merchant', 'mcc', 'account']
index = []
for cid, rows in per_cust.items():
    rows.sort(key=lambda x: (x[0], x[1]))
    json.dump(dict(id=cid, age=age.get(cid), postal_code=post.get(cid), has_mortgage_application=cid in mtg,
                   columns=cols, tx=rows), open(os.path.join(out, 'customers', cid + '.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    index.append(dict(id=cid, age=age.get(cid), postal_code=post.get(cid), n=len(rows), mortgage=cid in mtg))
json.dump(sorted(index, key=lambda x: x['id']), open(os.path.join(out, 'customers', 'index.json'), 'w'), indent=0)

with gzip.open(os.path.join(out, 'monthly_agg.csv.gz'), 'wt', newline='') as g:
    w = csv.writer(g); w.writerow(['customer_id', 'month', 'category', 'mcc', 'spend', 'income', 'count'])
    for (cid, m, cat, mcc), (s, inc, n) in agg.items():
        w.writerow([cid, m, cat, mcc, round(s, 2), round(inc, 2), n])
print('done', prof['rows'], 'rows;', len(per_cust), 'sample customers ->', out)
