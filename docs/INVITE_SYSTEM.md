# Invite-Only Registration System

## Overview

This application uses an invite-only registration system to protect the community. New users can only create accounts if they have a valid, unused invite code.

## How It Works

### For Existing Users

1. **Generate Invite Links**:

   - Log in to your account
   - Click your profile menu (top right)
   - Select "📨 Invite Friends"
   - Click "+ Create Invite Link"
   - The link is automatically copied to your clipboard

2. **Share Invites**:

   - Send the copied link to someone you trust
   - Each invite link can only be used once
   - Track which invites have been used on the Invites page

3. **View Invite Status**:
   - See all your created invites
   - Check which ones have been used
   - See who used each invite

### For New Users

1. **Receive Invite Link**:

   - Get an invite link from an existing member
   - The link will look like: `https://example.com/?invite=abc123...`

2. **Create Account**:

   - Click the invite link
   - The registration form will auto-populate with your invite code
   - Choose to sign up with:
     - **Email/Password**: Fill in email, username, password, and invite code
     - **Google**: Click "Continue with Google" (invite code is passed automatically)

3. **Account Created**:
   - Your account is created once registration is complete
   - The invite link is marked as "Used" and can't be used again
   - You can now generate your own invite links to invite others

## Technical Details

### Database Schema

**invite_links table**:

- `id`: Serial primary key
- `code`: Unique invite code (32-character hex string)
- `created_by`: User ID who created the invite
- `created_at`: Timestamp when created
- `used_at`: Timestamp when used (null if unused)
- `used_by`: User ID who used the invite
- `is_used`: Boolean flag

### API Endpoints

**Public**:

- `GET /api/invites/validate/:code` - Validate if an invite code is valid

**Authenticated**:

- `POST /api/invites/create` - Create a new invite link
- `GET /api/invites/my-invites` - Get all invites created by the current user

**Registration**:

- `POST /api/auth/register` - Requires `invite_code` field
- `GET /api/auth/google?invite=<code>` - Google OAuth with invite code
- `GET /api/auth/google/callback` - Validates invite before creating user

### Admin Exception

The superadmin can register without an invite code and is automatically assigned admin privileges.

## User Experience

### Registration Modal

When a user visits with an invite code in the URL:

1. Login modal automatically switches to "Sign Up" mode
2. Invite code field is pre-populated
3. Clear messaging about invite requirement
4. Helpful notice about where to get invites

### Error Handling

- `invite_required`: Shown when Google OAuth attempted without invite
- `invalid_invite`: Invite code doesn't exist or already used
- Form validation: Client-side check for invite code presence

## Security Considerations

1. **One-Time Use**: Each invite link can only be used once
2. **Tracking**: All invites are tracked to the creating user
3. **Transparency**: Users can see who used their invites
4. **Community Trust**: Only trusted members can invite new users

## Future Enhancements

Potential improvements:

- Invite expiration dates (auto-expire after X days)
- Invite quotas (limit invites per user)
- Admin view of all system invites
- Revoke unused invites
- Invite analytics and metrics
