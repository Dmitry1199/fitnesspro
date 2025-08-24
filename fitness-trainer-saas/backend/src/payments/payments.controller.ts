import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateSessionPaymentDto {
  sessionId: string;
}

class ConfirmPaymentDto {
  paymentIntentId: string;
}

class RefundPaymentDto {
  sessionId: string;
  reason?: string;
}

class CreateConnectAccountDto {
  email: string;
}

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('session/create-intent')
  @ApiOperation({ summary: 'Create payment intent for session booking' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiBody({ type: CreateSessionPaymentDto })
  async createSessionPaymentIntent(
    @Body() createPaymentDto: CreateSessionPaymentDto,
    @Request() req,
  ) {
    if (req.user.role !== 'CLIENT') {
      throw new BadRequestException('Only clients can make session payments');
    }

    return this.paymentsService.createSessionPaymentIntent(
      createPaymentDto.sessionId,
      req.user.sub,
    );
  }

  @Post('session/confirm')
  @ApiOperation({ summary: 'Confirm session payment' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Payment confirmation failed' })
  @ApiBody({ type: ConfirmPaymentDto })
  async confirmSessionPayment(@Body() confirmPaymentDto: ConfirmPaymentDto) {
    return this.paymentsService.confirmSessionPayment(
      confirmPaymentDto.paymentIntentId,
    );
  }

  @Post('session/refund')
  @ApiOperation({ summary: 'Refund session payment' })
  @ApiResponse({ status: 200, description: 'Payment refunded successfully' })
  @ApiResponse({ status: 400, description: 'Refund failed' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiBody({ type: RefundPaymentDto })
  async refundSessionPayment(
    @Body() refundDto: RefundPaymentDto,
    @Request() req,
  ) {
    // Only trainers and admins can process refunds
    if (!['TRAINER', 'ADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Insufficient permissions for refunds');
    }

    return this.paymentsService.refundSessionPayment(
      refundDto.sessionId,
      refundDto.reason,
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Get payment history for user' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getPaymentHistory(@Request() req) {
    return this.paymentsService.getPaymentHistory(req.user.sub, req.user.role);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Payment statistics retrieved successfully' })
  @ApiQuery({ name: 'trainerId', required: false, description: 'Filter by trainer ID (admin only)' })
  async getPaymentStats(@Request() req, @Query('trainerId') trainerId?: string) {
    // If user is trainer, only show their stats
    const targetTrainerId = req.user.role === 'TRAINER' ? req.user.sub : trainerId;

    return this.paymentsService.getPaymentStats(targetTrainerId);
  }

  @Post('connect/create-account')
  @ApiOperation({ summary: 'Create Stripe Connect account for trainer' })
  @ApiResponse({ status: 201, description: 'Connect account created successfully' })
  @ApiResponse({ status: 400, description: 'Account creation failed' })
  @ApiBody({ type: CreateConnectAccountDto })
  async createConnectAccount(
    @Body() createAccountDto: CreateConnectAccountDto,
    @Request() req,
  ) {
    if (req.user.role !== 'TRAINER') {
      throw new BadRequestException('Only trainers can create Connect accounts');
    }

    return this.paymentsService.createConnectAccount(
      req.user.sub,
      createAccountDto.email,
    );
  }

  @Post('connect/account-link/:stripeAccountId')
  @ApiOperation({ summary: 'Create Stripe Connect account link' })
  @ApiResponse({ status: 200, description: 'Account link created successfully' })
  @ApiResponse({ status: 400, description: 'Link creation failed' })
  async createConnectAccountLink(
    @Param('stripeAccountId') stripeAccountId: string,
    @Request() req,
  ) {
    if (req.user.role !== 'TRAINER') {
      throw new BadRequestException('Only trainers can access Connect account links');
    }

    return this.paymentsService.createConnectAccountLink(stripeAccountId);
  }

  @Get('connect/account-status')
  @ApiOperation({ summary: 'Get Stripe Connect account status' })
  @ApiResponse({ status: 200, description: 'Account status retrieved successfully' })
  async getConnectAccountStatus(@Request() req) {
    if (req.user.role !== 'TRAINER') {
      throw new BadRequestException('Only trainers can check Connect account status');
    }

    // This would check if trainer has a connected Stripe account
    // Implementation depends on how you store the Connect account info
    return { message: 'Connect account status endpoint' };
  }
}
