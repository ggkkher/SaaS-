import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
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
      include: { positions: { orderBy: { order: 'asc' } } },
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error('Offer fetch error:', error);
    return NextResponse.json(
      { error: 'Anfrage fehlgeschlagen' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { clientName, clientEmail, subtotalNet, taxAmount, totalGross, status, signatureUrl } =
      await request.json();

    const updateData: any = {
      ...(clientName && { clientName }),
      ...(clientEmail !== undefined && { clientEmail }),
      ...(subtotalNet !== undefined && { subtotalNet }),
      ...(taxAmount !== undefined && { taxAmount }),
      ...(totalGross !== undefined && { totalGross }),
      ...(status && { status }),
      ...(signatureUrl && { signatureUrl }),
    };

    // Set signedAt timestamp when status changes to 'signed'
    if (status === 'signed') {
      updateData.signedAt = new Date();
    }

    const offer = await prisma.offer.update({
      where: {
        id: params.id,
      },
      data: updateData,
      include: { positions: true },
    });

    return NextResponse.json({ offer, message: 'Angebot aktualisiert' });
  } catch (error) {
    console.error('Offer update error:', error);
    return NextResponse.json(
      { error: 'Aktualisierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const existingOffer = await prisma.offer.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    });

    if (!existingOffer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.offer.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Angebot gelöscht' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Offer deletion error:', error);
    return NextResponse.json(
      { error: 'Löschung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
