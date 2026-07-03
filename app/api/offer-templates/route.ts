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

    const templates = await prisma.offerTemplate.findMany({
      where: { userId: decoded.userId },
      include: {
        positions: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch offer templates error:', error);
    return NextResponse.json(
      { error: error.message || 'Angebots-Templates konnten nicht geladen werden' },
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

    const { name, description, positions } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Template-Name erforderlich' }, { status: 400 });
    }

    const template = await prisma.offerTemplate.create({
      data: {
        userId: decoded.userId,
        name: name.trim(),
        description: description?.trim() || null,
        positions: {
          create: positions?.map((pos: any, idx: number) => ({
            name: pos.name,
            description: pos.description || '',
            quantity: parseFloat(pos.quantity) || 1,
            unit: pos.unit || 'm²',
            unitPrice: pos.unitPrice ? parseFloat(pos.unitPrice) : null,
            hours: pos.hours ? parseFloat(pos.hours) : null,
            hourlyRate: pos.hourlyRate ? parseFloat(pos.hourlyRate) : null,
            order: idx,
          })) || [],
        },
      },
      include: {
        positions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error('Create offer template error:', error);
    return NextResponse.json(
      { error: error.message || 'Angebots-Template konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}
