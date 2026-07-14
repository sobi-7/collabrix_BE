const nodemailer = require('nodemailer');

// Create transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

// Send invitation email
const sendInvitationEmail = async (email, teamName, invitationLink, invitedByName, memberPassword) => {
  try {
    console.log('📧 Sending email to:', email);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `${invitedByName} invited you to join "${teamName}" team in Task Manager`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
              .credentials { background: #f0f0f0; border: 2px solid #667eea; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; }
              .credentials p { margin: 8px 0; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 10px 0; color: #856404; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 You're Invited!</h1>
              </div>
              <div class="content">
                <p>Hi,</p>
                <p><strong>${invitedByName}</strong> has invited you to join the <strong>"${teamName}"</strong> team in <strong>Task Manager</strong>.</p>
                
                <p>Task Manager is a collaborative task management tool that helps teams organize and complete projects together.</p>
                
                <h3>Your Login Credentials:</h3>
                <div class="credentials">
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Password:</strong> ${memberPassword}</p>
                </div>
                
                <div class="warning">
                  ⚠️ <strong>Important:</strong> Please change your password after your first login for security.
                </div>
                
                <p style="text-align: center; margin-top: 30px;">
                  <a href="${invitationLink}" class="button">Click Here to Login & Join Team</a>
                </p>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  <strong>Can't click the button?</strong> Copy and paste this link in your browser:
                </p>
                <p style="background: #f5f5f5; padding: 10px; border: 1px solid #ddd; border-radius: 5px; word-break: break-all; font-size: 12px;">
                  ${invitationLink}
                </p>
                
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                  This invitation will expire in 7 days.
                </p>
              </div>
              <div class="footer">
                <p>&copy; 2026 Task Manager. All rights reserved.</p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    console.error('Full error:', error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetLink, userName) => {
  try {
    console.log('📧 Sending password reset email to:', email);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Task Manager - Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 10px 0; color: #856404; font-size: 12px; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hi ${userName},</p>
                <p>We received a request to reset your password. Click the button below to create a new password.</p>
                
                <p style="text-align: center;">
                  <a href="${resetLink}" class="button">Reset Your Password</a>
                </p>
                
                <div class="warning">
                  ⏰ This link will expire in 1 hour.
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  <strong>Can't click the button?</strong> Copy and paste this link:
                </p>
                <p style="background: #f5f5f5; padding: 10px; border: 1px solid #ddd; border-radius: 5px; word-break: break-all; font-size: 12px;">
                  ${resetLink}
                </p>
                
                <div class="warning" style="margin-top: 20px;">
                  ⚠️ If you didn't request this, ignore this email. Your password won't change.
                </div>
              </div>
              <div class="footer">
                <p>&copy; 2026 Task Manager. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Password reset email error:', error.message);
    return false;
  }
};

module.exports = { sendInvitationEmail, sendPasswordResetEmail };

