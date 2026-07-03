import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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

    // Fetch original offer with positions
    const originalOffer = await prisma.offer.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
      include: {
        positions: true,
      },
    });

    if (!originalOffer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden' },
        { status: 404 }
      );
    }

    // Calculate new validUntil (30 days from now)
    const newValidUntil = new Date();
    newValidUntil.setDate(newValidUntil.getDate() + 30);

    // Create duplicate offer
    const duplicateOffer = await prisma.offer.create({
      data: {
        userId: decoded.userId,
        clientName: originalOffer.clientName,
        clientEmail: originalOffer.clientEmail,
        subtotalNet: originalOffer.subtotalNet,
        taxAmount: originalOffer.taxAmount,
        totalGross: originalOffer.totalGross,
        status: 'draft',
        validUntil: newValidUntil,
        positions: {
          create: originalOffer.positions.map((pos) => ({
            name: pos.name,
            description: pos.description,
            quantity: pos.quantity,
            unit: pos.unit,
            unitPrice: pos.unitPrice,
            totalNet: pos.totalNet,
            hours: pos.hours,
            hourlyRate: pos.hourlyRate,
            order: pos.order,
          })),
        },
      },
      include: {
        positions: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Angebot erfolgreich dupliziert',
        offer: duplicateOffer,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Offer duplication error:', error);
    return NextResponse.json(
      { error: error.message || 'Angebot konnte nicht dupliziert werden' },
      { status: 500 }
    );
  }
}
