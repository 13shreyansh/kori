import type { Receipt, SafeToSpend } from '../engine/analytics';
import type { Basket } from '../engine/taxonomy';
export type SheetState =
  | { kind: 'receipt'; receipt: Receipt }
  | { kind: 'safe'; safe: SafeToSpend }
  | { kind: 'basket'; basket: Basket }
  | { kind: 'txs'; label: string; ids: number[] };
export type Open = (s: SheetState) => void;
