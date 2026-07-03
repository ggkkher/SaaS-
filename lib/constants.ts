export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
} as const;

export const OFFER_QUOTAS = {
  [SUBSCRIPTION_TIERS.FREE]: 5,
  [SUBSCRIPTION_TIERS.PRO]: 40,
} as const;

export const SUBSCRIPTION_PRICES = {
  [SUBSCRIPTION_TIERS.FREE]: 0,
  [SUBSCRIPTION_TIERS.PRO]: 5000, // $50.00 in cents
} as const;

export const OFFER_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  SIGNED: 'signed',
  ACCEPTED: 'accepted',
} as const;

export const COLORS = {
  PRIMARY_LIGHT: '#4CAF50',
  PRIMARY_DARK: '#2E7D32',
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  GRAY: '#F5F5F5',
} as const;
