import User from '../models/User.js';
import Story from '../models/Story.js';
import Chapter from '../models/Chapter.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('following')
      .populate('following', '_id username');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.userId);
    
    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (userToFollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }
    
    const isFollowing = currentUser.following.includes(userToFollow._id);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== userToFollow._id.toString()
      );
      userToFollow.followers = userToFollow.followers.filter(
        id => id.toString() !== currentUser._id.toString()
      );
    } else {
      // Follow
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
    }
    
    await currentUser.save();
    await userToFollow.save();
    
    res.json({ following: !isFollowing });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, email, bio, profilePicture } = req.body;
    
    // Check if username or email is already taken by another user
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: req.userId } },
        { $or: [{ username }, { email }] }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Username or email already taken' 
      });
    }
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.profilePicture = profilePicture || user.profilePicture;
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ user: userResponse });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;
    
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old avatar file if it exists
    if (user.profilePicture) {
      const oldAvatarPath = path.join(__dirname, '../uploads/avatars/', path.basename(user.profilePicture));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user with new avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.profilePicture = avatarUrl;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ 
      message: 'Avatar uploaded successfully',
      profilePicture: avatarUrl,
      user: userResponse 
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
};

export const removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete avatar file if it exists
    if (user.profilePicture) {
      const avatarPath = path.join(__dirname, '../uploads/avatars/', path.basename(user.profilePicture));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Remove avatar from user
    user.profilePicture = '';
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ 
      message: 'Avatar removed successfully',
      user: userResponse 
    });
  } catch (error) {
    console.error('Remove avatar error:', error);
    res.status(500).json({ message: 'Failed to remove avatar' });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, publicProfile, showReadingActivity } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update preferences (add these fields to User model if they don't exist)
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) user.pushNotifications = pushNotifications;
    if (publicProfile !== undefined) user.publicProfile = publicProfile;
    if (showReadingActivity !== undefined) user.showReadingActivity = showReadingActivity;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ 
      message: 'Preferences updated successfully',
      user: userResponse 
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's avatar file if it exists
    if (user.profilePicture) {
      const avatarPath = path.join(__dirname, '../uploads/avatars/', path.basename(user.profilePicture));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Delete user's stories and chapters
    const stories = await Story.find({ author: req.userId });
    for (const story of stories) {
      await Chapter.deleteMany({ story: story._id });
    }
    await Story.deleteMany({ author: req.userId });
    
    // Remove user from followers/following lists
    await User.updateMany(
      { followers: req.userId },
      { $pull: { followers: req.userId } }
    );
    await User.updateMany(
      { following: req.userId },
      { $pull: { following: req.userId } }
    );
    
    // Delete user
    await User.findByIdAndDelete(req.userId);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};