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

    const {
      name,
      description,
      quantity,
      unit,
      unitPrice,
      hours,
      hourlyRate,
    } = await request.json();

    if (!name || quantity === undefined || !unit) {
      return NextResponse.json(
        { error: 'Erforderliche Felder fehlen' },
        { status: 400 }
      );
    }

    const lastPosition = await prisma.position.findFirst({
      where: { offerId: params.id },
      orderBy: { order: 'desc' },
    });

    const nextOrder = (lastPosition?.order ?? -1) + 1;

    const totalNet =
      unitPrice && quantity ? quantity * unitPrice : 0;

    const position = await prisma.position.create({
      data: {
        offerId: params.id,
        name,
        description: description || '',
        quantity: parseFloat(quantity),
        unit,
        unitPrice: unitPrice ? parseFloat(unitPrice) : 0,
        hours: hours ? parseFloat(hours) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        totalNet,
        order: nextOrder,
      },
    });

    // Update offer totals
    const allPositions = await prisma.position.findMany({
      where: { offerId: params.id },
    });

    const subtotalNet = allPositions.reduce((sum, pos) => sum + pos.totalNet, 0);
    const taxAmount = subtotalNet * 0.19;
    const totalGross = subtotalNet + taxAmount;

    await prisma.offer.update({
      where: { id: params.id },
      data: {
        subtotalNet,
        taxAmount,
        totalGross,
      },
    });

    return NextResponse.json(
      { position, message: 'Position hinzugefügt' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Position creation error:', error);
    return NextResponse.json(
      { error: 'Position konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}
