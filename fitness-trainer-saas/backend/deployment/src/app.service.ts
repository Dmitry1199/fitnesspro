import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): any {
    return {
      message: 'FitnessPro SaaS Backend API is running! 🏋️‍♂️',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      docs: '/api/docs',
      platform: 'fitness-training',
    };
  }

  getHealth(): any {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'connected', // This would be checked in real implementation
        api: 'active',
        authentication: 'ready',
      },
      platform: {
        type: 'fitness-training',
        features: ['user-management', 'trainer-client', 'workouts', 'sessions'],
      },
    };
  }
}
