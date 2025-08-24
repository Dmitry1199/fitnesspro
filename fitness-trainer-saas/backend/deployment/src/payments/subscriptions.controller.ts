import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { LiqPaySubscriptionsService } from './liqpay-subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateSubscriptionDto {
  planId: string;
}

class UpdateSubscriptionDto {
  planId: string;
}

class CancelSubscriptionDto {
  immediately?: boolean;
}

class LiqPaySubscriptionCallbackDto {
  data: string;
  signature: string;
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly liqpaySubscriptionsService: LiqPaySubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans in UAH' })
  @ApiResponse({ status: 200, description: 'Subscription plans retrieved successfully' })
  async getSubscriptionPlans() {
    return this.liqpaySubscriptionsService.getSubscriptionPlans();
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create LiqPay subscription for trainer' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Subscription creation failed' })
  @ApiBody({ type: CreateSubscriptionDto })
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Request() req,
  ) {
    if (req.user.role !== 'TRAINER') {
      throw new BadRequestException('Only trainers can create subscriptions');
    }

    return this.liqpaySubscriptionsService.createSubscription(
      req.user.sub,
      createSubscriptionDto.planId,
    );
  }

  @Put('update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update trainer LiqPay subscription plan' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 400, description: 'Subscription update failed' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  @ApiBody({ type: UpdateSubscriptionDto })
  async updateSubscription(
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Request() req,
  ) {
    if (req.user.role !== 'TRAINER') {
      throw new BadRequestException('Only trainers can update subscriptions');
    }

    return this.liqpaySubscriptionsService.updateSubscription(
      req.user.sub,
      updateSubscriptionDto.planId,
    );
  }

  @Delete('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel trainer LiqPay subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Subscription cancellation failed' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  @ApiBody({ type: CancelSubscriptionDto, required: false })
  async cancelSubscription(
    @Body() cancelDto: CancelSubscriptionDto = {},
    @Request() req,
  ) {
    if (req.user.role !== 'TRAINER') {
      throw new BadRequestException('Only trainers can cancel subscriptions');
    }

    return this.liqpaySubscriptionsService.cancelSubscription(
      req.user.sub,
      cancelDto.immediately || false,
    );
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current trainer subscription' })
  @ApiResponse({ status: 200, description: 'Current subscription retrieved successfully' })
  async getCurrentSubscription(@Request() req) {
    if (req.user.role !== 'TRAINER') {
      throw new BadRequestException('Only trainers can view subscription details');
    }

    return this.liqpaySubscriptionsService.getTrainerSubscription(req.user.sub);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription usage and limits' })
  @ApiResponse({ status: 200, description: 'Subscription usage retrieved successfully' })
  async getSubscriptionUsage(@Request() req) {
    if (req.user.role !== 'TRAINER') {
      throw new BadRequestException('Only trainers can view usage details');
    }

    return this.liqpaySubscriptionsService.getSubscriptionUsage(req.user.sub);
  }

  @Post('liqpay/callback')
  @ApiOperation({ summary: 'Handle LiqPay subscription callback' })
  @ApiResponse({ status: 200, description: 'Callback processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid callback data' })
  @ApiBody({ type: LiqPaySubscriptionCallbackDto })
  async handleSubscriptionCallback(@Body() callbackDto: LiqPaySubscriptionCallbackDto) {
    return this.liqpaySubscriptionsService.handleSubscriptionCallback(
      callbackDto.data,
      callbackDto.signature,
    );
  }

  @Get('features/:planId')
  @ApiOperation({ summary: 'Get features for a specific Ukrainian plan' })
  @ApiResponse({ status: 200, description: 'Plan features retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanFeatures(@Param('planId') planId: string) {
    const plans = this.liqpaySubscriptionsService.getSubscriptionPlans();
    const plan = plans.find(p => p.id === planId);

    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    return {
      planId: plan.id,
      features: plan.features,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
    };
  }

  @Get('check-status/:orderId')
  @ApiOperation({ summary: 'Check LiqPay subscription status' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Status check failed' })
  async checkSubscriptionStatus(@Param('orderId') orderId: string) {
    return this.liqpaySubscriptionsService.checkSubscriptionStatus(orderId);
  }
}
