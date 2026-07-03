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

    // Verify parent offer exists and belongs to user
    const parentOffer = await prisma.offer.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    });

    if (!parentOffer) {
      return NextResponse.json(
        { error: 'Original-Angebot nicht gefunden' },
        { status: 404 }
      );
    }

    // Count existing amendments to set number
    const existingAmendments = await prisma.offer.count({
      where: {
        parentOfferId: params.id,
      },
    });

    const amendmentNumber = existingAmendments + 1;

    // Create new amendment offer
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const amendment = await prisma.offer.create({
      data: {
        userId: decoded.userId,
        clientName: parentOffer.clientName,
        clientEmail: parentOffer.clientEmail,
        parentOfferId: params.id,
        amendmentType: 'amendment',
        amendmentNumber,
        subtotalNet: 0,
        taxAmount: 0,
        totalGross: 0,
        validUntil,
      },
      include: { positions: true },
    });

    return NextResponse.json(
      {
        amendment,
        message: `${amendmentNumber}. Nachtrag erstellt`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Amendment creation error:', error);
    return NextResponse.json(
      { error: 'Nachtrag konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}

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

    // Verify parent offer exists and belongs to user
    const parentOffer = await prisma.offer.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    });

    if (!parentOffer) {
      return NextResponse.json(
        { error: 'Original-Angebot nicht gefunden' },
        { status: 404 }
      );
    }

    // Get all amendments for this offer
    const amendments = await prisma.offer.findMany({
      where: {
        parentOfferId: params.id,
      },
      include: { positions: { orderBy: { order: 'asc' } } },
      orderBy: { amendmentNumber: 'asc' },
    });

    return NextResponse.json({ amendments });
  } catch (error) {
    console.error('Amendments fetch error:', error);
    return NextResponse.json(
      { error: 'Anfrage fehlgeschlagen' },
      { status: 500 }
    );
  }
}
