import { Request, Response, NextFunction } from 'express';
import { AppError } from '../services/errorService';

export interface ErrorResponse {
    message: string;
    code?: string;
    details?: any;
    timestamp: string;
    path: string;
}

export const errorHandler = (
    error: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction // Prefix with underscore to indicate intentionally unused
) => {
    console.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: (req as any).user?.id
    });

    let statusCode = 500;
    let message = 'Terjadi kesalahan internal server';
    let code: string | undefined;
    let details: any = undefined;

    // Handle AppError instances
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        // Remove code and details since they don't exist in AppError
    }
    // Handle TypeORM errors
    else if (error.message.includes('duplicate key')) {
        statusCode = 409;
        message = 'Data sudah ada dalam sistem';
        code = 'DUPLICATE_ENTRY';
    }
    // Handle validation errors
    else if (error.message.includes('validation')) {
        statusCode = 400;
        message = 'Data yang dikirim tidak valid';
        code = 'VALIDATION_ERROR';
    }
    // Handle JWT errors
    else if (error.message.includes('jwt') || error.message.includes('token')) {
        statusCode = 401;
        message = 'Token tidak valid atau sudah kadaluarsa';
        code = 'INVALID_TOKEN';
    }
    // Handle database connection errors
    else if (error.message.includes('connection') || error.message.includes('database')) {
        statusCode = 503;
        message = 'Layanan database sedang tidak tersedia';
        code = 'DATABASE_ERROR';
    }

    const errorResponse: ErrorResponse = {
        message,
        code,
        details,
        timestamp: new Date().toISOString(),
        path: req.path
    };

    // Log error for monitoring
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

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
    const errorResponse: ErrorResponse = {
        message: 'Endpoint tidak ditemukan',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
        path: req.path
    };

    res.status(404).json(errorResponse);
};