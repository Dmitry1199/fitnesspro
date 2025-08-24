'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, subscriptionPlans, openLiqPayCheckout, type SubscriptionPlan } from '@/lib/liqpay';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Check,
  Crown,
  CreditCard,
  Calendar,
  Users,
  Dumbbell,
  Settings,
  AlertCircle,
  Loader2,
  ExternalLink,
  Star,
  Banknote,
} from 'lucide-react';

interface CurrentSubscription {
  id: string;
  planId: string;
  planName: string;
  price: number;
  interval: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
  features: string[];
}

interface SubscriptionUsage {
  plan: SubscriptionPlan | null;
  limits: {
    clients: number;
    workouts: number;
    sessions: number;
  };
  usage: {
    activeClients: number;
    totalWorkouts: number;
    totalSessions: number;
  };
}

function PlanCard({
  plan,
  isCurrentPlan,
  onSelect
}: {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  onSelect: (planId: string) => void;
}) {
  return (
    <Card className={`relative ${(plan as any).popular ? 'border-primary' : ''} ${isCurrentPlan ? 'bg-muted/30' : ''}`}>
      {(plan as any).popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Star className="h-3 w-3 mr-1" />
            Популярний
          </Badge>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="text-3xl font-bold">
          {formatCurrency(plan.price)}
          <span className="text-base font-normal text-muted-foreground">/місяць</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <Button
          onClick={() => onSelect(plan.id)}
          disabled={isCurrentPlan}
          className="w-full"
          variant={isCurrentPlan ? 'secondary' : (plan as any).popular ? 'default' : 'outline'}
        >
          {isCurrentPlan ? 'Поточний план' : 'Обрати план'}
        </Button>
      </CardContent>
    </Card>
  );
}

function UsageCard({ usage }: { usage: SubscriptionUsage }) {
  if (!usage.plan) return null;

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Використання та ліміти
        </CardTitle>
        <CardDescription>
          Поточне використання для плану {usage.plan.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Clients */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Активні клієнти</span>
            <span>
              {usage.usage.activeClients}
              {usage.limits.clients !== -1 && ` / ${usage.limits.clients}`}
            </span>
          </div>
          {usage.limits.clients !== -1 && (
            <Progress
              value={getUsagePercentage(usage.usage.activeClients, usage.limits.clients)}
              className="h-2"
            />
          )}
        </div>

        {/* Total Workouts */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Створені тренування</span>
            <span>
              {usage.usage.totalWorkouts}
              {usage.limits.workouts !== -1 && ` / ${usage.limits.workouts}`}
            </span>
          </div>
          {usage.limits.workouts !== -1 && (
            <Progress
              value={getUsagePercentage(usage.usage.totalWorkouts, usage.limits.workouts)}
              className="h-2"
            />
          )}
        </div>

        {/* Total Sessions */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Загальна кількість сесій</span>
            <span>
              {usage.usage.totalSessions}
              {usage.limits.sessions !== -1 && ` / ${usage.limits.sessions}`}
            </span>
          </div>
          {usage.limits.sessions !== -1 && (
            <Progress
              value={getUsagePercentage(usage.usage.totalSessions, usage.limits.sessions)}
              className="h-2"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function LiqPaySubscriptionBilling() {
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const [subscriptionData, usageData] = await Promise.all([
        apiClient.getCurrentSubscription() as Promise<CurrentSubscription>,
        apiClient.getSubscriptionUsage() as Promise<SubscriptionUsage>,
      ]);

      setCurrentSubscription(subscriptionData);
      setUsage(usageData);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      // If no subscription, that's okay - user hasn't subscribed yet
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsProcessing(true);

    try {
      if (currentSubscription) {
        // Update existing subscription
        const result = await apiClient.updateSubscription(planId) as any;

        if (result?.liqpayData && result?.liqpaySignature) {
          openLiqPayCheckout(result.liqpayData, result.liqpaySignature);
          monitorSubscriptionStatus(result.orderId);
        } else {
          toast.success('Підписка оновлена!');
          loadSubscriptionData();
          setShowPlanSelection(false);
        }
      } else {
        // Create new subscription
        const result = await apiClient.createSubscription(planId, '') as any;

        if (result?.liqpayData && result?.liqpaySignature) {
          openLiqPayCheckout(result.liqpayData, result.liqpaySignature);
          monitorSubscriptionStatus(result.orderId);
        }
      }
    } catch (error) {
      console.error('Failed to handle subscription:', error);
      toast.error('Не вдалося обробити підписку');
      setIsProcessing(false);
    }
  };

  const monitorSubscriptionStatus = (orderId: string) => {
    const checkInterval = setInterval(async () => {
      try {
        const status = await apiClient.checkSubscriptionStatus(orderId) as any;

        if (status?.status === 'success') {
          clearInterval(checkInterval);
          setIsProcessing(false);
          toast.success('Підписка успішно активована!');
          loadSubscriptionData();
          setShowPlanSelection(false);
        } else if (status?.status === 'failure' || status?.status === 'error') {
          clearInterval(checkInterval);
          setIsProcessing(false);
          toast.error('Не вдалося активувати підписку');
        }
      } catch (error) {
        console.log('Status check error:', error);
      }
    }, 3000);

    // Stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      if (isProcessing) {
        setIsProcessing(false);
        toast.info('Перевірка статусу підписки завершена');
      }
    }, 300000);
  };

  const handleCancelSubscription = async (immediately: boolean = false) => {
    if (!currentSubscription) return;

    try {
      await apiClient.cancelSubscription(immediately);

      toast.success(
        immediately
          ? 'Підписка скасована негайно'
          : 'Підписка буде скасована в кінці білінгового періоду'
      );
      loadSubscriptionData();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Не вдалося скасувати підписку');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Завантаження даних підписки...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      {currentSubscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Crown className="h-5 w-5 mr-2" />
                  Поточна підписка
                </CardTitle>
                <CardDescription>
                  Управління підпискою FitnessPro
                </CardDescription>
              </div>
              <Badge
                variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}
              >
                {currentSubscription.status === 'active' ? 'Активна' : currentSubscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">{currentSubscription.planName}</h4>
                <p className="text-2xl font-bold">
                  {formatCurrency(currentSubscription.price)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /місяць
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Наступний платіж: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('uk-UA')}
                  </span>
                </div>
                {currentSubscription.cancelAtPeriodEnd && (
                  <div className="flex items-center text-sm text-orange-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>Скасовується в кінці періоду</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPlanSelection(true)}
                disabled={isProcessing}
              >
                <Settings className="h-4 w-4 mr-2" />
                Змінити план
              </Button>
              {!currentSubscription.cancelAtPeriodEnd && (
                <Button
                  variant="outline"
                  onClick={() => handleCancelSubscription(false)}
                  disabled={isProcessing}
                >
                  Скасувати підписку
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Оберіть ваш план</CardTitle>
            <CardDescription>
              Виберіть план підписки для початку роботи з FitnessPro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowPlanSelection(true)} disabled={isProcessing}>
              <Crown className="h-4 w-4 mr-2" />
              Переглянути плани
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage Statistics */}
      {usage && <UsageCard usage={usage} />}

      {/* LiqPay Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Banknote className="h-5 w-5 mr-2" />
            Оплата через LiqPay
          </CardTitle>
          <CardDescription>
            Безпечні платежі українським платіжним сервісом
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Оплата українськими гривнями</p>
          <p>• Підтримка всіх українських банків</p>
          <p>• Безпечна обробка платежів</p>
          <p>• Можливість оплати карткою або через мобільні платежі</p>
        </CardContent>
      </Card>

      {/* Plan Selection Dialog */}
      <Dialog open={showPlanSelection} onOpenChange={setShowPlanSelection}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Оберіть ваш план</DialogTitle>
            <DialogDescription>
              Виберіть план, який найкраще підходить для вашого бізнесу
            </DialogDescription>
          </DialogHeader>

          {isProcessing && (
            <div className="text-center py-6">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Обробка підписки...</p>
            </div>
          )}

          {!isProcessing && (
            <div className="grid md:grid-cols-3 gap-6 py-4">
              {subscriptionPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={currentSubscription?.planId === plan.id}
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
