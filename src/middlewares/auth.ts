// Backward compatibility file
// Re-exports from authMiddleware.ts

import { Request } from 'express';
import { authMiddleware, authorize } from './authMiddleware';

// Type alias for backward compatibility
export type AuthRequest = Request;

// Re-export middleware functions
export const auth = authMiddleware;
export const checkRole = (roles: string[]) => authorize(roles);

export { authMiddleware, authorize };
