import type { LucideProps } from 'lucide-react';
import { ICONS } from './icons.gen';
export function Icon({ name, ...p }: { name: string } & LucideProps) {
  const C = (ICONS as Record<string, React.ComponentType<LucideProps>>)[name] ?? ICONS.Circle;
  return <C size={18} strokeWidth={2.2} {...p} />;
}
