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

    // Get all customers for this user, sorted by name
    const customers = await prisma.customer.findMany({
      where: { userId: decoded.userId },
      include: {
        offers: {
          select: {
            id: true,
            totalGross: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Last 5 offers per customer
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add offer count to each customer
    const customersWithStats = customers.map((customer) => ({
      ...customer,
      offerCount: customer.offers.length,
      lastOfferDate: customer.offers[0]?.createdAt || null,
      totalSpent: customer.offers.reduce((sum, offer) => sum + offer.totalGross, 0),
    }));

    return NextResponse.json({ customers: customersWithStats }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch customers error:', error);
    return NextResponse.json(
      { error: error.message || 'Kunden konnten nicht geladen werden' },
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

    const { name, email, phone, notes, tags } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Kundenname erforderlich' }, { status: 400 });
    }

    // Create new customer
    const customer = await prisma.customer.create({
      data: {
        userId: decoded.userId,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
        tags: tags ? tags.split(',').map((t: string) => t.trim()).join(',') : '',
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: any) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: error.message || 'Kunde konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}
