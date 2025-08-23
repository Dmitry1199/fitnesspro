'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, Exercise, Workout } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Search,
  Filter,
  GripVertical,
  Clock,
  Target,
  Zap,
  Save,
  X,
  Dumbbell,
} from 'lucide-react';

interface WorkoutExercise {
  exerciseId: string;
  exercise?: Exercise;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
  order: number;
}

interface WorkoutFormProps {
  workout?: Workout;
  onSave: (workout: Workout) => void;
  onCancel: () => void;
}

export function WorkoutForm({ workout, onSave, onCancel }: WorkoutFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: workout?.name || '',
    description: workout?.description || '',
    estimatedDuration: workout?.estimatedDuration || 30,
    difficultyLevel: workout?.difficultyLevel || 'BEGINNER',
    calories: workout?.calories || 0,
    isTemplate: workout?.isTemplate || false,
    isPublic: workout?.isPublic || false,
  });

  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    workout?.exercises?.map(we => ({
      exerciseId: we.exercise.id,
      exercise: we.exercise,
      sets: we.sets,
      reps: we.reps,
      weight: we.weight,
      duration: we.duration,
      restTime: we.restTime,
      notes: we.notes,
      order: we.order,
    })) || []
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [exercisesData, categoriesData] = await Promise.all([
        apiClient.getExercises(),
        apiClient.getCategories(),
      ]);
      setExercises(exercisesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load exercise data');
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    const newOrder = Math.max(0, ...workoutExercises.map(we => we.order)) + 1;

    const newWorkoutExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exercise,
      sets: 3,
      reps: 12,
      restTime: 60,
      order: newOrder,
    };

    setWorkoutExercises([...workoutExercises, newWorkoutExercise]);
    setShowExerciseDialog(false);
    toast.success(`Added ${exercise.name} to workout`);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = workoutExercises.filter((_, i) => i !== index);
    // Reorder remaining exercises
    updated.forEach((we, i) => {
      we.order = i + 1;
    });
    setWorkoutExercises(updated);
    toast.success('Exercise removed from workout');
  };

  const handleExerciseUpdate = (index: number, field: string, value: any) => {
    const updated = [...workoutExercises];
    updated[index] = { ...updated[index], [field]: value };
    setWorkoutExercises(updated);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Workout name is required');
      return;
    }

    if (workoutExercises.length === 0) {
      toast.error('Please add at least one exercise');
      return;
    }

    setIsLoading(true);
    try {
      const workoutData = {
        ...formData,
        exercises: workoutExercises.map(we => ({
          exerciseId: we.exerciseId,
          sets: we.sets,
          reps: we.reps,
          weight: we.weight,
          duration: we.duration,
          restTime: we.restTime,
          notes: we.notes,
          order: we.order,
        })),
      };

      let savedWorkout;
      if (workout) {
        savedWorkout = await apiClient.updateWorkout(workout.id, workoutData);
      } else {
        savedWorkout = await apiClient.createWorkout(workoutData);
      }

      toast.success(`Workout ${workout ? 'updated' : 'created'} successfully!`);
      onSave(savedWorkout);
    } catch (error) {
      console.error('Failed to save workout:', error);
      toast.error(`Failed to ${workout ? 'update' : 'create'} workout`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
                         exercise.description?.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchesCategory = !selectedCategory || exercise.category.id === selectedCategory;
    const matchesDifficulty = !selectedDifficulty || exercise.difficultyLevel === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      {/* Workout Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Dumbbell className="h-5 w-5 mr-2" />
            {workout ? 'Edit Workout' : 'Create New Workout'}
          </CardTitle>
          <CardDescription>
            {workout ? 'Update your workout details and exercises' : 'Build a new workout routine for your clients'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workout Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Upper Body Strength"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={formData.difficultyLevel} onValueChange={(value) => setFormData({ ...formData, difficultyLevel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this workout routine..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 0 })}
                min="1"
                max="300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">Estimated Calories</Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) || 0 })}
                min="0"
                max="2000"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="template"
                checked={formData.isTemplate}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, isTemplate: checked })}
              />
              <Label htmlFor="template">Save as Template</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={formData.isPublic}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, isPublic: checked })}
              />
              <Label htmlFor="public">Make Public</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workout Exercises */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exercises ({workoutExercises.length})</CardTitle>
              <CardDescription>Add and configure exercises for this workout</CardDescription>
            </div>
            <Button onClick={() => setShowExerciseDialog(true)} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workoutExercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No exercises added yet</p>
              <p className="text-sm">Click "Add Exercise" to start building your workout</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workoutExercises.map((workoutExercise, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{workoutExercise.exercise?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {workoutExercise.exercise?.category.name} • {workoutExercise.exercise?.difficultyLevel}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveExercise(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Sets</Label>
                        <Input
                          type="number"
                          value={workoutExercise.sets || ''}
                          onChange={(e) => handleExerciseUpdate(index, 'sets', parseInt(e.target.value) || undefined)}
                          placeholder="3"
                          min="1"
                          max="20"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Reps</Label>
                        <Input
                          type="number"
                          value={workoutExercise.reps || ''}
                          onChange={(e) => handleExerciseUpdate(index, 'reps', parseInt(e.target.value) || undefined)}
                          placeholder="12"
                          min="1"
                          max="100"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Weight (kg)</Label>
                        <Input
                          type="number"
                          value={workoutExercise.weight || ''}
                          onChange={(e) => handleExerciseUpdate(index, 'weight', parseFloat(e.target.value) || undefined)}
                          placeholder="20"
                          min="0"
                          step="0.5"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Duration (sec)</Label>
                        <Input
                          type="number"
                          value={workoutExercise.duration || ''}
                          onChange={(e) => handleExerciseUpdate(index, 'duration', parseInt(e.target.value) || undefined)}
                          placeholder="60"
                          min="1"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rest (sec)</Label>
                        <Input
                          type="number"
                          value={workoutExercise.restTime || ''}
                          onChange={(e) => handleExerciseUpdate(index, 'restTime', parseInt(e.target.value) || undefined)}
                          placeholder="60"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label className="text-xs">Notes</Label>
                      <Input
                        value={workoutExercise.notes || ''}
                        onChange={(e) => handleExerciseUpdate(index, 'notes', e.target.value)}
                        placeholder="Special instructions..."
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading} className="min-w-[120px]">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {workout ? 'Update' : 'Create'} Workout
        </Button>
      </div>

      {/* Exercise Selection Dialog */}
      <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Exercise to Workout</DialogTitle>
            <DialogDescription>
              Choose exercises from the library to add to your workout
            </DialogDescription>
          </DialogHeader>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exercises..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Exercise List */}
          <ScrollArea className="h-96">
            <div className="grid md:grid-cols-2 gap-3">
              {filteredExercises.map((exercise) => (
                <Card key={exercise.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">{exercise.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {exercise.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {exercise.difficultyLevel}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{exercise.category.name}</span>
                        <div className="flex items-center space-x-2">
                          {exercise.duration && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {exercise.duration}s
                            </span>
                          )}
                          {exercise.caloriesPerMin && (
                            <span className="flex items-center">
                              <Zap className="h-3 w-3 mr-1" />
                              {exercise.caloriesPerMin}/min
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleAddExercise(exercise)}
                        className="w-full"
                        size="sm"
                        disabled={workoutExercises.some(we => we.exerciseId === exercise.id)}
                      >
                        {workoutExercises.some(we => we.exerciseId === exercise.id) ? 'Already Added' : 'Add Exercise'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredExercises.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No exercises found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExerciseDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
