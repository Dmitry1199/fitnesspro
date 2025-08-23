import { IsString, IsOptional, IsIn, IsBoolean, IsInt, IsArray, ValidateNested, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Using string literals for SQLite compatibility
const DIFFICULTY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;

export class WorkoutExerciseDto {
  @ApiProperty({ description: 'Exercise ID' })
  @IsString()
  exerciseId: string;

  @ApiProperty({ description: 'Number of sets', required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(50)
  sets?: number;

  @ApiProperty({ description: 'Number of repetitions per set', required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(1000)
  reps?: number;

  @ApiProperty({ description: 'Weight in kg', required: false })
  @IsOptional()
  @Min(0)
  @Max(1000)
  weight?: number;

  @ApiProperty({ description: 'Duration in seconds for time-based exercises', required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(7200)
  duration?: number;

  @ApiProperty({ description: 'Rest time in seconds', required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(600)
  restTime?: number;

  @ApiProperty({ description: 'Exercise notes', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ description: 'Order in workout' })
  @IsInt()
  @Min(1)
  order: number;
}

export class CreateWorkoutDto {
  @ApiProperty({ description: 'Workout name' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Workout description', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Estimated duration in minutes', required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(600)
  estimatedDuration?: number;

  @ApiProperty({
    description: 'Difficulty level',
    enum: DIFFICULTY_LEVELS,
    default: 'BEGINNER'
  })
  @IsIn(DIFFICULTY_LEVELS)
  @IsOptional()
  difficultyLevel?: string = 'BEGINNER';

  @ApiProperty({ description: 'Estimated total calories burned', required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(2000)
  calories?: number;

  @ApiProperty({ description: 'Is this a template workout', default: false })
  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean = false;

  @ApiProperty({ description: 'Is this workout public', default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = false;

  @ApiProperty({
    description: 'Exercises in this workout',
    type: [WorkoutExerciseDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutExerciseDto)
  exercises: WorkoutExerciseDto[];
}
