// Deterministic language understanding (English + common Finnish words).
// Used by the offline coach and as a parser for tool arguments. Kept separate so the eval can test it alone.
import type { Filter } from '../engine/analytics';

export const CATEGORY_WORDS: [RegExp, string[], string][] = [
  // [pattern, dataset categories, display phrase]
  [/\b(taxi|taxis|cab|cabs|uber|bolt|taksi\w*)\b/i, ['taxi'], 'taxis'],
  [/\b(dining out|eating out|eat out|restaurants?|ravintol\w*|dinners?|lunch(es)?|lounas\w*|takeaway|take-away)\b/i, ['restaurants_cafes', 'food_delivery'], 'eating out'],
  [/\b(food delivery|deliveries|delivery|wolt|foodora)\b/i, ['food_delivery'], 'food delivery'],
  [/\b(coffee|coffees|caf[eé]s?|kahvi\w*|latte|espresso)\b/i, ['restaurants_cafes'], 'cafés'],
  [/\b(grocer(y|ies)|food shopping|supermarket|ruoka\w*|kauppa\w*|s-market|prisma|alepa|lidl)\b/i, ['groceries'], 'groceries'],
  [/\b(alcohol|alko|beer|wine|drinks|booze|olut|viini)\b/i, ['alcohol_tobacco'], 'alcohol'],
  [/\b(bus|tram|metro|hsl|public transport|joukkoliikenne)\b/i, ['public_transport'], 'public transport'],
  [/\b(fuel|petrol|gas station|bensa\w*|polttoaine\w*|neste)\b/i, ['fuel'], 'fuel'],
  [/\b(clothes|clothing|fashion|vaatte\w*|zalando)\b/i, ['clothing'], 'clothes'],
  [/\b(online shopping|amazon|temu|verkkokauppa)\b/i, ['online_shopping'], 'online shopping'],
  [/\b(subscriptions?|netflix|spotify|streaming|tilau\w*)\b/i, ['subscriptions'], 'subscriptions'],
  [/\b(rent|vuokra\w*|housing|asuminen|vastike)\b/i, ['housing'], 'housing'],
  [/\b(electricity|power bill|s[aä]hk[oö]\w*|water bill|utilities)\b/i, ['utilities'], 'electricity and water'],
  [/\b(phone|mobile plan|internet|broadband|puhelin\w*|liittym\w*)\b/i, ['telecom'], 'phone and internet'],
  [/\b(insurance|vakuutu\w*)\b/i, ['insurance'], 'insurance'],
  [/\b(pharmacy|medicine|apteek\w*|l[aä][aä]k\w*)\b/i, ['pharmacy'], 'pharmacy'],
  [/\b(doctor|dentist|health ?care|hammasl\w*|terveys\w*|clinic)\b/i, ['healthcare'], 'doctors and dentists'],
  [/\b(car repairs?|car service|mechanic|autohuolto|korjaamo)\b/i, ['vehicle_maintenance'], 'car repairs'],
  [/\b(travel|trips?|flights?|holiday|vacation|matka\w*|hotel\w*)\b/i, ['travel'], 'travel'],
  [/\b(entertainment|movies?|cinema|concerts?|games?|leffa\w*)\b/i, ['entertainment'], 'fun and culture'],
  [/\b(gym|sports?|urheilu\w*)\b/i, ['sports', 'subscriptions'], 'sports'],
  [/\b(electronics|gadgets?|gigantti)\b/i, ['electronics'], 'electronics'],
  [/\b(haircut|beauty|cosmetics|parturi|kampaamo)\b/i, ['personal_care'], 'personal care'],
  [/\b(pets?|vet|el[aä]inl[aä][aä]k\w*)\b/i, ['pets'], 'pets'],
  [/\b(daycare|p[aä]iv[aä]koti\w*|childcare)\b/i, ['childcare'], 'daycare'],
];

const FI_MONTHS = ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kes', 'hein', 'elo', 'syys', 'loka', 'marras', 'joulu'];
const EN_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export function parsePeriod(q: string, today: string): string | undefined {
  const s = q.toLowerCase();
  if (/\b(last|previous|past) month\b|viime kuu\w*|edellis\w* kuu\w*/.test(s)) return 'last_month';
  if (/\bthis month\b|t[aä]ss[aä] kuussa|t[aä]m[aä]n kuun/.test(s)) return 'this_month';
  if (/\b(last|previous|past) week\b|viime viik\w*/.test(s)) return 'last_week';
  if (/\bthis week\b|t[aä]ll[aä] viikolla|t[aä]m[aä]n viikon/.test(s)) return 'this_week';
  if (/\b(30 days|four weeks|month so far)\b/.test(s)) return 'last_30';
  if (/\b(3|three) months\b|quarter|kolme\w* kuuka\w*/.test(s)) return 'last_3_months';
  if (/\b(year|12 months|twelve months|annual|vuo(si|de)\w*)\b/.test(s)) return 'last_12_months';
  for (let i = 0; i < 12; i++) {
    const en = new RegExp(`\\b(in |during )?${EN_MONTHS[i]}[a-z]*\\b`);
    const fi = new RegExp(`\\b${FI_MONTHS[i]}\\w*kuu\\w*`);
    if ((EN_MONTHS[i] === 'may' ? /\bin may\b|\bmay (20\d\d)\b/.test(s) : en.test(s)) || fi.test(s)) {
      const ty = Number(today.slice(0, 4));
      const tm = Number(today.slice(5, 7));
      const y = i + 1 > tm ? ty - 1 : ty;
      return `${y}-${String(i + 1).padStart(2, '0')}`;
    }
  }
  return undefined;
}

export function parseCategory(q: string): { cats: string[]; phrase: string } | undefined {
  // most specific first: delivery before eating out, coffee before restaurants
  const order = [2, 3, 0, 1, ...CATEGORY_WORDS.keys()].filter((v, i, a) => a.indexOf(v) === i);
  for (const i of order) {
    const [re, cats, phrase] = CATEGORY_WORDS[i];
    if (re.test(q)) return { cats, phrase };
  }
  return undefined;
}

export function parsePercent(q: string): number | undefined {
  const m = q.match(/(\d{1,3})\s*(%|percent|per cent|prosent\w*)/i);
  if (m) return Math.min(100, Number(m[1]));
  if (/\bhalf|puolet|puolella\b/i.test(q)) return 50;
  if (/\b(stopped|quit|give up)\b/i.test(q)) return 100;
  if (/\ba (third)\b/i.test(q)) return 33;
  if (/\ba quarter\b/i.test(q)) return 25;
  if (/\b(a fifth)\b/i.test(q)) return 20;
  if (/\b(stop|quit|cut out|no more|lopet\w*)\b/i.test(q)) return 100;
  return undefined;
}

export type Intent =
  | 'safe_to_spend' | 'what_if' | 'spender_type' | 'spend' | 'breakdown' | 'top_merchants' | 'baskets'
  | 'surprise' | 'subscriptions' | 'upcoming' | 'benchmark' | 'income' | 'savings' | 'explain' | 'advice' | 'help' | 'unknown';

export const CONCEPTS: Record<string, { re: RegExp; title: string }> = {
  baskets: { re: /\b(three baskets|baskets?|kori\w*)\b/i, title: 'The three baskets' },
  emergency: { re: /\b(emergency fund|buffer|puskuri\w*|rainy day|h[aä]t[aä]vara\w*)\b/i, title: 'A buffer for surprises' },
  compound: { re: /\b(compound(ing)?|korkoa korolle|interest on interest)\b/i, title: 'Compound growth' },
  inflation: { re: /\b(inflation|inflaatio\w*)\b/i, title: 'Inflation' },
  budget: { re: /\b(budget\w*|50.?30.?20|budjet\w*)\b/i, title: 'Budgeting in one line' },
  payyourself: { re: /\b(pay yourself first|save first|automatic saving|s[aä][aä]st[aä] ensin)\b/i, title: 'Pay yourself first' },
  interest: { re: /\b(interest rate|euribor|apr|korko\w*)\b/i, title: 'Interest rates' },
  credit: { re: /\b(credit card|buy now pay later|bnpl|klarna|luottokort\w*|osamaksu\w*)\b/i, title: 'Buy now, pay later' },
};

export function classify(q: string): { intent: Intent; filter: Filter; pct?: number; phrase?: string; concept?: string } {
  const s = q.toLowerCase().trim();
  const cat = parseCategory(s);
  const pct = parsePercent(s);
  const filter: Filter = {};
  if (cat) filter.category = cat.cats;
  if (cat?.phrase === 'cafés' && /coffee|kahvi|latte|espresso/.test(s)) filter.slipsOnly = true;
  // advice we must not give
  if (/\b(stocks?|shares?|crypto|bitcoin|invest(ing)? in|which fund|osak\w*|krypto\w*|kannattaako ostaa|tesla|nvidia|gamble|casino|betting|veikkaus|quick loan|pikalaina\w*|payday loan)\b/.test(s)) return { intent: 'advice', filter };
  if (/\b(what is|what's|what are|what does|explain|mik[aä] on|selit\w*|how does|teach me|tell me about|why should)\b/.test(s)) {
    for (const [k, v] of Object.entries(CONCEPTS)) if (v.re.test(s)) return { intent: 'explain', filter, concept: k };
  }
  if (/safe (for me )?to spend|safe-to-spend|(money|much) (do i have )?left to spend|what can i afford|budget for (the|this) week|(is it )?ok(ay)? to spend|spend until payday|can i (afford|spend)|how much (can|could) i spend|voinko|paljonko voin|left to spend|budget left/.test(s)) return { intent: 'safe_to_spend', filter };
  if (/what if|could i save|would i save|would .* save|save me|if i (cut|reduce|stop|stopped|spent less)|half as much|reduc\w+ .* by|cut .* by|säästä\w*|jos v[aä]hent\w*/.test(s) || (pct !== undefined && /save|cut|reduce|less|v[aä]hen/.test(s))) return { intent: 'what_if', filter, pct: pct ?? 20, phrase: cat?.phrase };
  if (/what kind of (spender|person)|spender type|(money|spending) personality|millainen kuluttaja|spending style|spending habits|big spender|say about me|who am i/.test(s)) return { intent: 'spender_type', filter };
  if (/surprise|unexpected|unplanned|emergenc(y|ies) cost|irregular|one-?off|yll[aä]tt\w*/.test(s) && !/emergency fund/.test(s)) return { intent: 'surprise', filter: { ...filter, basket: 'surprise' } };
  if (/subscri|recurring|renews?|streaming services|tilau\w*|toistuv\w*/.test(s) && !/how much .* (on|for) /.test(s) && !/(save|cut|stop)/.test(s)) return { intent: 'subscriptions', filter };
  if (/upcoming|bills? (due|coming)|next bills?|what bills|tulevat lasku\w*/.test(s)) return { intent: 'upcoming', filter };
  if (/compar|average (finn|person|household)|normal|other people|others my age|muihin|keskiver\w*|benchmark/.test(s)) return { intent: 'benchmark', filter };
  if (/\b(earn|income|salary|paid|palkka\w*|tulot)\b/.test(s)) return { intent: 'income', filter };
  if (/\b(saving|savings|saved|s[aä][aä]st\w*)\b/.test(s) && !cat) return { intent: 'savings', filter };
  if (/top merchants|where do i (shop|spend) most|which (shops|stores|places)|most often/.test(s)) return { intent: 'top_merchants', filter };
  if (/where (does|did|do) (my|the) money go|biggest (expense|cost|spend)|spen[dt] the most|what do i spend (the )?most|mihin rahat/.test(s)) return { intent: 'breakdown', filter };
  if (/basket|kori|fixed (cost|bill)|everyday|slip|needs and wants|bills vs|regular bills|by type|split my spending|break ?down my spending/.test(s)) return { intent: 'baskets', filter };
  if (cat || /how much|spent|spend|paljonko|kulu\w*/.test(s)) return { intent: 'spend', filter, phrase: cat?.phrase };
  if (/^(hi|hello|hey|moi|hei|help|apua)\b/.test(s)) return { intent: 'help', filter };
  return { intent: 'unknown', filter };
}
