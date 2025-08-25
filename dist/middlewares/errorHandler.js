"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const errorService_1 = require("../services/errorService");
const errorHandler = (error, req, res, _next) => {
    var _a;
    console.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
    });
    let statusCode = 500;
    let message = 'Terjadi kesalahan internal server';
    let code;
    let details = undefined;
    if (error instanceof errorService_1.AppError) {
        statusCode = error.statusCode;
        message = error.message;
    }
    else if (error.message.includes('duplicate key')) {
        statusCode = 409;
        message = 'Data sudah ada dalam sistem';
        code = 'DUPLICATE_ENTRY';
    }
    else if (error.message.includes('validation')) {
        statusCode = 400;
        message = 'Data yang dikirim tidak valid';
        code = 'VALIDATION_ERROR';
    }
    else if (error.message.includes('jwt') || error.message.includes('token')) {
        statusCode = 401;
        message = 'Token tidak valid atau sudah kadaluarsa';
        code = 'INVALID_TOKEN';
    }
    else if (error.message.includes('connection') || error.message.includes('database')) {
        statusCode = 503;
        message = 'Layanan database sedang tidak tersedia';
        code = 'DATABASE_ERROR';
    }
    const errorResponse = {
        message,
        code,
        details,
        timestamp: new Date().toISOString(),
        path: req.path
    };
    if (statusCode >= 500) {
        console.error('Server Error:', {
            error: errorResponse,
            request: {
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            }
        });
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    const errorResponse = {
        message: 'Endpoint tidak ditemukan',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
        path: req.path
    };
    res.status(404).json(errorResponse);
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map