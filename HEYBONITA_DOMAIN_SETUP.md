# HeyBonita.ai Domain Setup Guide

## Overview
This guide will help you connect your custom domain HeyBonita.ai to your Replit deployment, replacing the default hey-bonita.replit.app URL.

## Prerequisites
- Your Replit project is deployed and working at hey-bonita.replit.app
- You have access to your domain registrar's DNS settings for HeyBonita.ai
- Your Replit account has deployment permissions

## Step 1: Configure Domain in Replit Deployments

1. **Access Deployment Settings**
   - Go to your Replit project
   - Click the "Deploy" button in the top navigation
   - Select "Deployments" from the dropdown

2. **Add Custom Domain**
   - In the deployment dashboard, look for "Custom Domains" section
   - Click "Add Domain" or "Custom Domain"
   - Enter: `heybonita.ai`
   - Click "Add Domain"

3. **Get DNS Configuration Values**
   - Replit will provide you with DNS records to configure
   - Note down the CNAME or A record values provided

## Step 2: Configure DNS Records

### Option A: If using CNAME (Recommended)
Add the following DNS record at your domain registrar:

```
Type: CNAME
Name: @ (or root/apex)
Value: [Replit-provided-value].replit.app
TTL: 300 (or default)
```

### Option B: If using A Records
Add these DNS records at your domain registrar:

```
Type: A
Name: @ (or root/apex)  
Value: [IP-address-provided-by-Replit]
TTL: 300 (or default)

Type: A
Name: www
Value: [IP-address-provided-by-Replit]
TTL: 300 (or default)
```

## Step 3: Configure Google OAuth for Custom Domain

Since your app uses Google OAuth, you need to update the authorized domains:

1. **Google Cloud Console**
   - Go to https://console.cloud.google.com
   - Select your project (the one with Client ID: 452337819985...)
   - Navigate to "APIs & Services" > "Credentials"

2. **Update OAuth 2.0 Client**
   - Click on your OAuth 2.0 Client ID
   - In "Authorized JavaScript origins", add:
     - `https://heybonita.ai`
   - In "Authorized redirect URIs", add:
     - `https://heybonita.ai/auth/google/callback`
   - Click "Save"

## Step 4: Update Application Configuration

The app is already configured to automatically detect the domain. The OAuth callback URLs in `server/routes.ts` use dynamic host detection:

```javascript
// This will automatically work with heybonita.ai
callbackURL: `https://${req.hostname}/auth/google/callback`
```

## Step 5: SSL Certificate

Replit automatically handles SSL certificates for custom domains, so https://heybonita.ai will be secured automatically.

## Step 6: Verification

1. **DNS Propagation Check**
   - Use tools like https://dnschecker.org to verify DNS propagation
   - Enter `heybonita.ai` and check that it resolves to Replit's servers

2. **Test the Domain**
   - Visit https://heybonita.ai
   - Verify the landing page loads correctly
   - Test Google OAuth login functionality
   - Confirm all app features work properly

## Troubleshooting

### Common Issues

1. **DNS Not Propagating**
   - DNS changes can take up to 48 hours to propagate globally
   - Check with multiple DNS checker tools
   - Contact your domain registrar if issues persist

2. **OAuth Not Working**
   - Ensure you updated Google Cloud Console with the new domain
   - Clear browser cache and cookies
   - Check that redirect URIs exactly match

3. **SSL Certificate Issues**
   - Replit handles SSL automatically, but it may take time after DNS propagation
   - If issues persist, contact Replit support

4. **502/503 Errors**
   - Ensure your Replit deployment is running and healthy
   - Check deployment logs for any issues

## Current Status

- ✅ Landing page restored and functional at root path (`/`)
- ✅ App accessible at `/app` route  
- ✅ Google OAuth configured for production domains
- ✅ All buttons redirect to local `/app` route (ready for custom domain)
- ⏳ Waiting for HeyBonita.ai domain configuration

## Next Steps

1. Configure DNS records at your domain registrar
2. Add custom domain in Replit Deployments
3. Update Google OAuth settings
4. Test the complete flow at https://heybonita.ai

## Notes

- The app automatically detects the hostname, so no code changes are needed
- All authentication and features will work seamlessly with the custom domain
- The landing page serves as an effective showcase before users access the full app

---

**Support**: If you encounter issues, contact Replit support or check their documentation at https://docs.replit.com/deployments/custom-domains