'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, Workout, TrainingSession, Exercise } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkoutForm } from './workout-form';
import { SessionForm } from './session-form';
import { SubscriptionBilling } from '../payments/subscription-billing';
import { toast } from 'sonner';
import {
  BarChart3,
  Calendar,
  Dumbbell,
  Users,
  Plus,
  Settings,
  LogOut,
  Clock,
  TrendingUp,
  Star,
  MapPin,
  BookOpen,
  Zap,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';

interface DashboardStats {
  totalWorkouts: number;
  totalSessions: number;
  completedSessions: number;
  activeClients: number;
}

export function TrainerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | undefined>();
  const [selectedSession, setSelectedSession] = useState<TrainingSession | undefined>();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [workoutsData, sessionsData, exercisesData, workoutStats, sessionStats] = await Promise.all([
        apiClient.getMyWorkouts(),
        apiClient.getMySessions(),
        apiClient.getExercises(),
        apiClient.getWorkoutStats(),
        apiClient.getSessionStats(),
      ]);

      setWorkouts(workoutsData);
      setSessions(sessionsData);
      setExercises(exercisesData);

      setStats({
        totalWorkouts: (workoutStats as any)?.totalWorkouts || workoutsData.length,
        totalSessions: (sessionStats as any)?.totalSessions || sessionsData.length,
        completedSessions: (sessionStats as any)?.completedSessions || 0,
        activeClients: new Set(sessionsData.map(s => s.client?.id).filter(Boolean)).size,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  // Workout management
  const handleCreateWorkout = () => {
    setSelectedWorkout(undefined);
    setShowWorkoutForm(true);
  };

  const handleEditWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setShowWorkoutForm(true);
  };

  const handleWorkoutSaved = (workout: Workout) => {
    setShowWorkoutForm(false);
    setSelectedWorkout(undefined);
    loadDashboardData(); // Refresh data
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;

    try {
      await apiClient.deleteWorkout(workoutId);
      toast.success('Workout deleted successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Failed to delete workout:', error);
      toast.error('Failed to delete workout');
    }
  };

  // Session management
  const handleCreateSession = () => {
    setSelectedSession(undefined);
    setShowSessionForm(true);
  };

  const handleEditSession = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowSessionForm(true);
  };

  const handleSessionSaved = (session: TrainingSession) => {
    setShowSessionForm(false);
    setSelectedSession(undefined);
    loadDashboardData(); // Refresh data
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">FitnessPro</h1>
                <p className="text-sm text-muted-foreground">Trainer Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={user?.profilePicture} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">Fitness Trainer</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex items-center space-x-2">
              <Dumbbell className="h-4 w-4" />
              <span>Workouts</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Exercises</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Billing</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Clients</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalWorkouts || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Created and managed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled and completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.completedSessions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Successfully finished
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeClients || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently training
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Workouts</CardTitle>
                  <CardDescription>Your latest workout programs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workouts.slice(0, 5).map((workout) => (
                    <div key={workout.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{workout.name}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {workout.difficultyLevel}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {workout.exercises?.length || 0} exercises
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {workout.estimatedDuration || 0} min
                        </p>
                      </div>
                    </div>
                  ))}
                  {workouts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No workouts created yet
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                  <CardDescription>Your scheduled training sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{session.title}</p>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {session.startTime} - {session.endTime}
                          </span>
                          {session.location && (
                            <>
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {session.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={session.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No sessions scheduled
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Workout Management</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage your workout programs
                </p>
              </div>
              <Button onClick={handleCreateWorkout}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workout
              </Button>
            </div>

            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {workouts.map((workout) => (
                <Card key={workout.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{workout.name}</CardTitle>
                      <Badge variant={workout.isPublic ? 'default' : 'secondary'}>
                        {workout.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                    <CardDescription>{workout.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Difficulty:</span>
                      <Badge variant="outline">{workout.difficultyLevel}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{workout.estimatedDuration || 0} minutes</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Exercises:</span>
                      <span>{workout.exercises?.length || 0} exercises</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditWorkout(workout)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteWorkout(workout.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {workouts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No workouts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first workout to get started
                  </p>
                  <Button onClick={handleCreateWorkout}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Workout
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Session Management</h3>
                <p className="text-sm text-muted-foreground">
                  Schedule and manage training sessions
                </p>
              </div>
              <Button onClick={handleCreateSession}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </div>

            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h4 className="font-medium">{session.title}</h4>
                        <p className="text-sm text-muted-foreground">{session.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{session.sessionDate}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{session.startTime} - {session.endTime}</span>
                          </div>
                          {session.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{session.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={session.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSession(session)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {sessions.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No sessions scheduled</h3>
                  <p className="text-muted-foreground mb-4">
                    Schedule your first training session
                  </p>
                  <Button onClick={handleCreateSession}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Your First Session
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Exercises Tab */}
          <TabsContent value="exercises" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Exercise Library</h3>
                <p className="text-sm text-muted-foreground">
                  Browse and manage exercises
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {exercises.slice(0, 12).map((exercise) => (
                <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{exercise.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {exercise.difficultyLevel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {exercise.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {exercise.category.name}
                        </span>
                        {exercise.duration && (
                          <span className="text-muted-foreground">
                            {exercise.duration}s
                          </span>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Subscription & Billing</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your subscription plan and billing
                </p>
              </div>
            </div>

            <SubscriptionBilling />
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Client Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your training clients
                </p>
              </div>
            </div>

            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Client management coming soon</h3>
                <p className="text-muted-foreground">
                  Advanced client management features will be available in the next update
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Workout Form Modal */}
      <Dialog open={showWorkoutForm} onOpenChange={setShowWorkoutForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkout ? 'Edit Workout' : 'Create New Workout'}
            </DialogTitle>
          </DialogHeader>
          <WorkoutForm
            workout={selectedWorkout}
            onSave={handleWorkoutSaved}
            onCancel={() => setShowWorkoutForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Session Form Modal */}
      <Dialog open={showSessionForm} onOpenChange={setShowSessionForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSession ? 'Edit Session' : 'Schedule New Session'}
            </DialogTitle>
          </DialogHeader>
          <SessionForm
            session={selectedSession}
            onSave={handleSessionSaved}
            onCancel={() => setShowSessionForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
