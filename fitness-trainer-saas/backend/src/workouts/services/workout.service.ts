import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkoutDto } from '../dto/create-workout.dto';
import { UpdateWorkoutDto } from '../dto/update-workout.dto';
import { Workout } from '@prisma/client';

@Injectable()
export class WorkoutService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWorkoutDto: CreateWorkoutDto, createdById: string): Promise<Workout> {
    const { exercises, ...workoutData } = createWorkoutDto;

    // Verify all exercises exist
    const exerciseIds = exercises.map(e => e.exerciseId);
    const exerciseCount = await this.prisma.exercise.count({
      where: { id: { in: exerciseIds } },
    });

    if (exerciseCount !== exerciseIds.length) {
      throw new BadRequestException('One or more exercises not found');
    }

    // Check for duplicate exercises in the same workout
    const uniqueExerciseIds = new Set(exerciseIds);
    if (uniqueExerciseIds.size !== exerciseIds.length) {
      throw new BadRequestException('Duplicate exercises are not allowed in the same workout');
    }

    // Create workout with exercises
    return this.prisma.workout.create({
      data: {
        ...workoutData,
        createdById,
        exercises: {
          create: exercises.map(exercise => ({
            exerciseId: exercise.exerciseId,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            duration: exercise.duration,
            restTime: exercise.restTime,
            notes: exercise.notes,
            order: exercise.order,
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: {
              include: {
                category: true,
                muscleGroups: true,
                equipment: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
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
    createdById?: string;
    difficultyLevel?: string;
    isTemplate?: boolean;
    isPublic?: boolean;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters?.difficultyLevel) {
      where.difficultyLevel = filters.difficultyLevel;
    }

    if (filters?.isTemplate !== undefined) {
      where.isTemplate = filters.isTemplate;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
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

    return this.prisma.workout.findMany({
      where,
      include: {
        exercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                difficultyLevel: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { isTemplate: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string): Promise<any> {
    const workout = await this.prisma.workout.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            exercise: {
              include: {
                category: true,
                muscleGroups: true,
                equipment: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        workoutPlans: {
          include: {
            workoutPlan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    return workout;
  }

  async update(id: string, updateWorkoutDto: UpdateWorkoutDto): Promise<Workout> {
    const existingWorkout = await this.prisma.workout.findUnique({
      where: { id },
      include: {
        exercises: true,
      },
    });

    if (!existingWorkout) {
      throw new NotFoundException('Workout not found');
    }

    const { exercises, ...workoutData } = updateWorkoutDto;

    // If exercises are being updated
    if (exercises) {
      // Verify all exercises exist
      const exerciseIds = exercises.map(e => e.exerciseId);
      const exerciseCount = await this.prisma.exercise.count({
        where: { id: { in: exerciseIds } },
      });

      if (exerciseCount !== exerciseIds.length) {
        throw new BadRequestException('One or more exercises not found');
      }

      // Delete existing workout exercises and create new ones
      await this.prisma.workoutExercise.deleteMany({
        where: { workoutId: id },
      });
    }

    return this.prisma.workout.update({
      where: { id },
      data: {
        ...workoutData,
        exercises: exercises ? {
          create: exercises.map(exercise => ({
            exerciseId: exercise.exerciseId,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            duration: exercise.duration,
            restTime: exercise.restTime,
            notes: exercise.notes,
            order: exercise.order,
          })),
        } : undefined,
      },
      include: {
        exercises: {
          include: {
            exercise: {
              include: {
                category: true,
                muscleGroups: true,
                equipment: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
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
    const workout = await this.prisma.workout.findUnique({
      where: { id },
      include: {
        workoutPlans: true,
      },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    // Check if workout is used in any workout plans
    if (workout.workoutPlans.length > 0) {
      throw new BadRequestException(
        'Cannot delete workout that is used in workout plans. Remove from plans first.',
      );
    }

    await this.prisma.workout.delete({
      where: { id },
    });
  }

  async duplicateWorkout(id: string, createdById: string, newName?: string): Promise<Workout> {
    const originalWorkout = await this.findOne(id);

    const duplicateData: CreateWorkoutDto = {
      name: newName || `Copy of ${originalWorkout.name}`,
      description: originalWorkout.description || undefined,
      estimatedDuration: originalWorkout.estimatedDuration || undefined,
      difficultyLevel: originalWorkout.difficultyLevel as any,
      calories: originalWorkout.calories || undefined,
      isTemplate: false,
      isPublic: false,
      exercises: originalWorkout.exercises.map(workoutExercise => ({
        exerciseId: workoutExercise.exercise.id,
        sets: workoutExercise.sets || undefined,
        reps: workoutExercise.reps || undefined,
        weight: workoutExercise.weight || undefined,
        duration: workoutExercise.duration || undefined,
        restTime: workoutExercise.restTime || undefined,
        notes: workoutExercise.notes || undefined,
        order: workoutExercise.order,
      })),
    };

    return this.create(duplicateData, createdById);
  }

  async getWorkoutStats() {
    const [
      totalWorkouts,
      templateWorkouts,
      publicWorkouts,
      workoutsByDifficulty,
    ] = await Promise.all([
      this.prisma.workout.count(),
      this.prisma.workout.count({ where: { isTemplate: true } }),
      this.prisma.workout.count({ where: { isPublic: true } }),
      this.prisma.workout.groupBy({
        by: ['difficultyLevel'],
        _count: true,
        orderBy: { _count: { difficultyLevel: 'desc' } },
      }),
    ]);

    return {
      totalWorkouts,
      templateWorkouts,
      publicWorkouts,
      privateWorkouts: totalWorkouts - publicWorkouts,
      workoutsByDifficulty,
    };
  }

  async getWorkoutsByCreator(createdById: string) {
    return this.findAll({ createdById });
  }

  async getPublicWorkouts() {
    return this.findAll({ isPublic: true });
  }

  async getTemplateWorkouts() {
    return this.findAll({ isTemplate: true });
  }

  async calculateWorkoutMetrics(id: string) {
    const workout = await this.findOne(id);

    let totalDuration = 0;
    let totalCalories = 0;
    let exerciseCount = workout.exercises?.length || 0;

    workout.exercises?.forEach(workoutExercise => {
      const exercise = workoutExercise.exercise;

      // Calculate duration
      if (workoutExercise.duration) {
        totalDuration += workoutExercise.duration;
      } else if (workoutExercise.sets && workoutExercise.reps) {
        // Estimate duration: 3 seconds per rep + rest time
        const estimatedExerciseTime = (workoutExercise.sets * workoutExercise.reps * 3) +
                                     (workoutExercise.restTime || 60) * (workoutExercise.sets - 1);
        totalDuration += estimatedExerciseTime;
      }

      // Calculate calories
      if (exercise.caloriesPerMin && workoutExercise.duration) {
        totalCalories += (exercise.caloriesPerMin * workoutExercise.duration) / 60;
      }
    });

    return {
      exerciseCount,
      estimatedDuration: Math.ceil(totalDuration / 60), // in minutes
      estimatedCalories: Math.round(totalCalories),
      difficultyLevel: workout.difficultyLevel,
    };
  }
}
