import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthService, LoginDto } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('quick-login')
  @ApiOperation({ summary: 'Quick login for testing (no password required)' })
  @ApiResponse({ status: 200, description: 'Quick login successful' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['trainer', 'client', 'admin'],
    description: 'User type for quick login'
  })
  async quickLogin(@Query('type') type: 'trainer' | 'client' | 'admin' = 'trainer') {
    return this.authService.quickLogin(type);
  }

  @Get('test-users')
  @ApiOperation({ summary: 'Get list of test users for authentication' })
  @ApiResponse({ status: 200, description: 'Test users list' })
  async getTestUsers() {
    return {
      message: 'Available test users for authentication',
      users: [
        {
          email: 'john.trainer@fitnesspro.com',
          role: 'TRAINER',
          name: 'John Smith',
          description: 'Strength Training Expert'
        },
        {
          email: 'sarah.trainer@fitnesspro.com',
          role: 'TRAINER',
          name: 'Sarah Johnson',
          description: 'Yoga & Mindfulness Specialist'
        },
        {
          email: 'mike.crossfit@fitnesspro.com',
          role: 'TRAINER',
          name: 'Mike Rodriguez',
          description: 'CrossFit Specialist'
        },
        {
          email: 'emma.client@example.com',
          role: 'CLIENT',
          name: 'Emma Wilson',
          description: 'Beginner Client'
        },
        {
          email: 'david.client@example.com',
          role: 'CLIENT',
          name: 'David Chen',
          description: 'Intermediate Client'
        },
        {
          email: 'lisa.client@example.com',
          role: 'CLIENT',
          name: 'Lisa Anderson',
          description: 'Advanced Client'
        },
        {
          email: 'admin@fitnesspro.com',
          role: 'ADMIN',
          name: 'Admin User',
          description: 'Platform Administrator'
        }
      ],
      quickLoginExamples: {
        trainer: '/api/auth/quick-login?type=trainer',
        client: '/api/auth/quick-login?type=client',
        admin: '/api/auth/quick-login?type=admin'
      }
    };
  }
}
