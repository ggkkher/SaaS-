import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendOfferEmail } from '@/lib/email';

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

    // Sende Email
    await sendOfferEmail(
      offer.clientEmail,
      offer.clientName,
      offer.id.substring(0, 8).toUpperCase(),
      company.name,
      offer.totalGross,
      signatureUrl,
      pdfUrl
    );

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
