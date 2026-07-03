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
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token ungültig' }, { status: 401 });
    }

    // Get offer with positions
    const offer = await prisma.offer.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
      include: {
        positions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Angebot nicht gefunden' }, { status: 404 });
    }

    const { templateName, description } = await request.json();

    if (!templateName?.trim()) {
      return NextResponse.json({ error: 'Template-Name erforderlich' }, { status: 400 });
    }

    // Create template from offer
    const template = await prisma.offerTemplate.create({
      data: {
        userId: decoded.userId,
        name: templateName.trim(),
        description: description?.trim() || null,
        positions: {
          create: offer.positions.map((pos) => ({
            name: pos.name,
            description: pos.description,
            quantity: pos.quantity,
            unit: pos.unit,
            unitPrice: pos.unitPrice,
            hours: pos.hours,
            hourlyRate: pos.hourlyRate,
            order: pos.order,
          })),
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
    console.error('Save offer as template error:', error);
    return NextResponse.json(
      { error: error.message || 'Angebot konnte nicht als Template gespeichert werden' },
      { status: 500 }
    );
  }
}
