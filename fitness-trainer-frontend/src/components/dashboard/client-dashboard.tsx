'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, TrainingSession, Exercise } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionPaymentDialog } from '../payments/session-payment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search,
  Calendar,
  Dumbbell,
  Users,
  LogOut,
  Clock,
  MapPin,
  BookOpen,
  Zap,
  Star,
  Plus,
  Filter,
  User,
} from 'lucide-react';

interface DashboardStats {
  totalSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  availableTrainers: number;
}

export function ClientDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search and filter states
  const [trainerSearch, setTrainerSearch] = useState('');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [sessionsData, exercisesData, trainersData, categoriesData] = await Promise.all([
        apiClient.getMySessions(),
        apiClient.getExercises(),
        apiClient.searchTrainers(),
        apiClient.getCategories(),
      ]);

      setSessions(sessionsData);
      setExercises(exercisesData);
      setTrainers(trainersData);
      setCategories(categoriesData);

      // Calculate stats
      const upcoming = sessionsData.filter(s => new Date(s.sessionDate) > new Date()).length;
      const completed = sessionsData.filter(s => s.status === 'COMPLETED').length;

      setStats({
        totalSessions: sessionsData.length,
        upcomingSessions: upcoming,
        completedSessions: completed,
        availableTrainers: trainersData.length,
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

  const handleBookSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    toast.success('Session booked and paid successfully!');
    loadDashboardData(); // Refresh the session data
  };

  const filteredTrainers = trainers.filter(trainer => {
    const searchMatch =
      trainer.firstName.toLowerCase().includes(trainerSearch.toLowerCase()) ||
      trainer.lastName.toLowerCase().includes(trainerSearch.toLowerCase()) ||
      trainer.city?.toLowerCase().includes(trainerSearch.toLowerCase());

    return searchMatch;
  });

  const filteredExercises = exercises.filter(exercise => {
    const searchMatch = exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
                       exercise.description?.toLowerCase().includes(exerciseSearch.toLowerCase());
    const categoryMatch = !selectedCategory || exercise.category.id === selectedCategory;

    return searchMatch && categoryMatch;
  });

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
                <User className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">FitnessPro</h1>
                <p className="text-sm text-muted-foreground">Client Dashboard</p>
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
                  <p className="text-xs text-muted-foreground">Fitness Client</p>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="trainers" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Find Trainers</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>My Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Exercise Library</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All time sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.upcomingSessions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled ahead
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
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
                  <CardTitle className="text-sm font-medium">Available Trainers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.availableTrainers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Ready to help you
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                  <CardDescription>Your next training sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessions.slice(0, 3).map((session) => (
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
                      No sessions scheduled yet
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Exercises</CardTitle>
                  <CardDescription>Popular exercises to try</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exercises.slice(0, 3).map((exercise) => (
                    <div key={exercise.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{exercise.name}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {exercise.difficultyLevel}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {exercise.category.name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {exercise.duration && (
                          <p className="text-sm text-muted-foreground">
                            {exercise.duration}s
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trainers Tab */}
          <TabsContent value="trainers" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Find Your Perfect Trainer</h3>
                <p className="text-sm text-muted-foreground">
                  Browse available trainers and book your next session
                </p>
              </div>
              <div className="flex space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search trainers..."
                    value={trainerSearch}
                    onChange={(e) => setTrainerSearch(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrainers.map((trainer) => (
                <Card key={trainer.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="text-center pb-4">
                    <Avatar className="w-16 h-16 mx-auto mb-4">
                      <AvatarFallback>
                        {trainer.firstName?.[0]}{trainer.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{trainer.firstName} {trainer.lastName}</CardTitle>
                    <CardDescription>
                      {trainer.experienceLevel && (
                        <Badge variant="outline" className="mb-2">
                          {trainer.experienceLevel}
                        </Badge>
                      )}
                      {trainer.city && (
                        <div className="flex items-center justify-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {trainer.city}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trainer.fitnessGoals && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Specializes in:</p>
                        <p className="text-sm font-medium">{trainer.fitnessGoals}</p>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => handleBookSession(trainer.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Book Session
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTrainers.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No trainers found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search criteria
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">My Training Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  View and manage your booked sessions
                </p>
              </div>
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
                        {session.trainer && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Trainer:</span>{' '}
                            <span className="font-medium">
                              {session.trainer.firstName} {session.trainer.lastName}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={session.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
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
                  <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Book your first training session with a trainer
                  </p>
                  <Button onClick={() => setActiveTab('trainers')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Find Trainers
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
                  Explore exercises to enhance your fitness journey
                </p>
              </div>
              <div className="flex space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exercises..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    className="pl-10 w-64"
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
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredExercises.slice(0, 20).map((exercise) => (
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
        </Tabs>
      </div>

      {/* Session Payment Dialog */}
      {selectedSessionId && (
        <SessionPaymentDialog
          sessionId={selectedSessionId}
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
