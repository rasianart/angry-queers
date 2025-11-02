import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

interface StripeFormProps {
  amount: string;
  email: string;
  name: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const StripeForm: React.FC<StripeFormProps> = ({
  amount,
  email,
  name: _name, // Reserved for future use with billing details
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/donation-success',
          receipt_email: email,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed');
        setProcessing(false);
      } else {
        onSuccess();
        setProcessing(false);
      }
    } catch (err) {
      onError((err as Error).message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <PaymentElement />

      <button
        type='submit'
        disabled={!stripe || processing}
        className='w-full button-pink text-white py-4 rounded-lg transition-colors font-medium text-lg hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {processing ? 'Processing...' : `Donate $${amount}`}
      </button>
    </form>
  );
};

export default StripeForm;

