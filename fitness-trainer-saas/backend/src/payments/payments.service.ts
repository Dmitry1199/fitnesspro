import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

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

  async createSessionPaymentIntent(sessionId: string, clientId: string) {
    // Get session details
    const session = await this.prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            stripeAccountId: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Training session not found');
    }

    if (session.clientId && session.clientId !== clientId) {
      throw new BadRequestException('Session is assigned to a different client');
    }

    if (!session.price) {
      throw new BadRequestException('Session price not set');
    }

    // Calculate platform fee (10% commission)
    const platformFeeAmount = Math.round(session.price * 0.1 * 100); // Convert to cents
    const totalAmount = Math.round(session.price * 100); // Convert to cents

    try {
      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: totalAmount,
        currency: session.currency.toLowerCase(),
        application_fee_amount: platformFeeAmount,
        transfer_data: session.trainer.stripeAccountId ? {
          destination: session.trainer.stripeAccountId,
        } : undefined,
        metadata: {
          sessionId: session.id,
          clientId,
          trainerId: session.trainerId,
          type: 'session_payment',
        },
        description: `Payment for training session: ${session.title}`,
      });

      // Save payment record
      const payment = await this.prisma.payment.create({
        data: {
          sessionId: session.id,
          clientId,
          trainerId: session.trainerId,
          amount: session.price,
          currency: session.currency,
          stripePaymentIntentId: paymentIntent.id,
          status: 'PENDING',
          type: 'SESSION_PAYMENT',
          platformFee: session.price * 0.1,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentId: payment.id,
        amount: session.price,
        currency: session.currency,
        session: {
          id: session.id,
          title: session.title,
          date: session.sessionDate,
          time: `${session.startTime} - ${session.endTime}`,
          trainer: `${session.trainer.firstName} ${session.trainer.lastName}`,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Payment creation failed: ${error.message}`);
    }
  }

  async confirmSessionPayment(paymentIntentId: string) {
    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      // Find payment record
      const payment = await this.prisma.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        include: {
          session: true,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment record not found');
      }

      // Update payment status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'FAILED',
          stripeChargeId: paymentIntent.latest_charge as string,
          completedAt: paymentIntent.status === 'succeeded' ? new Date() : null,
        },
      });

      // If payment successful, confirm session booking
      if (paymentIntent.status === 'succeeded') {
        await this.prisma.sessionBooking.upsert({
          where: {
            sessionId_clientId: {
              sessionId: payment.sessionId,
              clientId: payment.clientId,
            },
          },
          create: {
            sessionId: payment.sessionId,
            clientId: payment.clientId,
            bookingStatus: 'CONFIRMED',
            paymentId: payment.id,
          },
          update: {
            bookingStatus: 'CONFIRMED',
            paymentId: payment.id,
          },
        });

        // Update session to assign client if not already assigned
        if (!payment.session.clientId) {
          await this.prisma.trainingSession.update({
            where: { id: payment.sessionId },
            data: { clientId: payment.clientId },
          });
        }
      }

      return {
        status: paymentIntent.status,
        paymentId: payment.id,
        sessionId: payment.sessionId,
      };
    } catch (error) {
      throw new BadRequestException(`Payment confirmation failed: ${error.message}`);
    }
  }

  async refundSessionPayment(sessionId: string, reason?: string) {
    // Find payment record
    const payment = await this.prisma.payment.findFirst({
      where: {
        sessionId,
        status: 'COMPLETED',
        type: 'SESSION_PAYMENT',
      },
      include: {
        session: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('No completed payment found for this session');
    }

    try {
      // Create refund in Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          sessionId,
          reason: reason || 'Session cancelled',
        },
      });

      // Update payment record
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          stripeRefundId: refund.id,
          refundedAt: new Date(),
          refundReason: reason,
        },
      });

      // Cancel session booking
      await this.prisma.sessionBooking.updateMany({
        where: { sessionId },
        data: { bookingStatus: 'CANCELLED' },
      });

      return {
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
      };
    } catch (error) {
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  async getPaymentHistory(userId: string, role: string) {
    const where = role === 'TRAINER'
      ? { trainerId: userId }
      : { clientId: userId };

    return this.prisma.payment.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            title: true,
            sessionDate: true,
            startTime: true,
            endTime: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentStats(trainerId?: string) {
    const where = trainerId ? { trainerId } : {};

    const [
      totalRevenue,
      totalPayments,
      completedPayments,
      pendingPayments,
      refundedPayments,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({ where }),
      this.prisma.payment.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.payment.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.payment.count({ where: { ...where, status: 'REFUNDED' } }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalPayments,
      completedPayments,
      pendingPayments,
      refundedPayments,
      platformFees: trainerId ?
        (totalRevenue._sum.amount || 0) * 0.1 :
        await this.calculateTotalPlatformFees(),
    };
  }

  private async calculateTotalPlatformFees() {
    const result = await this.prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { platformFee: true },
    });
    return result._sum.platformFee || 0;
  }

  async createConnectAccount(trainerId: string, email: string) {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: 'US',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          trainerId,
        },
      });

      // Save Stripe account ID to trainer record
      await this.prisma.user.update({
        where: { id: trainerId },
        data: { stripeAccountId: account.id },
      });

      return account;
    } catch (error) {
      throw new BadRequestException(`Failed to create Stripe account: ${error.message}`);
    }
  }

  async createConnectAccountLink(stripeAccountId: string) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${this.configService.get('FRONTEND_URL')}/trainer/settings/payments?refresh=true`,
        return_url: `${this.configService.get('FRONTEND_URL')}/trainer/settings/payments?success=true`,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      throw new BadRequestException(`Failed to create account link: ${error.message}`);
    }
  }
}
