"""Independent cent arithmetic from the official-column CSV. No app engine imports."""
import csv,json,datetime as dt,pathlib,collections
root=pathlib.Path(__file__).resolve().parents[1]
result={}
for cid in ['aino','mikko','laura']:
 rows=list(csv.DictReader(open(root/'public/data/kori'/f'{cid}.csv')))
 for r in rows:r['cents']=round(float(r['tx_amount_eur'])*100)
 def select(start,end,pred=lambda r:True):return [r for r in rows if start<=r['tx_date']<=end and r['cents']<0 and pred(r)]
 def total(rs):return -sum(r['cents'] for r in rs)/100
 last={r['bank_account_id']:float(r['balance_after_eur']) for r in rows}
 cats={}
 for key,pred in [('cafe',lambda r:r['mcc_code']=='5814'),('wolt',lambda r:r['merchant_id']=='Wolt'),('groceries',lambda r:r['mcc_code']=='5411'),('subscriptions',lambda r:r['merchant_id'] in ['Spotify','Netflix','iCloud','HBO Max'])]:cats[key]=total(select('2026-10-01','2026-10-31',pred))
 w=select('2026-09-19','2026-11-13',lambda r:r['merchant_id']=='Wolt')
 sat=select('2026-08-22','2026-11-08',lambda r:r['transaction_type']=='purchase' and r['mcc_code'] in ['5813','5812','4121'] and ((dt.date.fromisoformat(r['tx_date']).weekday()==5 and int(r['tx_timestamp'][11:13])>=18) or (dt.date.fromisoformat(r['tx_date']).weekday()==6 and int(r['tx_timestamp'][11:13])<5)))
 everyday=select('2026-08-17','2026-11-14',lambda r:r['transaction_type']=='purchase' and r['mcc_code'] in ['5411','5541','5912'])
 saved=select('2026-05-01','2026-10-31',lambda r:r['transaction_type']=='investment_deposit')
 inc=[r for r in rows if '2026-05-01'<=r['tx_date']<='2026-10-31' and r['transaction_type'] in ['salary','other_income'] and r['cents']>0]
 bymerchant=collections.defaultdict(list)
 for r in rows:
  if r['tx_date']>='2025-11-15' and r['cents']<0 and r['transaction_type'] not in ['purchase','investment_deposit']:bymerchant[r['merchant_id']].append(r)
 fixed=[ts for ts in bymerchant.values() if len(set(r['tx_date'][:7] for r in ts))>=3 and ts[0]['merchant_id'] not in ['Spotify','Netflix','iCloud','HBO Max']]
 cards=select('2025-11-15','2026-11-14',lambda r:r['transaction_type']=='purchase')
 result[cid]=dict(cats=cats,balance=last[cid+'-current'],pot=last[cid+'-savings'],woltCount=len(w),woltAverage=total(w)/len(w) if w else 0,saturdayTotal=total(sat),saturdayCount=len(sat),baseline=total(saved)/6,daily=round(total(everyday)/90,2),savingRate=total(saved)/(sum(r['cents'] for r in inc)/100 or 1),fixed=len(fixed),smallShare=sum(r['cents']>-1000 for r in cards)/(len(cards) or 1))
 if cid=='laura':
  result[cid]['low']=last[cid+'-current']-sum([96.75,145,890,120,85,212.6])-12*result[cid]['daily']
print(json.dumps(result,indent=2))
