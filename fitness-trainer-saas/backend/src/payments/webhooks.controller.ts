import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private paymentsService: PaymentsService,
    private subscriptionsService: SubscriptionsService,
    private prisma: PrismaService,
  ) {
    this.stripe = new Stripe(
      this.configService.get('STRIPE_SECRET_KEY') || 'sk_test_...',
      {
        apiVersion: '2025-07-30.basil',
      },
    );
  }

  @Post('stripe')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw new BadRequestException('Invalid signature');
    }

    // Check if we've already processed this event
    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });

    if (existingEvent && existingEvent.processed) {
      return { received: true, message: 'Event already processed' };
    }

    // Log the webhook event
    const webhookLog = await this.prisma.webhookEvent.upsert({
      where: { stripeEventId: event.id },
      create: {
        stripeEventId: event.id,
        eventType: event.type,
        eventData: JSON.stringify(event.data),
        processed: false,
      },
      update: {
        eventType: event.type,
        eventData: JSON.stringify(event.data),
      },
    });

    try {
      // Process the event based on type
      switch (event.type) {
        // Payment Intent Events
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event);
          break;

        // Subscription Events
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.subscriptionsService.handleSubscriptionWebhook(event);
          break;

        // Invoice Events
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          await this.subscriptionsService.handleSubscriptionWebhook(event);
          break;

        // Charge Events (for refunds)
        case 'charge.dispute.created':
          await this.handleChargeDispute(event);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      await this.prisma.webhookEvent.update({
        where: { id: webhookLog.id },
        data: { processed: true },
      });

      return { received: true };
    } catch (error) {
      console.error('Error processing webhook:', error);

      // Log the error
      await this.prisma.webhookEvent.update({
        where: { id: webhookLog.id },
        data: {
          processingError: error.message,
          processed: false,
        },
      });

      throw new BadRequestException('Webhook processing failed');
    }
  }

  private async handlePaymentSucceeded(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Find the payment record
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      console.error('Payment record not found for PaymentIntent:', paymentIntent.id);
      return;
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        stripeChargeId: paymentIntent.latest_charge as string,
        completedAt: new Date(),
      },
    });

    // If it's a session payment, confirm the booking
    if (payment.sessionId) {
      await this.prisma.sessionBooking.updateMany({
        where: { sessionId: payment.sessionId },
        data: { bookingStatus: 'CONFIRMED' },
      });

      // Assign client to session if not already assigned
      const session = await this.prisma.trainingSession.findUnique({
        where: { id: payment.sessionId },
      });

      if (session && !session.clientId) {
        await this.prisma.trainingSession.update({
          where: { id: payment.sessionId },
          data: { clientId: payment.clientId },
        });
      }
    }

    console.log('Payment succeeded and processed:', payment.id);
  }

  private async handlePaymentFailed(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Find the payment record
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      console.error('Payment record not found for failed PaymentIntent:', paymentIntent.id);
      return;
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    // Cancel the booking if it exists
    if (payment.sessionId) {
      await this.prisma.sessionBooking.updateMany({
        where: { sessionId: payment.sessionId },
        data: {
          bookingStatus: 'CANCELLED',
          cancellationReason: 'Payment failed',
        },
      });
    }

    console.log('Payment failed and processed:', payment.id);
  }

  private async handleChargeDispute(event: Stripe.Event) {
    const dispute = event.data.object as Stripe.Dispute;
    const chargeId = dispute.charge as string;

    // Find the payment by charge ID
    const payment = await this.prisma.payment.findFirst({
      where: { stripeChargeId: chargeId },
    });

    if (payment) {
      // Update payment status to indicate dispute
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'DISPUTED' },
      });

      console.log('Payment dispute created:', payment.id);
    }
  }

  @Post('test')
  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async testWebhook() {
    return {
      message: 'Webhook endpoint is working',
      timestamp: new Date().toISOString(),
    };
  }
}
