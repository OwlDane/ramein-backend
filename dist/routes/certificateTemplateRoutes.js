"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CertificateTemplateController_1 = require("../controllers/CertificateTemplateController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.auth, CertificateTemplateController_1.CertificateTemplateController.getAll);
router.get('/default', auth_1.auth, CertificateTemplateController_1.CertificateTemplateController.getDefault);
router.get('/:id', auth_1.auth, CertificateTemplateController_1.CertificateTemplateController.getById);
router.post('/', auth_1.auth, CertificateTemplateController_1.CertificateTemplateController.create);
router.put('/:id', auth_1.auth, CertificateTemplateController_1.CertificateTemplateController.update);
router.delete('/:id', auth_1.auth, CertificateTemplateController_1.CertificateTemplateController.delete);
router.patch('/:id/set-default', auth_1.auth, CertificateTemplateController_1.CertificateTemplateController.setDefault);
exports.default = router;
//# sourceMappingURL=certificateTemplateRoutes.js.map