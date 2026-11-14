// Shared demo data: the demo customers, the persona map (real head-counts) and a small cache of built customers.
import { useEffect, useState } from 'react';
import { buildCustomer, type Customer, type RawCustomer } from '../engine/model';
import type { Stage, Style, Trait } from '../engine/personas';

export interface Person { id: string; name: string; age: number; type: string; segment?: string; traits?: Trait[]; compare?: boolean }
export interface Example { id: string; name: string; age: number; traits: Trait[] }
export interface MapCell { stage: Stage; style: Style; name: string; line: string; count: number; traits: Record<Trait, number>; example: Example | null; byTrait: Record<Trait, Example | null> }
export interface PersonaMap {
  total: number; stages: Record<Stage, number>; styles: Record<Style, number>; traits: Record<Trait, number>;
  noTrait: number; moves30: number; moves50: number; cells: Record<string, MapCell>;
}
export interface Directory { demo: Person[]; map: PersonaMap | null; nameOf: (id: string) => string }

let dirP: Promise<{ demo: Person[]; map: PersonaMap | null }> | null = null;
const loadDir = () => (dirP ??= Promise.all([
  fetch('data/demo.json').then((r) => r.json() as Promise<Person[]>),
  fetch('data/persona_map.json').then((r) => (r.ok ? (r.json() as Promise<PersonaMap>) : null)).catch(() => null),
]).then(([demo, map]) => ({ demo, map })));

export function useDirectory(): Directory {
  const [d, setD] = useState<{ demo: Person[]; map: PersonaMap | null }>({ demo: [], map: null });
  useEffect(() => { let on = true; loadDir().then((x) => on && setD(x)); return () => { on = false; }; }, []);
  const nameOf = (id: string) => {
    const p = d.demo.find((x) => x.id === id); if (p) return p.name;
    if (d.map) for (const c of Object.values(d.map.cells)) for (const e of [c.example, ...Object.values(c.byTrait)]) if (e?.id === id) return e.name;
    return 'there';
  };
  return { ...d, nameOf };
}

const cache = new Map<string, Promise<Customer>>();
export const loadCustomer = (id: string) => {
  let p = cache.get(id);
  if (!p) { p = fetch(`data/customers/${id}.json`).then((r) => { if (!r.ok) throw new Error('no such customer'); return r.json() as Promise<RawCustomer>; }).then(buildCustomer); cache.set(id, p); p.catch(() => cache.delete(id)); }
  return p;
};
export function useCustomer(id: string) {
  const [c, setC] = useState<Customer | null>(null);
  useEffect(() => { let on = true; if (!id) return; loadCustomer(id).then((x) => on && setC(x)).catch(() => on && setC(null)); return () => { on = false; }; }, [id]);
  return c && c.id === id ? c : null;
}
