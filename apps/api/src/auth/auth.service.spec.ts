import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { UserRole } from '../common/enums';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-uuid',
    email: 'officer@example.com',
    passwordHash: '$2b$12$hashedpassword',
    role: UserRole.OFFICER,
    ...overrides,
  }) as User;

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: { findOneBy: jest.Mock };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    userRepo = { findOneBy: jest.fn() };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn(),
    };
    configService = { get: jest.fn().mockReturnValue('test-secret') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns accessToken and refreshToken for valid credentials', async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser());
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login('officer@example.com', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('throws UnauthorizedException when user is not found', async () => {
      userRepo.findOneBy.mockResolvedValue(null);

      await expect(service.login('unknown@example.com', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password does not match', async () => {
      userRepo.findOneBy.mockResolvedValue(makeUser());
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login('officer@example.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('encodes sub, email, and role into the token payload', async () => {
      const user = makeUser({ role: UserRole.ADMIN });
      userRepo.findOneBy.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await service.login(user.email, 'password');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-uuid', email: user.email, role: UserRole.ADMIN }),
        expect.anything(),
      );
    });
  });

  // ── refresh ───────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('issues a new access token for a valid refresh token', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-uuid',
        email: 'officer@example.com',
        role: UserRole.OFFICER,
      });

      const result = await service.refresh('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
    });

    it('throws UnauthorizedException for an invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
