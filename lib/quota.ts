import { prisma } from '@/lib/db';
import { STRIPE_PLANS } from '@/lib/stripe';

export async function canCreateOffer(userId: string): Promise<boolean> {
  const company = await prisma.company.findUnique({
    where: { userId },
  });

  if (!company) {
    return false;
  }

  const tier = company.subscriptionTier as keyof typeof STRIPE_PLANS;
  const limit = STRIPE_PLANS[tier]?.offersPerMonth || 0;

  // Check if we need to reset the monthly counter
  const now = new Date();
  if (
    !company.monthlyResetDate ||
    company.monthlyResetDate < new Date(now.getFullYear(), now.getMonth(), 1)
  ) {
    // Reset counter for new month
    await prisma.company.update({
      where: { userId },
      data: {
        offersCreatedThisMonth: 0,
        monthlyResetDate: new Date(now.getFullYear(), now.getMonth(), 1),
      },
    });
    return true;
  }

  return company.offersCreatedThisMonth < limit;
}

export async function incrementOfferCount(userId: string): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { userId },
  });

  if (!company) {
    return;
  }

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Reset if month has changed
  if (
    !company.monthlyResetDate ||
    company.monthlyResetDate < currentMonthStart
  ) {
    await prisma.company.update({
      where: { userId },
      data: {
        offersCreatedThisMonth: 1,
        monthlyResetDate: currentMonthStart,
      },
    });
  } else {
    await prisma.company.update({
      where: { userId },
      data: {
        offersCreatedThisMonth: {
          increment: 1,
        },
      },
    });
  }
}

export function getRemainingQuota(
  subscriptionTier: string,
  offersCreated: number
): number {
  const tier = subscriptionTier as keyof typeof STRIPE_PLANS;
  const limit = STRIPE_PLANS[tier]?.offersPerMonth || 0;
  return Math.max(0, limit - offersCreated);
}
