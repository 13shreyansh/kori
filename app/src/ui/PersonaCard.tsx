import { motion } from 'framer-motion';
import { STYLE_INFO, TRAIT_INFO, type Persona } from '../engine/personas';
import { Icon } from './Icon';

/** The home card that changes with the customer's persona (life stage x money style). */
export function PersonaCardView({ p, ask, customise }: { p: Persona; ask: (q: string) => void; customise?: () => void }) {
  const card = p.cards[0];
  return (
    <motion.div className="card seg-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <div className="seg-head">
        <span className="seg-ico"><Icon name={STYLE_INFO[p.style].icon} size={17} /></span>
        <span className="seg-kicker">Kori for you · {p.name}</span>
        {customise && <button className="seg-edit" onClick={customise} aria-label="Make it yours"><Icon name="SlidersHorizontal" size={16} /></button>}
      </div>
      <h4>{card.title}</h4>
      <p>{card.body}</p>
      <div className="seg-nudge"><Icon name="Lightbulb" size={14} /> {p.nudge}</div>
      <button className="seg-ask" onClick={() => ask(card.ask)}>{card.ask} <Icon name="ArrowRight" size={14} /></button>
    </motion.div>
  );
}

/** One small card per behaviour trait (many small taps, quiet account, bill-heavy, irregular income). */
export function TraitCards({ p, ask }: { p: Persona; ask: (q: string) => void }) {
  const cards = p.cards.slice(1);
  if (!cards.length) return null;
  return (
    <>
      <div className="section-title">Your habits</div>
      <div className="notes">
        {cards.map((k) => (
          <button key={k.kind} className="note" onClick={() => ask(k.ask)}>
            <span className="note-tag" style={{ color: 'var(--acc)' }}><Icon name={k.icon} size={14} /> {TRAIT_INFO[k.kind as keyof typeof TRAIT_INFO]?.label}</span>
            <h4>{k.title}</h4>
            <p>{k.body}</p>
            <span className="ask">{k.ask} <Icon name="ArrowRight" size={14} /></span>
          </button>
        ))}
      </div>
    </>
  );
}
