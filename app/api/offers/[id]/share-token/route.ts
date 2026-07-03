import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateShareToken, getShareTokenByOfferId } from '@/lib/share-tokens';

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

    // Generate or get existing share token
    const shareToken = await generateShareToken(params.id, offer.clientEmail || undefined);

    return NextResponse.json(
      { token: shareToken, message: 'Share-Token erstellt' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Share token generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Share-Token konnte nicht erstellt werden' },
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

    // Get existing share token
    const shareToken = await getShareTokenByOfferId(params.id);

    if (!shareToken) {
      return NextResponse.json(
        { token: null, message: 'Kein Share-Token vorhanden' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        token: shareToken.token,
        createdAt: shareToken.createdAt,
        accessCount: shareToken.accessCount,
        lastAccessedAt: shareToken.lastAccessedAt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Share token fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Share-Token konnte nicht abgerufen werden' },
      { status: 500 }
    );
  }
}
