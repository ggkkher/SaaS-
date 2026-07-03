import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateToken } from '@/lib/share-tokens';

export async function POST(
  request: NextRequest,
  { params }: { params: { shareToken: string; offerId: string } }
) {
  try {
    const { signatureUrl } = await request.json();

    if (!signatureUrl) {
      return NextResponse.json(
        { error: 'Signatur erforderlich' },
        { status: 400 }
      );
    }

    // Validate token
    const shareToken = await validateToken(params.shareToken);

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Link' },
        { status: 404 }
      );
    }

    // Verify that token belongs to this offer
    if (shareToken.offer.id !== params.offerId) {
      return NextResponse.json(
        { error: 'Dieses Angebot ist nicht verfügbar' },
        { status: 403 }
      );
    }

    // Update offer with signature
    const offer = await prisma.offer.update({
      where: { id: params.offerId },
      data: {
        signatureUrl,
        status: 'signed',
        signedAt: new Date(),
      },
      include: { positions: true },
    });

    return NextResponse.json(
      { message: 'Unterschrift erfolgreich gespeichert', offer },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Portal signature save error:', error);
    return NextResponse.json(
      { error: error.message || 'Unterschrift konnte nicht gespeichert werden' },
      { status: 500 }
    );
  }
}
