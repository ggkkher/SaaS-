import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
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

    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
      include: {
        offers: {
          select: {
            id: true,
            status: true,
            totalGross: true,
            createdAt: true,
            signedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ customer }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch customer error:', error);
    return NextResponse.json(
      { error: error.message || 'Kunde konnte nicht geladen werden' },
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
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token ungültig' }, { status: 401 });
    }

    // Verify ownership
    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
    }

    const { name, email, phone, notes, tags } = await request.json();

    const updatedCustomer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(tags && { tags: tags.split(',').map((t: string) => t.trim()).join(',') }),
      },
    });

    return NextResponse.json({ customer: updatedCustomer }, { status: 200 });
  } catch (error: any) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: error.message || 'Kunde konnte nicht aktualisiert werden' },
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
    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Kunde gelöscht' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: error.message || 'Kunde konnte nicht gelöscht werden' },
      { status: 500 }
    );
  }
}
