import { IsString, IsOptional, IsIn, IsUUID, IsNumber, IsDateString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const SESSION_TYPES = ['PERSONAL', 'GROUP', 'ONLINE'] as const;
const SESSION_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

export class CreateSessionDto {
  @ApiProperty({ description: 'Trainer ID (auto-filled for trainers)' })
  @IsUUID()
  @IsOptional()
  trainerId?: string;

  @ApiProperty({ description: 'Client ID (optional for open sessions)', required: false })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ description: 'Session title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Session description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Session date (YYYY-MM-DD or ISO string)' })
  @IsDateString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value;
    }
    return value instanceof Date ? value.toISOString() : value;
  })
  sessionDate: string;

  @ApiProperty({ description: 'Start time in HH:MM format (e.g., "09:00")' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time in HH:MM format (e.g., "10:00")' })
  @IsString()
  endTime: string;

  @ApiProperty({
    description: 'Session type',
    enum: SESSION_TYPES,
    default: 'PERSONAL'
  })
  @IsIn(SESSION_TYPES)
  @IsOptional()
  sessionType?: string = 'PERSONAL';

  @ApiProperty({ description: 'Session location or online link', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Workout plan ID', required: false })
  @IsUUID()
  @IsOptional()
  workoutPlanId?: string;

  @ApiProperty({ description: 'Session price', required: false })
  @IsNumber()
  @Min(0)
  @Max(10000)
  @IsOptional()
  price?: number;

  @ApiProperty({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string = 'USD';
}

export class CreateAvailabilityDto {
  @ApiProperty({ description: 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ description: 'Start time in HH:MM format (e.g., "09:00")' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time in HH:MM format (e.g., "17:00")' })
  @IsString()
  endTime: string;

  @ApiProperty({ description: 'Is this a recurring availability?', default: true })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean = true;

  @ApiProperty({ description: 'Specific date for one-time availability', required: false })
  @IsDateString()
  @IsOptional()
  specificDate?: string;

  @ApiProperty({ description: 'Is trainer available during this time?', default: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean = true;
}

export class BookSessionDto {
  @ApiProperty({ description: 'Session ID to book' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Message from client to trainer', required: false })
  @IsString()
  @IsOptional()
  clientMessage?: string;
}
