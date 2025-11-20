# Deploy Trigger

This file is used to trigger Railway deployment.

Last update: 2025-11-21 00:44 UTC+7

Changes:
- Fixed JWT role authorization in authMiddleware.ts
- Added detailed logging for production debugging
- Use decoded.role from JWT token for admin authentication
