import { IsString, IsOptional, IsIn, IsBoolean, IsInt, IsUUID, IsArray, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Using string literals for SQLite compatibility
const DIFFICULTY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;

export class CreateExerciseDto {
  @ApiProperty({ description: 'Exercise name' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Exercise description', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Step-by-step instructions', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  instructions?: string;

  @ApiProperty({
    description: 'Difficulty level',
    enum: DIFFICULTY_LEVELS,
    default: 'BEGINNER'
  })
  @IsIn(DIFFICULTY_LEVELS)
  @IsOptional()
  difficultyLevel?: string = 'BEGINNER';

  @ApiProperty({ description: 'Exercise duration in seconds', required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(7200) // max 2 hours
  duration?: number;

  @ApiProperty({ description: 'Estimated calories burned per minute', required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(50)
  caloriesPerMin?: number;

  @ApiProperty({ description: 'Exercise image URL', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ description: 'Exercise video URL', required: false })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiProperty({ description: 'Is this a custom exercise', default: false })
  @IsBoolean()
  @IsOptional()
  isCustom?: boolean = false;

  @ApiProperty({ description: 'Exercise category ID' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'Muscle group IDs', type: [String], required: false })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  muscleGroupIds?: string[];

  @ApiProperty({ description: 'Equipment IDs', type: [String], required: false })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  equipmentIds?: string[];
}
