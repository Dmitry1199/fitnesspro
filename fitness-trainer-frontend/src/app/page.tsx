'use client';

import { useAuth } from '@/lib/auth-context';
import { LoginPage } from '@/components/auth/login-page';
import { TrainerDashboard } from '@/components/dashboard/trainer-dashboard';
import { ClientDashboard } from '@/components/dashboard/client-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function HomePage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || !isAuthenticated) {
    return <LoginPage />;
  }

  if (user.role === 'TRAINER') {
    return <TrainerDashboard />;
  }

  if (user.role === 'CLIENT') {
    return <ClientDashboard />;
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  return <LoginPage />;
}
