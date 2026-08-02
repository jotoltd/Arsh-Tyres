import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Lock, Loader2 } from 'lucide-react';

interface StripePaymentProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}

export default function StripePaymentForm({ amount, onSuccess, onError }: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'Payment failed');
      onError(error.message || 'Payment failed');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setErrorMessage('Payment not completed');
      onError('Payment not completed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="w-4 h-4 text-emerald-400" />
        <span className="text-xs text-bright-snow/60">Secure payment powered by Stripe</span>
      </div>

      <div className="rounded-xl p-4 bg-[#1e2121] border border-white/5">
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: { card: {} },
          }}
        />
      </div>

      {errorMessage && (
        <div className="bg-racing-red/10 border border-racing-red/20 rounded-lg p-3 text-xs text-racing-red font-semibold">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        onClick={handleSubmit}
        disabled={!stripe || !elements || isProcessing}
        className="w-full flex items-center justify-center gap-2 bg-racing-red hover:bg-racing-red/90 disabled:opacity-50 disabled:cursor-not-allowed text-bright-snow font-extrabold uppercase tracking-wider text-sm px-5 py-3.5 rounded-xl transition shadow-lg shadow-racing-red/30"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay £{amount.toFixed(2)}
          </>
        )}
      </button>

      <p className="text-[11px] text-bright-snow/40 text-center">
        By confirming, you authorise Arsh Autos to charge your card for this amount.
      </p>
    </div>
  );
}
