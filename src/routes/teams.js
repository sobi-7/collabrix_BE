const express = require('express');
const Team = require('../models/Team');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const Task = require('../models/Task');


const router = express.Router();

// Create a team (ONLY for users with permission)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Team name required' });
    }

    // CHECK: User must have permission to create team
    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    if (!user || !user.can_create_team) {
      return res.status(403).json({ 
        message: 'You do not have permission to create teams. Only administrators can create teams.' 
      });
    }

    // Create team
    const team = new Team({
      name,
      creator_id: req.user._id,
      members: [
        {
          user_id: req.user._id,
          role: 'admin',  // Team creator is admin
        },
      ],
    });

    await team.save();

    console.log('✅ Team created:', name, 'by', user.email);

    res.status(201).json({
      message: 'Team created successfully',
      team,
    });
  } catch (error) {
    console.error('❌ Create team error:', error.message);
    res.status(500).json({ message: error.message });
  }
});
// Get single team with stats
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('creator_id', 'name email')
      .populate('members.user_id', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Calculate team stats from projects and tasks
    const Project = require('../models/Project');
    const Task = require('../models/Task');

    // Get all projects for this team
    const projects = await Project.find({ team_id: team._id });
    const projectIds = projects.map(p => p._id);

    // Get all tasks for these projects
    const tasks = await Task.find({ project_id: { $in: projectIds } });

    // Calculate stats
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'todo').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Add stats to response
    const teamData = team.toObject();
    teamData.stats = {
      total,
      completed,
      inProgress,
      pending,
      progress
    };

    console.log('✅ Team stats calculated:', teamData.stats);

    res.json(teamData);
  } catch (error) {
    console.error('❌ Get team error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get all teams for current user with stats
router.get('/', authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find({
      'members.user_id': req.user._id,
    }).populate('creator_id', 'name email');

    const Project = require('../models/Project');
    const Task = require('../models/Task');

    // Add stats to each team
    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const projects = await Project.find({ team_id: team._id });
        const projectIds = projects.map(p => p._id);
        const tasks = await Task.find({ project_id: { $in: projectIds } });

        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'done').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const pending = tasks.filter(t => t.status === 'todo').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        const teamData = team.toObject();
        teamData.stats = {
          total,
          completed,
          inProgress,
          pending,
          progress
        };

        return teamData;
      })
    );

    res.json(teamsWithStats);
  } catch (error) {
    console.error('❌ Get teams error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get single team
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)

      .populate('creator_id', 'name email')
      .populate('members.user_id', 'name email');


    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    console.error('❌ Get team error:', error.message);
    res.status(500).json({ message: error.message });
  }
});



// Invite member to team (send email invitation)
// router.post('/:id/members/invite', authMiddleware, async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: 'Email required' });
//     }

//     // Get the team
//     const team = await Team.findById(req.params.id);
//     if (!team) {
//       return res.status(404).json({ message: 'Team not found' });
//     }

//     // Check if current user is admin
//     const currentUserMember = team.members.find(
//       (member) => member.user_id.toString() === req.user._id.toString()
//     );

//     if (!currentUserMember || currentUserMember.role !== 'admin') {
//       return res.status(403).json({ message: 'Only admins can invite members' });
//     }

//     // Check if user already exists and is a member
//     const Invitation = require('../models/Invitation');
//     const User = require('../models/User');

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       const isMember = team.members.some(
//         (member) => member.user_id.toString() === existingUser._id.toString()
//       );

//       if (isMember) {
//         return res.status(400).json({ message: 'User is already a member' });
//       }

//       // Add existing user directly to team
//       team.members.push({
//         user_id: existingUser._id,
//         role: 'member',
//       });

//       await team.save();

//       console.log('✅ Existing user added to team:', email);

//       return res.json({
//         message: 'User added to team successfully',
//         team,
//       });
//     }

//     // Create invitation for new user
//     const crypto = require('crypto');
//     const token = crypto.randomBytes(32).toString('hex');

//     const invitation = new Invitation({
//       email,
//       team_id: team._id,
//       invited_by: req.user._id,
//       token,
//     });

//     await invitation.save();

//     // Create invitation link
//     const invitationLink = `${process.env.FRONTEND_URL}/signup?token=${token}`;

//     console.log('✅ Invitation created for:', email);
//     console.log('📧 Invitation link:', invitationLink);
//     // SEND EMAIL
//     const { sendInvitationEmail } = require('../services/emailService.js');
//     const emailSent = await sendInvitationEmail(
//       email,
//       team.name,
//       invitationLink,
//       req.user.name
//     );

//     if (!emailSent) {
//       // Email failed, but invitation is created
//       console.warn('⚠️ Email failed to send, but invitation created');
//       return res.status(201).json({
//         message: 'Invitation created but email failed to send. Please try again.',
//         invitationLink, // Show link as fallback
//       });
//     }
//     // In production, send email here using Nodemailer
//     // For now, return the link in response for testing
//     res.json({
//       message: 'Invitation sent successfully',
//       // Remove in production!
//     });
//   } catch (error) {
//     console.error('❌ Invite member error:', error.message);
//     res.status(500).json({ message: error.message });
//   }
// });
// Invite member to team (with password)
router.post('/:id/members/invite', authMiddleware, async (req, res) => {
  try {
    const { email, memberPassword } = req.body;

    if (!email || !memberPassword) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Get the team
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if current user is admin
    const currentUserMember = team.members.find(
      (member) => member.user_id.toString() === req.user._id.toString()
    );

    if (!currentUserMember || currentUserMember.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can invite members' });
    }

    // Check if user already exists
    const Invitation = require('../models/Invitation');
    const User = require('../models/User');

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const isMember = team.members.some(
        (member) => member.user_id.toString() === existingUser._id.toString()
      );

      if (isMember) {
        return res.status(400).json({ message: 'User is already a member' });
      }

      // Add existing user directly to team
      team.members.push({
        user_id: existingUser._id,
        role: 'member',
      });

      await team.save();

      console.log('✅ Existing user added to team:', email);

      return res.json({
        message: 'User added to team successfully',
        team,
      });
    }

    // Create invitation for new user (with password)
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    // Hash the password before storing
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(memberPassword, salt);

    const invitation = new Invitation({
      email,
      team_id: team._id,
      invited_by: req.user._id,
      token,
      member_password: hashedPassword,  // Store hashed password
    });

    await invitation.save();

    // Create invitation link
    const invitationLink = `${process.env.FRONTEND_URL}/login?token=${token}`;

    console.log('✅ Invitation created for:', email);
    console.log('🔗 Invitation link:', invitationLink);

    // SEND EMAIL
    const { sendInvitationEmail } = require('../services/emailService');
    const emailSent = await sendInvitationEmail(
      email,
      team.name,
      invitationLink,
      req.user.name,
      memberPassword  // Include password in email
    );

     if (!emailSent) {
      console.warn('⚠️ Email failed to send, but invitation created');
      // Still return success because invitation is created
      // Email might fail due to Gmail settings but user can still use the link
      return res.json({
        message: '⚠️ Invitation created but email failed. Share this link manually:',
        invitationLink,
        memberPassword,
      });
    }
    res.json({
      message: '✅ Invitation email sent successfully!',
      invitationLink, // Return link as backup
    });
  } catch (error) {
    console.error('❌ Invite member error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Accept invitation (called during signup)
router.post('/invitations/accept/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { user_id } = req.body;

    const Invitation = require('../models/Invitation');

    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }

    if (invitation.status === 'accepted') {
      return res.status(400).json({ message: 'Invitation already used' });
    }

    // Get the team and add user
    const team = await Team.findById(invitation.team_id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user already a member
    const isMember = team.members.some(
      (member) => member.user_id.toString() === user_id
    );

    if (!isMember) {
      team.members.push({
        user_id,
        role: 'member',
      });

      await team.save();
    }

    // Mark invitation as accepted
    invitation.status = 'accepted';
    await invitation.save();

    console.log('✅ Invitation accepted for:', invitation.email);

    res.json({
      message: 'Successfully joined team',
      team,
    });
  } catch (error) {
    console.error('❌ Accept invitation error:', error.message);
    res.status(500).json({ message: error.message });
  }
});
// Delete member from team (admin only)
router.delete('/:id/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const { id: teamId, memberId } = req.params;

    // Get the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if current user is admin
    const currentUserMember = team.members.find(
      (member) => member.user_id.toString() === req.user._id.toString()
    );

    if (!currentUserMember || currentUserMember.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    // Can't remove yourself
    if (memberId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot remove yourself from team' });
    }

    // Remove the member
    team.members = team.members.filter(
      (member) => member.user_id.toString() !== memberId
    );

    await team.save();

    console.log('✅ Member removed from team');

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('❌ Remove member error:', error.message);
    res.status(500).json({ message: error.message });
  }
});
// Delete team (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id: teamId } = req.params;

    // Get the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if current user is admin
    const currentUserMember = team.members.find(
      (member) => member.user_id.toString() === req.user._id.toString()
    );

    if (!currentUserMember || currentUserMember.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete teams' });
    }

    // Get all projects in team
    const Project = require('../models/Project');
    const Task = require('../models/Task');

    const projects = await Project.find({ team_id: teamId });
    const projectIds = projects.map(p => p._id);

    // Delete all tasks in these projects
    await Task.deleteMany({ project_id: { $in: projectIds } });

    // Delete all projects in team
    await Project.deleteMany({ team_id: teamId });

    // Delete the team
    await Team.findByIdAndDelete(teamId);

    console.log('✅ Team deleted with all projects and tasks');

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('❌ Delete team error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;