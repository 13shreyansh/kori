"""Invented customers, official S-Pankki CSV columns; compact adapter mirrors prepare_data.py.
Balances are a synthetic opening ledger plus each transaction, never display constants.
"""
import csv,json,datetime as dt,calendar,pathlib
from zoneinfo import ZoneInfo
OUT=pathlib.Path(__file__).resolve().parents[1]/'public/data/kori'
REFERENCE=dt.date(2026,11,14)
REAL_TODAY=dt.datetime.now(ZoneInfo("Europe/Helsinki")).date()
TODAY=REFERENCE
cols=['customer_id','bank_account_id','tx_date','tx_timestamp','category','tx_amount_eur','balance_after_eur','transaction_type','merchant_id','mcc_code']
people={
 'aino':dict(name='Aino Korhonen',age=21,since=2023,account='Käyttötili',suffix='4471',savings='Interrail',current=212.35,pot=60,goals=[['Interrail',900]]),
 'mikko':dict(name='Mikko Lahtinen',age=31,since=2019,account='Käyttötili',suffix='2093',savings='ASP account',current=2318.60,pot=6400,goals=[['Japan trip',3200],['Car',8000],['Own home',24000]]),
 'laura':dict(name='Laura Nieminen',age=44,since=2008,account='Household account',suffix='8810',savings='Savings',current=1817.35,pot=2300,goals=[])}
for cid,p in people.items():
 rows=[]
 def add(date,amount,cat,merchant,kind='purchase',mcc='',time='12:00:00',account='current'):
  cat={'Benefits':'Other Income','Transfer Savings':('Invest Withdraw' if account=='savings' else 'Invest Deposit'),'Subscriptions':'Entertainment','Insurance':'Utilities','Loan Repayment':'Housing','Childcare':'Utilities','Sports':'Entertainment'}.get(cat,cat)
  kind={'benefit':'other_income','savings_transfer':'investment_deposit','savings_credit':'investment_withdrawal','subscription':'utilities_payment','bill_payment':'utilities_payment'}.get(kind,kind)
  if isinstance(date,str): date=dt.date.fromisoformat(date)
  if date<=TODAY: rows.append(dict(customer_id=cid,bank_account_id=cid+'-'+account,tx_date=date.isoformat(),tx_timestamp=date.isoformat()+'T'+time,tx_amount_eur=round(amount,2),balance_after_eur=0,category=cat,transaction_type=kind,merchant_id=merchant,mcc_code=mcc))
 def save(date,amount):
  add(date,-amount,'Transfer Savings',p['savings'],'savings_transfer')
  add(date,amount,'Transfer Savings',p['account'],'savings_credit',account='savings')
 for ix in range(24):
  y=2024+(11+ix)//12; m=(11+ix)%12+1
  def day(d):return dt.date(y,m,d)
  if cid=='aino':
   add(day(25),[520,620,755,610,590,680][ix%6],'Salary','Kahvila Sävy Oy','salary')
   add(day(4),279.38,'Benefits','Kela','benefit')
   add(day(2),-480,'Housing','HOAS','housing_payment')
   add(day(20),-14.9,'Utilities','Elisa','utilities_payment')
   for d,amt,name in [(18,6.49,'Spotify'),(28,9.99,'Netflix'),(28,.99,'iCloud'),(28,5.99,'HBO Max')]:add(day(d),-amt,'Subscriptions',name,'subscription')
   save(day(26),18)
   for d in range(1,28):
    add(day(d),-(3.1+(d%6)*.7),'Groceries','Alepa' if d%2 else 'S-market',mcc='5411')
    if d%4==0:add(day(d),-3.2,'Transportation','HSL',mcc='4111')
   if (y,m)!=(2026,10):
    for d in [3,7,10,16,24]:add(day(d),-5.6,'Restaurants', 'Espresso House',mcc='5814')
   if (y,m)<(2026,9):
    for d in [5,12,19,26]:add(day(d),-16.8,'Restaurants','Wolt',mcc='5812')
  elif cid=='mikko':
   if (y,m)>=(2025,10):
    sal=day(15)
    while sal.weekday()>4:sal-=dt.timedelta(days=1)
    add(sal,3150,'Salary','Nordkode Oy','salary')
   for d,amt,cat,name in [(2,850,'Housing','Lumo'),(8,55,'Utilities','Helen'),(10,29.9,'Utilities','Elisa'),(21,38,'Insurance','If')]:add(day(d),-amt,cat,name,'bill_payment')
   if (y,m)>=(2025,12) and (y,m)<=(2026,10):save(day(16),([550,650,600,600,500,700][m-5] if y==2026 and 5<=m<=10 else 600))
   for d in range(1,27):
    if d%3==0:add(day(d),-7.8,'Groceries','Alepa',mcc='5411')
    elif d%4==0:add(day(d),-48.4,'Groceries','K-Citymarket',mcc='5411')
   if (y,m)<(2026,8):
    for d in [3,5,10,12,17,19,24,26]:add(day(d),-12.9,'Restaurants','Sodexo',mcc='5812')
  else:
   add(day(27),2840,'Salary','Espoon kaupunki','salary')
   for d,amt,cat,name in [(16,96.75,'Utilities','Helen'),(18,145,'Sports','Kiekko-Espoo juniors'),(20,890,'Loan Repayment','Home loan payment'),(23,120,'Childcare','City of Espoo afternoon club'),(26,212.6,'Insurance','Car insurance'),(1,64.8,'Utilities','DNA'),(3,38.2,'Insurance','Home insurance'),(8,25,'Utilities','HSY water'),(9,22,'Childcare','Espoo music school')]:add(day(d),-amt,cat,name,'bill_payment')
   save(day(28),114)
   if (y,m)<(2026,8):
    for d in [2,6,10,14,18,22,26]:add(day(d),-60,'Groceries','Prisma' if d%3 else 'K-Supermarket',mcc='5411')
 if cid=='aino':
  cafe=[('Espresso House',v) for v in [5.6,5.6,6.9,5.6,4.9,6.9]]+[("Robert's Coffee",v) for v in [4.8,4.8,5.2,4.8]]+[('Fazer Café',v) for v in [7.4,6.2]]+[('Café Regatta',5.5),('Paulig Kulma',4.5),('Paulig Kulma',4.5),('Kahvila Sävy',4.2)]
  for i,(name,v) in enumerate(cafe):add(f'2026-10-{i*2+1:02}',-v,'Restaurants',name,mcc='5814')
  dates=[dt.date(2026,9,19)+dt.timedelta(days=d) for d in [0,2,4,6,8,10]]+[dt.date(2026,10,1)+dt.timedelta(days=i*2) for i in range(15)]+[dt.date(2026,11,1)+dt.timedelta(days=i*2) for i in range(7)]
  for date in dates:add(date,-16.8,'Restaurants','Wolt',mcc='5812')
  # Card share is generated, not a signal constant. Add occasional larger essential purchases.
  for i in range(125):add(TODAY-dt.timedelta(days=i*2+1),-10.2,'Groceries','S-market' if i%2 else 'Alepa',mcc='5411')
 elif cid=='mikko':
  totals=[72,80,84,86,90,84,78,90,164,92,90,94]
  for i,total in enumerate(totals):
   date=dt.date(2026,8,22)+dt.timedelta(days=i*7)
   n=3 if i<7 else 2
   for j in range(n):add(date,-round(total/n,2) if j<n-1 else -round(total-round(total/n,2)*(n-1),2),'Restaurants' if j<n-1 else 'Transportation',['Bar Loose','Ravintola Kuu','Taksi Helsinki'][j],mcc='5813' if j<n-1 else '4121',time=f'{19+j:02}:30:00')
  dates=[dt.date(2026,8,24)+dt.timedelta(days=i) for i in range(82) if (dt.date(2026,8,24)+dt.timedelta(days=i)).weekday()<5][:47]
  for date in dates:add(date,-12.9,'Restaurants','Sodexo',mcc='5812',time='11:45:00')
  add('2026-11-07',-118.4,'Groceries','Prisma',mcc='5411')
  for i in range(24):add(TODAY-dt.timedelta(days=i*10+2),-4.2,'Restaurants','Fazer Café',mcc='5814')
 else:
  start=TODAY-dt.timedelta(days=89)
  for i in range(76):
   date=start+dt.timedelta(days=i)
   amount=40 if dt.date(2026,10,1)<=date<=dt.date(2026,10,14) else 28 if dt.date(2026,10,15)<=date<=dt.date(2026,10,28) else 34
   add(date,-amount,'Groceries','S-market' if i%3 else 'K-Supermarket',mcc='5411')
  # November grocery split, plus cent correction on the first day of the 90-day window.
  for d,amt in [(6,85),(13,85),(3,42),(10,50)]:add(f'2026-11-{d:02}',-amt,'Groceries','Prisma' if d in [6,13] else 'S-market',mcc='5411')
  for d,amt in [(2,43.5),(4,38.2),(7,47.6),(9,39.5),(12,45.5)]:add(f'2026-11-{d:02}',-amt,'Groceries','K-Supermarket',mcc='5411')
  rows[next(i for i,r in enumerate(rows) if r['tx_date']==start.isoformat() and r['category']=='Groceries')]['tx_amount_eur']+=.3
 if cid=='laura':
  eligible=[r for r in rows if r['tx_date']>='2025-11-15' and r['tx_date']<'2026-11-01' and r['transaction_type']=='purchase'][:59]
  for r in eligible:
   r['tx_amount_eur']=round(r['tx_amount_eur']+6.5,2)
   add(r['tx_date'],-6.5,'Groceries','Alepa',mcc='5411',time='17:20:00')
 rows.sort(key=lambda r:(r['tx_timestamp'],r['bank_account_id']))
 opening={}
 for account,target in [('current',p.pop('current')),('savings',p.pop('pot'))]:
  acc=cid+'-'+account
  opening[acc]=round(target-sum(r['tx_amount_eur'] for r in rows if r['bank_account_id']==acc),2)
  bal=opening[acc]
  for r in rows:
   if r['bank_account_id']==acc:bal=round(bal+r['tx_amount_eur'],2);r['balance_after_eur']=bal
 delta=(REAL_TODAY-REFERENCE).days
 last_sat=REAL_TODAY-dt.timedelta(days=((REAL_TODAY.weekday()-5)%7 or 7))
 sat_delta=(last_sat-dt.date(2026,11,7)).days
 for index,r in enumerate(rows):
  r['_reference_date']=r['tx_date'];r['_stable_index']=index
  original=dt.date.fromisoformat(r['tx_date'])
  night=r['mcc_code'] in ['5813','5812','4121'] and original.weekday()==5 and int(r['tx_timestamp'][11:13])>=18
  r['tx_date']=(original+dt.timedelta(days=sat_delta if night else delta)).isoformat()
  r['tx_timestamp']=r['tx_date']+'T'+r['tx_timestamp'][-8:]
 rows.sort(key=lambda r:(r['tx_timestamp'],r['bank_account_id']))
 for acc in opening:
  bal=opening[acc]
  for r in rows:
   if r['bank_account_id']==acc:bal=round(bal+r['tx_amount_eur'],2);r['balance_after_eur']=bal
 with open(OUT/(cid+'.csv'),'w') as f:
  w=csv.DictWriter(f,fieldnames=cols,extrasaction="ignore");w.writeheader();w.writerows(rows)
 p.update(id=cid,postal_code='00100' if cid!='laura' else '02100',openingBalances=opening,
  columns=['date','time','amount','balance','category','type','merchant','mcc','account'],
  tx=[[r['tx_date'],r['tx_timestamp'][-8:],r['tx_amount_eur'],r['balance_after_eur'],r['category'],r['transaction_type'],r['merchant_id'],r['mcc_code'],r['bank_account_id']] for r in rows],
  invoices=([dict(date='2026-11-24',amount=-85,merchant='School trip, class 6B',category='school',approved=False),dict(date='2026-12-05',amount=-40,merchant='Hockey tournament fee',category='sports',approved=True)] if cid=='laura' else []))
 p['referenceDates']=[r['_reference_date'] for r in rows]
 p['transactionIds']=[r['_stable_index'] for r in rows]
 p['anchorDate']=REAL_TODAY.isoformat()
 for invoice in p['invoices']:invoice['date']=(dt.date.fromisoformat(invoice['date'])+dt.timedelta(days=delta)).isoformat()
 (OUT/(cid+'.json')).write_text(json.dumps(p,ensure_ascii=False,separators=(',',':')))
 print(cid,len(rows),'rows')
