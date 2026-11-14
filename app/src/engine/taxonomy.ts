// Maps the dataset's `category` (and MCC as a fallback) to display names, icons and a default basket.
// Basket meaning (S-Pankki's pedagogy):
//   fixed    = mandatory and regular (rent, electricity, phone)
//   surprise = mandatory but irregular (dentist, car repair, broken washing machine)
//   everyday = everyday spending that slips through your fingers (coffee, takeaway, taxis)
export type Basket = 'fixed' | 'surprise' | 'everyday';
export type Kind = 'spend' | 'income' | 'savings' | 'transfer';

export interface CatInfo {
  key: string;
  label: string;
  icon: string; // lucide icon name
  kind: Kind;
  basket: Basket; // default basket when not overridden by recurrence detection
  essential: boolean; // needs, not wants
  slip?: boolean; // typical "slips through your fingers" category
}

const C = (key: string, label: string, icon: string, basket: Basket, essential: boolean, slip = false, kind: Kind = 'spend'): CatInfo =>
  ({ key, label, icon, basket, essential, slip, kind });

export const CATEGORIES: Record<string, CatInfo> = Object.fromEntries([
  C('housing', 'Rent & housing', 'Home', 'fixed', true),
  C('loan_repayment', 'Loan payments', 'Landmark', 'fixed', true),
  C('utilities', 'Electricity & water', 'Zap', 'fixed', true),
  C('telecom', 'Phone & internet', 'Smartphone', 'fixed', true),
  C('insurance', 'Insurance', 'Shield', 'fixed', true),
  C('childcare', 'Daycare', 'Baby', 'fixed', true),
  C('subscriptions', 'Subscriptions', 'Repeat', 'fixed', false),
  C('taxes', 'Taxes & fees', 'Receipt', 'surprise', true),
  C('groceries', 'Groceries', 'ShoppingBasket', 'everyday', true),
  C('restaurants_cafes', 'Cafés & restaurants', 'Coffee', 'everyday', false, true),
  C('food_delivery', 'Food delivery', 'Bike', 'everyday', false, true),
  C('alcohol_tobacco', 'Alcohol', 'Wine', 'everyday', false, true),
  C('taxi', 'Taxis', 'CarTaxiFront', 'everyday', false, true),
  C('public_transport', 'Public transport', 'TramFront', 'everyday', true),
  C('fuel', 'Fuel', 'Fuel', 'everyday', true),
  C('clothing', 'Clothes', 'Shirt', 'everyday', false),
  C('online_shopping', 'Online shopping', 'Package', 'everyday', false, true),
  C('electronics', 'Electronics', 'Laptop', 'everyday', false),
  C('entertainment', 'Fun & culture', 'Ticket', 'everyday', false, true),
  C('sports', 'Sports', 'Dumbbell', 'everyday', false),
  C('personal_care', 'Personal care', 'Sparkles', 'everyday', false),
  C('travel', 'Travel', 'Plane', 'everyday', false),
  C('furniture', 'Furniture', 'Sofa', 'everyday', false),
  C('pharmacy', 'Pharmacy', 'Pill', 'surprise', true),
  C('healthcare', 'Doctor & dentist', 'Stethoscope', 'surprise', true),
  C('vehicle_maintenance', 'Car repairs', 'Wrench', 'surprise', true),
  C('household_appliances', 'Appliances', 'WashingMachine', 'surprise', true),
  C('home_improvement', 'Home repairs', 'Hammer', 'surprise', true),
  C('pets', 'Vet & pets', 'PawPrint', 'surprise', true),
  C('income_salary', 'Salary', 'Briefcase', 'everyday', false, false, 'income'),
  C('income_benefits', 'Benefits', 'HandCoins', 'everyday', false, false, 'income'),
  C('income_pension', 'Pension', 'Briefcase', 'everyday', false, false, 'income'),
  C('tax_refund', 'Tax refund', 'Receipt', 'everyday', false, false, 'income'),
  C('transfer_savings', 'To savings', 'PiggyBank', 'everyday', false, false, 'savings'),
  C('transfer_p2p', 'MobilePay & transfers', 'ArrowLeftRight', 'everyday', false, false, 'transfer'),
].map((c) => [c.key, c]));

// MCC fallback for categories we have not seen (the real file may name categories differently).
const MCC_RANGES: [number, number, string][] = [
  [4111, 4112, 'public_transport'], [4121, 4121, 'taxi'], [3000, 3350, 'travel'], [4411, 4411, 'travel'], [7011, 7011, 'travel'],
  [4814, 4816, 'telecom'], [4899, 4899, 'subscriptions'], [4900, 4900, 'utilities'], [5411, 5411, 'groceries'], [5422, 5499, 'groceries'],
  [5541, 5542, 'fuel'], [5611, 5699, 'clothing'], [5712, 5719, 'furniture'], [5722, 5722, 'household_appliances'], [5732, 5734, 'electronics'],
  [5811, 5813, 'restaurants_cafes'], [5814, 5814, 'restaurants_cafes'], [5815, 5818, 'subscriptions'], [5912, 5912, 'pharmacy'], [5921, 5921, 'alcohol_tobacco'],
  [5941, 5941, 'sports'], [5977, 5977, 'personal_care'], [5200, 5251, 'home_improvement'], [6300, 6399, 'insurance'], [6513, 6513, 'housing'],
  [7230, 7230, 'personal_care'], [7538, 7549, 'vehicle_maintenance'], [7832, 7841, 'entertainment'], [7922, 7999, 'entertainment'], [8011, 8099, 'healthcare'],
  [8351, 8351, 'childcare'], [9311, 9311, 'taxes'], [742, 742, 'pets'], [5999, 5999, 'online_shopping'], [5311, 5311, 'clothing'],
];

const unknown = new Map<string, CatInfo>();
export function categoryInfo(category: string, mcc: string, amount: number): CatInfo {
  const hit = CATEGORIES[category];
  if (hit) return hit;
  const m = parseInt(mcc, 10);
  if (!Number.isNaN(m)) for (const [a, b, k] of MCC_RANGES) if (m >= a && m <= b) return CATEGORIES[k];
  const key = category || 'other';
  if (!unknown.has(key)) {
    const pretty = key.replace(/_/g, ' ').replace(/^\w/, (s) => s.toUpperCase()) || 'Other';
    unknown.set(key, C(key, pretty, 'Circle', 'everyday', false, false, amount > 0 ? 'income' : 'spend'));
  }
  return unknown.get(key)!;
}
