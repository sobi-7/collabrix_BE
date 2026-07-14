const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  avatar_url: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',  // Default to member
  },
   can_create_team: {
    type: Boolean,
    default: true,  // By default, users CANNOT create teams
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function() {
  try {
    if (!this.isModified('password')) return;
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw error;
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);