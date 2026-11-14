import { useCallback, useEffect, useMemo, useState } from 'react';
import * as A from './engine/analytics';
import { eur } from './engine/analytics';
import { buildCustomer, type Customer, type RawCustomer } from './engine/model';
import { askCoach, providerStatus } from './coach/provider';
import { segmentOf } from './engine/segments';
import { Coach, type Msg } from './ui/Coach';
import { Explore } from './ui/Explore';
import { Icon } from './ui/Icon';
import { Me, type Persona } from './ui/Me';
import { Sheet } from './ui/Sheet';
import { Today } from './ui/Today';
import { Compare } from './ui/Compare';
import { TxList } from './ui/TxList';
import type { SheetState } from './ui/types';
import { VisualView } from './ui/Visual';

type Tab = 'today' | 'coach' | 'explore' | 'me';

export default function App() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [pid, setPid] = useState<string>(() => new URLSearchParams(location.search).get('c') ?? '');
  const [c, setC] = useState<Customer | null>(null);
  const [tab, setTab] = useState<Tab>('today');
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState('offline');

  useEffect(() => { providerStatus().then(setProvider); }, []);
  const [compare, setCompare] = useState(() => new URLSearchParams(location.search).has('compare') || location.hash === '#compare');
  useEffect(() => {
    const on = () => {
      const h = location.hash;
      if (h === '#compare') { setCompare(true); window.scrollTo(0, 0); }
      else if (h.startsWith('#c=')) { setCompare(false); setPid(h.slice(3)); setTab('today'); }
      else setCompare(false);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    fetch('data/demo.json').then((r) => r.json()).then((d: Persona[]) => { setPersonas(d); setPid((p) => p || d[0].id); });
  }, []);
  useEffect(() => {
    if (!pid) return;
    fetch(`data/customers/${pid}.json`).then((r) => r.json()).then((raw: RawCustomer) => { setC(buildCustomer(raw)); setMsgs([]); });
  }, [pid]);

  const name = personas.find((p) => p.id === pid)?.name ?? 'there';
  const send = useCallback(async (q: string) => {
    if (!c) return;
    setTab('coach');
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setBusy(true);
    const history = msgs.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    const a = await askCoach(c, q, history, provider);
    setBusy(false);
    setMsgs((m) => [...m, { role: 'bot', text: a.text, answer: a }]);
  }, [c, msgs, provider]);

  if (compare) return personas.length ? <Compare personas={personas} /> : null;
  return (
    <div className="stage">
      <div className="phone">
        <div className="statusbar"><span>9:41</span><span style={{ display: 'flex', gap: 6 }}><Icon name="Signal" size={15} /><Icon name="Wifi" size={15} /><Icon name="BatteryFull" size={17} /></span></div>
        {!c ? <div className="screen" style={{ display: 'grid', placeItems: 'center' }}><div className="typing"><i /><i /><i /></div></div> : (
          <>
            {tab === 'today' && <Today c={c} name={name} open={setSheet} ask={send} />}
            {tab === 'coach' && <Coach msgs={msgs} busy={busy} send={send} open={setSheet} provider={provider} starters={[...segmentOf(c).play.questions, 'What kind of spender am I?']} />}
            {tab === 'explore' && <Explore c={c} open={setSheet} />}
            {tab === 'me' && <Me c={c} personas={personas} current={pid} pick={(id) => { setPid(id); setTab('today'); }} open={setSheet} ask={send} />}
            <SheetView c={c} s={sheet} close={() => setSheet(null)} ask={(q) => { setSheet(null); send(q); }} />
          </>
        )}
        <nav className="tabbar" aria-label="Main">
          <TabBtn on={tab === 'today'} icon="House" label="Today" onClick={() => setTab('today')} />
          <button className={'tab tab-coach' + (tab === 'coach' ? ' on' : '')} onClick={() => setTab('coach')}><span className="dot"><Icon name="MessageCircle" size={22} /></span>Coach</button>
          <TabBtn on={tab === 'explore'} icon="ChartNoAxesColumn" label="Explore" onClick={() => setTab('explore')} />
          <TabBtn on={tab === 'me'} icon="UserRound" label="Me" onClick={() => setTab('me')} />
        </nav>
      </div>
      <div className="demo-bar">Kori · a money coach for S-mobiili · Junction 2026 prototype on synthetic S-Pankki data</div>
    </div>
  );
}

function TabBtn({ on, icon, label, onClick }: { on: boolean; icon: string; label: string; onClick: () => void }) {
  return <button className={'tab' + (on ? ' on' : '')} onClick={onClick} aria-current={on}><Icon name={icon} size={22} />{label}</button>;
}

function SheetView({ c, s, close, ask }: { c: Customer; s: SheetState | null; close: () => void; ask: (q: string) => void }) {
  const content = useMemo(() => {
    if (!s) return null;
    if (s.kind === 'receipt') {
      const r = s.receipt;
      return (
        <>
          <div className="muted" style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.05em' }}>RECEIPT FOR THIS NUMBER</div>
          <h3>{r.label}</h3>
          <div className="big">{r.unit === 'EUR' ? eur(r.value, 2) : r.unit === '%' ? Math.round(r.value <= 1 ? r.value * 100 : r.value) + '%' : r.value}</div>
          <div className="formula"><b>How it’s calculated: </b>{r.formula}</div>
          {r.txIds.length > 0 ? <TxList c={c} ids={r.txIds} /> : <p className="muted" style={{ fontSize: 13.5 }}>This number comes from public data or a calculation, not from single payments.</p>}
        </>
      );
    }
    if (s.kind === 'safe') {
      const v = { kind: 'waterfall' as const, title: 'This pay period', rows: s.safe.steps.map((x) => ({ label: x.label, value: x.amount, display: x.note })) };
      return (
        <>
          <h3>How your safe-to-spend works</h3>
          <p style={{ color: 'var(--ink-2)', lineHeight: 1.5, fontSize: 14.5 }}>We start from your income and take out what is already spoken for. What’s left, spread over the days until payday, is yours to spend without borrowing from future you.</p>
          <VisualView v={v} />
          <div className="formula" style={{ marginTop: 12 }}>
            <b>{s.safe.left < 0 ? '−' : ''}{eur(s.safe.left)} {s.safe.left < 0 ? 'over budget' : 'left'}</b> ÷ {s.safe.horizonDays} days = <b>{eur(s.safe.perDay, 2)} a day</b>, so <b>{eur(s.safe.week, 2)}</b> for the next 7 days.
            {s.safe.cappedByCash && ' Your balance after upcoming bills is lower than this, so we use that instead.'}
          </div>
          <button className="btn brand" style={{ width: '100%' }} onClick={() => ask('What is safe to spend this week?')}>Ask the coach about it</button>
        </>
      );
    }
    if (s.kind === 'basket') {
      const b = s.basket;
      const rows = A.breakdown(c, 'category', { period: 'last_3_months', basket: b });
      const tot = rows.reduce((a, r) => a + r.total, 0);
      const ids = rows.flatMap((r) => r.ids);
      return (
        <>
          <div className="muted" style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.05em', color: `var(--${b})` }}>BASKET</div>
          <h3>{A.basketName[b]}</h3>
          <p style={{ color: 'var(--ink-2)', margin: '0 0 8px', lineHeight: 1.5 }}>{A.basketBlurb[b]}</p>
          <div className="big">{eur(tot / 3)}<span style={{ fontSize: 16 }} className="muted"> / month</span></div>
          <VisualView v={{ kind: 'bars', title: 'Last 3 months by category', rows: rows.slice(0, 6).map((r) => ({ label: r.label, value: r.total, ids: r.ids, tone: b })) }} />
          <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => ask(b === 'surprise' ? 'What were my surprise costs?' : b === 'fixed' ? 'What bills are coming up?' : 'How much could I save if I cut eating out by 20%?')}>Ask the coach</button>
          </div>
          <TxList c={c} ids={ids} limit={25} />
        </>
      );
    }
    return (<><h3>{s.label}</h3><p className="muted" style={{ marginTop: 0 }}>{s.ids.length} payments · {eur(s.ids.reduce((a, i) => a - (c.tx[i]?.amount ?? 0), 0), 2)}</p><TxList c={c} ids={s.ids} /></>);
  }, [s, c, ask]);
  return <Sheet open={!!s} onClose={close}>{content}</Sheet>;
}
