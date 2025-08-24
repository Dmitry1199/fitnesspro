import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
}

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  private subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 19,
      interval: 'month',
      features: [
        'Up to 20 clients',
        'Basic workout builder',
        'Session scheduling',
        'Email support',
      ],
      stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 49,
      interval: 'month',
      features: [
        'Up to 100 clients',
        'Advanced workout builder',
        'Automated scheduling',
        'Progress tracking',
        'Video sessions',
        'Priority support',
      ],
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 99,
      interval: 'month',
      features: [
        'Unlimited clients',
        'White-label solution',
        'Custom branding',
        'Advanced analytics',
        'API access',
        'Dedicated support',
      ],
      stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
    },
  ];

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.stripe = new Stripe(
      this.configService.get('STRIPE_SECRET_KEY') || 'sk_test_...',
      {
        apiVersion: '2025-07-30.basil',
      },
    );
  }

  getSubscriptionPlans() {
    return this.subscriptionPlans;
  }

  async createSubscription(trainerId: string, planId: string, paymentMethodId: string) {
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

    try {
      let customerId = trainer.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: trainer.email,
          name: `${trainer.firstName} ${trainer.lastName}`,
          metadata: {
            trainerId,
            role: trainer.role,
          },
        });
        customerId = customer.id;

        // Save customer ID
        await this.prisma.user.update({
          where: { id: trainerId },
          data: { stripeCustomerId: customerId },
        });
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.stripePriceId }],
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          trainerId,
          planId,
        },
      });

      // Save subscription record
      const subscriptionRecord = await this.prisma.subscription.create({
        data: {
          userId: trainerId,
          planId,
          planName: plan.name,
          price: plan.price,
          interval: plan.interval,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          status: subscription.status,
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
      });

      // Update trainer subscription status
      await this.prisma.user.update({
        where: { id: trainerId },
        data: {
          subscriptionPlan: planId,
          subscriptionStatus: subscription.status,
        },
      });

      return {
        subscription: subscriptionRecord,
        stripeSubscription: subscription,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
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
        status: { in: ['active', 'trialing'] },
      },
    });

    if (!currentSubscription) {
      throw new NotFoundException('No active subscription found');
    }

    try {
      // Update Stripe subscription
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        currentSubscription.stripeSubscriptionId,
      );

      const updatedSubscription = await this.stripe.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: plan.stripePriceId,
          }],
          proration_behavior: 'create_prorations',
          metadata: {
            trainerId,
            planId: newPlanId,
          },
        },
      );

      // Update subscription record
      await this.prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          planId: newPlanId,
          planName: plan.name,
          price: plan.price,
          status: updatedSubscription.status,
          currentPeriodStart: new Date((updatedSubscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
        },
      });

      // Update trainer plan
      await this.prisma.user.update({
        where: { id: trainerId },
        data: {
          subscriptionPlan: newPlanId,
          subscriptionStatus: updatedSubscription.status,
        },
      });

      return updatedSubscription;
    } catch (error) {
      throw new BadRequestException(`Subscription update failed: ${error.message}`);
    }
  }

  async cancelSubscription(trainerId: string, immediately = false) {
    // Get current subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: trainerId,
        status: { in: ['active', 'trialing'] },
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    try {
      if (immediately) {
        // Cancel immediately
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

        // Update status
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
          },
        });

        await this.prisma.user.update({
          where: { id: trainerId },
          data: {
            subscriptionPlan: null,
            subscriptionStatus: 'canceled',
          },
        });
      } else {
        // Cancel at period end
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { cancelAtPeriodEnd: true },
        });
      }

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

  async createPortalSession(trainerId: string) {
    const trainer = await this.prisma.user.findUnique({
      where: { id: trainerId },
    });

    if (!trainer?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer found for trainer');
    }

    try {
      const portalSession = await this.stripe.billingPortal.sessions.create({
        customer: trainer.stripeCustomerId,
        return_url: `${this.configService.get('FRONTEND_URL')}/trainer/billing`,
      });

      return portalSession;
    } catch (error) {
      throw new BadRequestException(`Portal session creation failed: ${error.message}`);
    }
  }

  async handleSubscriptionWebhook(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const trainerId = subscription.metadata?.trainerId;

    if (!trainerId) {
      console.log('No trainer ID in subscription metadata');
      return;
    }

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await this.updateSubscriptionStatus(trainerId, subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(trainerId, subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(trainerId, subscription);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(trainerId, subscription);
        break;
    }
  }

  private async updateSubscriptionStatus(trainerId: string, stripeSubscription: Stripe.Subscription) {
    await this.prisma.subscription.updateMany({
      where: {
        userId: trainerId,
        stripeSubscriptionId: stripeSubscription.id,
      },
      data: {
        status: stripeSubscription.status,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    await this.prisma.user.update({
      where: { id: trainerId },
      data: { subscriptionStatus: stripeSubscription.status },
    });
  }

  private async handleSubscriptionDeleted(trainerId: string, stripeSubscription: Stripe.Subscription) {
    await this.prisma.subscription.updateMany({
      where: {
        userId: trainerId,
        stripeSubscriptionId: stripeSubscription.id,
      },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });

    await this.prisma.user.update({
      where: { id: trainerId },
      data: {
        subscriptionPlan: null,
        subscriptionStatus: 'canceled',
      },
    });
  }

  private async handlePaymentSucceeded(trainerId: string, stripeSubscription: Stripe.Subscription) {
    // Payment succeeded, ensure subscription is active
    await this.updateSubscriptionStatus(trainerId, stripeSubscription);
  }

  private async handlePaymentFailed(trainerId: string, stripeSubscription: Stripe.Subscription) {
    // Payment failed, update status
    await this.prisma.user.update({
      where: { id: trainerId },
      data: { subscriptionStatus: 'past_due' },
    });
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
    const limits = {
      basic: { clients: 20, workouts: 50, sessions: 100 },
      pro: { clients: 100, workouts: 200, sessions: 500 },
      premium: { clients: -1, workouts: -1, sessions: -1 }, // Unlimited
    };

    return limits[planId] || limits.basic;
  }
}
