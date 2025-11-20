import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import AppDataSource from "../config/database";
import { User } from "../entities/User";
import { createOrUpdateSession, getSession } from "./sessionTimeout";

// Define custom JWT payload interface
interface JwtUserPayload extends JwtPayload {
  userId: string;
  role: string;
}

// Note: Express Request is extended globally in src/types/express.d.ts

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get token from header - using headers.authorization instead of header()
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "No token provided or invalid format",
      });
      return;
    }

    // Extract token
    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret",
    ) as JwtUserPayload;

    // Get user from database
    // Support both userId (regular) and id (admin) in JWT payload
    const userId = decoded.userId || (decoded as any).id;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Attach user and token to request
    // Use role from JWT token if available (for admin tokens), otherwise from database
    req.user = {
      ...user,
      userId: user.id,
      role: decoded.role || user.role,
    };
    req.token = token;

    // Auto-create or update session if it doesn't exist
    // This handles cases where backend restarts and in-memory sessions are lost
    if (!getSession(token)) {
      createOrUpdateSession(token, user.id);
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: "Token expired",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
};

// Role-based authorization middleware
export const authorize = (allowedRoles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user exists (should be set by authMiddleware)
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    // Check role authorization (case-insensitive)
    if (allowedRoles.length > 0 && !allowedRoles.map(r => r.toUpperCase()).includes(req.user.role.toUpperCase())) {
      console.error('[Auth] Role authorization failed:', {
        userRole: req.user.role,
        allowedRoles,
        userEmail: req.user.email,
        path: req.path
      });
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

// Export authenticate as an alias for authMiddleware
export const authenticate = authMiddleware;
