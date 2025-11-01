import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: number;
  email: string;
  username: string;
  display_name: string;
  auth_provider: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError('Unauthorized. Admin access only.');
        } else {
          setError('Failed to fetch users');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUsers(data.users);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      setLoading(false);
    }
  };

  const handleUpdateUserType = async (userId: number, newType: string) => {
    setUpdating(userId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found');
        setUpdating(null);
        return;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_type: newType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update user type');
        setUpdating(null);
        return;
      }

      // Refresh users list
      await fetchUsers();
      setUpdating(null);
    } catch (err) {
      console.error('Error updating user type:', err);
      alert('Failed to update user type');
      setUpdating(null);
    }
  };

  // Check if current user is admin
  if (!currentUser || !currentUser.is_super_admin) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-2xl mx-auto'>
          <div className='bg-white rounded-lg shadow-md p-8 text-center'>
            <h2 className='text-2xl font-semibold text-gray-800 mb-4'>
              Unauthorized Access
            </h2>
            <p className='text-gray-600 mb-6'>
              This page is restricted to admin users only.
            </p>
            <Link
              to='/'
              className='inline-block button-pink text-white px-6 py-3 rounded-md transition-colors font-medium'
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='bg-white rounded-lg shadow-md p-8 text-center'>
            <h3 className='text-lg text-gray-700'>Loading users...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='bg-white rounded-lg shadow-md p-8 text-center'>
            <h3 className='text-lg text-red-600 mb-4'>{error}</h3>
            <Link
              to='/'
              className='inline-block button-pink text-white px-6 py-3 rounded-md transition-colors font-medium'
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-6xl mx-auto px-6'>
        <div className='bg-white rounded-lg shadow-md p-8'>
          <h1 className='text-3xl font-thin text-gray-900 mb-6'>
            User Management
          </h1>
          <p className='text-gray-600 mb-8'>
            Manage user accounts and permissions. Only accessible to the super
            administrator.
          </p>

          {/* Users Table */}
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    User
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Email
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Auth Provider
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    User Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Created
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div>
                          <div className='text-sm font-medium text-gray-900'>
                            {user.display_name || user.username || 'N/A'}
                          </div>
                          <div className='text-sm text-gray-500'>
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{user.email}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.auth_provider === 'google'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.auth_provider}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.user_type === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.user_type === 'admin' ? 'Admin' : 'Basic'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      {user.user_type === 'admin' &&
                      user.email === currentUser.email ? (
                        <span className='text-gray-400'>
                          Cannot modify admin
                        </span>
                      ) : (
                        <select
                          value={user.user_type || 'basic'}
                          onChange={e =>
                            handleUpdateUserType(user.id, e.target.value)
                          }
                          disabled={updating === user.id}
                          className='text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500'
                        >
                          <option value='basic'>Basic</option>
                          <option value='admin'>Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className='text-center py-12'>
              <p className='text-gray-500'>No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
