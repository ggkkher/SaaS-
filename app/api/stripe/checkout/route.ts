import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import stripe, { getOrCreateStripeCustomer } from '@/lib/stripe';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token ungültig' },
        { status: 401 }
      );
    }

    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID erforderlich' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { userId: decoded.userId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Unternehmen nicht gefunden' },
        { status: 404 }
      );
    }

    let customerId = company.stripeCustomerId;

    if (!customerId) {
      customerId = await getOrCreateStripeCustomer(
        decoded.userId,
        user.email,
        company.name
      );

      await prisma.company.update({
        where: { id: company.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const origin = request.nextUrl.origin;

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
      success_url: `${origin}/dashboard?stripe=success`,
      cancel_url: `${origin}/dashboard?stripe=canceled`,
      metadata: {
        userId: decoded.userId,
        companyId: company.id,
      },
    });

    return NextResponse.json({ sessionUrl: session.url }, { status: 200 });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Checkout-Erstellung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
