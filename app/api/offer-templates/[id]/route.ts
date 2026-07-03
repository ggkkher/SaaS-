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
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token ungültig' }, { status: 401 });
    }

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

    return NextResponse.json({ template }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch offer template error:', error);
    return NextResponse.json(
      { error: error.message || 'Angebots-Template konnte nicht geladen werden' },
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
    const template = await prisma.offerTemplate.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 });
    }

    await prisma.offerTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Template gelöscht' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete offer template error:', error);
    return NextResponse.json(
      { error: error.message || 'Angebots-Template konnte nicht gelöscht werden' },
      { status: 500 }
    );
  }
}
