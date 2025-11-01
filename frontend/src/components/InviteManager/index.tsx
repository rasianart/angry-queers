import React, { useState, useEffect } from 'react';

interface Invite {
  id: number;
  code: string;
  created_at: string;
  used_at: string | null;
  is_used: boolean;
  used_by_email: string | null;
  used_by_name: string | null;
}

export const InviteManager: React.FC = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchInvites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/invites/my-invites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invites');
      }

      const data = await response.json();
      setInvites(data.invites);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleCreateInvite = async () => {
    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/invites/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create invite');
      }

      const data = await response.json();

      // Copy invite link to clipboard
      await navigator.clipboard.writeText(data.invite_link);
      setCopiedCode(data.invite.code);
      setTimeout(() => setCopiedCode(null), 3000);

      // Refresh invites list
      fetchInvites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const copyInviteLink = async (code: string) => {
    const frontendUrl = window.location.origin;
    const inviteLink = `${frontendUrl}/?invite=${code}`;
    await navigator.clipboard.writeText(inviteLink);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className='p-4 text-center'>
        <div className='text-gray-600'>Loading invites...</div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-md p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-800'>Invite Links</h2>
        <button
          onClick={handleCreateInvite}
          disabled={creating}
          className='button-pink text-white px-4 py-2 rounded-md disabled:opacity-50'
        >
          {creating ? 'Creating...' : '+ Create Invite Link'}
        </button>
      </div>

      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          {error}
        </div>
      )}

      {copiedCode && (
        <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4'>
          Invite link copied to clipboard!
        </div>
      )}

      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Invite Code
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Created
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Used By
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {invites.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-6 py-4 text-center text-gray-500'>
                  No invites created yet. Click "Create Invite Link" to get
                  started.
                </td>
              </tr>
            ) : (
              invites.map(invite => (
                <tr key={invite.id}>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <code className='text-sm font-mono bg-gray-100 px-2 py-1 rounded'>
                      {invite.code.substring(0, 12)}...
                    </code>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {new Date(invite.created_at).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {invite.is_used ? (
                      <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800'>
                        Used
                      </span>
                    ) : (
                      <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'>
                        Available
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {invite.is_used
                      ? invite.used_by_name || invite.used_by_email || 'Unknown'
                      : '—'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm'>
                    {!invite.is_used && (
                      <button
                        onClick={() => copyInviteLink(invite.code)}
                        className='text-green-600 hover:text-green-900'
                      >
                        {copiedCode === invite.code ? '✓ Copied' : 'Copy Link'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md'>
        <h3 className='text-sm font-semibold text-blue-900 mb-2'>
          How Invite Links Work
        </h3>
        <ul className='text-xs text-blue-800 space-y-1'>
          <li>• Each invite link can only be used once</li>
          <li>
            • Share invite links with people you trust to join the platform
          </li>
          <li>
            • Links are automatically marked as "Used" when someone creates an
            account
          </li>
          <li>• Create as many invite links as you need</li>
        </ul>
      </div>
    </div>
  );
};
