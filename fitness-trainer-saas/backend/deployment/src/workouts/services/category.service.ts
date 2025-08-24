import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ExerciseCategory, MuscleGroup, Equipment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateCategoryDto {
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface CreateMuscleGroupDto {
  name: string;
  description?: string;
}

export interface CreateEquipmentDto {
  name: string;
  description?: string;
  imageUrl?: string;
}

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // Exercise Categories
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<ExerciseCategory> {
    const existingCategory = await this.prisma.exerciseCategory.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new BadRequestException('Category with this name already exists');
    }

    return this.prisma.exerciseCategory.create({
      data: createCategoryDto,
    });
  }

  async findAllCategories(): Promise<ExerciseCategory[]> {
    return this.prisma.exerciseCategory.findMany({
      include: {
        exercises: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryById(id: string): Promise<ExerciseCategory> {
    const category = await this.prisma.exerciseCategory.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            muscleGroups: true,
            equipment: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(id: string, updateData: Partial<CreateCategoryDto>): Promise<ExerciseCategory> {
    const existingCategory = await this.prisma.exerciseCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    if (updateData.name && updateData.name !== existingCategory.name) {
      const duplicateCategory = await this.prisma.exerciseCategory.findUnique({
        where: { name: updateData.name },
      });

      if (duplicateCategory) {
        throw new BadRequestException('Category with this name already exists');
      }
    }

    return this.prisma.exerciseCategory.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.prisma.exerciseCategory.findUnique({
      where: { id },
      include: {
        exercises: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.exercises.length > 0) {
      throw new BadRequestException(
        'Cannot delete category that contains exercises. Move exercises to another category first.',
      );
    }

    await this.prisma.exerciseCategory.delete({
      where: { id },
    });
  }

  // Muscle Groups
  async createMuscleGroup(createMuscleGroupDto: CreateMuscleGroupDto): Promise<MuscleGroup> {
    const existingMuscleGroup = await this.prisma.muscleGroup.findUnique({
      where: { name: createMuscleGroupDto.name },
    });

    if (existingMuscleGroup) {
      throw new BadRequestException('Muscle group with this name already exists');
    }

    return this.prisma.muscleGroup.create({
      data: createMuscleGroupDto,
    });
  }

  async findAllMuscleGroups(): Promise<MuscleGroup[]> {
    return this.prisma.muscleGroup.findMany({
      include: {
        exercises: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findMuscleGroupById(id: string): Promise<MuscleGroup> {
    const muscleGroup = await this.prisma.muscleGroup.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            category: true,
            equipment: true,
          },
        },
      },
    });

    if (!muscleGroup) {
      throw new NotFoundException('Muscle group not found');
    }

    return muscleGroup;
  }

  async updateMuscleGroup(id: string, updateData: Partial<CreateMuscleGroupDto>): Promise<MuscleGroup> {
    const existingMuscleGroup = await this.prisma.muscleGroup.findUnique({
      where: { id },
    });

    if (!existingMuscleGroup) {
      throw new NotFoundException('Muscle group not found');
    }

    if (updateData.name && updateData.name !== existingMuscleGroup.name) {
      const duplicateMuscleGroup = await this.prisma.muscleGroup.findUnique({
        where: { name: updateData.name },
      });

      if (duplicateMuscleGroup) {
        throw new BadRequestException('Muscle group with this name already exists');
      }
    }

    return this.prisma.muscleGroup.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteMuscleGroup(id: string): Promise<void> {
    const muscleGroup = await this.prisma.muscleGroup.findUnique({
      where: { id },
      include: {
        exercises: true,
      },
    });

    if (!muscleGroup) {
      throw new NotFoundException('Muscle group not found');
    }

    if (muscleGroup.exercises.length > 0) {
      throw new BadRequestException(
        'Cannot delete muscle group that is used in exercises. Remove from exercises first.',
      );
    }

    await this.prisma.muscleGroup.delete({
      where: { id },
    });
  }

  // Equipment
  async createEquipment(createEquipmentDto: CreateEquipmentDto): Promise<Equipment> {
    const existingEquipment = await this.prisma.equipment.findUnique({
      where: { name: createEquipmentDto.name },
    });

    if (existingEquipment) {
      throw new BadRequestException('Equipment with this name already exists');
    }

    return this.prisma.equipment.create({
      data: createEquipmentDto,
    });
  }

  async findAllEquipment(): Promise<Equipment[]> {
    return this.prisma.equipment.findMany({
      include: {
        exercises: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findEquipmentById(id: string): Promise<Equipment> {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            category: true,
            muscleGroups: true,
          },
        },
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    return equipment;
  }

  async updateEquipment(id: string, updateData: Partial<CreateEquipmentDto>): Promise<Equipment> {
    const existingEquipment = await this.prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      throw new NotFoundException('Equipment not found');
    }

    if (updateData.name && updateData.name !== existingEquipment.name) {
      const duplicateEquipment = await this.prisma.equipment.findUnique({
        where: { name: updateData.name },
      });

      if (duplicateEquipment) {
        throw new BadRequestException('Equipment with this name already exists');
      }
    }

    return this.prisma.equipment.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteEquipment(id: string): Promise<void> {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        exercises: true,
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    if (equipment.exercises.length > 0) {
      throw new BadRequestException(
        'Cannot delete equipment that is used in exercises. Remove from exercises first.',
      );
    }

    await this.prisma.equipment.delete({
      where: { id },
    });
  }

  // Combined stats and utilities
  async getCategoryStats() {
    const [categories, muscleGroups, equipment] = await Promise.all([
      this.prisma.exerciseCategory.count(),
      this.prisma.muscleGroup.count(),
      this.prisma.equipment.count(),
    ]);

    return {
      totalCategories: categories,
      totalMuscleGroups: muscleGroups,
      totalEquipment: equipment,
    };
  }

  async initializeDefaultData() {
    // Create default categories if they don't exist
    const defaultCategories = [
      { name: 'Strength Training', description: 'Weight lifting and resistance exercises', iconUrl: '🏋️‍♂️' },
      { name: 'Cardio', description: 'Cardiovascular and endurance exercises', iconUrl: '🏃‍♂️' },
      { name: 'Flexibility', description: 'Stretching and mobility exercises', iconUrl: '🧘‍♀️' },
      { name: 'Functional', description: 'Functional movement and daily activity training', iconUrl: '⚡' },
      { name: 'Sports Specific', description: 'Sport-specific training exercises', iconUrl: '⚽' },
    ];

    const defaultMuscleGroups = [
      { name: 'Chest', description: 'Pectoral muscles' },
      { name: 'Back', description: 'Latissimus dorsi, rhomboids, trapezius' },
      { name: 'Shoulders', description: 'Deltoids and rotator cuff' },
      { name: 'Arms', description: 'Biceps, triceps, forearms' },
      { name: 'Legs', description: 'Quadriceps, hamstrings, calves' },
      { name: 'Glutes', description: 'Gluteal muscles' },
      { name: 'Core', description: 'Abdominals, obliques, lower back' },
      { name: 'Full Body', description: 'Multiple muscle groups' },
    ];

    const defaultEquipment = [
      { name: 'Bodyweight', description: 'No equipment needed' },
      { name: 'Dumbbells', description: 'Free weights' },
      { name: 'Barbell', description: 'Olympic or standard barbell' },
      { name: 'Kettlebell', description: 'Kettlebell weights' },
      { name: 'Resistance Bands', description: 'Elastic resistance bands' },
      { name: 'Pull-up Bar', description: 'Pull-up or chin-up bar' },
      { name: 'Cable Machine', description: 'Cable and pulley system' },
      { name: 'Cardio Machine', description: 'Treadmill, bike, elliptical' },
    ];

    // Create categories
    for (const category of defaultCategories) {
      await this.prisma.exerciseCategory.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
    }

    // Create muscle groups
    for (const muscleGroup of defaultMuscleGroups) {
      await this.prisma.muscleGroup.upsert({
        where: { name: muscleGroup.name },
        update: {},
        create: muscleGroup,
      });
    }

    // Create equipment
    for (const equipment of defaultEquipment) {
      await this.prisma.equipment.upsert({
        where: { name: equipment.name },
        update: {},
        create: equipment,
      });
    }

    return {
      categoriesCreated: defaultCategories.length,
      muscleGroupsCreated: defaultMuscleGroups.length,
      equipmentCreated: defaultEquipment.length,
    };
  }
}
