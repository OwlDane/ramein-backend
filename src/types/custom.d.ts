// Global type augmentation for Express
// DO NOT name this file "express.d.ts" as it conflicts with Express module

import { User } from '../entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: User | any;
      token?: string;
      sessionData?: {
        lastActivity: number;
        userId: string;
      };
    }
  }
}

export {};
