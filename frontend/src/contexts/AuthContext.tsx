import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';

interface User {
  id: number;
  email: string;
  username?: string;
  display_name?: string;
  auth_provider: 'email' | 'google';
  user_type?: string;
  is_super_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
    inviteCode: string
  ) => Promise<void>;
  loginWithGoogle: (inviteCode?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token on mount
    const token = localStorage.getItem('token');

    // Check URL for token (from Google OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');

    if (urlToken) {
      localStorage.setItem('token', urlToken);

      // Clean up URL first - remove all query params (token, invite, error)
      window.history.replaceState({}, document.title, window.location.pathname);

      // Fetch user with the new token from URL
      fetchUser(urlToken).then(() => {
        // After user is fetched, check if there's a redirect path stored
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          localStorage.removeItem('redirectAfterLogin');
          // Redirect to the stored path
          window.location.href = redirectPath;
        }
      });
    } else if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Fallback: if backend didn't provide is_super_admin, infer from FE env
        const feList =
          (import.meta as any).env?.VITE_SUPERADMIN ||
          (import.meta as any).env?.VITE_SUPERADMINS ||
          '';
        const feSupers = String(feList)
          .split(',')
          .map((s: string) => s.trim().toLowerCase())
          .filter((s: string) => s.length > 0);
        const inferred = feSupers.includes(
          (data.user?.email || '').toLowerCase()
        );
        const mergedUser = {
          ...data.user,
          is_super_admin: data.user?.is_super_admin ?? inferred,
        };
        setUser(mergedUser);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to login');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const register = async (
    email: string,
    username: string,
    password: string,
    inviteCode: string
  ) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        username,
        password,
        invite_code: inviteCode,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to register');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const loginWithGoogle = (inviteCode?: string) => {
    // Store the current full path (including query params) for redirect after login
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/' && !currentPath.includes('token=')) {
      localStorage.setItem('redirectAfterLogin', currentPath);
    }

    const url = inviteCode
      ? `/api/auth/google?invite=${inviteCode}`
      : '/api/auth/google';
    window.location.href = url;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Memoize the context value to ensure it creates a new reference when user changes
  const contextValue = useMemo(
    () => ({ user, loading, login, register, loginWithGoogle, logout }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
