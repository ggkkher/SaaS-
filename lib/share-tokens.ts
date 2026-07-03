import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function generateShareToken(
  offerId: string,
  clientEmail?: string
): Promise<string> {
  // Generate a random 32-byte token (256-bit)
  const token = crypto.randomBytes(32).toString('hex');

  await prisma.offerShareToken.create({
    data: {
      token,
      offerId,
      clientEmail,
    },
  });

  return token;
}

export async function getOrCreateShareToken(
  offerId: string,
  clientEmail?: string
): Promise<string> {
  // Check if token already exists
  const existing = await prisma.offerShareToken.findFirst({
    where: { offerId },
  });

  if (existing) {
    return existing.token;
  }

  // Create new token
  return generateShareToken(offerId, clientEmail);
}

export async function validateToken(token: string) {
  const shareToken = await prisma.offerShareToken.findUnique({
    where: { token },
    include: { offer: { include: { positions: true, user: { include: { company: true } } } } },
  });

  if (!shareToken) {
    return null;
  }

  // Check if token is expired
  if (shareToken.expiresAt && shareToken.expiresAt < new Date()) {
    return null;
  }

  return shareToken;
}

export async function trackAccess(token: string) {
  await prisma.offerShareToken.update({
    where: { token },
    data: {
      accessCount: { increment: 1 },
      lastAccessedAt: new Date(),
    },
  });
}

export async function getShareTokenByOfferId(offerId: string) {
  return prisma.offerShareToken.findFirst({
    where: { offerId },
  });
}

export async function isTokenExpired(token: string): Promise<boolean> {
  const shareToken = await prisma.offerShareToken.findUnique({
    where: { token },
  });

  if (!shareToken) {
    return true;
  }

  if (shareToken.expiresAt && shareToken.expiresAt < new Date()) {
    return true;
  }

  return false;
}

export function getPortalUrl(token: string, offerId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/portal/${token}/offers/${offerId}`;
}

export function generateQRCodeUrl(token: string, offerId: string): string {
  const portalUrl = getPortalUrl(token, offerId);
  // Using QR.io API for simple QR code generation
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(portalUrl)}`;
}
