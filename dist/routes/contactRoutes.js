"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ContactController_1 = require("../controllers/ContactController");
const router = (0, express_1.Router)();
router.post('/', ContactController_1.ContactController.submitContactForm);
router.get('/health', ContactController_1.ContactController.healthCheck);
exports.default = router;
//# sourceMappingURL=contactRoutes.js.map