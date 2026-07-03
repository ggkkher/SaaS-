import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendOfferEmail } from '@/lib/email';
import { getOrCreateShareToken, getPortalUrl } from '@/lib/share-tokens';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const offer = await prisma.offer.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden' },
        { status: 404 }
      );
    }

    if (!offer.clientEmail) {
      return NextResponse.json(
        { error: 'Keine E-Mail-Adresse für den Kunden gespeichert' },
        { status: 400 }
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

    const origin = request.nextUrl.origin;
    const signatureUrl = `${origin}/offers/${offer.id}/sign`;
    const pdfUrl = `${origin}/api/offers/${offer.id}/pdf`;

    // Generate share token for portal access
    const shareToken = await getOrCreateShareToken(params.id, offer.clientEmail);
    const portalUrl = `${origin}${getPortalUrl(shareToken, params.id)}`;

    // Create email tracking record
    const emailTracking = await prisma.emailTracking.create({
      data: {
        pixelId: `${params.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        offerId: params.id,
        email: offer.clientEmail,
      },
    });

    // Sende Email
    await sendOfferEmail(
      offer.clientEmail,
      offer.clientName,
      offer.id.substring(0, 8).toUpperCase(),
      company.name,
      offer.totalGross,
      signatureUrl,
      pdfUrl,
      portalUrl,
      emailTracking.pixelId
    );

    // Update offer mit sentAt und sentBy timestamps
    await prisma.offer.update({
      where: { id: params.id },
      data: {
        sentAt: new Date(),
        sentBy: decoded.userId,
        status: 'sent',
      },
    });

    return NextResponse.json(
      { message: 'E-Mail erfolgreich versendet' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error.message || 'E-Mail konnte nicht versendet werden' },
      { status: 500 }
    );
  }
}
