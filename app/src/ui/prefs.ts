// "Make it yours": the persona sets the defaults, the person has the final say.
// Stored per customer in localStorage (a per-viewer convenience). In S-mobiili this would be saved to the profile.
import { useCallback, useEffect, useState } from 'react';
import type { ModuleId, Persona } from '../engine/personas';

export type Tone = 'persona' | 'gentle' | 'straight' | 'playful';
export interface Prefs { order: ModuleId[] | null; hidden: ModuleId[]; tone: Tone; textScale: number | null; goal: { label: string; amount: number } | null }
export const DEFAULT_PREFS: Prefs = { order: null, hidden: [], tone: 'persona', textScale: null, goal: null };
export const TONE_TEXT: Record<Tone, string> = {
  persona: '',
  gentle: 'The customer asked for a gentle, reassuring tone.',
  straight: 'The customer asked for straight talk: short, direct, numbers first, no pep talk.',
  playful: 'The customer asked for a playful, light tone with a little humour.',
};
export const MODULE_LABEL: Record<ModuleId, string> = {
  safe: 'Safe to spend', persona: 'Your coach card', goal: 'Your next goal', traits: 'Your habits', baskets: 'Three baskets', guess: 'Guess first game', notes: 'Coach notes', bills: 'Coming up',
};

const key = (id: string) => `kori.prefs.${id}`;
function load(id: string): Prefs {
  try { const s = localStorage.getItem(key(id)); return s ? { ...DEFAULT_PREFS, ...JSON.parse(s) } : DEFAULT_PREFS; } catch { return DEFAULT_PREFS; }
}

export function usePrefs(customerId: string) {
  const [prefs, setPrefs] = useState<Prefs>(() => load(customerId));
  useEffect(() => { setPrefs(load(customerId)); }, [customerId]);
  const update = useCallback((p: Partial<Prefs>) => setPrefs((old) => {
    const next = { ...old, ...p };
    try { localStorage.setItem(key(customerId), JSON.stringify(next)); } catch { /* private mode: keep in memory */ }
    return next;
  }), [customerId]);
  const reset = useCallback(() => { try { localStorage.removeItem(key(customerId)); } catch { /* ignore */ } setPrefs(DEFAULT_PREFS); }, [customerId]);
  return { prefs, update, reset };
}

/** The modules to show, in order: persona layout, then the person's own order and hidden list. 'safe' always stays. */
export function effectiveLayout(p: Persona, prefs: Prefs): ModuleId[] {
  const base = prefs.order ? [...prefs.order.filter((m) => p.layout.includes(m)), ...p.layout.filter((m) => !prefs.order!.includes(m))] : p.layout;
  return base.filter((m) => m === 'safe' || !prefs.hidden.includes(m));
}
export const MODULE_INFO: Record<ModuleId, { icon: string; what: string }> = {
  safe: { icon: 'ShieldCheck', what: 'What you can spend until payday' },
  persona: { icon: 'Sparkles', what: 'Kori’s read on your month' },
  goal: { icon: 'Target', what: 'Pick a goal, see the date' },
  traits: { icon: 'Footprints', what: 'One per habit Kori noticed' },
  baskets: { icon: 'ShoppingBasket', what: 'Fixed, surprise, everyday' },
  guess: { icon: 'Dices', what: 'Guess, then see the total' },
  notes: { icon: 'Lightbulb', what: 'Tips from your own data' },
  bills: { icon: 'CalendarClock', what: 'Bills in the next 14 days' },
};
export const isChanged = (p: Prefs) => !!p.order || p.hidden.length > 0 || p.tone !== 'persona' || p.textScale != null;
