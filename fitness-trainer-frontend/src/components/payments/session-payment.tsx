'use client';

import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe, formatPrice } from '@/lib/stripe';
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
} from 'lucide-react';

interface SessionPaymentProps {
  sessionId: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

interface PaymentIntentData {
  clientSecret: string;
  paymentIntentId: string;
  paymentId: string;
  amount: number;
  currency: string;
  session: {
    id: string;
    title: string;
    date: string;
    time: string;
    trainer: string;
  };
}

function CheckoutForm({
  paymentIntentData,
  onSuccess,
  onCancel
}: {
  paymentIntentData: PaymentIntentData;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'succeeded' | 'failed'>('pending');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment failed:', error);
        toast.error(error.message || 'Payment failed');
        setPaymentStatus('failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await apiClient.confirmSessionPayment(paymentIntent.id);

        setPaymentStatus('succeeded');
        toast.success('Payment successful! Session booked.');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed');
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'succeeded') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
        <p className="text-muted-foreground">
          Your training session has been booked successfully.
        </p>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Payment Failed</h3>
        <p className="text-muted-foreground mb-4">
          There was an issue processing your payment. Please try again.
        </p>
        <div className="flex space-x-3 justify-center">
          <Button
            variant="outline"
            onClick={() => setPaymentStatus('pending')}
          >
            Try Again
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Session Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Session Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium">{paymentIntentData.session.title}</h4>
            <p className="text-sm text-muted-foreground">
              with {paymentIntentData.session.trainer}
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{paymentIntentData.session.date}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{paymentIntentData.session.time}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Amount:</span>
            <Badge variant="outline" className="text-lg">
              {formatPrice(paymentIntentData.amount, paymentIntentData.currency)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Information
          </CardTitle>
          <CardDescription>
            Your payment information is secure and encrypted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay {formatPrice(paymentIntentData.amount, paymentIntentData.currency)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function SessionPayment({ sessionId, onPaymentSuccess, onCancel }: SessionPaymentProps) {
  const [paymentIntentData, setPaymentIntentData] = useState<PaymentIntentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createPaymentIntent();
  }, [sessionId]);

  const createPaymentIntent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.createSessionPaymentIntent(sessionId) as PaymentIntentData;
      setPaymentIntentData(data);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize payment');
      toast.error('Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Payment Setup Failed</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <div className="flex space-x-3 justify-center">
          <Button onClick={createPaymentIntent}>
            Try Again
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (!paymentIntentData) {
    return null;
  }

  const stripePromise = getStripe();

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: paymentIntentData.clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: 'hsl(var(--primary))',
            colorBackground: 'hsl(var(--background))',
            colorText: 'hsl(var(--foreground))',
            colorDanger: 'hsl(var(--destructive))',
          },
        },
      }}
    >
      <CheckoutForm
        paymentIntentData={paymentIntentData}
        onSuccess={onPaymentSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}

export function SessionPaymentDialog({
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
          <DialogTitle>Complete Your Payment</DialogTitle>
          <DialogDescription>
            Secure payment processing powered by Stripe
          </DialogDescription>
        </DialogHeader>
        <SessionPayment
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
