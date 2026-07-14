const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Sign up
// Sign up (with optional invitation token)
// router.post('/signup', async (req, res) => {
//   try {
//     const { email, password, name, invitationToken } = req.body;

//     console.log('Signup attempt:', { email, name, hasToken: !!invitationToken });

//     if (!email || !password || !name) {
//       return res.status(400).json({ message: 'All fields required' });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Email already registered' });
//     }

//     // Create new user
//     const user = new User({ email, password, name });
//     await user.save();

//     // If invitation token provided, accept invitation
//     if (invitationToken) {
//       const Invitation = require('../models/Invitation');
//       const invitation = await Invitation.findOne({ token: invitationToken });

//       if (invitation && invitation.status === 'pending') {
//         // Add user to team
//         const Team = require('../models/Team');
//         const team = await Team.findById(invitation.team_id);

//         if (team) {
//           team.members.push({
//             user_id: user._id,
//             role: 'member',
//           });
//           await team.save();

//           // Mark invitation as accepted
//           invitation.status = 'accepted';
//           await invitation.save();

//           console.log('✅ User automatically added to team:', email);
//         }
//       }
//     }

//     // Create token
//     const token = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET, {
//       expiresIn: '7d',
//     });

//     console.log('✅ User created successfully:', email);

//     res.status(201).json({
//       message: 'User created successfully',
//       token,
//       user: { _id: user._id, email: user.email, name: user.name, can_create_team: user.can_create_team  },
//     });
//   } catch (error) {
//     console.error('❌ Signup error:', error.message);
//     res.status(500).json({ message: error.message });
//   }
// });

// Sign up (ADMIN ONLY - requires signup code)
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, adminSignupCode } = req.body;

    console.log('Signup attempt:', { email, name, isAdmin: !!adminSignupCode });

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields required' });
    }

    // CHECK: Admin signup code required
    if (!adminSignupCode || adminSignupCode !== process.env.ADMIN_SIGNUP_CODE) {
      return res.status(403).json({ 
        message: 'Signup is restricted. Only admins can create accounts. Contact your administrator for an invitation.' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new admin user
    const user = new User({ 
      email, 
      password, 
      name,
         role: 'admin',     
      can_create_team: true  // Admins can create teams
    });
    
    await user.save();

    // Create token
    const token = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log('✅ Admin user created successfully:', email);

    res.status(201).json({
      message: 'Admin account created successfully',
      token,
      user: { 
        _id: user._id, 
        email: user.email, 
        name: user.name,
             role: 'admin', 
        can_create_team: true 
      },
    });
  } catch (error) {
    console.error('❌ Signup error:', error.message);
    res.status(500).json({ message: error.message });
  }
});
// router.post('/signup', async (req, res) => {
//   try {
//     const { email, password, name } = req.body;

//     console.log('Signup attempt:', { email, name });

//     // Validate input
//     if (!email || !password || !name) {
//       return res.status(400).json({ message: 'All fields required' });
//     }

//     // Check if user exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Email already registered' });
//     }

//     // Create new user
//     console.log('Creating user...');
//     const user = new User({ email, password, name });
    
//     console.log('Saving user...');
//     await user.save();

//     console.log('User saved, creating token...');

//     // Create token
//     const token = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET, {
//       expiresIn: '7d',
//     });

//     console.log('✅ User created successfully:', email);

//     res.status(201).json({
//       message: 'User created successfully',
//       token,
//       user: { _id: user._id, email: user.email, name: user.name },
//     });
//   } catch (error) {
//     console.error('❌ Signup error:', error.message);
//     console.error('Full error:', error);
//     res.status(500).json({ message: error.message });
//   }
// });

// Login
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log('Login attempt:', email);

//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password required' });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const isPasswordValid = await user.comparePassword(password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const token = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET, {
//       expiresIn: '7d',
//     });

//     console.log('✅ Login successful:', email);

//     res.json({
//       message: 'Login successful',
//       token,
//       user: { _id: user._id, email: user.email, name: user.name, can_create_team: user.can_create_team  },
//     });
//   } catch (error) {
//     console.error('❌ Login error:', error.message);
//     res.status(500).json({ message: error.message });
//   }
// });
// Login (with optional invitation token)
// Login (with optional invitation token)
router.post('/login', async (req, res) => {
  try {
    const { email, password, invitationToken } = req.body;

    console.log('Login attempt:', { email, hasToken: !!invitationToken });

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    let user = await User.findOne({ email });

    // If user doesn't exist but has invitation token, create account
    if (!user && invitationToken) {
      console.log('📝 Creating account from invitation for:', email);
      
      const Invitation = require('../models/Invitation');
      const invitation = await Invitation.findOne({ token: invitationToken });

      if (!invitation) {
        return res.status(404).json({ message: 'Invalid or expired invitation' });
      }

      // Create new user with password from invitation
      user = new User({
        email,
        password,
        name: email.split('@')[0], // Use email prefix as name
        role: 'member', // Always member from invitation
        can_create_team: false,
      });

      await user.save();
      console.log('✅ Account created from invitation:', email);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If invitation token provided, add to team
    if (invitationToken) {
      const Invitation = require('../models/Invitation');
      const Team = require('../models/Team');

      const invitation = await Invitation.findOne({ token: invitationToken });

      if (invitation && invitation.status === 'pending') {
        const team = await Team.findById(invitation.team_id);

        if (team) {
          const isMember = team.members.some(
            (member) => member.user_id.toString() === user._id.toString()
          );

          if (!isMember) {
            team.members.push({
              user_id: user._id,
              role: 'member',
            });
            await team.save();
            console.log('✅ User added to team:', email);
          }

          // Mark invitation as accepted
          invitation.status = 'accepted';
          await invitation.save();
        }
      }
    }

    const token = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log('✅ Login successful:', email, '| Role:', user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        can_create_team: user.can_create_team,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
});
// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
     console.log('User fetched:', user.email, '| Role:', user.role);
    res.json(user);
  } catch (error) {
    console.error('❌ Get user error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;