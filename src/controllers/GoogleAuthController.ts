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
    const { idToken, accessToken } = req.body;
    const token = idToken || accessToken;

    if (!token) {
      throw new AppError('ID Token or Access Token is required', 400);
    }

    // Verify Google token by calling Google's tokeninfo endpoint
    // Try ID token first, then access token
    let response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);

    if (!response.ok) {
      // If ID token verification fails, try with access token
      response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
    }

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
        phone: '', // Will be filled later by user
        address: '', // Will be filled later by user
        education: '', // Will be filled later by user
        profilePicture: picture,
        googleId,
        isVerified: email_verified || true, // Google users are pre-verified
        isEmailVerified: email_verified || true,
        role: UserRole.USER,
      });
      await userRepository.save(user);
      console.log(`User created: ${user.email}`);
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
      console.log(`User updated: ${user.email}`);
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    // Return user data and token
    res.json({
      success: true,
      message: 'Google login successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
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
      console.error('Detailed error:', error);
      res.status(500).json({
        success: false,
        message: 'Google authentication failed',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      });
    }
  }
};