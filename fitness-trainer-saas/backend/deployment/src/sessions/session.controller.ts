import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
  ApiQuery,
} from '@nestjs/swagger';
import { SessionService } from './session.service';
import { CreateSessionDto, CreateAvailabilityDto, BookSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly prisma: PrismaService
  ) {}

  // ===============================
  // TRAINER AVAILABILITY ENDPOINTS
  // ===============================

  @Post('availability')
  @ApiOperation({ summary: 'Create trainer availability slot' })
  @ApiResponse({ status: 201, description: 'Availability created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Availability slot already exists' })
  async createAvailability(@Body() createAvailabilityDto: CreateAvailabilityDto, @Request() req) {
    return this.sessionService.createAvailability(req.user.sub, createAvailabilityDto);
  }

  @Get('availability/:trainerId')
  @ApiOperation({ summary: 'Get trainer availability' })
  @ApiResponse({ status: 200, description: 'Availability retrieved successfully' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by specific date (YYYY-MM-DD)' })
  async getTrainerAvailability(
    @Param('trainerId') trainerId: string,
    @Query('date') dateString?: string
  ) {
    const date = dateString ? new Date(dateString) : undefined;
    return this.sessionService.getTrainerAvailability(trainerId, date);
  }

  @Get('my-availability')
  @ApiOperation({ summary: 'Get current user trainer availability' })
  @ApiResponse({ status: 200, description: 'Availability retrieved successfully' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by specific date (YYYY-MM-DD)' })
  async getMyAvailability(@Request() req, @Query('date') dateString?: string) {
    const date = dateString ? new Date(dateString) : undefined;
    return this.sessionService.getTrainerAvailability(req.user.sub, date);
  }

  @Patch('availability/:availabilityId')
  @ApiOperation({ summary: 'Update trainer availability' })
  @ApiResponse({ status: 200, description: 'Availability updated successfully' })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  async updateAvailability(
    @Param('availabilityId') availabilityId: string,
    @Body() updateData: Partial<CreateAvailabilityDto>,
    @Request() req
  ) {
    return this.sessionService.updateAvailability(req.user.sub, availabilityId, updateData);
  }

  @Delete('availability/:availabilityId')
  @ApiOperation({ summary: 'Delete trainer availability' })
  @ApiResponse({ status: 200, description: 'Availability deleted successfully' })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  async deleteAvailability(@Param('availabilityId') availabilityId: string, @Request() req) {
    await this.sessionService.deleteAvailability(req.user.sub, availabilityId);
    return { message: 'Availability deleted successfully' };
  }

  // ===============================
  // TRAINING SESSION ENDPOINTS
  // ===============================

  @Post()
  @ApiOperation({ summary: 'Create a new training session' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Time conflict with existing session' })
  async createSession(@Body() createSessionDto: CreateSessionDto, @Request() req) {
    // If user is a trainer, they can create sessions for themselves
    // If user is admin, they can create sessions for any trainer
    if (req.user.role === 'TRAINER') {
      createSessionDto.trainerId = req.user.sub;
    } else if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only trainers and admins can create sessions');
    }

    return this.sessionService.createSession(createSessionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get training sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  @ApiQuery({ name: 'trainerId', required: false, description: 'Filter by trainer ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter from start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter until end date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by session status' })
  async getSessions(
    @Request() req,
    @Query('trainerId') trainerId?: string,
    @Query('startDate') startDateString?: string,
    @Query('endDate') endDateString?: string,
    @Query('status') status?: string,
  ) {
    const filters: any = {};

    if (startDateString) filters.startDate = new Date(startDateString);
    if (endDateString) filters.endDate = new Date(endDateString);
    if (status) filters.status = status;

    // If user is a trainer, only show their sessions unless they specify another trainer
    const targetTrainerId = req.user.role === 'TRAINER' && !trainerId ? req.user.sub : trainerId;

    if (targetTrainerId) {
      return this.sessionService.getTrainerSessions(targetTrainerId, filters);
    }

    // For clients, show their sessions
    if (req.user.role === 'CLIENT') {
      return this.sessionService.getClientSessions(req.user.sub);
    }

    // For admins, show all sessions if no trainer specified
    if (!targetTrainerId) {
      throw new BadRequestException('Trainer ID is required for admin users');
    }

    return this.sessionService.getTrainerSessions(targetTrainerId, filters);
  }

  @Get('my-sessions')
  @ApiOperation({ summary: 'Get current user sessions' })
  @ApiResponse({ status: 200, description: 'User sessions retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter from start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter until end date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by session status' })
  async getMySessions(
    @Request() req,
    @Query('startDate') startDateString?: string,
    @Query('endDate') endDateString?: string,
    @Query('status') status?: string,
  ) {
    const filters: any = {};

    if (startDateString) filters.startDate = new Date(startDateString);
    if (endDateString) filters.endDate = new Date(endDateString);
    if (status) filters.status = status;

    if (req.user.role === 'TRAINER') {
      return this.sessionService.getTrainerSessions(req.user.sub, filters);
    } else if (req.user.role === 'CLIENT') {
      return this.sessionService.getClientSessions(req.user.sub);
    } else {
      throw new BadRequestException('Invalid user role for this endpoint');
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get session statistics' })
  @ApiResponse({ status: 200, description: 'Session statistics retrieved' })
  @ApiQuery({ name: 'trainerId', required: false, description: 'Get stats for specific trainer' })
  async getSessionStats(@Request() req, @Query('trainerId') trainerId?: string) {
    // If user is a trainer, only show their stats unless they're admin
    const targetTrainerId = req.user.role === 'TRAINER' ? req.user.sub : trainerId;
    return this.sessionService.getSessionStats(targetTrainerId);
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.getSessionById(sessionId);
  }

  @Patch(':sessionId')
  @ApiOperation({ summary: 'Update training session' })
  @ApiResponse({ status: 200, description: 'Session updated successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body() updateData: Partial<CreateSessionDto>,
    @Request() req
  ) {
    // Check if user has permission to update this session
    const session = await this.sessionService.getSessionById(sessionId);

    if (req.user.role === 'TRAINER' && session.trainerId !== req.user.sub) {
      throw new BadRequestException('You can only update your own sessions');
    }

    if (req.user.role === 'CLIENT') {
      throw new BadRequestException('Clients cannot update sessions');
    }

    return this.sessionService.updateSession(sessionId, updateData);
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Delete training session' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete session with active booking' })
  async deleteSession(@Param('sessionId') sessionId: string, @Request() req) {
    // Check if user has permission to delete this session
    const session = await this.sessionService.getSessionById(sessionId);

    if (req.user.role === 'TRAINER' && session.trainerId !== req.user.sub) {
      throw new BadRequestException('You can only delete your own sessions');
    }

    if (req.user.role === 'CLIENT') {
      throw new BadRequestException('Clients cannot delete sessions');
    }

    await this.sessionService.deleteSession(sessionId);
    return { message: 'Session deleted successfully' };
  }

  // ===============================
  // SESSION BOOKING ENDPOINTS
  // ===============================

  @Post(':sessionId/book')
  @ApiOperation({ summary: 'Book a training session' })
  @ApiResponse({ status: 201, description: 'Session booked successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 409, description: 'Session already booked' })
  async bookSession(
    @Param('sessionId') sessionId: string,
    @Body() bookingData: { clientMessage?: string },
    @Request() req
  ) {
    if (req.user.role !== 'CLIENT') {
      throw new BadRequestException('Only clients can book sessions');
    }

    const bookSessionDto: BookSessionDto = {
      sessionId,
      clientMessage: bookingData.clientMessage,
    };

    return this.sessionService.bookSession(req.user.sub, bookSessionDto);
  }

  @Get('bookings/:bookingId')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBooking(@Param('bookingId') bookingId: string) {
    return this.sessionService.getBookingById(bookingId);
  }

  @Post('bookings/:bookingId/confirm')
  @ApiOperation({ summary: 'Confirm a session booking (trainers only)' })
  @ApiResponse({ status: 200, description: 'Booking confirmed successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 400, description: 'Invalid booking status or unauthorized' })
  async confirmBooking(
    @Param('bookingId') bookingId: string,
    @Body() confirmData: { trainerResponse?: string },
    @Request() req
  ) {
    if (req.user.role !== 'TRAINER') {
      throw new BadRequestException('Only trainers can confirm bookings');
    }

    return this.sessionService.confirmBooking(
      bookingId,
      req.user.sub,
      confirmData.trainerResponse
    );
  }

  @Post('bookings/:bookingId/cancel')
  @ApiOperation({ summary: 'Cancel a session booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 400, description: 'Unauthorized to cancel this booking' })
  async cancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() cancelData: { reason?: string },
    @Request() req
  ) {
    return this.sessionService.cancelBooking(
      bookingId,
      req.user.sub,
      cancelData.reason
    );
  }

  // ===============================
  // CALENDAR & DISCOVERY ENDPOINTS
  // ===============================

  @Get('available-slots/:trainerId')
  @ApiOperation({ summary: 'Get available time slots for a trainer' })
  @ApiResponse({ status: 200, description: 'Available slots retrieved successfully' })
  @ApiQuery({ name: 'date', required: true, description: 'Date to check availability (YYYY-MM-DD)' })
  async getAvailableSlots(
    @Param('trainerId') trainerId: string,
    @Query('date') dateString: string
  ) {
    if (!dateString) {
      throw new BadRequestException('Date parameter is required');
    }

    const date = new Date(dateString);
    const availability = await this.sessionService.getTrainerAvailability(trainerId, date);
    const sessions = await this.sessionService.getTrainerSessions(trainerId, {
      startDate: date,
      endDate: date,
    });

    // Calculate available slots by subtracting booked sessions from availability
    const availableSlots = availability.filter(slot => slot.isAvailable).map(slot => {
      const conflictingSessions = sessions.filter(session => {
        const sessionDate = new Date(session.sessionDate);
        return sessionDate.toDateString() === date.toDateString() &&
               ((session.startTime >= slot.startTime && session.startTime < slot.endTime) ||
                (session.endTime > slot.startTime && session.endTime <= slot.endTime));
      });

      return {
        ...slot,
        isBooked: conflictingSessions.length > 0,
        conflictingSessions: conflictingSessions.map(s => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status
        }))
      };
    });

    return availableSlots;
  }

  @Get('trainers/search')
  @ApiOperation({ summary: 'Search for available trainers' })
  @ApiResponse({ status: 200, description: 'Available trainers retrieved successfully' })
  @ApiQuery({ name: 'date', required: false, description: 'Date to check availability (YYYY-MM-DD)' })
  @ApiQuery({ name: 'startTime', required: false, description: 'Preferred start time (HH:MM)' })
  @ApiQuery({ name: 'endTime', required: false, description: 'Preferred end time (HH:MM)' })
  async searchAvailableTrainers(
    @Query('date') dateString?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string
  ) {
    // This would require a more complex query to find trainers with availability
    // For now, return all trainers with their availability
    const trainers = await this.prisma.user.findMany({
      where: { role: 'TRAINER', isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        experienceLevel: true,
        fitnessGoals: true,
        city: true,
        trainerAvailability: dateString ? {
          where: {
            OR: [
              { dayOfWeek: new Date(dateString).getDay(), isRecurring: true },
              { specificDate: new Date(dateString) }
            ],
            isAvailable: true,
          }
        } : true,
      }
    });

    return trainers;
  }
}
