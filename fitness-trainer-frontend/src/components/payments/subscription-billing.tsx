'use client';

import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe, formatPrice, subscriptionPlans, type SubscriptionPlan } from '@/lib/stripe';
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
            <Crown className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <div className="text-3xl font-bold">
          {formatPrice(plan.price)}
          <span className="text-base font-normal text-muted-foreground">/{plan.interval}</span>
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
          {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
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

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Usage & Limits
        </CardTitle>
        <CardDescription>
          Current usage for your {usage.plan.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Clients */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Active Clients</span>
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
            <span>Created Workouts</span>
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
            <span>Total Sessions</span>
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

export function SubscriptionBilling() {
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

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

    if (currentSubscription) {
      // Update existing subscription
      try {
        await apiClient.updateSubscription(planId);

        toast.success('Subscription updated successfully!');
        loadSubscriptionData();
        setShowPlanSelection(false);
      } catch (error) {
        console.error('Failed to update subscription:', error);
        toast.error('Failed to update subscription');
      }
    } else {
      // Need to create new subscription - this would show payment form
      setShowPlanSelection(true);
    }
  };

  const handleCancelSubscription = async (immediately: boolean = false) => {
    if (!currentSubscription) return;

    try {
      await apiClient.cancelSubscription(immediately);

      toast.success(
        immediately
          ? 'Subscription cancelled immediately'
          : 'Subscription will cancel at the end of billing period'
      );
      loadSubscriptionData();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const handleOpenBillingPortal = async () => {
    try {
      const { url } = await apiClient.createBillingPortalSession() as { url: string };

      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      toast.error('Failed to open billing portal');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading subscription data...</p>
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
                  Current Subscription
                </CardTitle>
                <CardDescription>
                  Manage your FitnessPro subscription
                </CardDescription>
              </div>
              <Badge
                variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}
              >
                {currentSubscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">{currentSubscription.planName}</h4>
                <p className="text-2xl font-bold">
                  {formatPrice(currentSubscription.price)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{currentSubscription.interval}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Next billing: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
                {currentSubscription.cancelAtPeriodEnd && (
                  <div className="flex items-center text-sm text-orange-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>Cancels at period end</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPlanSelection(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Change Plan
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenBillingPortal}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Billing Portal
              </Button>
              {!currentSubscription.cancelAtPeriodEnd && (
                <Button
                  variant="outline"
                  onClick={() => handleCancelSubscription(false)}
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Plan</CardTitle>
            <CardDescription>
              Select a subscription plan to get started with FitnessPro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowPlanSelection(true)}>
              <Crown className="h-4 w-4 mr-2" />
              View Plans
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage Statistics */}
      {usage && <UsageCard usage={usage} />}

      {/* Plan Selection Dialog */}
      <Dialog open={showPlanSelection} onOpenChange={setShowPlanSelection}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
            <DialogDescription>
              Select the plan that best fits your business needs
            </DialogDescription>
          </DialogHeader>

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
        </DialogContent>
      </Dialog>
    </div>
  );
}
