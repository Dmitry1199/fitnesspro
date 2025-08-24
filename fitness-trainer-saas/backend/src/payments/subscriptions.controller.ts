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
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateSubscriptionDto {
  planId: string;
  paymentMethodId: string;
}

class UpdateSubscriptionDto {
  planId: string;
}

class CancelSubscriptionDto {
  immediately?: boolean;
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, description: 'Subscription plans retrieved successfully' })
  async getSubscriptionPlans() {
    return this.subscriptionsService.getSubscriptionPlans();
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create subscription for trainer' })
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

    return this.subscriptionsService.createSubscription(
      req.user.sub,
      createSubscriptionDto.planId,
      createSubscriptionDto.paymentMethodId,
    );
  }

  @Put('update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update trainer subscription plan' })
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

    return this.subscriptionsService.updateSubscription(
      req.user.sub,
      updateSubscriptionDto.planId,
    );
  }

  @Delete('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel trainer subscription' })
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

    return this.subscriptionsService.cancelSubscription(
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

    return this.subscriptionsService.getTrainerSubscription(req.user.sub);
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

    return this.subscriptionsService.getSubscriptionUsage(req.user.sub);
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  @ApiResponse({ status: 200, description: 'Portal session created successfully' })
  @ApiResponse({ status: 400, description: 'Portal session creation failed' })
  async createPortalSession(@Request() req) {
    if (req.user.role !== 'TRAINER') {
      throw new BadRequestException('Only trainers can access billing portal');
    }

    return this.subscriptionsService.createPortalSession(req.user.sub);
  }

  @Get('features/:planId')
  @ApiOperation({ summary: 'Get features for a specific plan' })
  @ApiResponse({ status: 200, description: 'Plan features retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanFeatures(@Param('planId') planId: string) {
    const plans = this.subscriptionsService.getSubscriptionPlans();
    const plan = plans.find(p => p.id === planId);

    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    return {
      planId: plan.id,
      features: plan.features,
      price: plan.price,
      interval: plan.interval,
    };
  }
}
