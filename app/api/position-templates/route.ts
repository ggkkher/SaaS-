import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token ungültig' }, { status: 401 });
    }

    const templates = await prisma.positionTemplate.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch position templates error:', error);
    return NextResponse.json(
      { error: error.message || 'Positionen-Templates konnten nicht geladen werden' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token ungültig' }, { status: 401 });
    }

    const { name, description, quantity, unit, unitPrice, hours, hourlyRate } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Positionsname erforderlich' }, { status: 400 });
    }

    const template = await prisma.positionTemplate.create({
      data: {
        userId: decoded.userId,
        name: name.trim(),
        description: description?.trim() || '',
        quantity: parseFloat(quantity) || 1,
        unit: unit || 'm²',
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        hours: hours ? parseFloat(hours) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error('Create position template error:', error);
    return NextResponse.json(
      { error: error.message || 'Position-Template konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}
