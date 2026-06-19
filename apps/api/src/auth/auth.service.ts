import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findOneBy({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens({ sub: user.id, email: user.email, role: user.role });
  }

  async refresh(token: string): Promise<{ accessToken: string }> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'refresh-change-me-dev-only'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const accessToken = this.jwtService.sign(
      { sub: payload.sub, email: payload.email, role: payload.role },
      { expiresIn: '15m' },
    );
    return { accessToken };
  }

  private issueTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET', 'refresh-change-me-dev-only'),
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }
}
