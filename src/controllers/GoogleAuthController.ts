import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import AppDataSource from '../config/database';
import { User, UserRole } from '../entities/User';
import { AppError } from '../services/errorService';

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      throw new AppError('Access Token is required', 400);
    }

    // Verify Google access token by calling Google's userinfo endpoint
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`);
    
    if (!response.ok) {
      throw new AppError('Invalid Google token', 400);
    }

    const googleUser = await response.json() as GoogleUserInfo;
    
    if (!googleUser || !googleUser.email) {
      throw new AppError('Invalid Google user data', 400);
    }

    const { email, name, picture, sub: googleId, email_verified } = googleUser;

    // Find or create user
    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOne({ where: { email } });

    if (!user) {
      // Create new user
      user = userRepository.create({
        email,
        name: name || email.split('@')[0],
        password: '', // No password for OAuth users
        profilePicture: picture,
        googleId,
        isVerified: email_verified || true, // Google users are pre-verified
        role: UserRole.USER,
      });
      await userRepository.save(user);
    } else {
      // Update existing user with Google info
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (picture && !user.profilePicture) {
        user.profilePicture = picture;
      }
      if (!user.isVerified && email_verified) {
        user.isVerified = true;
      }
      await userRepository.save(user);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    // Return user data and token
    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profilePicture: user.profilePicture,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Google authentication failed',
      });
    }
  }
};