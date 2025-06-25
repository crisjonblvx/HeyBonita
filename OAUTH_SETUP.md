# OAuth Setup Guide

## Google OAuth Setup

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"

### 2. OAuth Consent Screen
1. Go to "OAuth consent screen"
2. Select "External" user type
3. Fill in required information:
   - App name: "Bonita AI"
   - User support email: Your email
   - Developer contact information: Your email

### 3. Scopes Configuration
Add these scopes:
- `openid`
- `email`
- `profile`

### 4. Create OAuth 2.0 Client ID
1. Application type: "Web application"
2. Name: "Bonita AI Web Client"
3. Authorized redirect URIs:
   ```
   https://your-replit-url.replit.app/auth/google/callback
   ```

### 5. Get Credentials
After creation, you'll receive:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Add these to your Replit secrets.

## Apple OAuth Setup

### 1. Apple Developer Account
1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Sign in with your Apple ID
3. Navigate to "Certificates, Identifiers & Profiles"

### 2. Create App ID
1. Go to "Identifiers" > "App IDs"
2. Click "+" to create new App ID
3. Select "App" and continue
4. Fill in:
   - Description: "Bonita AI"
   - Bundle ID: `com.yourcompany.bonita`
5. Enable "Sign In with Apple" capability

### 3. Create Service ID
1. Go to "Identifiers" > "Services IDs"
2. Click "+" to create new Service ID
3. Fill in:
   - Description: "Bonita AI Web"
   - Identifier: `com.yourcompany.bonita.web`
4. Enable "Sign In with Apple"
5. Configure domains and return URLs:
   ```
   Domain: your-replit-url.replit.app
   Return URL: https://your-replit-url.replit.app/auth/apple/callback
   ```

### 4. Create Private Key
1. Go to "Keys"
2. Click "+" to create new key
3. Fill in:
   - Key Name: "Bonita AI Sign In Key"
   - Enable "Sign In with Apple"
4. Download the private key file (.p8)

### 5. Get Required Information
You'll need these values:
- `APPLE_CLIENT_ID`: Your Service ID
- `APPLE_TEAM_ID`: Your Team ID (found in membership details)
- `APPLE_KEY_ID`: The Key ID from the private key
- `APPLE_PRIVATE_KEY`: Contents of the .p8 file

Add these to your Replit secrets.

## Testing OAuth Integration

Once credentials are added:
1. Restart your Replit
2. Go to the login page
3. Click "Google" or "Apple" buttons
4. Complete OAuth flow
5. You should be redirected back to the app, logged in

## Notes

- OAuth buttons are already integrated into the login/signup forms
- Database schema includes OAuth fields (google_id, apple_id, provider)
- Authentication routes are configured at `/auth/google` and `/auth/apple`
- Users can link OAuth accounts to existing local accounts if emails match