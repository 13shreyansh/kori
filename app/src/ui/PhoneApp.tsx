// The phone app itself: Today, Coach, Explore, Me and the sheets. Used full-screen at #app and embedded live on the landing page.
import { useCallback, useEffect, useImperativeHandle, useMemo, useState, type Ref } from 'react';
import * as A from '../engine/analytics';
import { eur } from '../engine/analytics';
import type { Customer } from '../engine/model';
import type { Basket } from '../engine/taxonomy';
import { askCoach, providerStatus } from '../coach/provider';
import { personaOf } from '../engine/personas';
import { TONE_TEXT, usePrefs } from './prefs';
import { Customise } from './Customise';
import { Coach, type Msg } from './Coach';
import { Explore } from './Explore';
import { Icon } from './Icon';
import { Me } from './Me';
import { Sheet } from './Sheet';
import { Today, themeClass } from './Today';
import { TxList } from './TxList';
import type { SheetState } from './types';
import { VisualView } from './Visual';
import { useCustomer, type Person } from './data';

export type Tab = 'today' | 'coach' | 'explore' | 'me';
export interface PhoneApi { ask: (q: string) => void; go: (t: Tab) => void; basket: (b: Basket) => void; customise: () => void }

let providerP: Promise<string> | null = null;

export function PhoneApp({ cid, name, people, onPick, embed, api }: { cid: string; name: string; people: Person[]; onPick: (id: string) => void; embed?: boolean; api?: Ref<PhoneApi> }) {
  const c = useCustomer(cid);
  const [tab, setTab] = useState<Tab>('today');
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState('offline');
  const { prefs, update: updatePrefs, reset: resetPrefs } = usePrefs(cid);
  const [czOpen, setCzOpen] = useState(false);
  const p = useMemo(() => (c ? personaOf(c, (x) => eur(x)) : null), [c]);

  useEffect(() => { (providerP ??= providerStatus()).then(setProvider); }, []);
  useEffect(() => { setMsgs([]); setSheet(null); setCzOpen(false); setTab('today'); }, [cid]);

  const send = useCallback(async (q: string) => {
    if (!c) return;
    setTab('coach'); setSheet(null); setCzOpen(false);
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setBusy(true);
    const history = msgs.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    const a = await askCoach(c, q, history, provider, TONE_TEXT[prefs.tone]);
    setBusy(false);
    setMsgs((m) => [...m, { role: 'bot', text: a.text, answer: a }]);
  }, [c, msgs, provider, prefs.tone]);

  useImperativeHandle(api, () => ({
    ask: send,
    go: (t) => { setSheet(null); setCzOpen(false); setTab(t); },
    basket: (b) => { setCzOpen(false); setTab('today'); setSheet({ kind: 'basket', basket: b }); },
    customise: () => { setSheet(null); setTab('today'); setCzOpen(true); },
  }), [send]);

  const closeSheet = useCallback(() => setSheet(null), []);
  const closeCz = useCallback(() => setCzOpen(false), []);
  const ts = prefs.textScale ?? p?.textScale ?? 1;
  return (
    <div className={'phone' + (embed ? ' embed' : '') + (p ? ' ' + themeClass(p) : '')} style={{ ['--ts' as string]: ts }}>
      <div className="statusbar"><span>9:41</span><span style={{ display: 'flex', gap: 6 }}><Icon name="Signal" size={15} /><Icon name="Wifi" size={15} /><Icon name="BatteryFull" size={17} /></span></div>
      {!c || !p ? <div className="screen" style={{ display: 'grid', placeItems: 'center' }}><div className="typing" aria-label="Loading"><i /><i /><i /></div></div> : (
        <>
          {tab === 'today' && <Today c={c} name={name} open={setSheet} ask={send} prefs={prefs} customise={() => setCzOpen(true)} why={() => setTab('me')} />}
          {tab === 'coach' && <Coach msgs={msgs} busy={busy} send={send} open={setSheet} provider={provider} starters={p.questions} />}
          {tab === 'explore' && <Explore c={c} open={setSheet} />}
          {tab === 'me' && <Me c={c} personas={people} current={cid} pick={onPick} open={setSheet} ask={send} customise={() => setCzOpen(true)} prefs={prefs} />}
          <Customise open={czOpen} onClose={closeCz} p={p} prefs={prefs} update={updatePrefs} reset={resetPrefs} />
          <SheetView c={c} s={sheet} close={closeSheet} ask={send} />
        </>
      )}
      <nav className="tabbar" aria-label="Main">
        <TabBtn on={tab === 'today'} icon="House" label="Today" onClick={() => setTab('today')} />
        <button className={'tab tab-coach' + (tab === 'coach' ? ' on' : '')} onClick={() => setTab('coach')} aria-current={tab === 'coach'}><span className="dot"><Icon name="MessageCircle" size={22} /></span>Coach</button>
        <TabBtn on={tab === 'explore'} icon="ChartNoAxesColumn" label="Explore" onClick={() => setTab('explore')} />
        <TabBtn on={tab === 'me'} icon="UserRound" label="Me" onClick={() => setTab('me')} />
      </nav>
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
