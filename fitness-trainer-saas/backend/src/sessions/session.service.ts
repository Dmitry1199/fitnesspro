import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrainingSession, SessionBooking, TrainerAvailability } from '@prisma/client';
import { CreateSessionDto, CreateAvailabilityDto, BookSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  // Trainer Availability Management
  async createAvailability(trainerId: string, createAvailabilityDto: CreateAvailabilityDto): Promise<TrainerAvailability> {
    // Validate time format
    this.validateTimeFormat(createAvailabilityDto.startTime);
    this.validateTimeFormat(createAvailabilityDto.endTime);

    // Convert specificDate string to Date object if provided
    const specificDate = createAvailabilityDto.specificDate
      ? new Date(createAvailabilityDto.specificDate)
      : undefined;

    if (createAvailabilityDto.specificDate && isNaN(specificDate?.getTime())) {
      throw new BadRequestException('Invalid specific date format');
    }

    // Check for conflicts with existing availability
    const existingAvailability = await this.prisma.trainerAvailability.findFirst({
      where: {
        trainerId,
        dayOfWeek: createAvailabilityDto.dayOfWeek,
        startTime: createAvailabilityDto.startTime,
        ...(specificDate && {
          specificDate: specificDate
        })
      }
    });

    if (existingAvailability) {
      throw new ConflictException('Availability slot already exists for this time');
    }

    return this.prisma.trainerAvailability.create({
      data: {
        trainerId,
        ...createAvailabilityDto,
        specificDate,
      },
    });
  }

  async getTrainerAvailability(trainerId: string, date?: Date): Promise<TrainerAvailability[]> {
    const where: any = { trainerId };

    if (date) {
      const dayOfWeek = date.getDay();
      where.OR = [
        { dayOfWeek, isRecurring: true },
        { specificDate: date }
      ];
    }

    return this.prisma.trainerAvailability.findMany({
      where,
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ],
    });
  }

  async updateAvailability(trainerId: string, availabilityId: string, updateData: Partial<CreateAvailabilityDto>): Promise<TrainerAvailability> {
    const availability = await this.prisma.trainerAvailability.findFirst({
      where: { id: availabilityId, trainerId }
    });

    if (!availability) {
      throw new NotFoundException('Availability slot not found');
    }

    if (updateData.startTime) this.validateTimeFormat(updateData.startTime);
    if (updateData.endTime) this.validateTimeFormat(updateData.endTime);

    return this.prisma.trainerAvailability.update({
      where: { id: availabilityId },
      data: updateData,
    });
  }

  async deleteAvailability(trainerId: string, availabilityId: string): Promise<void> {
    const availability = await this.prisma.trainerAvailability.findFirst({
      where: { id: availabilityId, trainerId }
    });

    if (!availability) {
      throw new NotFoundException('Availability slot not found');
    }

    await this.prisma.trainerAvailability.delete({
      where: { id: availabilityId }
    });
  }

  // Training Session Management
  async createSession(createSessionDto: CreateSessionDto): Promise<TrainingSession> {
    // Validate time format
    this.validateTimeFormat(createSessionDto.startTime);
    this.validateTimeFormat(createSessionDto.endTime);

    // Convert sessionDate string to Date object
    const sessionDate = new Date(createSessionDto.sessionDate);
    if (isNaN(sessionDate.getTime())) {
      throw new BadRequestException('Invalid session date format');
    }

    // Validate trainer exists
    const trainer = await this.prisma.user.findUnique({
      where: { id: createSessionDto.trainerId }
    });

    if (!trainer || trainer.role !== 'TRAINER') {
      throw new BadRequestException('Invalid trainer ID');
    }

    // Validate client if provided
    if (createSessionDto.clientId) {
      const client = await this.prisma.user.findUnique({
        where: { id: createSessionDto.clientId }
      });

      if (!client || client.role !== 'CLIENT') {
        throw new BadRequestException('Invalid client ID');
      }
    }

    // Check for trainer availability and conflicts
    await this.checkTrainerAvailability(
      createSessionDto.trainerId,
      sessionDate,
      createSessionDto.startTime,
      createSessionDto.endTime
    );

    // Calculate duration
    const duration = this.calculateDuration(createSessionDto.startTime, createSessionDto.endTime);

    return this.prisma.trainingSession.create({
      data: {
        trainerId: createSessionDto.trainerId,
        clientId: createSessionDto.clientId,
        title: createSessionDto.title,
        description: createSessionDto.description,
        sessionDate,
        startTime: createSessionDto.startTime,
        endTime: createSessionDto.endTime,
        duration,
        sessionType: createSessionDto.sessionType || 'PERSONAL',
        location: createSessionDto.location,
        workoutPlanId: createSessionDto.workoutPlanId,
        price: createSessionDto.price,
        currency: createSessionDto.currency || 'USD',
      },
      include: {
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        workoutPlan: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      }
    });
  }

  async getSessionById(sessionId: string): Promise<TrainingSession> {
    const session = await this.prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        workoutPlan: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        booking: true,
      }
    });

    if (!session) {
      throw new NotFoundException('Training session not found');
    }

    return session;
  }

  async getTrainerSessions(trainerId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }): Promise<TrainingSession[]> {
    const where: any = { trainerId };

    if (filters?.startDate || filters?.endDate) {
      where.sessionDate = {};
      if (filters.startDate) where.sessionDate.gte = filters.startDate;
      if (filters.endDate) where.sessionDate.lte = filters.endDate;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.trainingSession.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        workoutPlan: {
          select: {
            id: true,
            name: true,
          }
        },
        booking: true,
      },
      orderBy: [
        { sessionDate: 'asc' },
        { startTime: 'asc' }
      ]
    });
  }

  async getClientSessions(clientId: string): Promise<TrainingSession[]> {
    return this.prisma.trainingSession.findMany({
      where: { clientId },
      include: {
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        workoutPlan: {
          select: {
            id: true,
            name: true,
          }
        },
        booking: true,
      },
      orderBy: [
        { sessionDate: 'asc' },
        { startTime: 'asc' }
      ]
    });
  }

  async updateSession(sessionId: string, updateData: Partial<CreateSessionDto>): Promise<TrainingSession> {
    const session = await this.prisma.trainingSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException('Training session not found');
    }

    // Validate time formats if being updated
    if (updateData.startTime) this.validateTimeFormat(updateData.startTime);
    if (updateData.endTime) this.validateTimeFormat(updateData.endTime);

    // Check for conflicts if date/time is being updated
    if (updateData.sessionDate || updateData.startTime || updateData.endTime) {
      const updatedDate = updateData.sessionDate ? new Date(updateData.sessionDate) : session.sessionDate;
      await this.checkTrainerAvailability(
        updateData.trainerId || session.trainerId,
        updatedDate,
        updateData.startTime || session.startTime,
        updateData.endTime || session.endTime,
        sessionId // Exclude current session from conflict check
      );
    }

    // Recalculate duration if times changed
    const duration = (updateData.startTime || updateData.endTime)
      ? this.calculateDuration(
          updateData.startTime || session.startTime,
          updateData.endTime || session.endTime
        )
      : session.duration;

    // Prepare update data with proper conversions
    const updatePrismaData: any = {
      ...updateData,
      duration,
    };

    // Convert sessionDate string to Date if provided
    if (updateData.sessionDate) {
      updatePrismaData.sessionDate = new Date(updateData.sessionDate);
    }

    return this.prisma.trainingSession.update({
      where: { id: sessionId },
      data: updatePrismaData,
      include: {
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
      }
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: { booking: true }
    });

    if (!session) {
      throw new NotFoundException('Training session not found');
    }

    if (session.booking) {
      throw new BadRequestException('Cannot delete a session with an active booking. Cancel the booking first.');
    }

    await this.prisma.trainingSession.delete({
      where: { id: sessionId }
    });
  }

  // Session Booking Management
  async bookSession(clientId: string, bookSessionDto: BookSessionDto): Promise<SessionBooking> {
    const session = await this.prisma.trainingSession.findUnique({
      where: { id: bookSessionDto.sessionId },
      include: { booking: true }
    });

    if (!session) {
      throw new NotFoundException('Training session not found');
    }

    if (session.booking) {
      throw new ConflictException('Session is already booked');
    }

    if (session.clientId && session.clientId !== clientId) {
      throw new BadRequestException('Session is assigned to a different client');
    }

    // Update session to assign client if not already assigned
    if (!session.clientId) {
      await this.prisma.trainingSession.update({
        where: { id: bookSessionDto.sessionId },
        data: { clientId }
      });
    }

    return this.prisma.sessionBooking.create({
      data: {
        sessionId: bookSessionDto.sessionId,
        clientId,
        clientMessage: bookSessionDto.clientMessage,
      },
      include: {
        session: {
          include: {
            trainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });
  }

  async confirmBooking(bookingId: string, trainerId: string, trainerResponse?: string): Promise<SessionBooking> {
    const booking = await this.prisma.sessionBooking.findUnique({
      where: { id: bookingId },
      include: { session: true }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.session.trainerId !== trainerId) {
      throw new BadRequestException('You can only confirm your own session bookings');
    }

    if (booking.bookingStatus !== 'PENDING') {
      throw new BadRequestException('Booking is not in pending status');
    }

    return this.prisma.sessionBooking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy: trainerId,
        trainerResponse,
      },
      include: {
        session: {
          include: {
            trainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });
  }

  async cancelBooking(bookingId: string, userId: string, reason?: string): Promise<SessionBooking> {
    const booking = await this.prisma.sessionBooking.findUnique({
      where: { id: bookingId },
      include: { session: true, client: true }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if user has permission to cancel
    const canCancel = booking.clientId === userId || booking.session.trainerId === userId;
    if (!canCancel) {
      throw new BadRequestException('You can only cancel your own bookings');
    }

    if (booking.bookingStatus === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    const cancelledBy = booking.clientId === userId ? 'CLIENT' : 'TRAINER';

    return this.prisma.sessionBooking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: 'CANCELLED',
        cancellationDate: new Date(),
        cancellationReason: reason,
        cancelledBy,
      },
      include: {
        session: {
          include: {
            trainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });
  }

  async getBookingById(bookingId: string): Promise<SessionBooking> {
    const booking = await this.prisma.sessionBooking.findUnique({
      where: { id: bookingId },
      include: {
        session: {
          include: {
            trainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            workoutPlan: {
              select: {
                id: true,
                name: true,
                description: true,
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  // Helper Methods
  private validateTimeFormat(time: string): void {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new BadRequestException(`Invalid time format: ${time}. Use HH:MM format.`);
    }
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }

    return end - start;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async checkTrainerAvailability(
    trainerId: string,
    sessionDate: Date,
    startTime: string,
    endTime: string,
    excludeSessionId?: string
  ): Promise<void> {
    const dayOfWeek = sessionDate.getDay();

    // Check if trainer has availability for this day/time
    const availability = await this.prisma.trainerAvailability.findFirst({
      where: {
        trainerId,
        OR: [
          { dayOfWeek, isRecurring: true },
          { specificDate: sessionDate }
        ],
        isAvailable: true,
      }
    });

    if (!availability) {
      throw new BadRequestException('Trainer is not available at this time');
    }

    // Check for conflicts with existing sessions
    const conflictingSession = await this.prisma.trainingSession.findFirst({
      where: {
        trainerId,
        sessionDate,
        ...(excludeSessionId && { id: { not: excludeSessionId } }),
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    if (conflictingSession) {
      throw new ConflictException('Trainer has a conflicting session at this time');
    }
  }

  // Statistics and Reporting
  async getSessionStats(trainerId?: string) {
    const where = trainerId ? { trainerId } : {};

    const [
      totalSessions,
      completedSessions,
      cancelledSessions,
      pendingBookings,
      confirmedBookings,
    ] = await Promise.all([
      this.prisma.trainingSession.count({ where }),
      this.prisma.trainingSession.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.trainingSession.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.sessionBooking.count({
        where: {
          bookingStatus: 'PENDING',
          ...(trainerId && { session: { trainerId } })
        }
      }),
      this.prisma.sessionBooking.count({
        where: {
          bookingStatus: 'CONFIRMED',
          ...(trainerId && { session: { trainerId } })
        }
      }),
    ]);

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      scheduledSessions: totalSessions - completedSessions - cancelledSessions,
      pendingBookings,
      confirmedBookings,
    };
  }
}
