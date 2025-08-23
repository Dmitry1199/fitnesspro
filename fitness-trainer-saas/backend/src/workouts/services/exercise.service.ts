import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';
import { Exercise } from '@prisma/client';

@Injectable()
export class ExerciseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createExerciseDto: CreateExerciseDto, createdById?: string): Promise<Exercise> {
    const { muscleGroupIds, equipmentIds, ...exerciseData } = createExerciseDto;

    // Verify category exists
    const category = await this.prisma.exerciseCategory.findUnique({
      where: { id: createExerciseDto.categoryId },
    });

    if (!category) {
      throw new BadRequestException('Exercise category not found');
    }

    // Verify muscle groups exist if provided
    if (muscleGroupIds && muscleGroupIds.length > 0) {
      const muscleGroupCount = await this.prisma.muscleGroup.count({
        where: { id: { in: muscleGroupIds } },
      });

      if (muscleGroupCount !== muscleGroupIds.length) {
        throw new BadRequestException('One or more muscle groups not found');
      }
    }

    // Verify equipment exists if provided
    if (equipmentIds && equipmentIds.length > 0) {
      const equipmentCount = await this.prisma.equipment.count({
        where: { id: { in: equipmentIds } },
      });

      if (equipmentCount !== equipmentIds.length) {
        throw new BadRequestException('One or more equipment items not found');
      }
    }

    return this.prisma.exercise.create({
      data: {
        ...exerciseData,
        createdById,
        muscleGroups: muscleGroupIds ? {
          connect: muscleGroupIds.map(id => ({ id })),
        } : undefined,
        equipment: equipmentIds ? {
          connect: equipmentIds.map(id => ({ id })),
        } : undefined,
      },
      include: {
        category: true,
        muscleGroups: true,
        equipment: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    categoryId?: string;
    difficultyLevel?: string;
    muscleGroupId?: string;
    equipmentId?: string;
    isCustom?: boolean;
    search?: string;
    createdById?: string;
  }) {
    const where: any = {};

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.difficultyLevel) {
      where.difficultyLevel = filters.difficultyLevel;
    }

    if (filters?.isCustom !== undefined) {
      where.isCustom = filters.isCustom;
    }

    if (filters?.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters?.muscleGroupId) {
      where.muscleGroups = {
        some: { id: filters.muscleGroupId },
      };
    }

    if (filters?.equipmentId) {
      where.equipment = {
        some: { id: filters.equipmentId },
      };
    }

    if (filters?.search) {
      // SQLite case-insensitive search using contains (SQLite is case-insensitive by default for LIKE operations)
      where.OR = [
        {
          name: {
            contains: filters.search,
          },
        },
        {
          description: {
            contains: filters.search,
          },
        },
      ];
    }

    return this.prisma.exercise.findMany({
      where,
      include: {
        category: true,
        muscleGroups: true,
        equipment: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { isCustom: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(id: string): Promise<Exercise> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: {
        category: true,
        muscleGroups: true,
        equipment: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        workoutExercises: {
          include: {
            workout: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }

  async update(id: string, updateExerciseDto: UpdateExerciseDto): Promise<Exercise> {
    const existingExercise = await this.prisma.exercise.findUnique({
      where: { id },
    });

    if (!existingExercise) {
      throw new NotFoundException('Exercise not found');
    }

    const { muscleGroupIds, equipmentIds, ...exerciseData } = updateExerciseDto;

    // Verify category exists if being updated
    if (updateExerciseDto.categoryId) {
      const category = await this.prisma.exerciseCategory.findUnique({
        where: { id: updateExerciseDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException('Exercise category not found');
      }
    }

    return this.prisma.exercise.update({
      where: { id },
      data: {
        ...exerciseData,
        muscleGroups: muscleGroupIds ? {
          set: [],
          connect: muscleGroupIds.map(id => ({ id })),
        } : undefined,
        equipment: equipmentIds ? {
          set: [],
          connect: equipmentIds.map(id => ({ id })),
        } : undefined,
      },
      include: {
        category: true,
        muscleGroups: true,
        equipment: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async remove(id: string): Promise<void> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: {
        workoutExercises: true,
      },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    // Check if exercise is used in any workouts
    if (exercise.workoutExercises.length > 0) {
      throw new BadRequestException(
        'Cannot delete exercise that is used in workouts. Remove from workouts first.',
      );
    }

    await this.prisma.exercise.delete({
      where: { id },
    });
  }

  async findByCategory(categoryId: string) {
    return this.prisma.exercise.findMany({
      where: { categoryId },
      include: {
        category: true,
        muscleGroups: true,
        equipment: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByMuscleGroup(muscleGroupId: string) {
    return this.prisma.exercise.findMany({
      where: {
        muscleGroups: {
          some: { id: muscleGroupId },
        },
      },
      include: {
        category: true,
        muscleGroups: true,
        equipment: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getExerciseStats() {
    const [
      totalExercises,
      customExercises,
      exercisesByCategory,
      exercisesByDifficulty,
    ] = await Promise.all([
      this.prisma.exercise.count(),
      this.prisma.exercise.count({ where: { isCustom: true } }),
      this.prisma.exercise.groupBy({
        by: ['categoryId'],
        _count: true,
        orderBy: { _count: { categoryId: 'desc' } },
      }),
      this.prisma.exercise.groupBy({
        by: ['difficultyLevel'],
        _count: true,
        orderBy: { _count: { difficultyLevel: 'desc' } },
      }),
    ]);

    return {
      totalExercises,
      customExercises,
      systemExercises: totalExercises - customExercises,
      exercisesByCategory,
      exercisesByDifficulty,
    };
  }
}
