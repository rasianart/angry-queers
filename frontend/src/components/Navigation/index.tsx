import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoginModal } from '../LoginModal';
import { UserMenu } from '../UserMenu';
import angryQueersLogo from '../../assets/angryqueers.svg';

const Navigation: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, loading } = useAuth();

  // Auto-open login modal if invite code is in URL or if on a page requiring auth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');
    const marker = urlParams.get('marker');

    if (inviteCode && !user) {
      setShowLoginModal(true);
    }

    // If there's a marker parameter and user isn't logged in, prompt for login
    if (marker && !loading && !user) {
      // Store the full path for redirect after login
      const fullPath = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', fullPath);
      setShowLoginModal(true);
    }
  }, [user, loading]);

  const allNavItems = [
    {
      path: '/',
      label: 'Angry Queers',
      icon: '🏠',
      requiresAuth: false,
      adminOnly: false,
      superAdminOnly: false,
    },
    {
      path: '/canvas',
      label: 'Canvas',
      icon: '📍',
      requiresAuth: true,
      adminOnly: false,
      superAdminOnly: false,
    },
    {
      path: '/events',
      label: 'Events',
      icon: '📅',
      requiresAuth: false,
      adminOnly: false,
      superAdminOnly: false,
    },
    // {
    //   path: '/about',
    //   label: 'About',
    //   icon: 'ℹ️',
    //   requiresAuth: false,
    //   adminOnly: false,
    //   superAdminOnly: false,
    // },
    {
      path: '/users',
      label: 'Users',
      icon: '👥',
      requiresAuth: true,
      adminOnly: false,
      superAdminOnly: true,
    },
  ];

  // Filter nav items based on authentication status and admin access
  const navItems = allNavItems.filter(item => {
    // Skip items that require auth if user is not logged in
    if (item.requiresAuth && !user) return false;
    // Skip admin-only items if user is not admin
    if (item.adminOnly && user?.user_type !== 'admin') return false;
    // Skip super admin only items if user is not super admin
    if (item.superAdminOnly && !user?.is_super_admin) return false;
    return true;
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className='sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm'>
      <div className='max-w-6xl mx-auto px-6'>
        <div className='flex justify-between items-center h-16'>
          {/* Desktop Navigation Links */}
          <div className='hidden md:flex space-x-4'>
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-gray-800 nav-button-active'
                      : 'text-black hover:text-gray-900 nav-button'
                  } ${item.path === '/' ? '-ml-3' : ''}`}
                >
                  {item.path === '/' ? (
                    <img
                      src={angryQueersLogo}
                      alt='Angry Queers'
                      className='h-8'
                    />
                  ) : (
                    <span>{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className='hidden md:flex items-center space-x-4'>
            {!loading && (
              <>
                {user ? (
                  <UserMenu />
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className='px-4 py-2 button-pink text-white rounded-md transition-colors'
                  >
                    Log In
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mobile Logo/Brand */}
          <Link to='/' className='md:hidden flex items-center'>
            <img src={angryQueersLogo} alt='Angry Queers' className='h-8' />
          </Link>

          {/* Mobile menu button */}
          <div className='md:hidden flex items-center'>
            {!loading && !user && (
              <button
                onClick={() => setShowLoginModal(true)}
                className='px-3 py-1.5 text-sm button-pink text-white rounded-md mr-2'
              >
                Log In
              </button>
            )}
            <button
              onClick={toggleMobileMenu}
              className='inline-flex items-center justify-center p-2 rounded-md button-pink text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500'
              aria-expanded='false'
            >
              <span className='sr-only'>Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200'>
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-gray-800 bg-gray-100 nav-button-active'
                      : 'text-black hover:text-gray-900 hover:bg-gray-50 nav-button'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </nav>
  );
};

export default Navigation;
