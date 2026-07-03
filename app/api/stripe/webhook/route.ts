import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import stripe from '@/lib/stripe';

async function readStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export async function POST(request: NextRequest) {
  const body = await readStream(request.body!);
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        const company = await prisma.company.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (company) {
          const tier =
            subscription.items.data[0]?.price?.metadata?.tier || 'free';

          await prisma.company.update({
            where: { id: company.id },
            data: {
              subscriptionTier: tier,
              stripeSubscriptionId: subscription.id,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        const company = await prisma.company.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (company) {
          await prisma.company.update({
            where: { id: company.id },
            data: {
              subscriptionTier: 'free',
              stripeSubscriptionId: null,
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        console.log('Payment succeeded for invoice:', event.data.object.id);
        break;
      }

      case 'invoice.payment_failed': {
        console.log('Payment failed for invoice:', event.data.object.id);
        break;
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
