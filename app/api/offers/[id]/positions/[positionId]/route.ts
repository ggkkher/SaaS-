import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; positionId: string } }
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

    const totalNet =
      unitPrice && quantity ? quantity * unitPrice : 0;

    const position = await prisma.position.update({
      where: { id: params.positionId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(quantity !== undefined && { quantity: parseFloat(quantity) }),
        ...(unit && { unit }),
        ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
        ...(hours !== undefined && { hours: hours ? parseFloat(hours) : null }),
        ...(hourlyRate !== undefined && {
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        }),
        ...(unitPrice || hours !== undefined ? { totalNet } : {}),
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

    return NextResponse.json({ position, message: 'Position aktualisiert' });
  } catch (error) {
    console.error('Position update error:', error);
    return NextResponse.json(
      { error: 'Aktualisierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; positionId: string } }
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

    await prisma.position.delete({
      where: { id: params.positionId },
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
      { message: 'Position gelöscht' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Position deletion error:', error);
    return NextResponse.json(
      { error: 'Löschung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
