import { motion } from 'framer-motion';
import { eur } from '../engine/analytics';
import type { segmentOf } from '../engine/segments';
import { Icon } from './Icon';

type Seg = ReturnType<typeof segmentOf>;

/** The home card that changes with the customer's behaviour segment. */
export function SegmentCard({ seg, ask }: { seg: Seg; ask: (q: string) => void }) {
  const card = seg.play.card(seg.f, (x) => eur(x));
  return (
    <motion.div className={`card seg-card seg-${seg.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <div className="seg-head">
        <span className="seg-ico"><Icon name={seg.play.icon} size={17} /></span>
        <span className="seg-kicker">Kori for you · {seg.play.name}</span>
      </div>
      <h4>{card.title}</h4>
      <p>{card.body}</p>
      <div className="seg-nudge"><Icon name="Lightbulb" size={14} /> {seg.play.nudge(seg.f, (x) => eur(x))}</div>
      <button className="seg-ask" onClick={() => ask(card.ask)}>{card.ask} <Icon name="ArrowRight" size={14} /></button>
    </motion.div>
  );
}
