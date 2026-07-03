import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token ungültig' }, { status: 401 });
    }

    const offer = await prisma.offer.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Angebot nicht gefunden' }, { status: 404 });
    }

    // Get email tracking data
    const trackings = await prisma.emailTracking.findMany({
      where: { offerId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    const latestTracking = trackings[0] || null;

    return NextResponse.json({
      hasTracking: trackings.length > 0,
      latestTracking: latestTracking ? {
        email: latestTracking.email,
        sentAt: latestTracking.sentAt,
        openedAt: latestTracking.openedAt,
        linkClicks: latestTracking.linkClicks,
      } : null,
      allTrackings: trackings.map(t => ({
        email: t.email,
        sentAt: t.sentAt,
        openedAt: t.openedAt,
        linkClicks: t.linkClicks,
      })),
    });
  } catch (error: any) {
    console.error('Email tracking error:', error);
    return NextResponse.json(
      { error: error.message || 'Fehler beim Abrufen des Email-Status' },
      { status: 500 }
    );
  }
}
