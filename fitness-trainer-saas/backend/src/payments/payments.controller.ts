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
import { LiqPayService } from './liqpay.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateSessionPaymentDto {
  sessionId: string;
}

class LiqPayCallbackDto {
  data: string;
  signature: string;
}

class RefundPaymentDto {
  sessionId: string;
  reason?: string;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly liqpayService: LiqPayService) {}

  @Post('session/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create LiqPay payment for session booking' })
  @ApiResponse({ status: 201, description: 'LiqPay payment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiBody({ type: CreateSessionPaymentDto })
  async createSessionPayment(
    @Body() createPaymentDto: CreateSessionPaymentDto,
    @Request() req,
  ) {
    if (req.user.role !== 'CLIENT') {
      throw new BadRequestException('Only clients can make session payments');
    }

    return this.liqpayService.createSessionPayment(
      createPaymentDto.sessionId,
      req.user.sub,
    );
  }

  @Post('liqpay/callback')
  @ApiOperation({ summary: 'Handle LiqPay payment callback' })
  @ApiResponse({ status: 200, description: 'Callback processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid callback data' })
  @ApiBody({ type: LiqPayCallbackDto })
  async handleLiqPayCallback(@Body() callbackDto: LiqPayCallbackDto) {
    return this.liqpayService.handleLiqPayCallback(
      callbackDto.data,
      callbackDto.signature,
    );
  }

  @Post('session/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund session payment via LiqPay' })
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

    return this.liqpayService.refundSessionPayment(
      refundDto.sessionId,
      refundDto.reason,
    );
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history for user' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getPaymentHistory(@Request() req) {
    return this.liqpayService.getPaymentHistory(req.user.sub, req.user.role);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Payment statistics retrieved successfully' })
  @ApiQuery({ name: 'trainerId', required: false, description: 'Filter by trainer ID (admin only)' })
  async getPaymentStats(@Request() req, @Query('trainerId') trainerId?: string) {
    // If user is trainer, only show their stats
    const targetTrainerId = req.user.role === 'TRAINER' ? req.user.sub : trainerId;

    return this.liqpayService.getPaymentStats(targetTrainerId);
  }

  @Get('check-status/:orderId')
  @ApiOperation({ summary: 'Check LiqPay payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Status check failed' })
  async checkPaymentStatus(@Param('orderId') orderId: string) {
    return this.liqpayService.checkPaymentStatus(orderId);
  }
}
