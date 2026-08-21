import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { jest } from '@jest/globals';
import request from 'supertest';
import { createHash, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { PrismaService as PrismaServiceClass } from '../prisma/prisma.service.js';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testEmail: string;
  let registration: request.Response;
  const testEmails = new Set<string>();

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-auth-secret';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    const { AppModule } = await import('../app.module.js');

    app = await NestFactory.create(AppModule);
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = app.get(PrismaServiceClass);
    testEmail = createTestEmail(testEmails);
  });

  jest.setTimeout(60_000);

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [...testEmails] } },
    });
    await app.close();
  });

  it('registers a user and creates a safe preference', async () => {
    registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        displayName: 'Auth Test User',
        email: testEmail.toUpperCase(),
        password: 'password123',
        grade: 'senior-high',
      })
      .expect(201);

    expect(Object.keys(registration.body).sort()).toEqual([
      'accessToken',
      'refreshToken',
      'user',
    ]);
    expect(registration.body.user).toEqual(
      expect.objectContaining({
        email: testEmail,
        displayName: 'Auth Test User',
      }),
    );
    expect(registration.body).not.toHaveProperty('passwordHash');
    expect(registration.body).not.toHaveProperty('tokenHash');

    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { preference: true },
    });
    expect(user).not.toBeNull();
    expect(user?.passwordHash).not.toBe('password123');
    expect(await bcrypt.compare('password123', user!.passwordHash)).toBe(true);
    expect(user?.preference).toEqual(
      expect.objectContaining({
        grade: 'senior_high',
        subject: null,
        pathway: null,
      }),
    );
  });

  it('rejects whitespace-only display names', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        displayName: '   ',
        email: createTestEmail(testEmails),
        password: 'password123',
        grade: 'senior-high',
      })
      .expect(400);
  });

  it('rejects pathways for grades where they do not apply', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        displayName: 'Auth Test User',
        email: createTestEmail(testEmails),
        password: 'password123',
        grade: 'junior-high',
        pathway: 'stem',
      })
      .expect(400);
  });

  it('accepts a pathway for senior-high', async () => {
    const email = createTestEmail(testEmails);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        displayName: 'Pathway Test User',
        email,
        password: 'password123',
        grade: 'senior-high',
        pathway: 'stem',
      })
      .expect(201);
  });

  it('rejects duplicate registration', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        displayName: 'Auth Test User',
        email: testEmail,
        password: 'password123',
        grade: 'senior-high',
      })
      .expect(409);

    expect(await prisma.user.count({ where: { email: testEmail } })).toBe(1);
  });

  it('logs in and stores only a refresh-token hash', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'password123' })
      .expect(201);

    expect(login.body).toEqual(
      expect.objectContaining({
        user: {
          id: expect.any(String),
          email: testEmail,
          displayName: 'Auth Test User',
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      }),
    );
    expect(Object.keys(login.body.user).sort()).toEqual([
      'displayName',
      'email',
      'id',
    ]);

    const tokenHash = hashToken(login.body.refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    expect(storedToken).not.toBeNull();
    expect(storedToken?.tokenHash).toBe(tokenHash);
    expect(storedToken?.tokenHash).not.toBe(login.body.refreshToken);

    const payload = new JwtService().decode(login.body.accessToken) as Record<
      string,
      unknown
    >;
    expect(payload).toEqual(
      expect.objectContaining({ sub: login.body.user.id }),
    );
    expect(payload).not.toHaveProperty('refreshToken');
  });

  it('rejects an incorrect password generically', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'incorrect-password' })
      .expect(401);

    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body.message).toBe('Invalid authentication credentials.');
  });

  it('protects /auth/me and returns only the safe user', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'password123' })
      .expect(201);

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(Object.keys(me.body).sort()).toEqual(['displayName', 'email', 'id']);
    expect(me.body).not.toHaveProperty('passwordHash');
    expect(me.body).not.toHaveProperty('refreshTokens');
    expect(me.body).not.toHaveProperty('tokenHash');
  });

  it('rejects missing and invalid access tokens', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid.jwt.value')
      .expect(401);
  });

  it('rotates refresh tokens and preserves the token family', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'password123' })
      .expect(201);
    const oldHash = hashToken(login.body.refreshToken);
    const oldToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: oldHash },
    });

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(201);
    const newToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshed.body.refreshToken) },
    });
    const revokedOldToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: oldHash },
    });

    expect(refreshed.body.accessToken).toEqual(expect.any(String));
    expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);
    expect(newToken?.familyId).toBe(oldToken?.familyId);
    expect(revokedOldToken?.revokedAt).not.toBeNull();
    expect(newToken?.tokenHash).not.toBe(refreshed.body.refreshToken);
  });

  it('revokes the family when an old refresh token is reused', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'password123' })
      .expect(201);
    const rotated = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(201);
    const replacementHash = hashToken(rotated.body.refreshToken);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);

    const replacement = await prisma.refreshToken.findUnique({
      where: { tokenHash: replacementHash },
    });
    const familyTokens = await prisma.refreshToken.findMany({
      where: { familyId: replacement!.familyId },
    });
    expect(familyTokens.every((token) => token.revokedAt !== null)).toBe(true);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(401);
  });

  it('logs out and rejects the revoked refresh token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'password123' })
      .expect(201);
    const tokenHash = hashToken(login.body.refreshToken);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: login.body.refreshToken })
      .expect(201);

    const revokedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    expect(revokedToken?.revokedAt).not.toBeNull();
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });

  it('rejects invalid and expired refresh tokens', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid-refresh-token' })
      .expect(401);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'password123' })
      .expect(201);
    const tokenHash = hashToken(login.body.refreshToken);
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });
});

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function createTestEmail(testEmails: Set<string>): string {
  const email = `auth-test-${randomUUID()}@example.com`;
  testEmails.add(email);
  return email;
}
