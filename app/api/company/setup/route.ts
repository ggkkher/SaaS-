import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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

    const {
      name,
      logo,
      hourlyRate,
      profitMargin,
      materialCost,
      fixedCosts,
      taxRate,
    } = await request.json();

    if (!name || !hourlyRate || !profitMargin === undefined) {
      return NextResponse.json(
        { error: 'Erforderliche Felder fehlen' },
        { status: 400 }
      );
    }

    const existingCompany = await prisma.company.findUnique({
      where: { userId: decoded.userId },
    });

    let company;

    if (existingCompany) {
      company = await prisma.company.update({
        where: { userId: decoded.userId },
        data: {
          name,
          logoUrl: logo || existingCompany.logoUrl,
          hourlyRate: parseFloat(hourlyRate),
          profitMargin: parseFloat(profitMargin),
          materialCost: parseFloat(materialCost) || 0,
          fixedCosts: parseFloat(fixedCosts) || 0,
          taxRate: parseFloat(taxRate) || 0.19,
        },
      });
    } else {
      company = await prisma.company.create({
        data: {
          userId: decoded.userId,
          name,
          logoUrl: logo || null,
          hourlyRate: parseFloat(hourlyRate),
          profitMargin: parseFloat(profitMargin),
          materialCost: parseFloat(materialCost) || 0,
          fixedCosts: parseFloat(fixedCosts) || 0,
          taxRate: parseFloat(taxRate) || 0.19,
        },
      });
    }

    return NextResponse.json(
      {
        message: 'Unternehmen erfolgreich erstellt',
        company,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Company setup error:', error);
    return NextResponse.json(
      { error: 'Unternehmens-Setup fehlgeschlagen' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const company = await prisma.company.findUnique({
      where: { userId: decoded.userId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Unternehmen nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Company fetch error:', error);
    return NextResponse.json(
      { error: 'Anfrage fehlgeschlagen' },
      { status: 500 }
    );
  }
}
