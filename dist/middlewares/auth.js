"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authMiddleware = exports.checkRole = exports.auth = void 0;
const authMiddleware_1 = require("./authMiddleware");
Object.defineProperty(exports, "authMiddleware", { enumerable: true, get: function () { return authMiddleware_1.authMiddleware; } });
Object.defineProperty(exports, "authorize", { enumerable: true, get: function () { return authMiddleware_1.authorize; } });
exports.auth = authMiddleware_1.authMiddleware;
const checkRole = (roles) => (0, authMiddleware_1.authorize)(roles);
exports.checkRole = checkRole;
//# sourceMappingURL=auth.js.map