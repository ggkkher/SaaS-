import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import stripe from '@/lib/stripe';
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

    const company = await prisma.company.findUnique({
      where: { userId: decoded.userId },
    });

    if (!company || !company.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Stripe-Kunde nicht gefunden' },
        { status: 404 }
      );
    }

    const origin = request.nextUrl.origin;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ portalUrl: portalSession.url }, { status: 200 });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Portal-Erstellung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
