import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateOfferPDF } from '@/lib/pdf-generator';

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

    const company = await prisma.company.findUnique({
      where: { userId: decoded.userId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Unternehmen nicht gefunden' },
        { status: 404 }
      );
    }

    const pdfBuffer = await generateOfferPDF({
      id: offer.id,
      clientName: offer.clientName,
      clientEmail: offer.clientEmail || undefined,
      positions: offer.positions,
      subtotalNet: offer.subtotalNet,
      taxAmount: offer.taxAmount,
      totalGross: offer.totalGross,
      validUntil: offer.validUntil.toISOString(),
      companyName: company.name,
      companyLogo: company.logoUrl || undefined,
      createdAt: offer.createdAt.toISOString(),
      amendmentNumber: offer.amendmentNumber || undefined,
      parentOfferId: offer.parentOfferId || undefined,
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Angebot_${offer.id.substring(0, 8)}_${offer.clientName.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'PDF-Generierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
