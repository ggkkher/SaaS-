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

    // Get all offers for this user
    const offers = await prisma.offer.findMany({
      where: { userId: decoded.userId },
      include: {
        positions: true,
      },
    });

    // Group by month and calculate metrics
    const monthlyData: {
      [key: string]: {
        month: string;
        revenue: number;
        offerCount: number;
        signedOffers: number;
      };
    } = {};

    for (const offer of offers) {
      const date = new Date(offer.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthLabel,
          revenue: 0,
          offerCount: 0,
          signedOffers: 0,
        };
      }

      monthlyData[monthKey].offerCount += 1;

      // Only count revenue from signed/sent offers
      if (offer.status === 'signed' || offer.status === 'accepted') {
        monthlyData[monthKey].revenue += offer.totalGross;
        monthlyData[monthKey].signedOffers += 1;
      }
    }

    // Convert to array and sort by month
    const trends = Object.values(monthlyData)
      .sort((a, b) => {
        const aDate = new Date(a.month);
        const bDate = new Date(b.month);
        return aDate.getTime() - bDate.getTime();
      });

    // Calculate overall stats
    const totalRevenue = offers
      .filter(o => o.status === 'signed' || o.status === 'accepted')
      .reduce((sum, o) => sum + o.totalGross, 0);

    const totalOffers = offers.length;
    const signedOffers = offers.filter(o => o.status === 'signed' || o.status === 'accepted').length;
    const conversionRate = totalOffers > 0 ? (signedOffers / totalOffers) * 100 : 0;

    // Get stats for last 12 months
    const last12Months = trends.slice(-12);

    return NextResponse.json(
      {
        trends: last12Months,
        stats: {
          totalRevenue,
          totalOffers,
          signedOffers,
          conversionRate: Math.round(conversionRate),
          averageOfferValue: totalOffers > 0 ? totalRevenue / signedOffers : 0,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Revenue trends error:', error);
    return NextResponse.json(
      { error: error.message || 'Fehler beim Laden der Analysen' },
      { status: 500 }
    );
  }
}
