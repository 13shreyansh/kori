import { motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { eur, type Receipt } from '../engine/analytics';
import type { CoachAnswer } from '../coach/coach';
import { Icon } from './Icon';
import type { Open } from './types';
import { VisualView } from './Visual';

export interface Msg { role: 'user' | 'bot'; text: string; answer?: CoachAnswer }

const STARTERS = ['How much did I spend on taxis last month?', 'What is safe to spend this week?', 'What kind of spender am I?', 'How much could I save if I reduced dining out by 20%?'];

/** Wrap every euro amount in a tappable chip that opens the receipt behind it. */
export function linkNumbers(text: string, receipts: Receipt[], open: Open): ReactNode[] {
  const parts = text.split(/(€[\d,]+(?:\.\d{1,2})?|\d+(?:\.\d)?%)/g);
  return parts.map((p, i) => {
    if (!/^€|%$/.test(p)) return <span key={i}>{p}</span>;
    const val = Number(p.replace(/[€,%]/g, ''));
    const r = receipts.find((x) => Math.abs(Math.abs(x.value) - val) < 0.6 || (x.unit === 'EUR' && eur(x.value) === p) || (x.unit === 'EUR' && eur(x.value, 2) === p));
    if (!r) return <b key={i}>{p}</b>;
    return <button key={i} className="num" onClick={() => open({ kind: 'receipt', receipt: r })} aria-label={`Show how ${p} was calculated`}>{p}</button>;
  });
}

export function Coach({ msgs, busy, send, open, provider, starters = STARTERS }: { msgs: Msg[]; busy: boolean; send: (q: string) => void; open: Open; provider: string; starters?: string[] }) {
  const [q, setQ] = useState('');
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = list.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, [msgs, busy]);
  return (
    <div className="chat">
      <div className="chat-head">
        <div className="avatar" style={{ background: 'var(--brand)', color: '#fff' }}><Icon name="Sprout" size={20} /></div>
        <div className="who">Kori coach<small>Answers from your own transactions</small></div>
        <span className="badge" title="Raw transactions never leave the phone; only computed totals do."><Icon name={provider === 'gemini' ? 'Sparkles' : 'Lock'} size={12} />{provider === 'gemini' ? 'Gemini · totals only' : 'On-device'}</span>
      </div>
      <div className="msgs" ref={list}>
        {msgs.length === 0 && (
          <div className="fade-in" style={{ marginTop: 10 }}>
            <div className="bubble">Hi! I’m your money coach. Ask me anything about your own spending. Every number I give you is tappable, so you can see exactly which payments it comes from.</div>
            <div className="chips" style={{ marginTop: 12 }}>{starters.map((s) => <button className="chip" key={s} onClick={() => send(s)}>{s}</button>)}</div>
          </div>
        )}
        {msgs.map((m, i) => m.role === 'user' ? (
          <motion.div key={i} className="msg-user" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>{m.text}</motion.div>
        ) : (
          <motion.div key={i} className="msg-bot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bubble">
              {linkNumbers(m.text, m.answer?.receipts ?? [], open)}
              {!!m.answer?.receipts.length && <div className="receipts-hint"><Icon name="ReceiptText" size={13} /> Tap a number to see the payments behind it</div>}
            </div>
            {m.answer?.visual && <VisualView v={m.answer.visual} onRow={(ids, label) => open({ kind: 'txs', ids, label })} />}
            {m.answer?.lesson?.body && <div className="lesson"><b><Icon name="GraduationCap" size={14} />{m.answer.lesson.title}</b>{m.answer.lesson.body}</div>}
            {i === msgs.length - 1 && !!m.answer?.followups.length && (
              <div className="chips">{m.answer.followups.map((f) => <button className="chip" key={f} onClick={() => send(f)}>{f}</button>)}</div>
            )}
          </motion.div>
        ))}
        {busy && <div className="typing" aria-label="Coach is thinking"><i /><i /><i /></div>}
      </div>
      <div className="composer">
        <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) { send(q.trim()); setQ(''); } }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about your money…" aria-label="Ask the coach" />
          <button className="send" type="submit" aria-label="Send"><Icon name="ArrowUp" size={20} /></button>
        </form>
      </div>
    </div>
  );
}
