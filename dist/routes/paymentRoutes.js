"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentController_1 = __importDefault(require("../controllers/PaymentController"));
const middlewares_1 = require("../middlewares");
const router = (0, express_1.Router)();
router.get("/test", PaymentController_1.default.testPaymentAPI.bind(PaymentController_1.default));
router.post("/summary", middlewares_1.authenticate, PaymentController_1.default.getPaymentSummary.bind(PaymentController_1.default));
router.post("/create", middlewares_1.authenticate, PaymentController_1.default.createTransaction.bind(PaymentController_1.default));
router.get("/my-transactions", middlewares_1.authenticate, PaymentController_1.default.getMyTransactions.bind(PaymentController_1.default));
router.get("/transaction/:orderId", middlewares_1.authenticate, PaymentController_1.default.getTransactionByOrderId.bind(PaymentController_1.default));
router.get("/status/:orderId", middlewares_1.authenticate, PaymentController_1.default.checkTransactionStatus.bind(PaymentController_1.default));
router.get("/:id", middlewares_1.authenticate, PaymentController_1.default.getTransactionById.bind(PaymentController_1.default));
router.post("/cancel/:orderId", middlewares_1.authenticate, PaymentController_1.default.cancelTransaction.bind(PaymentController_1.default));
router.post("/notification", PaymentController_1.default.handleNotification.bind(PaymentController_1.default));
router.get("/event/:eventId", middlewares_1.authenticate, middlewares_1.adminOnly, PaymentController_1.default.getEventTransactions.bind(PaymentController_1.default));
router.get("/admin/all", middlewares_1.authenticate, middlewares_1.adminOnly, PaymentController_1.default.getAllTransactions.bind(PaymentController_1.default));
router.get("/admin/statistics", middlewares_1.authenticate, middlewares_1.adminOnly, PaymentController_1.default.getTransactionStatistics.bind(PaymentController_1.default));
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map