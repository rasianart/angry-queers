import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { InviteManager } from '../../components/InviteManager';
import { Link } from 'react-router-dom';

export const Invites: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-gray-600 text-lg'>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold text-gray-800 mb-4'>
            Authentication Required
          </h1>
          <p className='text-gray-600 mb-6'>
            You must be logged in to manage invite links.
          </p>
          <Link to='/' className='button-pink text-white px-6 py-3 rounded-md'>
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-8'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-800 mb-2'>
            Invite Friends
          </h1>
          <p className='text-gray-600'>
            Share invite links with people you trust to join our community. Each
            link can only be used once.
          </p>
        </div>

        <InviteManager />
      </div>
    </div>
  );
};
