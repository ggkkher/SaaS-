import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
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

    // Verify ownership
    const template = await prisma.positionTemplate.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 });
    }

    const { name, description, quantity, unit, unitPrice, hours, hourlyRate } = await request.json();

    const updated = await prisma.positionTemplate.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || '' }),
        ...(quantity !== undefined && { quantity: parseFloat(quantity) }),
        ...(unit && { unit }),
        ...(unitPrice !== undefined && { unitPrice: unitPrice ? parseFloat(unitPrice) : null }),
        ...(hours !== undefined && { hours: hours ? parseFloat(hours) : null }),
        ...(hourlyRate !== undefined && { hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null }),
      },
    });

    return NextResponse.json({ template: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Update position template error:', error);
    return NextResponse.json(
      { error: error.message || 'Position-Template konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = _request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token ungültig' }, { status: 401 });
    }

    // Verify ownership
    const template = await prisma.positionTemplate.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 });
    }

    await prisma.positionTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Template gelöscht' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete position template error:', error);
    return NextResponse.json(
      { error: error.message || 'Position-Template konnte nicht gelöscht werden' },
      { status: 500 }
    );
  }
}
