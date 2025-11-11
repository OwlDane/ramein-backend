// Global type definitions for Express
// This file extends Express Request with custom properties

declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
      sessionData?: {
        lastActivity: number;
        userId: string;
      };
    }
  }
}

export {};
