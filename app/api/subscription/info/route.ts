import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getRemainingQuota } from '@/lib/quota';
import { STRIPE_PLANS } from '@/lib/stripe';

export async function GET(request: NextRequest) {
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

    if (!company) {
      return NextResponse.json(
        { error: 'Unternehmen nicht gefunden' },
        { status: 404 }
      );
    }

    const tier = company.subscriptionTier as keyof typeof STRIPE_PLANS;
    const planInfo = STRIPE_PLANS[tier] || STRIPE_PLANS.free;
    const remaining = getRemainingQuota(company.subscriptionTier, company.offersCreatedThisMonth);

    return NextResponse.json({
      tier: company.subscriptionTier,
      plan: planInfo,
      offersCreatedThisMonth: company.offersCreatedThisMonth,
      remainingQuota: remaining,
      hasActiveSubscription: !!company.stripeSubscriptionId,
    });
  } catch (error) {
    console.error('Subscription info error:', error);
    return NextResponse.json(
      { error: 'Anfrage fehlgeschlagen' },
      { status: 500 }
    );
  }
}
