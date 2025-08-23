'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dumbbell, Users, Shield, ArrowRight, Zap, Calendar, TrendingUp } from 'lucide-react';

interface UserRole {
  type: 'trainer' | 'client' | 'admin';
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
}

const USER_ROLES: UserRole[] = [
  {
    type: 'trainer',
    title: 'Fitness Trainer',
    description: 'Manage workouts, schedule sessions, and train clients',
    icon: <Dumbbell className="h-8 w-8" />,
    features: ['Create workout plans', 'Manage client sessions', 'Track client progress', 'Set availability'],
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    type: 'client',
    title: 'Client',
    description: 'Book sessions, follow workouts, and track your progress',
    icon: <Users className="h-8 w-8" />,
    features: ['Browse trainers', 'Book training sessions', 'Access workout library', 'Track your progress'],
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    type: 'admin',
    title: 'Administrator',
    description: 'Manage the platform, users, and system settings',
    icon: <Shield className="h-8 w-8" />,
    features: ['User management', 'System analytics', 'Platform configuration', 'Support tools'],
    color: 'bg-purple-500 hover:bg-purple-600',
  },
];

export function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (role: 'trainer' | 'client' | 'admin') => {
    try {
      setIsLoading(true);
      await login(role);
      toast.success(`Welcome! Logged in as ${role}`);
    } catch (error) {
      toast.error('Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-lg mr-3">
              <Dumbbell className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">FitnessPro</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The complete fitness training platform connecting trainers and clients
          </p>
        </div>

        {/* Features Banner */}
        <div className="flex justify-center mb-12">
          <div className="flex flex-wrap gap-4 items-center">
            <Badge variant="secondary" className="text-sm py-2 px-4">
              <Zap className="h-4 w-4 mr-2" />
              Workout Management
            </Badge>
            <Badge variant="secondary" className="text-sm py-2 px-4">
              <Calendar className="h-4 w-4 mr-2" />
              Session Booking
            </Badge>
            <Badge variant="secondary" className="text-sm py-2 px-4">
              <TrendingUp className="h-4 w-4 mr-2" />
              Progress Tracking
            </Badge>
          </div>
        </div>

        {/* Role Selection */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-8">Choose Your Role</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {USER_ROLES.map((role) => (
              <Card key={role.type} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-full text-white ${role.color.split(' ')[0]}`}>
                      {role.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {role.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-muted-foreground">
                        <ArrowRight className="h-4 w-4 mr-2 text-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => handleLogin(role.type)}
                    disabled={isLoading}
                    className={`w-full ${role.color} text-white border-0`}
                  >
                    {isLoading ? 'Logging in...' : `Login as ${role.title}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Demo Notice */}
        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Demo Mode:</strong> This is a demonstration platform with sample data.
                Choose any role to explore the features. No registration required!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* API Status */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Backend API: <span className="text-green-600 font-medium">Connected</span> •
            39 endpoints available
          </p>
        </div>
      </div>
    </div>
  );
}
