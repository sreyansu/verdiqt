import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if ((err as any)?.name === "MulterError") {
    const multerError = err as any;
    const statusCode = multerError.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message =
      multerError.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file is too large. Maximum allowed size is 50MB."
        : multerError.message || "File upload error.";

    console.error(`[UPLOAD ERROR] ${statusCode} - ${message}`, {
      code: multerError.code,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });

    res.status(statusCode).json({
      success: false,
      error: message,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${statusCode} - ${message}`, {
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

export function createError(message: string, statusCode: number): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  return error;
}
