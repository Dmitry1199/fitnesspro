const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'TRAINER' | 'CLIENT' | 'ADMIN';
  experienceLevel?: string;
  fitnessGoals?: string;
  profilePicture?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  difficultyLevel: string;
  duration?: number;
  caloriesPerMin?: number;
  imageUrl?: string;
  category: {
    id: string;
    name: string;
    iconUrl?: string;
  };
  muscleGroups: Array<{
    id: string;
    name: string;
  }>;
  equipment: Array<{
    id: string;
    name: string;
  }>;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  estimatedDuration?: number;
  difficultyLevel: string;
  calories?: number;
  isTemplate: boolean;
  isPublic: boolean;
  createdAt: string;
  exercises: Array<{
    id: string;
    sets?: number;
    reps?: number;
    weight?: number;
    duration?: number;
    restTime?: number;
    notes?: string;
    order: number;
    exercise: Exercise;
  }>;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TrainingSession {
  id: string;
  title: string;
  description?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  sessionType: string;
  status: string;
  location?: string;
  price?: number;
  currency: string;
  trainer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  booking?: {
    id: string;
    bookingStatus: string;
    clientMessage?: string;
    trainerResponse?: string;
  };
  workoutPlan?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface TrainerAvailability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  specificDate?: string;
  isAvailable: boolean;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('fitnesspro_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('fitnesspro_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fitnesspro_token');
    }
  }



  // Authentication
  async quickLogin(type: 'trainer' | 'client' | 'admin' = 'trainer') {
    const response = await this.request<{
      accessToken: string;
      user: User;
    }>(`/auth/quick-login?type=${type}`);

    this.setToken(response.accessToken);
    return response;
  }

  async login(email: string, password?: string) {
    const response = await this.request<{
      accessToken: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setToken(response.accessToken);
    return response;
  }

  logout() {
    this.clearToken();
  }

  // Exercises
  async getExercises(filters?: {
    categoryId?: string;
    difficultyLevel?: string;
    muscleGroupId?: string;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    return this.request<Exercise[]>(`/exercises?${params}`);
  }

  async getExercise(id: string) {
    return this.request<Exercise>(`/exercises/${id}`);
  }

  async createExercise(data: {
    name: string;
    description?: string;
    instructions?: string;
    difficultyLevel: string;
    duration?: number;
    caloriesPerMin?: number;
    categoryId: string;
    muscleGroupIds?: string[];
    equipmentIds?: string[];
  }) {
    return this.request<Exercise>('/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Categories, Muscle Groups, Equipment
  async getCategories() {
    return this.request<Array<{
      id: string;
      name: string;
      description?: string;
      iconUrl?: string;
    }>>('/categories/exercise-categories');
  }

  async getMuscleGroups() {
    return this.request<Array<{
      id: string;
      name: string;
      description?: string;
    }>>('/categories/muscle-groups');
  }

  async getEquipment() {
    return this.request<Array<{
      id: string;
      name: string;
      description?: string;
    }>>('/categories/equipment');
  }

  // Workouts
  async getWorkouts(filters?: {
    difficultyLevel?: string;
    isTemplate?: boolean;
    isPublic?: boolean;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }

    return this.request<Workout[]>(`/workouts?${params}`);
  }

  async getWorkout(id: string) {
    return this.request<Workout>(`/workouts/${id}`);
  }

  async createWorkout(data: {
    name: string;
    description?: string;
    estimatedDuration?: number;
    difficultyLevel: string;
    calories?: number;
    isTemplate?: boolean;
    isPublic?: boolean;
    exercises: Array<{
      exerciseId: string;
      sets?: number;
      reps?: number;
      weight?: number;
      duration?: number;
      restTime?: number;
      notes?: string;
      order: number;
    }>;
  }) {
    return this.request<Workout>('/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkout(id: string, data: Partial<{
    name: string;
    description?: string;
    estimatedDuration?: number;
    difficultyLevel: string;
    calories?: number;
    isTemplate?: boolean;
    isPublic?: boolean;
  }>) {
    return this.request<Workout>(`/workouts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkout(id: string) {
    return this.request(`/workouts/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyWorkouts() {
    return this.request<Workout[]>('/workouts/my-workouts');
  }

  async getPublicWorkouts() {
    return this.request<Workout[]>('/workouts/public');
  }

  async getTemplateWorkouts() {
    return this.request<Workout[]>('/workouts/templates');
  }

  // Sessions
  async getSessions(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    return this.request<TrainingSession[]>(`/sessions?${params}`);
  }

  async getMySessions() {
    return this.request<TrainingSession[]>('/sessions/my-sessions');
  }

  async getSession(id: string) {
    return this.request<TrainingSession>(`/sessions/${id}`);
  }

  async createSession(data: {
    title: string;
    description?: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    sessionType?: string;
    location?: string;
    price?: number;
    clientId?: string;
  }) {
    return this.request<TrainingSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bookSession(sessionId: string, clientMessage?: string) {
    return this.request(`/sessions/${sessionId}/book`, {
      method: 'POST',
      body: JSON.stringify({ clientMessage }),
    });
  }

  async confirmBooking(bookingId: string, trainerResponse?: string) {
    return this.request(`/sessions/bookings/${bookingId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ trainerResponse }),
    });
  }

  async cancelBooking(bookingId: string, reason?: string) {
    return this.request(`/sessions/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Trainer Availability
  async getMyAvailability() {
    return this.request<TrainerAvailability[]>('/sessions/my-availability');
  }

  async createAvailability(data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isRecurring?: boolean;
    specificDate?: string;
    isAvailable?: boolean;
  }) {
    return this.request<TrainerAvailability>('/sessions/availability', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTrainerAvailability(trainerId: string, date?: string) {
    const params = date ? `?date=${date}` : '';
    return this.request<TrainerAvailability[]>(`/sessions/availability/${trainerId}${params}`);
  }

  async getAvailableSlots(trainerId: string, date: string) {
    return this.request(`/sessions/available-slots/${trainerId}?date=${date}`);
  }

  async searchTrainers(filters?: {
    date?: string;
    startTime?: string;
    endTime?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    return this.request<Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      experienceLevel: string;
      fitnessGoals?: string;
      city?: string;
    }>>(`/sessions/trainers/search?${params}`);
  }

  // Statistics
  async getWorkoutStats() {
    return this.request('/workouts/stats');
  }

  async getSessionStats() {
    return this.request('/sessions/stats');
  }

  // Public generic request method
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Payment & Billing (LiqPay)
  async createSessionPaymentIntent(sessionId: string) {
    return this.request('/payments/session/create', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }



  async refundSessionPayment(sessionId: string, reason?: string) {
    return this.request('/payments/session/refund', {
      method: 'POST',
      body: JSON.stringify({ sessionId, reason }),
    });
  }

  async getPaymentHistory() {
    return this.request('/payments/history');
  }

  async getPaymentStats(trainerId?: string) {
    const params = trainerId ? `?trainerId=${trainerId}` : '';
    return this.request(`/payments/stats${params}`);
  }

  // Subscriptions
  async getSubscriptionPlans() {
    return this.request('/subscriptions/plans');
  }

  async createSubscription(planId: string, paymentMethodId?: string) {
    return this.request('/subscriptions/create', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  async updateSubscription(planId: string) {
    return this.request('/subscriptions/update', {
      method: 'PUT',
      body: JSON.stringify({ planId }),
    });
  }

  async cancelSubscription(immediately: boolean = false) {
    return this.request('/subscriptions/cancel', {
      method: 'DELETE',
      body: JSON.stringify({ immediately }),
    });
  }

  async getCurrentSubscription() {
    return this.request('/subscriptions/current');
  }

  async getSubscriptionUsage() {
    return this.request('/subscriptions/usage');
  }

  async checkPaymentStatus(orderId: string) {
    return this.request(`/payments/check-status/${orderId}`);
  }

  async checkSubscriptionStatus(orderId: string) {
    return this.request(`/subscriptions/check-status/${orderId}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
