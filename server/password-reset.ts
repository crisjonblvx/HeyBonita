import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import { db } from './db';
import { users, passwordResets } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
// Types will be available after schema update

// Generate a secure reset token
export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

// Create a password reset request
export async function createPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return { success: true, message: 'If an account with that email exists, you will receive a reset link.' };
    }

    // Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token
    await db.insert(passwordResets).values({
      userId: user.id,
      token,
      expiresAt,
      used: false
    });

    // In a real app, you would send an email here
    // For now, we'll log the token (remove in production)
    console.log(`Password reset token for ${email}: ${token}`);
    
    return { success: true, message: 'If an account with that email exists, you will receive a reset link.' };
  } catch (error) {
    console.error('Error creating password reset:', error);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
}

// Verify and use a reset token
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find valid, unused token
    const [resetRecord] = await db
      .select({
        id: passwordResets.id,
        userId: passwordResets.userId,
        used: passwordResets.used,
        expiresAt: passwordResets.expiresAt
      })
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.token, token),
          eq(passwordResets.used, false),
          gt(passwordResets.expiresAt, new Date())
        )
      );

    if (!resetRecord) {
      return { success: false, message: 'Invalid or expired reset token.' };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, resetRecord.userId));

    // Mark token as used
    await db
      .update(passwordResets)
      .set({ used: true })
      .where(eq(passwordResets.id, resetRecord.id));

    return { success: true, message: 'Password has been reset successfully.' };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
}

// Clean up expired tokens (run periodically)
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    await db
      .delete(passwordResets)
      .where(gt(new Date(), passwordResets.expiresAt));
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}