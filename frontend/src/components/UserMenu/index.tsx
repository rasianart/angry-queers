import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <div className='relative'>
      {user ? (
        <div className='relative'>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className='flex items-center space-x-2 text-gray-700 hover:text-white button-green text-white'
          >
            <div className='w-8 h-8 button-green rounded-full flex items-center justify-center text-white font-semibold'>
              {user.display_name?.[0] || user.email[0].toUpperCase()}
            </div>
            <span className='hidden md:block'>
              {user.display_name || user.email}
            </span>
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>

          {showMenu && (
            <>
              <div
                className='fixed inset-0 z-10'
                onClick={() => setShowMenu(false)}
              />
              <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20'>
                <div className='px-4 py-2 text-sm text-gray-700 border-b'>
                  <div className='font-medium'>
                    {user.display_name || user.email}
                  </div>
                  <div className='text-xs text-gray-500'>{user.email}</div>
                </div>
                <Link
                  to='/invites'
                  onClick={() => setShowMenu(false)}
                  className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  📨 Invite Friends
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setShowMenu(false);
                    navigate('/');
                  }}
                  className='block w-full text-left px-4 py-2 text-sm button-green text-white rounded-none'
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};
