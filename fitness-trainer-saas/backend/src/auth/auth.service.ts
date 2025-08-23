import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface LoginDto {
  email: string;
  password?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // For testing purposes, we'll allow login without password verification
    // In production, you would verify the password hash here

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        experienceLevel: user.experienceLevel,
        fitnessGoals: user.fitnessGoals,
      },
    };
  }

  async validateUser(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  // Quick login method for testing with predefined users
  async quickLogin(userType: 'trainer' | 'client' | 'admin' = 'trainer') {
    const emailMap = {
      trainer: 'john.trainer@fitnesspro.com',
      client: 'emma.client@example.com',
      admin: 'admin@fitnesspro.com',
    };

    return this.login({ email: emailMap[userType] });
  }
}
