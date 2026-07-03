import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSignatureConfirmationEmail } from '@/lib/email';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offer = await prisma.offer.findFirst({
      where: {
        id: params.id,
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

    // Hole Company-Info
    const user = await prisma.user.findUnique({
      where: { id: offer.userId },
      include: { company: true },
    });

    if (!user?.company) {
      return NextResponse.json(
        { error: 'Unternehmen nicht gefunden' },
        { status: 404 }
      );
    }

    // Sende Bestätigungs-Email
    await sendSignatureConfirmationEmail(
      offer.clientEmail,
      offer.clientName,
      offer.id.substring(0, 8).toUpperCase(),
      user.company.name
    );

    return NextResponse.json(
      { message: 'Bestätigungs-E-Mail erfolgreich versendet' },
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
