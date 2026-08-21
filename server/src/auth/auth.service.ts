import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { Grade, Pathway } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';

const BCRYPT_ROUNDS = 12;
const INVALID_CREDENTIALS_MESSAGE = 'Invalid authentication credentials.';

const gradeMap: Record<string, Grade> = {
  'lower-primary': Grade.lower_primary,
  'upper-primary': Grade.upper_primary,
  'junior-high': Grade.junior_high,
  'senior-high': Grade.senior_high,
};

const pathwayMap: Record<string, Pathway> = {
  'arts-sports': Pathway.arts_sports,
  'social-sciences': Pathway.social_sciences,
  stem: Pathway.stem,
};

export interface SafeUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly refreshTokenTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.refreshTokenTtlMs = parseDuration(
      process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    );
  }

  async register(dto: RegisterDto): Promise<{ user: SafeUser } & AuthTokens> {
    const email = normalizeEmail(dto.email);
    const displayName = dto.displayName.trim();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      const user = await this.prisma.$transaction(async (transaction) => {
        const createdUser = await transaction.user.create({
          data: {
            email,
            passwordHash,
            displayName,
            preference: {
              create: {
                grade: gradeMap[dto.grade],
                subject: dto.subject?.trim() || null,
                pathway: dto.pathway ? pathwayMap[dto.pathway] : null,
              },
            },
          },
          select: { id: true, email: true, displayName: true },
        });

        return createdUser;
      });

      return { user, ...(await this.issueTokens(user.id)) };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'An account with that email already exists.',
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<{ user: SafeUser } & AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(dto.email) },
      select: { id: true, email: true, displayName: true, passwordHash: true },
    });

    const passwordMatches = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };

    return { user: safeUser, ...(await this.issueTokens(user.id)) };
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    const tokenHash = hashRefreshToken(dto.refreshToken);
    const now = new Date();
    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        familyId: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!existingToken) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (existingToken.revokedAt) {
      await this.revokeFamily(existingToken.familyId);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (existingToken.expiresAt <= now) {
      await this.prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: { revokedAt: now },
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const rawRefreshToken = generateRefreshToken();
    const newExpiresAt = new Date(now.getTime() + this.refreshTokenTtlMs);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const revoked = await transaction.refreshToken.updateMany({
          where: { id: existingToken.id, revokedAt: null },
          data: { revokedAt: now },
        });

        if (revoked.count !== 1) {
          await transaction.refreshToken.updateMany({
            where: { familyId: existingToken.familyId, revokedAt: null },
            data: { revokedAt: now },
          });
          throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
        }

        await transaction.refreshToken.create({
          data: {
            userId: existingToken.userId,
            tokenHash: hashRefreshToken(rawRefreshToken),
            familyId: existingToken.familyId,
            expiresAt: newExpiresAt,
          },
        });

        return {
          accessToken: await this.createAccessToken(existingToken.userId),
          refreshToken: rawRefreshToken,
        };
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }
  }

  async logout(dto: RefreshTokenDto): Promise<{ success: true }> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(dto.refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  private async issueTokens(userId: string): Promise<AuthTokens> {
    const rawRefreshToken = generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashRefreshToken(rawRefreshToken),
        familyId: randomUUID(),
        expiresAt: new Date(Date.now() + this.refreshTokenTtlMs),
      },
    });

    return {
      accessToken: await this.createAccessToken(userId),
      refreshToken: rawRefreshToken,
    };
  }

  private createAccessToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId },
      {
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ??
          '15m') as JwtSignOptions['expiresIn'],
      },
    );
  }

  private revokeFamily(familyId: string): Promise<unknown> {
    return this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function parseDuration(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    throw new Error(
      'JWT_REFRESH_EXPIRES_IN must use a value such as 7d, 12h, or 30m.',
    );
  }

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return Number(match[1]) * multipliers[match[2]];
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
