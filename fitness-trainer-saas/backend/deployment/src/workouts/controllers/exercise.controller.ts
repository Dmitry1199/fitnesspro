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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ExerciseService } from '../services/exercise.service';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Workouts')
@Controller('exercises')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new exercise' })
  @ApiResponse({ status: 201, description: 'Exercise created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createExerciseDto: CreateExerciseDto, @Request() req) {
    return this.exerciseService.create(createExerciseDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all exercises with optional filters' })
  @ApiResponse({ status: 200, description: 'Exercises retrieved successfully' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'difficultyLevel', required: false, description: 'Filter by difficulty level' })
  @ApiQuery({ name: 'muscleGroupId', required: false, description: 'Filter by muscle group ID' })
  @ApiQuery({ name: 'equipmentId', required: false, description: 'Filter by equipment ID' })
  @ApiQuery({ name: 'isCustom', required: false, description: 'Filter by custom exercises' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or description' })
  @ApiQuery({ name: 'createdById', required: false, description: 'Filter by creator ID' })
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('difficultyLevel') difficultyLevel?: string,
    @Query('muscleGroupId') muscleGroupId?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('isCustom') isCustom?: string,
    @Query('search') search?: string,
    @Query('createdById') createdById?: string,
  ) {
    const filters = {
      categoryId,
      difficultyLevel,
      muscleGroupId,
      equipmentId,
      isCustom: isCustom ? isCustom === 'true' : undefined,
      search,
      createdById,
    };

    return this.exerciseService.findAll(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get exercise statistics' })
  @ApiResponse({ status: 200, description: 'Exercise statistics retrieved' })
  async getStats() {
    return this.exerciseService.getExerciseStats();
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get exercises by category' })
  @ApiResponse({ status: 200, description: 'Exercises retrieved by category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findByCategory(@Param('categoryId') categoryId: string) {
    return this.exerciseService.findByCategory(categoryId);
  }

  @Get('muscle-group/:muscleGroupId')
  @ApiOperation({ summary: 'Get exercises by muscle group' })
  @ApiResponse({ status: 200, description: 'Exercises retrieved by muscle group' })
  @ApiResponse({ status: 404, description: 'Muscle group not found' })
  async findByMuscleGroup(@Param('muscleGroupId') muscleGroupId: string) {
    return this.exerciseService.findByMuscleGroup(muscleGroupId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exercise by ID' })
  @ApiResponse({ status: 200, description: 'Exercise retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  async findOne(@Param('id') id: string) {
    return this.exerciseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update exercise' })
  @ApiResponse({ status: 200, description: 'Exercise updated successfully' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async update(@Param('id') id: string, @Body() updateExerciseDto: UpdateExerciseDto) {
    return this.exerciseService.update(id, updateExerciseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete exercise' })
  @ApiResponse({ status: 200, description: 'Exercise deleted successfully' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete exercise used in workouts' })
  async remove(@Param('id') id: string) {
    await this.exerciseService.remove(id);
    return { message: 'Exercise deleted successfully' };
  }
}
