# HeyBonita.ai Domain Setup Guide

## 🌐 Connecting Your Custom Domain

Your Bonita AI application is now configured to work with `heybonita.ai`. Follow these steps to complete the domain setup:

### 1. Replit Domain Configuration

**In your Replit deployment settings:**
1. Go to your Replit project
2. Click "Deploy" button
3. In deployment settings, add custom domain: `heybonita.ai`
4. Replit will provide DNS records to configure

### 2. DNS Configuration

**Configure these DNS records with your domain provider:**
```
Type: CNAME
Name: @ (or heybonita.ai)
Value: [Replit will provide this]

Type: CNAME  
Name: www
Value: [Replit will provide this]
```

### 3. Google OAuth Update

**Update Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   - `https://heybonita.ai/auth/google/callback`
   - `https://www.heybonita.ai/auth/google/callback`
5. Save changes

### 4. SSL Certificate

Replit automatically provides SSL certificates for custom domains. Once DNS propagates:
- Your site will be accessible at `https://heybonita.ai`
- SSL will be automatically configured
- HTTP traffic will redirect to HTTPS

### 5. Environment Variables

The application automatically detects production environment and uses:
- Production callback URL: `https://heybonita.ai/auth/google/callback`
- Development callback URL: Current Replit URL (for testing)

### 6. Testing Checklist

After domain setup, verify:
- [ ] Site loads at `https://heybonita.ai`
- [ ] Google OAuth login works
- [ ] User registration functions
- [ ] All AI features operational
- [ ] Mobile responsiveness
- [ ] Admin dashboard accessible

### 7. DNS Propagation

**Timeline:** DNS changes can take 24-48 hours to fully propagate
**Check status:** Use tools like `dig heybonita.ai` or online DNS checkers

### 8. Launch Verification

Once domain is live:
1. Test complete user journey
2. Verify Google OAuth flow
3. Check all core features
4. Monitor admin dashboard
5. Test on mobile devices

## 🎉 Ready for Launch!

Your application is configured to work seamlessly with HeyBonita.ai domain. The OAuth callbacks and all internal links will automatically use your custom domain in production.

## Support

If you encounter issues:
- Check DNS propagation status
- Verify Google OAuth callback URLs
- Test with incognito/private browsing
- Contact Replit support for deployment issues