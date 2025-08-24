import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

export interface LiqPayConfig {
  public_key: string;
  private_key: string;
  version: string;
  action: string;
  amount: number;
  currency: string;
  description: string;
  order_id: string;
  result_url?: string;
  server_url?: string;
}

@Injectable()
export class LiqPayService {
  private publicKey: string;
  private privateKey: string;
  private apiUrl = 'https://www.liqpay.ua/api/3/checkout';

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

  private encodeData(params: LiqPayConfig): { data: string; signature: string } {
    const dataString = JSON.stringify(params);
    const data = Buffer.from(dataString).toString('base64');
    const signature = this.generateSignature(data);

    return { data, signature };
  }

  async createSessionPayment(sessionId: string, clientId: string) {
    // Get session details
    const session = await this.prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

    // Convert price to UAH (assuming session price is in USD, convert to UAH)
    const uahAmount = Math.round(session.price * 41); // Approximate USD to UAH conversion
    const orderId = `session_${sessionId}_${Date.now()}`;

    // LiqPay payment configuration
    const liqpayParams: LiqPayConfig = {
      public_key: this.publicKey,
      private_key: this.privateKey,
      version: '3',
      action: 'pay',
      amount: uahAmount,
      currency: 'UAH',
      description: `Оплата тренування: ${session.title}`,
      order_id: orderId,
      result_url: `${this.configService.get('FRONTEND_URL')}/payment-success`,
      server_url: `${this.configService.get('BACKEND_URL')}/payments/liqpay/callback`,
    };

    // Generate LiqPay form data
    const { data, signature } = this.encodeData(liqpayParams);

    // Save payment record
    const payment = await this.prisma.payment.create({
      data: {
        sessionId: session.id,
        clientId,
        trainerId: session.trainerId,
        amount: session.price,
        currency: 'UAH',
        liqpayOrderId: orderId,
        status: 'PENDING',
        type: 'SESSION_PAYMENT',
        platformFee: session.price * 0.1,
      },
    });

    return {
      paymentId: payment.id,
      liqpayData: data,
      liqpaySignature: signature,
      amount: uahAmount,
      currency: 'UAH',
      orderId,
      session: {
        id: session.id,
        title: session.title,
        date: session.sessionDate,
        time: `${session.startTime} - ${session.endTime}`,
        trainer: `${session.trainer.firstName} ${session.trainer.lastName}`,
      },
    };
  }

  async handleLiqPayCallback(data: string, signature: string) {
    // Verify signature
    const expectedSignature = this.generateSignature(data);
    if (signature !== expectedSignature) {
      throw new BadRequestException('Invalid signature');
    }

    // Decode data
    const decodedData = Buffer.from(data, 'base64').toString('utf8');
    const paymentData = JSON.parse(decodedData);

    // Find payment record
    const payment = await this.prisma.payment.findFirst({
      where: { liqpayOrderId: paymentData.order_id },
      include: {
        session: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    // Update payment status based on LiqPay status
    let paymentStatus = 'PENDING';
    if (paymentData.status === 'success') {
      paymentStatus = 'COMPLETED';
    } else if (paymentData.status === 'failure' || paymentData.status === 'error') {
      paymentStatus = 'FAILED';
    }

    // Update payment record
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
        liqpayTransactionId: paymentData.transaction_id,
        completedAt: paymentStatus === 'COMPLETED' ? new Date() : null,
      },
    });

    // If payment successful, confirm session booking
    if (paymentStatus === 'COMPLETED') {
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
      status: paymentStatus,
      paymentId: payment.id,
      sessionId: payment.sessionId,
      transactionId: paymentData.transaction_id,
    };
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

    if (!payment.liqpayTransactionId) {
      throw new BadRequestException('No LiqPay transaction ID found');
    }

    try {
      // LiqPay refund request
      const refundParams = {
        public_key: this.publicKey,
        version: '3',
        action: 'refund',
        order_id: payment.liqpayOrderId,
        amount: Math.round(payment.amount * 41), // Convert to UAH
        currency: 'UAH',
      };

      const { data, signature } = this.encodeData(refundParams as LiqPayConfig);

      // Make refund request to LiqPay
      const response = await axios.post('https://www.liqpay.ua/api/request', {
        data,
        signature,
      });

      if (response.data.status === 'success') {
        // Update payment record
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'REFUNDED',
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
          refundId: response.data.transaction_id,
          amount: payment.amount,
          currency: 'UAH',
          status: 'success',
        };
      } else {
        throw new BadRequestException(`Refund failed: ${response.data.err_description}`);
      }
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

  // Utility method to check payment status
  async checkPaymentStatus(orderId: string) {
    const statusParams = {
      public_key: this.publicKey,
      version: '3',
      action: 'status',
      order_id: orderId,
    };

    const { data, signature } = this.encodeData(statusParams as LiqPayConfig);

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
