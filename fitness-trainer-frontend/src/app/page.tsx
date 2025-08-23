'use client';

import { useAuth } from '@/lib/auth-context';
import { LoginPage } from '@/components/auth/login-page';
import { TrainerDashboard } from '@/components/dashboard/trainer-dashboard';
import { ClientDashboard } from '@/components/dashboard/client-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function HomePage() {
  const { user, isLoading, isTrainer, isClient, isAdmin } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPage />;
  }

  if (isTrainer) {
    return <TrainerDashboard />;
  }

  if (isClient) {
    return <ClientDashboard />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <LoginPage />;
}
