-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "profilePicture" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "phoneNumber" TEXT,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "fitnessGoals" TEXT,
    "experienceLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "preferredWorkoutTime" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "postalCode" TEXT
);

-- CreateTable
CREATE TABLE "trainer_availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "specificDate" DATETIME,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "trainer_availability_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainerId" TEXT NOT NULL,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sessionDate" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'PERSONAL',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "workoutPlanId" TEXT,
    "notes" TEXT,
    "clientNotes" TEXT,
    "price" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "training_sessions_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "training_sessions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "training_sessions_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "workout_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "bookingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "bookingDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancellationDate" DATETIME,
    "cancellationReason" TEXT,
    "cancelledBy" TEXT,
    "confirmedAt" DATETIME,
    "confirmedBy" TEXT,
    "paymentIntentId" TEXT,
    "paymentMethod" TEXT,
    "clientMessage" TEXT,
    "trainerResponse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "session_bookings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_bookings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exercise_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "muscle_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "duration" INTEGER,
    "caloriesPerMin" INTEGER,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "exercises_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "exercise_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exercises_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimatedDuration" INTEGER,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "calories" INTEGER,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "workouts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sets" INTEGER,
    "reps" INTEGER,
    "weight" REAL,
    "duration" INTEGER,
    "restTime" INTEGER,
    "notes" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workoutId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    CONSTRAINT "workout_exercises_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workouts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workout_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workout_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationWeeks" INTEGER,
    "workoutsPerWeek" INTEGER,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "goals" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    CONSTRAINT "workout_plans_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "workout_plans_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workout_plan_workouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" INTEGER,
    "weekNumber" INTEGER,
    "order" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workoutPlanId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    CONSTRAINT "workout_plan_workouts_workoutPlanId_fkey" FOREIGN KEY ("workoutPlanId") REFERENCES "workout_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workout_plan_workouts_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workouts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ExerciseEquipment" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ExerciseEquipment_A_fkey" FOREIGN KEY ("A") REFERENCES "equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ExerciseEquipment_B_fkey" FOREIGN KEY ("B") REFERENCES "exercises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ExerciseMuscleGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ExerciseMuscleGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "exercises" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ExerciseMuscleGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "muscle_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "trainer_availability_trainerId_dayOfWeek_startTime_key" ON "trainer_availability"("trainerId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "session_bookings_sessionId_key" ON "session_bookings"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_categories_name_key" ON "exercise_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "muscle_groups_name_key" ON "muscle_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_name_key" ON "equipment"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workout_exercises_workoutId_exerciseId_order_key" ON "workout_exercises"("workoutId", "exerciseId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "workout_plan_workouts_workoutPlanId_workoutId_dayOfWeek_weekNumber_key" ON "workout_plan_workouts"("workoutPlanId", "workoutId", "dayOfWeek", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "_ExerciseEquipment_AB_unique" ON "_ExerciseEquipment"("A", "B");

-- CreateIndex
CREATE INDEX "_ExerciseEquipment_B_index" ON "_ExerciseEquipment"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ExerciseMuscleGroups_AB_unique" ON "_ExerciseMuscleGroups"("A", "B");

-- CreateIndex
CREATE INDEX "_ExerciseMuscleGroups_B_index" ON "_ExerciseMuscleGroups"("B");
