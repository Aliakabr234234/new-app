import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateTokens';
import { hashToken } from '../utils/hashToken';

const prisma = new PrismaClient();

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export async function createTokenPair(payload: TokenPayload, rememberMe: boolean = false) {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store hashed refresh token in DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: payload.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshTokenValue: string) {
  // Verify the JWT
  const payload = verifyRefreshToken(refreshTokenValue);

  // Check if token hash exists in DB
  const tokenHash = hashToken(refreshTokenValue);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }

  // Generate new access token
  const accessToken = generateAccessToken({
    id: payload.id,
    email: payload.email,
    role: payload.role,
  });

  return { accessToken, user: payload };
}

export async function revokeRefreshToken(refreshTokenValue: string) {
  const tokenHash = hashToken(refreshTokenValue);
  try {
    await prisma.refreshToken.delete({
      where: { tokenHash },
    });
  } catch {
    // Token may not exist — that's okay
  }
}

export async function revokeAllUserTokens(userId: string) {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

// Clean up expired tokens periodically
export async function cleanupExpiredTokens() {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
}
