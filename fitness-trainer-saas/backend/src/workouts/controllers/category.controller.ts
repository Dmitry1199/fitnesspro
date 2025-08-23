import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CategoryService,
  CreateCategoryDto,
  CreateMuscleGroupDto,
  CreateEquipmentDto,
} from '../services/category.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Workouts')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Exercise Categories
  @Post('exercise-categories')
  @ApiOperation({ summary: 'Create a new exercise category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Category with this name already exists' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }

  @Get('exercise-categories')
  @ApiOperation({ summary: 'Get all exercise categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async findAllCategories() {
    return this.categoryService.findAllCategories();
  }

  @Get('exercise-categories/:id')
  @ApiOperation({ summary: 'Get exercise category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findCategoryById(@Param('id') id: string) {
    return this.categoryService.findCategoryById(id);
  }

  @Patch('exercise-categories/:id')
  @ApiOperation({ summary: 'Update exercise category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(@Param('id') id: string, @Body() updateData: Partial<CreateCategoryDto>) {
    return this.categoryService.updateCategory(id, updateData);
  }

  @Delete('exercise-categories/:id')
  @ApiOperation({ summary: 'Delete exercise category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete category with exercises' })
  async deleteCategory(@Param('id') id: string) {
    await this.categoryService.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }

  // Muscle Groups
  @Post('muscle-groups')
  @ApiOperation({ summary: 'Create a new muscle group' })
  @ApiResponse({ status: 201, description: 'Muscle group created successfully' })
  @ApiResponse({ status: 400, description: 'Muscle group with this name already exists' })
  async createMuscleGroup(@Body() createMuscleGroupDto: CreateMuscleGroupDto) {
    return this.categoryService.createMuscleGroup(createMuscleGroupDto);
  }

  @Get('muscle-groups')
  @ApiOperation({ summary: 'Get all muscle groups' })
  @ApiResponse({ status: 200, description: 'Muscle groups retrieved successfully' })
  async findAllMuscleGroups() {
    return this.categoryService.findAllMuscleGroups();
  }

  @Get('muscle-groups/:id')
  @ApiOperation({ summary: 'Get muscle group by ID' })
  @ApiResponse({ status: 200, description: 'Muscle group retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Muscle group not found' })
  async findMuscleGroupById(@Param('id') id: string) {
    return this.categoryService.findMuscleGroupById(id);
  }

  @Patch('muscle-groups/:id')
  @ApiOperation({ summary: 'Update muscle group' })
  @ApiResponse({ status: 200, description: 'Muscle group updated successfully' })
  @ApiResponse({ status: 404, description: 'Muscle group not found' })
  async updateMuscleGroup(@Param('id') id: string, @Body() updateData: Partial<CreateMuscleGroupDto>) {
    return this.categoryService.updateMuscleGroup(id, updateData);
  }

  @Delete('muscle-groups/:id')
  @ApiOperation({ summary: 'Delete muscle group' })
  @ApiResponse({ status: 200, description: 'Muscle group deleted successfully' })
  @ApiResponse({ status: 404, description: 'Muscle group not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete muscle group used in exercises' })
  async deleteMuscleGroup(@Param('id') id: string) {
    await this.categoryService.deleteMuscleGroup(id);
    return { message: 'Muscle group deleted successfully' };
  }

  // Equipment
  @Post('equipment')
  @ApiOperation({ summary: 'Create new equipment' })
  @ApiResponse({ status: 201, description: 'Equipment created successfully' })
  @ApiResponse({ status: 400, description: 'Equipment with this name already exists' })
  async createEquipment(@Body() createEquipmentDto: CreateEquipmentDto) {
    return this.categoryService.createEquipment(createEquipmentDto);
  }

  @Get('equipment')
  @ApiOperation({ summary: 'Get all equipment' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully' })
  async findAllEquipment() {
    return this.categoryService.findAllEquipment();
  }

  @Get('equipment/:id')
  @ApiOperation({ summary: 'Get equipment by ID' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async findEquipmentById(@Param('id') id: string) {
    return this.categoryService.findEquipmentById(id);
  }

  @Patch('equipment/:id')
  @ApiOperation({ summary: 'Update equipment' })
  @ApiResponse({ status: 200, description: 'Equipment updated successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async updateEquipment(@Param('id') id: string, @Body() updateData: Partial<CreateEquipmentDto>) {
    return this.categoryService.updateEquipment(id, updateData);
  }

  @Delete('equipment/:id')
  @ApiOperation({ summary: 'Delete equipment' })
  @ApiResponse({ status: 200, description: 'Equipment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete equipment used in exercises' })
  async deleteEquipment(@Param('id') id: string) {
    await this.categoryService.deleteEquipment(id);
    return { message: 'Equipment deleted successfully' };
  }

  // Statistics and utilities
  @Get('stats')
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.categoryService.getCategoryStats();
  }

  @Post('initialize-default-data')
  @ApiOperation({ summary: 'Initialize default categories, muscle groups, and equipment' })
  @ApiResponse({ status: 200, description: 'Default data initialized successfully' })
  async initializeDefaultData() {
    return this.categoryService.initializeDefaultData();
  }
}
