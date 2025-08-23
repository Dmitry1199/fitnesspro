'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, TrainingSession, Workout } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  DollarSign,
  Save,
  X,
  Users,
  User,
  Globe,
} from 'lucide-react';

interface SessionFormProps {
  session?: TrainingSession;
  onSave: (session: TrainingSession) => void;
  onCancel: () => void;
}

export function SessionForm({ session, onSave, onCancel }: SessionFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [date, setDate] = useState<Date | undefined>(
    session ? new Date(session.sessionDate) : new Date()
  );
  const [showCalendar, setShowCalendar] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: session?.title || '',
    description: session?.description || '',
    startTime: session?.startTime || '09:00',
    endTime: session?.endTime || '10:00',
    sessionType: session?.sessionType || 'PERSONAL',
    location: session?.location || '',
    price: session?.price || 75,
    currency: session?.currency || 'USD',
    clientId: session?.client?.id || '',
    workoutPlanId: session?.workoutPlan?.id || '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [workoutsData] = await Promise.all([
        apiClient.getMyWorkouts(),
        // In a real app, you'd have an API to get clients
        // For now, we'll just use an empty array
      ]);
      setWorkouts(workoutsData);
      setClients([]); // This would be populated with trainer's clients
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load session data');
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Session title is required');
      return;
    }

    if (!date) {
      toast.error('Session date is required');
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      toast.error('Start and end times are required');
      return;
    }

    // Validate time order
    const startTime = formData.startTime.split(':').map(Number);
    const endTime = formData.endTime.split(':').map(Number);
    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];

    if (endMinutes <= startMinutes) {
      toast.error('End time must be after start time');
      return;
    }

    setIsLoading(true);
    try {
      const sessionData = {
        ...formData,
        sessionDate: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        clientId: formData.clientId || undefined,
        workoutPlanId: formData.workoutPlanId || undefined,
      };

      let savedSession;
      if (session) {
        // Update existing session (this would require an update API)
        toast.info('Session update functionality coming soon');
        return;
      } else {
        // Create new session
        savedSession = await apiClient.createSession(sessionData);
      }

      toast.success(`Session ${session ? 'updated' : 'created'} successfully!`);
      onSave(savedSession);
    } catch (error) {
      console.error('Failed to save session:', error);
      toast.error(`Failed to ${session ? 'update' : 'create'} session`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return 0;

    const startTime = formData.startTime.split(':').map(Number);
    const endTime = formData.endTime.split(':').map(Number);
    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];

    return Math.max(0, endMinutes - startMinutes);
  };

  return (
    <div className="space-y-6">
      {/* Session Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            {session ? 'Edit Training Session' : 'Schedule New Session'}
          </CardTitle>
          <CardDescription>
            {session ? 'Update session details and settings' : 'Create a new training session for your clients'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Personal Training Session"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionType">Session Type</Label>
              <Select value={formData.sessionType} onValueChange={(value) => setFormData({ ...formData, sessionType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERSONAL">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Personal Training
                    </div>
                  </SelectItem>
                  <SelectItem value="GROUP">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Group Session
                    </div>
                  </SelectItem>
                  <SelectItem value="ONLINE">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      Online Session
                    </div>
                  </SelectItem>
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
              placeholder="Describe this training session..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Session Date *</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                      setShowCalendar(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Select value={formData.startTime} onValueChange={(value) => setFormData({ ...formData, startTime: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Select value={formData.endTime} onValueChange={(value) => setFormData({ ...formData, endTime: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration indicator */}
          {calculateDuration() > 0 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Duration: {calculateDuration()} minutes</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location and Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Location & Pricing</CardTitle>
          <CardDescription>Set the session location and pricing details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Main Gym, Online, Client's Home"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="5"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="UAH">UAH (₴)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Optional Settings</CardTitle>
          <CardDescription>Additional session configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Assign to Client (Optional)</Label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client or leave open for booking" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Open for booking</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workout">Workout Plan (Optional)</Label>
            <Select value={formData.workoutPlanId} onValueChange={(value) => setFormData({ ...formData, workoutPlanId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a workout plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific workout</SelectItem>
                {workouts.map(workout => (
                  <SelectItem key={workout.id} value={workout.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{workout.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {workout.difficultyLevel}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          {session ? 'Update' : 'Schedule'} Session
        </Button>
      </div>
    </div>
  );
}
