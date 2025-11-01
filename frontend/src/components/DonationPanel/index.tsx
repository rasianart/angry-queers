import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeForm from './StripeForm';

interface DonationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

let stripePromise: Promise<any> | null = null;

const getStripe = async () => {
  if (!stripePromise) {
    const response = await fetch('/api/donations/config');
    const { publishableKey } = await response.json();
    if (publishableKey) {
      stripePromise = loadStripe(publishableKey);
    }
  }
  return stripePromise;
};

const DonationPanel: React.FC<DonationPanelProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [stripe, setStripe] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const presetAmounts = ['25', '50', '100', '250', '500'];

  useEffect(() => {
    getStripe().then(setStripe);
  }, []);

  const handleAmountSelect = (value: string) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setCustomAmount(value);
      setAmount('');
    }
  };

  const handleContinue = async () => {
    setError(null);

    const finalAmount = customAmount || amount;

    // Validation
    if (!finalAmount || parseInt(finalAmount) < 1) {
      setError('Please enter a valid donation amount');
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      // Create payment intent with Stripe
      const response = await fetch('/api/donations/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseInt(finalAmount),
          email,
          name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize payment');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setShowPaymentForm(true);
    } catch (err) {
      setError((err as Error).message || 'Failed to initialize payment');
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // Confirm the donation in our database
      await fetch('/api/donations/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
        }),
      });

      setSuccess(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setAmount('');
        setCustomAmount('');
        setEmail('');
        setName('');
        setShowPaymentForm(false);
        setClientSecret('');
        setPaymentIntentId('');
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error confirming donation:', err);
      // Still show success to user since payment went through
      setSuccess(true);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setShowPaymentForm(false);
    setClientSecret('');
    setPaymentIntentId('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity'
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className='h-full flex flex-col'>
          {/* Header */}
          <div className='bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-white relative'>
            <button
              onClick={onClose}
              className='absolute top-4 right-4 text-white hover:text-gray-200 transition-colors button-pink text-white'
              aria-label='Close'
            >
              <X size={24} />
            </button>
            <h2 className='text-2xl font-thin mb-2'>Direct Aid</h2>
            <p className='text-sm opacity-90'>
              Support our undocumented neighbors
            </p>
          </div>

          {/* Content */}
          <div className='flex-1 overflow-y-auto p-6'>
            {success ? (
              <div className='bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center'>
                <div className='text-green-600 text-5xl mb-4'>✓</div>
                <h3 className='text-xl font-thin text-gray-900 mb-2'>
                  Thank You!
                </h3>
                <p className='text-gray-700'>
                  Your donation has been processed successfully. Your support
                  helps us provide direct aid to our undocumented neighbors.
                </p>
              </div>
            ) : (
              <>
                {/* Mission Statement */}
                <div className='mb-6 pb-6 border-b border-gray-200'>
                  <p className='text-gray-700 leading-relaxed'>
                    We are a collective of queer Chicagoans building power and
                    solidarity through direct action and mutual aid. We mobilize
                    financial resources from our community to provide direct aid
                    to our undocumented neighbors in the face of ICE terror.
                  </p>
                </div>

                {/* Donation Form */}
                <div className='space-y-6'>
                  {error && (
                    <div className='bg-red-50 border border-red-300 rounded-lg p-4 text-red-700 text-sm'>
                      {error}
                    </div>
                  )}

                  {!showPaymentForm ? (
                    <>
                      {/* Preset Amounts */}
                      <div>
                        <label className='block text-sm font-medium text-gray-900 mb-3'>
                          Select Amount
                        </label>
                        <div className='grid grid-cols-3 gap-2'>
                          {presetAmounts.map(preset => (
                            <button
                              key={preset}
                              type='button'
                              onClick={() => handleAmountSelect(preset)}
                              className={`py-3 px-4 rounded-lg border-2 font-medium transition-all button-pink ${
                                amount === preset
                                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                                  : 'border-gray-300 hover:border-pink-300 text-gray-700'
                              }`}
                            >
                              ${preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Amount */}
                      <div>
                        <label className='block text-sm font-medium text-gray-900 mb-2'>
                          Or Enter Custom Amount
                        </label>
                        <div className='relative'>
                          <span className='absolute left-3 top-3 text-gray-500 text-lg'>
                            $
                          </span>
                          <input
                            type='text'
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            placeholder='0'
                            className='w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg'
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className='block text-sm font-medium text-gray-900 mb-2'>
                          Email Address
                        </label>
                        <input
                          type='email'
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                          placeholder='your@email.com'
                        />
                      </div>

                      {/* Name */}
                      <div>
                        <label className='block text-sm font-medium text-gray-900 mb-2'>
                          Name
                        </label>
                        <input
                          type='text'
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                          className='w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                          placeholder='John Doe'
                        />
                      </div>

                      {/* Continue Button */}
                      <button
                        onClick={handleContinue}
                        className='w-full button-pink text-white py-4 rounded-lg transition-colors font-medium text-lg hover:text-white'
                      >
                        Continue to Payment
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Show selected amount */}
                      <div className='bg-gray-50 p-4 rounded-lg'>
                        <div className='flex justify-between items-center mb-2'>
                          <span className='text-gray-700'>
                            Donation Amount:
                          </span>
                          <span className='text-2xl font-bold text-pink-600'>
                            ${customAmount || amount}
                          </span>
                        </div>
                        <div className='text-sm text-gray-600'>
                          Email: {email}
                        </div>
                        <button
                          onClick={() => setShowPaymentForm(false)}
                          className='text-sm text-pink-600 hover:text-pink-700 mt-2 button-pink text-white'
                        >
                          ← Change details
                        </button>
                      </div>

                      {/* Stripe Payment Form */}
                      {clientSecret && stripe && (
                        <Elements
                          stripe={stripe}
                          options={{
                            clientSecret,
                            appearance: {
                              theme: 'stripe',
                              variables: {
                                colorPrimary: '#ec4899',
                              },
                            },
                          }}
                        >
                          <StripeForm
                            amount={customAmount || amount}
                            email={email}
                            name={name}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                          />
                        </Elements>
                      )}
                    </>
                  )}

                  <p className='text-xs text-gray-600 text-center'>
                    Your donation goes directly to supporting our undocumented
                    neighbors. All transactions are secure and encrypted.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DonationPanel;
