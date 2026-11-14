#!/usr/bin/env python3
"""Generate a stand-in tx_junction_transactions.csv with the same columns as S-Pankki's file.

Used only until the real 346 MB file is processed. Uses the REAL customer table (ids, ages, postcodes)
so the demo personas line up with real customer ids. Dates use the SAS style seen in the mortgage file.
Usage: python3 generate_synthetic.py <real repo dir with tx_customers_junction.csv> <out dir> [--n 300]
"""
import csv, os, sys, random, datetime as dt, math

src, out = sys.argv[1], sys.argv[2]
N = int(sys.argv[sys.argv.index('--n') + 1]) if '--n' in sys.argv else 300
os.makedirs(out, exist_ok=True)
rng = random.Random(42)
START, END = dt.date(2025, 11, 1), dt.date(2026, 10, 31)
MON = 'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split()
def sas(d, t=None):
    s = f"{d.day:02d}{MON[d.month-1]}{d.year % 100:02d}"
    return s if t is None else f"{s}:{t}"

# merchant catalogue: (merchant_id, category, mcc, typical_amount, sd)
M = {
 'groceries':   [('M_SMARKET_KALLIO','groceries','5411',38,22),('M_PRISMA_ITIS','groceries','5411',72,35),('M_ALEPA_HAKANIEMI','groceries','5411',14,8),('M_LIDL_SORNAINEN','groceries','5411',41,18),('M_KMARKET_TOOLO','groceries','5411',22,12)],
 'cafe':        [('M_ROBERTS_COFFEE','restaurants_cafes','5814',5.4,1.5),('M_ESPRESSO_HOUSE','restaurants_cafes','5814',6.2,1.8),('M_RFOOD_KIOSK','restaurants_cafes','5499',4.1,1.2)],
 'restaurant':  [('M_RAVINTOLA_SAVOTTA','restaurants_cafes','5812',48,20),('M_HESBURGER','restaurants_cafes','5814',11,3),('M_RAVINTOLA_ASTOR','restaurants_cafes','5812',36,14),('M_BAR_ROSKAPANKKI','restaurants_cafes','5813',19,9)],
 'delivery':    [('M_WOLT','food_delivery','5814',24,7),('M_FOODORA','food_delivery','5814',22,6)],
 'alcohol':     [('M_ALKO_KAMPPI','alcohol_tobacco','5921',28,15)],
 'transport':   [('M_HSL_MOBILE','public_transport','4111',3.2,0.4)],
 'taxi':        [('M_TAXI_HELSINKI','taxi','4121',23,9),('M_BOLT','taxi','4121',15,6),('M_UBER','taxi','4121',17,7)],
 'fuel':        [('M_NESTE_PASILA','fuel','5541',62,15),('M_ABC_HYVINKAA','fuel','5541',58,14)],
 'clothing':    [('M_ZALANDO','clothing','5651',64,35),('M_HM_FORUM','clothing','5651',39,20),('M_STOCKMANN','clothing','5311',85,45)],
 'electronics': [('M_GIGANTTI','electronics','5732',180,140),('M_VERKKOKAUPPA','electronics','5732',95,90)],
 'leisure':     [('M_FINNKINO','entertainment','7832',15,3),('M_LIPPUFI','entertainment','7922',55,25),('M_STEAM','entertainment','5816',19,12)],
 'sport':       [('M_INTERSPORT','sports','5941',60,40)],
 'beauty':      [('M_SOKOS_BEAUTY','personal_care','5977',28,15),('M_PARTURI_KALLIO','personal_care','7230',42,10)],
 'online':      [('M_AMAZON_DE','online_shopping','5999',34,25),('M_TEMU','online_shopping','5999',21,14)],
 'pharmacy':    [('M_YLIOPISTON_APTEEKKI','pharmacy','5912',22,15)],
 'health':      [('M_TERVEYSTALO','healthcare','8062',95,60),('M_MEHILAINEN','healthcare','8011',120,70)],
 'dentist':     [('M_HAMMASLAAKARI_OY','healthcare','8021',160,90)],
 'carrepair':   [('M_KAHDEKSIKKO_AUTOHUOLTO','vehicle_maintenance','7538',420,250)],
 'appliance':   [('M_POWER_ITAKESKUS','household_appliances','5722',540,250)],
 'homeimprove': [('M_KRAUTA','home_improvement','5200',110,80),('M_IKEA_VANTAA','furniture','5712',160,120)],
 'vet':         [('M_EVIDENSIA_ELAINLAAKARI','pets','0742',140,80)],
 'travel':      [('M_FINNAIR','travel','3008',260,120),('M_VIKING_LINE','travel','4411',120,60),('M_BOOKING_COM','travel','7011',190,90),('M_VR','travel','4112',38,15)],
}
FIXED = {  # merchant, category, mcc
 'rent': ('M_SATO_VUOKRA','housing','6513'), 'hoa': ('M_AS_OY_VASTIKE','housing','6513'),
 'mortgage': ('M_SPANKKI_LAINA','loan_repayment','6012'), 'electricity': ('M_HELEN_SAHKO','utilities','4900'),
 'water': ('M_HSY_VESI','utilities','4900'), 'phone': ('M_ELISA','telecom','4814'), 'internet': ('M_DNA','telecom','4814'),
 'insurance': ('M_LAHITAPIOLA','insurance','6300'), 'netflix': ('M_NETFLIX','subscriptions','4899'),
 'spotify': ('M_SPOTIFY','subscriptions','5815'), 'gym': ('M_ELIXIA','subscriptions','7997'),
 'hsl_season': ('M_HSL_KAUSI','public_transport','4111'), 'daycare': ('M_HELSINGIN_KAUPUNKI','childcare','8351'),
 'icloud': ('M_APPLE_COM_BILL','subscriptions','5818'), 'yle': ('M_VEROHALLINTO','taxes','9311'),
}

def persona(age, rnd):
    if age < 25: return rnd.choice(['student', 'student', 'young_worker'])
    if age < 35: return rnd.choice(['young_worker', 'young_worker', 'couple'])
    if age < 55: return rnd.choice(['family', 'family', 'couple', 'young_worker'])
    if age < 66: return rnd.choice(['couple', 'family'])
    return 'retiree'

TRUTH = {}  # planted behaviour per customer, written to truth.csv for the segment eval

def gen_customer(cid, age, rnd):
    p = persona(age, rnd)
    leak = rnd.choice([0.5, 1.0, 1.0, 1.5, 2.2])  # how leaky everyday spending is
    income = {'student': rnd.uniform(900, 1300), 'young_worker': rnd.uniform(2100, 3300), 'couple': rnd.uniform(2800, 4300),
              'family': rnd.uniform(3200, 5200), 'retiree': rnd.uniform(1400, 2600)}[p]
    accounts = [f"ACC{cid[4:]}01"] + ([f"ACC{cid[4:]}02"] if rnd.random() < 0.4 else [])
    has_car = p in ('family', 'couple', 'retiree') and rnd.random() < 0.7 or rnd.random() < 0.15
    owns = p in ('family', 'couple', 'retiree') and rnd.random() < 0.55
    pet = rnd.random() < 0.25
    rows = []
    def add(d, amt, merchant, cat, mcc, ttype, t=None):
        if START <= d <= END:
            t = t or f"{rnd.randint(7,22):02d}:{rnd.randint(0,59):02d}:{rnd.randint(0,59):02d}"
            rows.append([d, t, round(amt, 2), merchant, cat, mcc, ttype])
    d = START
    rent = round(income * rnd.uniform(0.28, 0.4) / 10) * 10
    subs = [s for s in ['netflix', 'spotify', 'gym', 'icloud'] if rnd.random() < {'student': .5, 'retiree': .25}.get(p, .55)]
    while d <= END:
        dom = d.day
        # income
        if p == 'student':
            if dom == 1: add(d, 279.0, 'M_KELA_OPINTOTUKI', 'income_benefits', '', 'credit_transfer', '06:00:00')
            if dom == 15: add(d, rnd.uniform(500, 900), 'M_KESATYO_OY', 'income_salary', '', 'credit_transfer', '06:00:00')
        elif p == 'retiree':
            if dom == 4: add(d, income, 'M_ELAKETURVAKESKUS', 'income_pension', '', 'credit_transfer', '06:00:00')
        else:
            pay = dt.date(d.year, d.month, 15 if p == 'family' and cid[-1] in '13579' else 28)
            if d == pay or (pay.weekday() > 4 and d == pay - dt.timedelta(days=pay.weekday() - 4)):
                add(d, income * rnd.uniform(0.98, 1.02), 'M_TYONANTAJA_OY', 'income_salary', '', 'credit_transfer', '06:00:00')
            if p == 'family' and dom == 26: add(d, 194.0, 'M_KELA_LAPSILISA', 'income_benefits', '', 'credit_transfer', '06:00:00')
        # fixed regular
        if dom == 2:
            if owns: add(d, -rnd.uniform(0.9, 1.1) * rent * 0.35, *FIXED['hoa'], 'e_invoice')
            else: add(d, -rent, *FIXED['rent'], 'e_invoice')
        if dom == 5 and owns: add(d, -rent * 0.75, *FIXED['mortgage'], 'loan_payment')
        if dom == 12: add(d, -(35 + 55 * (d.month in (12, 1, 2)) + rnd.uniform(-8, 8)) * (1.6 if owns else 1), *FIXED['electricity'], 'e_invoice')
        if dom == 18: add(d, -rnd.choice([19.9, 24.9, 29.9]), *FIXED['phone'], 'direct_debit')
        if dom == 18 and p != 'student': add(d, -34.9, *FIXED['internet'], 'direct_debit')
        if dom == 20 and d.month in (1, 4, 7, 10): add(d, -rnd.uniform(140, 320), *FIXED['insurance'], 'e_invoice')
        if dom == 8 and owns and d.month % 3 == 0: add(d, -rnd.uniform(60, 110), *FIXED['water'], 'e_invoice')
        if dom == 10 and p == 'family': add(d, -rnd.choice([150, 230, 295]), *FIXED['daycare'], 'e_invoice')
        if dom == 1 and not has_car and p != 'retiree': add(d, -rnd.choice([64.7, 78.6]) if p != 'student' else -39.3, *FIXED['hsl_season'], 'card_payment')
        for i, s in enumerate(subs):
            if dom == 6 + i * 3: add(d, -{'netflix': 13.99, 'spotify': 11.99, 'gym': 54.0, 'icloud': 2.99}[s], *FIXED[s], 'card_payment')
        # everyday
        wd = d.weekday()
        hh = {'family': 1.9, 'couple': 1.4}.get(p, 1.0)
        if rnd.random() < 0.5 + 0.2 * (wd >= 4):
            m = rnd.choice(M['groceries'][:3] if rnd.random() < .7 else M['groceries'])
            add(d, -max(2, rnd.gauss(m[3], m[4])) * hh, m[0], m[1], m[2], 'card_payment')
        if wd < 5 and rnd.random() < 0.35 * leak * (0.4 if p == 'retiree' else 1):
            m = rnd.choice(M['cafe']); add(d, -max(2, rnd.gauss(m[3], m[4])), m[0], m[1], m[2], 'card_payment')
        if rnd.random() < (0.09 + 0.08 * (wd >= 4)) * leak:
            m = rnd.choice(M['restaurant']); add(d, -max(6, rnd.gauss(m[3], m[4])) * (1.6 if p in ('couple', 'family') else 1), m[0], m[1], m[2], 'card_payment')
        if rnd.random() < 0.06 * leak * (2 if p in ('young_worker', 'student') else 0.6):
            m = rnd.choice(M['delivery']); add(d, -max(10, rnd.gauss(m[3], m[4])), m[0], m[1], m[2], 'card_payment', f"{rnd.randint(18,23):02d}:{rnd.randint(10,59)}:00")
        if wd >= 4 and rnd.random() < 0.12 * (0.3 if p == 'student' else 1):
            m = M['alcohol'][0]; add(d, -max(6, rnd.gauss(m[3], m[4])), m[0], m[1], m[2], 'card_payment')
        if rnd.random() < 0.04 * leak + (0.05 if wd >= 4 else 0) * leak:
            m = rnd.choice(M['taxi']); add(d, -max(8, rnd.gauss(m[3], m[4])), m[0], m[1], m[2], 'card_payment', f"{rnd.choice([0,1,2,23,22]):02d}:{rnd.randint(10,59)}:00")
        if not has_car and rnd.random() < 0.08:
            m = M['transport'][0]; add(d, -m[3], m[0], m[1], m[2], 'card_payment')
        if has_car and rnd.random() < 0.09:
            m = rnd.choice(M['fuel']); add(d, -max(20, rnd.gauss(m[3], m[4])), m[0], m[1], m[2], 'card_payment')
        for k, pr in (('clothing', .035), ('online', .03 * leak), ('leisure', .04), ('beauty', .025), ('sport', .01), ('electronics', .006), ('homeimprove', .01)):
            if rnd.random() < pr:
                m = rnd.choice(M[k]); add(d, -max(3, rnd.gauss(m[3], m[4])), m[0], m[1], m[2], 'card_payment')
        if rnd.random() < 0.025 * (1.8 if p == 'retiree' else 1):
            m = M['pharmacy'][0]; add(d, -max(4, rnd.gauss(m[3], m[4])), m[0], m[1], m[2], 'card_payment')
        if rnd.random() < 0.007 * (2 if p in ('retiree', 'family') else 1):
            m = rnd.choice(M['health']); add(d, -max(30, rnd.gauss(m[3], m[4])), m[0], m[1], m[2], 'card_payment')
        if rnd.random() < 0.0035:
            m = M['dentist'][0]; add(d, -max(60, rnd.gauss(m[3], m[4])), m[0], m[1], m[2], 'e_invoice')
        if has_car and rnd.random() < 0.006:
            m = M['carrepair'][0]; add(d, -max(90, rnd.gauss(m[3], m[4])), m[0], m[1], m[2], 'card_payment')
        if rnd.random() < 0.0016:
            m = M['appliance'][0]; add(d, -max(200, rnd.gauss(m[3], m[4])), m[0], m[1], m[2], 'card_payment')
        if pet and rnd.random() < 0.006:
            m = M['vet'][0]; add(d, -max(50, rnd.gauss(m[3], m[4])), m[0], m[1], m[2], 'card_payment')
        if rnd.random() < 0.008 and p != 'student':
            m = rnd.choice(M['travel']); add(d, -max(25, rnd.gauss(m[3], m[4])) * (1.7 if p in ('couple', 'family') else 1), m[0], m[1], m[2], 'card_payment')
        if dom in (3, 4) and rnd.random() < 0.5 and p != 'student':  # savings transfer
            add(d, -round(income * rnd.uniform(0.02, 0.1), -1), 'M_OWN_SAVINGS', 'transfer_savings', '', 'own_transfer', '08:00:00')
        if rnd.random() < 0.02:
            add(d, rnd.uniform(5, 60) * (1 if rnd.random() < .5 else -1), 'M_MOBILEPAY_P2P', 'transfer_p2p', '', 'mobilepay', None)
        if rnd.random() < 0.004:
            add(d, rnd.uniform(20, 140), 'M_VEROHALLINTO', 'tax_refund', '9311', 'credit_transfer', '06:00:00') if d.month in (8, 9) else None
        d += dt.timedelta(days=1)
    # Behaviours S-Pankki asked about at the booth. A separate RNG keeps every other customer's rows unchanged.
    rs = random.Random(cid + ':behaviour')
    forwarder = p in ('young_worker', 'couple', 'family') and rs.random() < 0.16
    light = rs.random() < 0.12
    if forwarder:  # salary arrives, and within a day most of it moves to an account at another bank
        share = rs.uniform(0.45, 0.8)
        for r in [r for r in rows if r[4] == 'income_salary']:
            when = r[0] + dt.timedelta(days=rs.choice([0, 0, 1]))
            rows.append([when, f"{rs.randint(6,9):02d}:{rs.randint(10,59)}:00", -round(r[2] * share, -1), 'M_OMA_TILI_TOINEN_PANKKI', 'salary_sweep', '', 'salary_sweep'])
        rows = [r for r in rows if not (r[4] == 'transfer_savings')]
    TRUTH[cid] = (p, int(forwarder), int(light))
    if light:  # uses another bank's card for most daily shopping: few card payments here
        rows = [r for r in rows if r[6] != 'card_payment' or rs.random() < 0.2]
    # keep the household solvent: scale variable spending so outgoings land at 88-101% of income
    rows.sort(key=lambda r: (r[0], r[1]))
    inc = sum(r[2] for r in rows if r[2] > 0)
    fixed_cats = {'salary_sweep', 'housing', 'loan_repayment', 'utilities', 'telecom', 'insurance', 'childcare', 'subscriptions', 'public_transport', 'transfer_savings', 'transfer_p2p'}
    fixed_out = -sum(r[2] for r in rows if r[2] < 0 and r[4] in fixed_cats)
    var_out = -sum(r[2] for r in rows if r[2] < 0 and r[4] not in fixed_cats)
    target = inc * rnd.uniform(0.88, 1.01) - fixed_out
    k = max(0.12 if forwarder else 0.35, min(2.5, target / var_out)) if var_out else 1
    rows = [[d, t, round(a * k, 2) if a < 0 and cat not in fixed_cats else a, mer, cat, mcc, ty] for d, t, a, mer, cat, mcc, ty in rows]
    bal = rnd.uniform(300, 4000) if p != 'retiree' else rnd.uniform(2000, 15000)
    outrows = []
    for i, (d, t, amt, mer, cat, mcc, ty) in enumerate(rows):
        bal += amt
        acc = accounts[0] if ty != 'own_transfer' or len(accounts) == 1 else accounts[0]
        outrows.append([cid, acc, sas(d), sas(d, t), cat, f"{amt:.2f}", f"{bal:.2f}", ty, mer, mcc])
    return outrows

custs = list(csv.DictReader(open(os.path.join(src, 'tx_customers_junction.csv'), encoding='utf-8-sig')))
rng.shuffle(custs)
pick = custs[:N]
with open(os.path.join(out, 'tx_junction_transactions.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['customer_id', 'bank_account_id', 'tx_date', 'tx_timestamp', 'category', 'tx_amount_eur', 'balance_after_eur', 'transaction_type', 'merchant_id', 'mcc_code'])
    for c in pick:
        for r in gen_customer(c['customer_id'], int(c['customer_age']), random.Random(c['customer_id'])):
            w.writerow(r)
import shutil
for fn in ('tx_customers_junction.csv', 'mtg_tx_customer_link_and_final_mtg_infio.csv'):
    shutil.copy(os.path.join(src, fn), out)
with open(os.path.join(out, 'truth.csv'), 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['customer_id', 'persona', 'forwarder', 'light'])
    for cid, (p, fw, li) in sorted(TRUTH.items()): w.writerow([cid, p, fw, li])
print('wrote', N, 'customers')
