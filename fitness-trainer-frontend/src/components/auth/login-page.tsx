'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Dumbbell,
  User,
  UserCheck,
  Shield,
  Loader2,
  Mail,
  Lock,
} from 'lucide-react';

export function LoginPage() {
  const { quickLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleQuickLogin = async (type: 'trainer' | 'client' | 'admin') => {
    try {
      setIsLoading(true);
      await quickLogin(type);
      toast.success(`Вхід як ${type === 'trainer' ? 'тренер' : type === 'client' ? 'клієнт' : 'адміністратор'}!`);
    } catch (error) {
      console.error('Quick login failed:', error);
      toast.error('Помилка входу в систему');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Введіть email адресу');
      return;
    }

    try {
      setIsLoading(true);
      // For demo purposes, redirect to quick login based on email domain
      if (email.includes('trainer')) {
        await quickLogin('trainer');
        toast.success('Вхід як тренер!');
      } else if (email.includes('admin')) {
        await quickLogin('admin');
        toast.success('Вхід як адміністратор!');
      } else {
        await quickLogin('client');
        toast.success('Вхід як клієнт!');
      }
    } catch (error) {
      console.error('Email login failed:', error);
      toast.error('Помилка входу в систему');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-yellow-500 text-white p-3 rounded-xl">
              <Dumbbell className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FitnessPro</h1>
          <p className="text-sm text-gray-600 mt-2">🇺🇦 Українська фітнес платформа</p>
          <p className="text-xs text-gray-500 mt-1">Професійна платформа для тренерів та клієнтів</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle>Вхід в систему</CardTitle>
            <CardDescription>
              Оберіть тип облікового запису для входу
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Quick Login Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Швидкий вхід (демо):</h3>

              <Button
                onClick={() => handleQuickLogin('trainer')}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-2" />
                )}
                Увійти як Тренер
              </Button>

              <Button
                onClick={() => handleQuickLogin('client')}
                disabled={isLoading}
                variant="outline"
                className="w-full border-blue-200 hover:bg-blue-50"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                Увійти як Клієнт
              </Button>

              <Button
                onClick={() => handleQuickLogin('admin')}
                disabled={isLoading}
                variant="outline"
                className="w-full border-gray-200 hover:bg-gray-50"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Увійти як Адміністратор
              </Button>
            </div>

            <Separator />

            {/* Email Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Вхід з email:</h3>

              <div className="space-y-2">
                <Label htmlFor="email">Email адреса</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trainer@fitnesspro.ua"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль (опціонально)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введіть пароль"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Увійти з Email
              </Button>
            </form>

            {/* Demo Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 text-center">
                <strong>Демо-платформа:</strong> Використовуйте швидкий вхід для тестування.<br />
                Email підказки: trainer@*, client@*, admin@*
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            FitnessPro © 2024 - Українська фітнес платформа з LiqPay інтеграцією
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Підтримка українських гривень та локальних банків
          </p>
        </div>
      </div>
    </div>
  );
}
