import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { LiqPayService } from './liqpay.service';
import { PaymentsController } from './payments.controller';
import { LiqPaySubscriptionsService } from './liqpay-subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [PaymentsController, SubscriptionsController],
  providers: [LiqPayService, LiqPaySubscriptionsService],
  exports: [LiqPayService, LiqPaySubscriptionsService],
})
export class PaymentsModule {}
