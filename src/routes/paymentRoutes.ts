import { Router } from "express";
import paymentController from "../controllers/PaymentController";
import { authenticate, adminOnly } from "../middlewares";

const router = Router();

/**
 * Public routes (with authentication)
 */

// Get payment summary before checkout
router.post(
  "/summary",
  authenticate,
  paymentController.getPaymentSummary.bind(paymentController),
);

// Create new transaction
router.post(
  "/create",
  authenticate,
  paymentController.createTransaction.bind(paymentController),
);

// Get user's own transactions (MUST be before /:id route)
router.get(
  "/my-transactions",
  authenticate,
  paymentController.getMyTransactions.bind(paymentController),
);

// Get transaction by order ID
router.get(
  "/transaction/:orderId",
  authenticate,
  paymentController.getTransactionByOrderId.bind(paymentController),
);

// Check transaction status from Midtrans
router.get(
  "/status/:orderId",
  authenticate,
  paymentController.checkTransactionStatus.bind(paymentController),
);

// Get transaction by ID (MUST be after specific routes)
router.get(
  "/:id",
  authenticate,
  paymentController.getTransactionById.bind(paymentController),
);

// Cancel transaction
router.post(
  "/cancel/:orderId",
  authenticate,
  paymentController.cancelTransaction.bind(paymentController),
);

/**
 * Webhook route (no authentication - verified by signature)
 */
router.post(
  "/notification",
  paymentController.handleNotification.bind(paymentController),
);

/**
 * Admin routes
 */

// Get event transactions (admin only)
router.get(
  "/event/:eventId",
  authenticate,
  adminOnly,
  paymentController.getEventTransactions.bind(paymentController),
);

// Get all transactions (admin only)
router.get(
  "/admin/all",
  authenticate,
  adminOnly,
  paymentController.getAllTransactions.bind(paymentController),
);

// Get transaction statistics (admin only)
router.get(
  "/admin/statistics",
  authenticate,
  adminOnly,
  paymentController.getTransactionStatistics.bind(paymentController),
);

export default router;
