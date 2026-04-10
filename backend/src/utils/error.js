// error.js
import multer from "multer";
const { Error } = global;

/**
 * Error Converter Middleware
 */
export function errorConverter(err, req, res, next) {
  let statusCode = 500;
  let message = "Internal Server Error";

  // Handle Multer-specific errors (file size, wrong type, etc.)
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = `File too large. Maximum allowed size is 100 MB.`;
    } else {
      message = `Upload error: ${err.message}`;
    }
  } else if (err instanceof HttpException) {
    statusCode = err.status;
    message = err.message;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  const errorResponse = {
    message,
    statusCode,
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Not Found Middleware
 */
export function notFound(req, res, next) {
  const err = new HttpException(404, "Not Found");
  next(err);
}

/**
 * HttpException Class
 */
export class HttpException extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * AppError Class
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}
