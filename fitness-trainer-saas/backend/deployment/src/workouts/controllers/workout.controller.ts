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
import { WorkoutService } from '../services/workout.service';
import { CreateWorkoutDto } from '../dto/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/update-workout.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Workouts')
@Controller('workouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workout' })
  @ApiResponse({ status: 201, description: 'Workout created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createWorkoutDto: CreateWorkoutDto, @Request() req) {
    return this.workoutService.create(createWorkoutDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workouts with optional filters' })
  @ApiResponse({ status: 200, description: 'Workouts retrieved successfully' })
  @ApiQuery({ name: 'createdById', required: false, description: 'Filter by creator ID' })
  @ApiQuery({ name: 'difficultyLevel', required: false, description: 'Filter by difficulty level' })
  @ApiQuery({ name: 'isTemplate', required: false, description: 'Filter by template workouts' })
  @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by public workouts' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or description' })
  async findAll(
    @Query('createdById') createdById?: string,
    @Query('difficultyLevel') difficultyLevel?: string,
    @Query('isTemplate') isTemplate?: string,
    @Query('isPublic') isPublic?: string,
    @Query('search') search?: string,
  ) {
    const filters = {
      createdById,
      difficultyLevel,
      isTemplate: isTemplate ? isTemplate === 'true' : undefined,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      search,
    };

    return this.workoutService.findAll(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get workout statistics' })
  @ApiResponse({ status: 200, description: 'Workout statistics retrieved' })
  async getStats() {
    return this.workoutService.getWorkoutStats();
  }

  @Get('my-workouts')
  @ApiOperation({ summary: 'Get workouts created by current user' })
  @ApiResponse({ status: 200, description: 'User workouts retrieved successfully' })
  async getMyWorkouts(@Request() req) {
    return this.workoutService.getWorkoutsByCreator(req.user.sub);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get all public workouts' })
  @ApiResponse({ status: 200, description: 'Public workouts retrieved successfully' })
  async getPublicWorkouts() {
    return this.workoutService.getPublicWorkouts();
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all template workouts' })
  @ApiResponse({ status: 200, description: 'Template workouts retrieved successfully' })
  async getTemplateWorkouts() {
    return this.workoutService.getTemplateWorkouts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workout by ID' })
  @ApiResponse({ status: 200, description: 'Workout retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workout not found' })
  async findOne(@Param('id') id: string) {
    return this.workoutService.findOne(id);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get workout metrics and calculations' })
  @ApiResponse({ status: 200, description: 'Workout metrics calculated successfully' })
  @ApiResponse({ status: 404, description: 'Workout not found' })
  async getWorkoutMetrics(@Param('id') id: string) {
    return this.workoutService.calculateWorkoutMetrics(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an existing workout' })
  @ApiResponse({ status: 201, description: 'Workout duplicated successfully' })
  @ApiResponse({ status: 404, description: 'Original workout not found' })
  @ApiQuery({ name: 'newName', required: false, description: 'Name for the duplicated workout' })
  async duplicateWorkout(
    @Param('id') id: string,
    @Request() req,
    @Query('newName') newName?: string,
  ) {
    return this.workoutService.duplicateWorkout(id, req.user.sub, newName);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workout' })
  @ApiResponse({ status: 200, description: 'Workout updated successfully' })
  @ApiResponse({ status: 404, description: 'Workout not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async update(@Param('id') id: string, @Body() updateWorkoutDto: UpdateWorkoutDto) {
    return this.workoutService.update(id, updateWorkoutDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workout' })
  @ApiResponse({ status: 200, description: 'Workout deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workout not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete workout used in workout plans' })
  async remove(@Param('id') id: string) {
    await this.workoutService.remove(id);
    return { message: 'Workout deleted successfully' };
  }
}
