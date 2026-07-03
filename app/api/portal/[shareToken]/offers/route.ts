import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    // Validate token
    const shareToken = await prisma.offerShareToken.findUnique({
      where: { token: params.shareToken },
      include: { offer: true },
    });

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Link' },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (shareToken.expiresAt && new Date(shareToken.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Link ist abgelaufen' },
        { status: 403 }
      );
    }

    // Track access
    await prisma.offerShareToken.update({
      where: { id: shareToken.id },
      data: {
        accessCount: shareToken.accessCount + 1,
        lastAccessedAt: new Date(),
      },
    });

    // Get all offers for this user
    const offers = await prisma.offer.findMany({
      where: { userId: shareToken.offer.userId },
      include: { positions: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      {
        clientEmail: shareToken.clientEmail,
        offers: offers.map((offer) => ({
          id: offer.id,
          clientName: offer.clientName,
          status: offer.status,
          subtotalNet: offer.subtotalNet,
          taxAmount: offer.taxAmount,
          totalGross: offer.totalGross,
          createdAt: offer.createdAt,
          validUntil: offer.validUntil,
          signatureUrl: offer.signatureUrl,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Portal offers error:', error);
    return NextResponse.json(
      { error: error.message || 'Fehler beim Laden der Angebote' },
      { status: 500 }
    );
  }
}
