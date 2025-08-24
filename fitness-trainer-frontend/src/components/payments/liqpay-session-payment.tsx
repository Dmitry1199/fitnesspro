'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, openLiqPayCheckout } from '@/lib/liqpay';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Banknote,
} from 'lucide-react';

interface LiqPaySessionPaymentProps {
  sessionId: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

interface LiqPayPaymentData {
  paymentId: string;
  liqpayData: string;
  liqpaySignature: string;
  amount: number;
  currency: string;
  orderId: string;
  session: {
    id: string;
    title: string;
    date: string;
    time: string;
    trainer: string;
  };
}

export function LiqPaySessionPayment({ sessionId, onPaymentSuccess, onCancel }: LiqPaySessionPaymentProps) {
  const [paymentData, setPaymentData] = useState<LiqPayPaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    createPayment();
  }, [sessionId]);

  const createPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.createSessionPaymentIntent(sessionId) as LiqPayPaymentData;
      setPaymentData(data);
    } catch (error) {
      console.error('Failed to create LiqPay payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize payment');
      toast.error('Не вдалося ініціалізувати платіж');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentData) return;

    setIsProcessing(true);
    try {
      // Open LiqPay checkout in a new window
      openLiqPayCheckout(paymentData.liqpayData, paymentData.liqpaySignature);

      // Set up payment monitoring
      monitorPaymentStatus(paymentData.orderId);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Помилка при обробці платежу');
      setIsProcessing(false);
    }
  };

  const monitorPaymentStatus = (orderId: string) => {
    const checkInterval = setInterval(async () => {
      try {
        const status = await apiClient.checkPaymentStatus(orderId) as any;

        if (status?.status === 'success') {
          clearInterval(checkInterval);
          setIsProcessing(false);
          toast.success('Платіж успішно завершено!');
          onPaymentSuccess();
        } else if (status?.status === 'failure' || status?.status === 'error') {
          clearInterval(checkInterval);
          setIsProcessing(false);
          toast.error('Платіж не вдалося завершити');
        }
      } catch (error) {
        // Continue monitoring on error
        console.log('Status check error:', error);
      }
    }, 3000); // Check every 3 seconds

    // Stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      if (isProcessing) {
        setIsProcessing(false);
        toast.info('Перевірка статусу платежу завершена');
      }
    }, 300000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Підготовка платежу...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Помилка ініціалізації платежу</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <div className="flex space-x-3 justify-center">
          <Button onClick={createPayment}>
            Спробувати знову
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Скасувати
          </Button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-semibold mb-2">Обробка платежу</h3>
        <p className="text-muted-foreground mb-4">
          Будь ласка, завершіть платіж у вікні LiqPay та поверніться сюди
        </p>
        <Button variant="outline" onClick={() => setIsProcessing(false)}>
          Скасувати очікування
        </Button>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Session Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Деталі тренування</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium">{paymentData.session.title}</h4>
            <p className="text-sm text-muted-foreground">
              з тренером {paymentData.session.trainer}
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{paymentData.session.date}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{paymentData.session.time}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Сума до оплати:</span>
            <Badge variant="outline" className="text-lg">
              {formatCurrency(paymentData.amount)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Banknote className="h-5 w-5 mr-2" />
            Оплата через LiqPay
          </CardTitle>
          <CardDescription>
            Безпечна оплата українськими гривнями через LiqPay
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Безпечна оплата</p>
                <p className="text-blue-700">
                  Платіж обробляється через захищену систему LiqPay з підтримкою українських банків
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-medium text-sm">Доступні способи оплати:</h5>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Банківські картки (Visa, Mastercard)</li>
              <li>• Українські банківські картки</li>
              <li>• Мобільні платежі</li>
              <li>• Електронні гаманці</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Payment Actions */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Скасувати
        </Button>
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="flex-1"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Оплатити {formatCurrency(paymentData.amount)}
        </Button>
      </div>

      {/* Additional Information */}
      <div className="text-xs text-muted-foreground text-center">
        Натискаючи "Оплатити", ви погоджуєтесь з умовами користування сервісом
      </div>
    </div>
  );
}

export function LiqPaySessionPaymentDialog({
  sessionId,
  open,
  onOpenChange,
  onPaymentSuccess,
}: {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Оплата тренування</DialogTitle>
          <DialogDescription>
            Безпечна оплата через LiqPay - український сервіс платежів
          </DialogDescription>
        </DialogHeader>
        <LiqPaySessionPayment
          sessionId={sessionId}
          onPaymentSuccess={() => {
            onPaymentSuccess();
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
