import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExerciseService } from './services/exercise.service';
import { WorkoutService } from './services/workout.service';
import { CategoryService } from './services/category.service';
import { ExerciseController } from './controllers/exercise.controller';
import { WorkoutController } from './controllers/workout.controller';
import { CategoryController } from './controllers/category.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ExerciseController,
    WorkoutController,
    CategoryController,
  ],
  providers: [
    ExerciseService,
    WorkoutService,
    CategoryService,
  ],
  exports: [
    ExerciseService,
    WorkoutService,
    CategoryService,
  ],
})
export class WorkoutsModule {}
