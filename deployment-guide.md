# Hey Bonita Deployment Guide

## Admin Dashboard Setup

### Option 1: Subdomain Setup (admin.heybonita.ai)

1. **DNS Configuration:**
   - Create a CNAME record for `admin.heybonita.ai` pointing to your main domain
   - Or create an A record pointing to your server IP

2. **Environment Variables:**
   ```
   ADMIN_PASSWORD=your_secure_password_here
   DOMAIN=heybonita.ai
   ```

3. **Access:**
   - Admin dashboard: `https://admin.heybonita.ai`
   - Main app: `https://heybonita.ai`

### Option 2: Path-based Admin (Current Setup)

1. **Access:**
   - Admin dashboard: `https://heybonita.ai/admin`
   - Main app: `https://heybonita.ai`

2. **Authentication:**
   - Default password: `bonita2025`
   - Set custom password via `ADMIN_PASSWORD` environment variable

## Security Recommendations

1. **Change Default Password:**
   ```bash
   export ADMIN_PASSWORD="your_secure_password_here"
   ```

2. **IP Whitelist (Optional):**
   - Restrict admin access to specific IP addresses
   - Configure in your hosting provider's firewall

3. **HTTPS Only:**
   - Ensure SSL certificate is properly configured
   - Admin dashboard should only be accessed via HTTPS

## Soft Launch Checklist

- [ ] Set secure admin password
- [ ] Test admin dashboard functionality
- [ ] Verify analytics are tracking correctly
- [ ] Confirm email notifications work (cj@heybonita.ai)
- [ ] Test user registration and gamification
- [ ] Monitor error logs during initial rollout

## Analytics Features

- **User Metrics:** Total users, daily active users
- **Feature Usage:** Chat messages, images generated, scripts created
- **Support System:** Ticket management with priority levels
- **Real-time Monitoring:** Auto-refresh every 30 seconds

## Support Integration

- **Email:** All tickets route to cj@heybonita.ai
- **Priority Levels:** Low, Medium, High, Urgent
- **Status Tracking:** Open, In Progress, Resolved, Closed