import type { Tier } from './member';

// Membership tiers as offered at application. Prices are the introductory
// prices; update here when they change.
export const TIERS: { id: Tier; name: string; price: string; note?: string; perks: string[] }[] = [
  {
    id: 'community',
    name: 'The Community',
    price: 'Free',
    perks: ['See and book AFTR. events', 'The members’ gallery', 'Community news'],
  },
  {
    id: 'club',
    name: 'The Club',
    price: 'GHS 275 / year',
    note: 'Intro price',
    perks: ['Everything in The Community', '50% off flagship AFTR. events', 'The members’ forum', 'Discounts with partners'],
  },
  {
    id: 'inner_circle',
    name: 'The Inner Circle',
    price: 'GHS 500 / year',
    note: 'Intro price',
    perks: ['Everything in The Club', 'Free entry to flagship AFTR. events'],
  },
];

export const tierInfo = (id: Tier) => TIERS.find((t) => t.id === id)!;
