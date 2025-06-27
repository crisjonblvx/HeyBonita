# Deployment OAuth Fix Guide

## Issue
The deployed app shows "redirect_uri_mismatch" error because the Google OAuth settings need the new deployment URL.

## Quick Fix Steps

### 1. Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services > Credentials**
3. Click on your OAuth 2.0 Client ID
4. In **Authorized redirect URIs**, add this exact URL:
   ```
   https://144ee532-ec99-4997-9ea5-5404cbf92117-00-1uqlcgy3yn9y6.worf.replit.dev/auth/google/callback
   ```
5. **Save** the changes
6. Wait 5-10 minutes for changes to propagate

### 2. Test the Fix
1. Clear browser cookies/cache for the deployed site
2. Try Google login again
3. Should redirect properly to home screen after authentication

## Current Status
- App is deployed and running
- Authentication flow is configured
- Only needs Google OAuth redirect URI update

## Post-Fix Verification
- [ ] Google login works without redirect errors
- [ ] Users land on home screen after authentication
- [ ] All AI features accessible
- [ ] User data properly isolated

The application code is correctly configured - this is purely a Google OAuth console configuration issue.