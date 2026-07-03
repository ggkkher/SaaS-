import { NextRequest, NextResponse } from 'next/server';
import { validateToken, trackAccess } from '@/lib/share-tokens';

export async function GET(
  _request: NextRequest,
  { params }: { params: { shareToken: string; offerId: string } }
) {
  try {
    // Validate token
    const shareToken = await validateToken(params.shareToken);

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Link' },
        { status: 404 }
      );
    }

    // Verify that the token belongs to this offer
    if (shareToken.offer.id !== params.offerId) {
      return NextResponse.json(
        { error: 'Dieses Angebot ist nicht verfügbar' },
        { status: 403 }
      );
    }

    // Track access
    await trackAccess(params.shareToken);

    const offer = shareToken.offer;

    return NextResponse.json(
      {
        offer: {
          id: offer.id,
          clientName: offer.clientName,
          clientEmail: offer.clientEmail,
          status: offer.status,
          signatureUrl: offer.signatureUrl,
          totalGross: offer.totalGross,
          subtotalNet: offer.subtotalNet,
          taxAmount: offer.taxAmount,
          signedAt: offer.signedAt,
          createdAt: offer.createdAt,
          positions: offer.positions,
          company: {
            name: offer.user.company?.name || 'Unbekanntes Unternehmen',
            logoUrl: offer.user.company?.logoUrl,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Portal offer fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Angebot konnte nicht geladen werden' },
      { status: 500 }
    );
  }
}
