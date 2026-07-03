import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const STRIPE_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    offersPerMonth: 5,
  },
  pro: {
    name: 'Pro',
    price: 50,
    offersPerMonth: 40,
  },
};

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  companyName: string
) {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
        companyName,
      },
    });
    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

export async function cancelSubscription(subscriptionId: string) {
  await stripe.subscriptions.cancel(subscriptionId);
}

export default stripe;
