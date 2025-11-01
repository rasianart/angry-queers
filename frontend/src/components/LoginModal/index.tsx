import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginModalProps {
  onClose: () => void;
  redirectAfterLogin?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  redirectAfterLogin,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();

  // Store redirect path when modal opens
  useEffect(() => {
    if (redirectAfterLogin) {
      localStorage.setItem('redirectAfterLogin', redirectAfterLogin);
    }
  }, [redirectAfterLogin]);

  // Check for invite code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invite = urlParams.get('invite');
    const errorParam = urlParams.get('error');

    if (invite) {
      setInviteCode(invite);
      setIsSignUp(true); // Auto-switch to sign up mode if invite present
    }

    if (errorParam === 'invite_required') {
      setError('An invite code is required to create an account');
    } else if (errorParam === 'invalid_invite') {
      setError('Invalid or already used invite code');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setError('Username is required');
          return;
        }
        if (!inviteCode.trim()) {
          setError('Invite code is required to create an account');
          return;
        }
        await register(email, username, password, inviteCode);

        // Remove invite code from URL after successful registration
        const url = new URL(window.location.href);
        url.searchParams.delete('invite');
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.toString());
      } else {
        await login(email, password);
      }

      // Check for redirect path
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectPath;
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      // Clear redirect path if user closes modal without logging in
      localStorage.removeItem('redirectAfterLogin');
      onClose();
    }
  };

  const handleClose = () => {
    // Clear redirect path if user closes modal without logging in
    localStorage.removeItem('redirectAfterLogin');
    onClose();
  };

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      onClick={handleBackdropClick}
    >
      <div className='bg-white rounded-lg shadow-xl w-full max-w-md p-6'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-2xl font-bold text-gray-800'>
            {isSignUp ? 'Sign Up' : 'Log In'}
          </h2>
          <button
            onClick={handleClose}
            className='text-gray-500 hover:text-gray-700 button-pink text-white'
          >
            ✕
          </button>
        </div>

        {error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Email
            </label>
            <input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500'
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Username
                </label>
                <input
                  type='text'
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Invite Code *
                </label>
                <input
                  type='text'
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder='Enter your invite code'
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500'
                />
                <p className='mt-1 text-xs text-gray-500'>
                  An invite code is required to create an account
                </p>
              </div>
            </>
          )}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Password
            </label>
            <input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full button-pink text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50'
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className='mt-4'>
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-300'></div>
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-white text-gray-500'>Or</span>
            </div>
          </div>

          <button
            onClick={() => loginWithGoogle(inviteCode)}
            className='mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
          >
            <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
              <path
                fill='#4285F4'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='#34A853'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='#FBBC05'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='#EA4335'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className='mt-4 text-center text-sm'>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className='button-pink text-white'
          >
            {isSignUp
              ? 'Already have an account? Log in'
              : "Don't have an account? Sign up"}
          </button>
        </div>

        {!inviteCode && isSignUp && (
          <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
            <p className='text-xs text-gray-700'>
              <strong>Need an invite code?</strong> To protect our community,
              account creation requires an invitation. Ask an existing member to
              generate an invite link for you, or contact the administrators if
              you're interested in joining.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
