import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { suggestPrice } from '@/lib/ai-calculator';

export async function POST(request: NextRequest) {
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

    const { name, description, quantity, unit, hourlyRate, hours } =
      await request.json();

    if (!name || !unit || quantity === undefined) {
      return NextResponse.json(
        { error: 'Erforderliche Felder fehlen' },
        { status: 400 }
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

    const suggestion = await suggestPrice(
      {
        name,
        description: description || '',
        quantity: parseFloat(quantity),
        unit,
        hourlyRate: hourlyRate || company.hourlyRate,
        hours: hours ? parseFloat(hours) : undefined,
      },
      {
        hourlyRate: company.hourlyRate,
        profitMargin: company.profitMargin,
        materialCost: company.materialCost,
        fixedCosts: company.fixedCosts,
      }
    );

    return NextResponse.json(suggestion, { status: 200 });
  } catch (error: any) {
    console.error('AI calculation error:', error);
    return NextResponse.json(
      { error: 'Preisberechnung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
