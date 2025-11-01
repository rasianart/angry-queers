import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from '../Navigation';
import { useAuth } from '../../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user } = useAuth();

  // Create a unique key that changes when user logs in/out or user_type changes
  const navKey = user
    ? `user-${user.id}-${user.user_type || 'basic'}`
    : 'logged-out';

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navigation key={navKey} />
      <main className='flex-1'>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
