# Google OAuth Configuration Fix

## Issue
The current Google OAuth setup has an outdated callback URL, causing users to share the same test account instead of having individual isolated accounts.

## Solution
Update Google Cloud Console with the correct callback URL for the current deployment.

## Steps to Fix Google OAuth

### 1. Access Google Cloud Console
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Select your project (or create one if needed)

### 2. Configure OAuth Consent Screen
- Navigate to APIs & Services → OAuth consent screen
- Ensure the app is set to "External" for public access
- Add these domains to "Authorized domains":
  - `replit.app`
  - `heybonita.ai` (for future custom domain)

### 3. Update Credentials
- Go to APIs & Services → Credentials
- Find your OAuth 2.0 Client ID
- Click Edit (pencil icon)

### 4. Update Authorized Redirect URIs
Replace any existing redirect URIs with these current ones:
```
https://hey-bonita.replit.app/auth/google/callback
https://heybonita.ai/auth/google/callback
```

### 5. Save Changes
- Click "Save" in Google Cloud Console
- Changes may take a few minutes to propagate

## Current Configuration
- Client ID: `452337819985-h6a0qlgsktrmm71e4vgqpfd8ttc75bif.apps.googleusercontent.com`
- Callback URL: `https://hey-bonita.replit.app/auth/google/callback`
- Production URL: `https://heybonita.ai/auth/google/callback` (future)

## Testing
After updating the Google Cloud Console:
1. Try Google OAuth login on the auth page
2. Each user should get their own isolated account
3. Conversations and data should be separate per user

## Why This Fixes the Shared Account Issue
- The old Quick Access created a single test user for everyone
- Google OAuth creates individual accounts based on Google profiles
- Each user gets their own database records and isolated data
- No more shared conversations or mixed user data

## Verification
Once Google OAuth works:
- Remove or disable the Quick Access button
- All users will have proper individual accounts
- Data isolation will be maintained automatically