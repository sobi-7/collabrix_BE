const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not (security)
      return res.json({
        message: 'If email exists, reset link will be sent',
      });
    }

    // Create reset token
    const token = crypto.randomBytes(32).toString('hex');

    // Save to database
    const passwordReset = new PasswordReset({
      email,
      token,
    });

    await passwordReset.save();

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    console.log('✅ Password reset token created for:', email);
    console.log('🔗 Reset link:', resetLink);

    // Send email
    const emailSent = await sendPasswordResetEmail(
      email,
      resetLink,
      user.name
    );

    if (!emailSent) {
      console.warn('⚠️ Email failed to send');
      return res.status(201).json({
        message: 'Password reset email failed to send',
        resetLink, // Return link as fallback
      });
    }

    res.json({
      message: 'Password reset link sent to your email',
      resetLink, // Return for testing
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Find reset token
    const passwordReset = await PasswordReset.findOne({ token });

    if (!passwordReset) {
      return res.status(404).json({ message: 'Invalid or expired reset token' });
    }

    if (passwordReset.status === 'used') {
      return res.status(400).json({ message: 'Reset token already used' });
    }

    // Find user
    const user = await User.findOne({ email: passwordReset.email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('✅ Password reset successful for:', user.email);

    // Mark token as used
    passwordReset.status = 'used';
    await passwordReset.save();

    res.json({
      message: 'Password reset successfully! You can now login with your new password.',
    });
  } catch (error) {
    console.error('❌ Reset password error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Verify reset token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const passwordReset = await PasswordReset.findOne({ token });

    if (!passwordReset || passwordReset.status === 'used') {
      return res.status(404).json({ message: 'Invalid or expired token' });
    }

    res.json({
      message: 'Token is valid',
      email: passwordReset.email,
    });
  } catch (error) {
    console.error('❌ Verify token error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;