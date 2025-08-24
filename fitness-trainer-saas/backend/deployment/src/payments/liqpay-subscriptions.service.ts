import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  currency: string;
}

@Injectable()
export class LiqPaySubscriptionsService {
  private publicKey: string;
  private privateKey: string;

  private subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Базовий план',
      price: 499,
      interval: 'month',
      currency: 'UAH',
      features: [
        'До 20 клієнтів',
        'Базовий конструктор тренувань',
        'Планування сесій',
        'Email підтримка',
      ],
    },
    {
      id: 'pro',
      name: 'Професійний план',
      price: 1299,
      interval: 'month',
      currency: 'UAH',
      features: [
        'До 100 клієнтів',
        'Розширений конструктор тренувань',
        'Автоматичне планування',
        'Відстеження прогресу',
        'Відео сесії',
        'Пріоритетна підтримка',
      ],
    },
    {
      id: 'premium',
      name: 'Преміум план',
      price: 2499,
      interval: 'month',
      currency: 'UAH',
      features: [
        'Необмежена кількість клієнтів',
        'White-label рішення',
        'Персональний брендинг',
        'Розширена аналітика',
        'API доступ',
        'Персональна підтримка',
      ],
    },
  ];

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.publicKey = this.configService.get('LIQPAY_PUBLIC_KEY') || '';
    this.privateKey = this.configService.get('LIQPAY_PRIVATE_KEY') || '';
  }

  private generateSignature(data: string): string {
    const signatureString = this.privateKey + data + this.privateKey;
    return CryptoJS.SHA1(signatureString).toString(CryptoJS.enc.Base64);
  }

  private encodeData(params: any): { data: string; signature: string } {
    const dataString = JSON.stringify(params);
    const data = Buffer.from(dataString).toString('base64');
    const signature = this.generateSignature(data);

    return { data, signature };
  }

  getSubscriptionPlans() {
    return this.subscriptionPlans;
  }

  async createSubscription(trainerId: string, planId: string) {
    const plan = this.subscriptionPlans.find(p => p.id === planId);
    if (!plan) {
      throw new BadRequestException('Invalid subscription plan');
    }

    // Get trainer details
    const trainer = await this.prisma.user.findUnique({
      where: { id: trainerId, role: 'TRAINER' },
    });

    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }

    const orderId = `subscription_${trainerId}_${planId}_${Date.now()}`;

    try {
      // LiqPay subscription payment configuration
      const liqpayParams = {
        public_key: this.publicKey,
        version: '3',
        action: 'pay',
        amount: plan.price,
        currency: 'UAH',
        description: `Підписка на план: ${plan.name}`,
        order_id: orderId,
        subscribe: '1', // Enable subscription
        subscribe_periodicity: 'month',
        result_url: `${this.configService.get('FRONTEND_URL')}/trainer/billing?success=true`,
        server_url: `${this.configService.get('BACKEND_URL')}/payments/liqpay/subscription-callback`,
      };

      const { data, signature } = this.encodeData(liqpayParams);

      // Save subscription record
      const subscriptionRecord = await this.prisma.subscription.create({
        data: {
          userId: trainerId,
          planId,
          planName: plan.name,
          price: plan.price,
          interval: plan.interval,
          liqpaySubscriptionId: orderId,
          liqpayCustomerId: trainer.liqpayCustomerId || '',
          status: 'pending',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      return {
        subscription: subscriptionRecord,
        liqpayData: data,
        liqpaySignature: signature,
        orderId,
      };
    } catch (error) {
      throw new BadRequestException(`Subscription creation failed: ${error.message}`);
    }
  }

  async updateSubscription(trainerId: string, newPlanId: string) {
    const plan = this.subscriptionPlans.find(p => p.id === newPlanId);
    if (!plan) {
      throw new BadRequestException('Invalid subscription plan');
    }

    // Get current subscription
    const currentSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId: trainerId,
        status: { in: ['active', 'pending'] },
      },
    });

    if (!currentSubscription) {
      throw new NotFoundException('No active subscription found');
    }

    // For LiqPay, we need to cancel current subscription and create a new one
    // This is because LiqPay doesn't support plan changes like Stripe

    // Cancel current subscription
    await this.cancelSubscription(trainerId, true);

    // Create new subscription
    return this.createSubscription(trainerId, newPlanId);
  }

  async cancelSubscription(trainerId: string, immediately = false) {
    // Get current subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: trainerId,
        status: { in: ['active', 'pending'] },
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    try {
      // For LiqPay, we need to make an unsubscribe request
      if (subscription.liqpaySubscriptionId) {
        const unsubscribeParams = {
          public_key: this.publicKey,
          version: '3',
          action: 'unsubscribe',
          order_id: subscription.liqpaySubscriptionId,
        };

        const { data, signature } = this.encodeData(unsubscribeParams);

        await axios.post('https://www.liqpay.ua/api/request', {
          data,
          signature,
        });
      }

      // Update subscription status
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
          cancelAtPeriodEnd: !immediately,
        },
      });

      await this.prisma.user.update({
        where: { id: trainerId },
        data: {
          subscriptionPlan: immediately ? null : subscription.planId,
          subscriptionStatus: 'canceled',
        },
      });

      return { success: true, immediately };
    } catch (error) {
      throw new BadRequestException(`Subscription cancellation failed: ${error.message}`);
    }
  }

  async getTrainerSubscription(trainerId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId: trainerId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return null;
    }

    const plan = this.subscriptionPlans.find(p => p.id === subscription.planId);

    return {
      ...subscription,
      plan,
      features: plan?.features || [],
    };
  }

  async handleSubscriptionCallback(data: string, signature: string) {
    // Verify signature
    const expectedSignature = this.generateSignature(data);
    if (signature !== expectedSignature) {
      throw new BadRequestException('Invalid signature');
    }

    // Decode data
    const decodedData = Buffer.from(data, 'base64').toString('utf8');
    const callbackData = JSON.parse(decodedData);

    const orderId = callbackData.order_id;

    // Find subscription record
    const subscription = await this.prisma.subscription.findFirst({
      where: { liqpaySubscriptionId: orderId },
    });

    if (!subscription) {
      console.log('Subscription not found for order:', orderId);
      return;
    }

    // Update subscription status based on LiqPay status
    let subscriptionStatus = 'pending';
    if (callbackData.status === 'success') {
      subscriptionStatus = 'active';
    } else if (callbackData.status === 'failure' || callbackData.status === 'error') {
      subscriptionStatus = 'cancelled';
    }

    // Update subscription record
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: subscriptionStatus,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Update trainer subscription status
    await this.prisma.user.update({
      where: { id: subscription.userId },
      data: {
        subscriptionPlan: subscriptionStatus === 'active' ? subscription.planId : null,
        subscriptionStatus,
      },
    });

    console.log('Subscription status updated:', subscription.id, subscriptionStatus);
  }

  async getSubscriptionUsage(trainerId: string) {
    const trainer = await this.prisma.user.findUnique({
      where: { id: trainerId },
      include: {
        _count: {
          select: {
            bookedSessions: true,
            createdWorkouts: true,
          },
        },
      },
    });

    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }

    const plan = this.subscriptionPlans.find(p => p.id === trainer.subscriptionPlan);
    const limits = this.getPlanLimits(trainer.subscriptionPlan || 'basic');

    // Get active clients count
    const activeClients = await this.prisma.user.count({
      where: {
        role: 'CLIENT',
        bookedSessions: {
          some: {
            trainerId,
            sessionDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
    });

    return {
      plan,
      limits,
      usage: {
        activeClients,
        totalSessions: (trainer as any)._count.bookedSessions,
        totalWorkouts: (trainer as any)._count.createdWorkouts,
      },
    };
  }

  private getPlanLimits(planId: string) {
    const limits: { [key: string]: { clients: number; workouts: number; sessions: number } } = {
      basic: { clients: 20, workouts: 50, sessions: 100 },
      pro: { clients: 100, workouts: 200, sessions: 500 },
      premium: { clients: -1, workouts: -1, sessions: -1 }, // Unlimited
    };

    return limits[planId] || limits.basic;
  }

  async checkSubscriptionStatus(orderId: string) {
    const statusParams = {
      public_key: this.publicKey,
      version: '3',
      action: 'status',
      order_id: orderId,
    };

    const { data, signature } = this.encodeData(statusParams);

    try {
      const response = await axios.post('https://www.liqpay.ua/api/request', {
        data,
        signature,
      });

      return response.data;
    } catch (error) {
      throw new BadRequestException(`Status check failed: ${error.message}`);
    }
  }
}
