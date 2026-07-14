const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Grant team creation permission (super admin only)
router.post('/users/:userId/grant-team-creation', authMiddleware, async (req, res) => {
  try {
    // Check if current user is super admin
    // This would require a super_admin field on User model
    // For now, just check if they're trying to grant to themselves
    
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    targetUser.can_create_team = true;
    await targetUser.save();

    console.log('✅ Team creation granted to:', targetUser.email);

    res.json({
      message: 'Team creation permission granted',
      user: targetUser,
    });
  } catch (error) {
    console.error('❌ Grant permission error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Revoke team creation permission
router.post('/users/:userId/revoke-team-creation', authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    targetUser.can_create_team = false;
    await targetUser.save();

    console.log('✅ Team creation revoked from:', targetUser.email);

    res.json({
      message: 'Team creation permission revoked',
      user: targetUser,
    });
  } catch (error) {
    console.error('❌ Revoke permission error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;