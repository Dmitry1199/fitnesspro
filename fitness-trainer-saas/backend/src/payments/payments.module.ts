import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [PaymentsController, SubscriptionsController, WebhooksController],
  providers: [PaymentsService, SubscriptionsService],
  exports: [PaymentsService, SubscriptionsService],
})
export class PaymentsModule {}
