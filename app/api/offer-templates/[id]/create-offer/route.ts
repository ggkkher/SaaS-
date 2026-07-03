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

    // Get template with positions
    const template = await prisma.offerTemplate.findFirst({
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

    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 });
    }

    const { clientName, clientEmail, customerId } = await request.json();

    if (!clientName?.trim()) {
      return NextResponse.json({ error: 'Kundenname erforderlich' }, { status: 400 });
    }

    // Create new offer from template
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    // Calculate totals
    let subtotalNet = 0;
    for (const pos of template.positions) {
      const quantity = pos.quantity || 1;
      const unitPrice = pos.unitPrice || (pos.hourlyRate && pos.hours ? pos.hourlyRate * pos.hours : 0);
      subtotalNet += quantity * unitPrice;
    }

    const taxAmount = subtotalNet * 0.19;
    const totalGross = subtotalNet + taxAmount;

    const offer = await prisma.offer.create({
      data: {
        userId: decoded.userId,
        clientName: clientName.trim(),
        clientEmail: clientEmail?.trim() || null,
        customerId: customerId || null,
        subtotalNet,
        taxAmount,
        totalGross,
        validUntil,
        status: 'draft',
        positions: {
          create: template.positions.map((pos) => ({
            name: pos.name,
            description: pos.description,
            quantity: pos.quantity,
            unit: pos.unit,
            unitPrice: pos.unitPrice || 0,
            totalNet: (pos.quantity || 1) * (pos.unitPrice || (pos.hourlyRate && pos.hours ? pos.hourlyRate * pos.hours : 0)),
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

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error: any) {
    console.error('Create offer from template error:', error);
    return NextResponse.json(
      { error: error.message || 'Angebot konnte nicht aus Template erstellt werden' },
      { status: 500 }
    );
  }
}
