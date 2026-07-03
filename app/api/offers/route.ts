import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { canCreateOffer, incrementOfferCount } from '@/lib/quota';

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

    const offers = await prisma.offer.findMany({
      where: { userId: decoded.userId },
      include: { positions: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error('Offers fetch error:', error);
    return NextResponse.json(
      { error: 'Anfrage fehlgeschlagen' },
      { status: 500 }
    );
  }
}

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

    const canCreate = await canCreateOffer(decoded.userId);
    if (!canCreate) {
      const company = await prisma.company.findUnique({
        where: { userId: decoded.userId },
      });
      return NextResponse.json(
        {
          error: 'Kontingent für diesen Monat aufgebraucht',
          quotaExceeded: true,
          tier: company?.subscriptionTier || 'free'
        },
        { status: 429 }
      );
    }

    const { clientName, clientEmail } = await request.json();

    if (!clientName) {
      return NextResponse.json(
        { error: 'Kundennamen erforderlich' },
        { status: 400 }
      );
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const offer = await prisma.offer.create({
      data: {
        userId: decoded.userId,
        clientName,
        clientEmail: clientEmail || null,
        subtotalNet: 0,
        taxAmount: 0,
        totalGross: 0,
        validUntil,
      },
      include: { positions: true },
    });

    // Increment offer count after successful creation
    await incrementOfferCount(decoded.userId);

    return NextResponse.json(
      { offer, message: 'Angebot erstellt' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Offer creation error:', error);
    return NextResponse.json(
      { error: 'Angebotserstellung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
