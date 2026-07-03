import { NextRequest, NextResponse } from 'next/server';
import { validateToken, trackAccess } from '@/lib/share-tokens';

export async function GET(
  _request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    // Validate token and get offers
    const shareToken = await validateToken(params.shareToken);

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Link' },
        { status: 404 }
      );
    }

    // Track access
    await trackAccess(params.shareToken);

    // Get all offers for this user (share token belongs to offers of the same user)
    // For now, return just the offer associated with this token
    // In future, could get all offers from the same user
    const offer = shareToken.offer;

    return NextResponse.json(
      {
        offers: [
          {
            id: offer.id,
            clientName: offer.clientName,
            status: offer.status,
            totalGross: offer.totalGross,
            subtotalNet: offer.subtotalNet,
            taxAmount: offer.taxAmount,
            signedAt: offer.signedAt,
            createdAt: offer.createdAt,
            positions: offer.positions,
          },
        ],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Portal offers fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Angebote konnten nicht geladen werden' },
      { status: 500 }
    );
  }
}
