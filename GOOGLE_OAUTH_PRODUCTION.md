# Google OAuth Production Setup

## Current Issue
The "accounts.google.com refused to connect" error occurs because the OAuth app is in Testing mode.

## Solution: Publish OAuth App to Production

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Select your project with the OAuth credentials

### 2. Navigate to OAuth Consent Screen
- In the left sidebar, click on "OAuth consent screen" (not Overview)
- You should see your app configuration with a "Publishing status" section

### 3. Publish App to Production
- Look for the "Publishing status" section
- If the app shows "Testing", click "PUBLISH APP" button
- If you don't see a publish button, click "EDIT APP" first
- Scroll down to "Publishing status" and click "PUBLISH APP"
- Confirm that you want to make the app available to all users
- Status should change from "Testing" to "In production"

### 4. Verify Settings
- User Type: External
- Publishing Status: **In production** (not Testing)
- App name: "Bonita AI"
- Scopes: userinfo.email, userinfo.profile

### 5. Current Configuration
- Client ID: `452337819985-h6a0qlgsktrmm71e4vgqpfd8ttc75bif.apps.googleusercontent.com`
- Redirect URI: `https://144ee532-ec99-4997-9ea5-5404cbf92117-00-1uqlcgy3yn9y6.worf.replit.dev/auth/google/callback`

### 6. No App Verification Needed
For basic profile and email scopes, Google doesn't require app verification when published to production.

## Result
Once published, any Google user can sign in without the "unverified app" warning or connection refusal.