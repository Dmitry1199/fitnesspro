import { loadStripe, Stripe } from '@stripe/stripe-js';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

export const formatPrice = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 19,
    interval: 'month',
    features: [
      'Up to 20 clients',
      'Basic workout builder',
      'Session scheduling',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 49,
    interval: 'month',
    popular: true,
    features: [
      'Up to 100 clients',
      'Advanced workout builder',
      'Automated scheduling',
      'Progress tracking',
      'Video sessions',
      'Priority support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 99,
    interval: 'month',
    features: [
      'Unlimited clients',
      'White-label solution',
      'Custom branding',
      'Advanced analytics',
      'API access',
      'Dedicated support',
    ],
  },
] as const;

export type SubscriptionPlan = typeof subscriptionPlans[number];
