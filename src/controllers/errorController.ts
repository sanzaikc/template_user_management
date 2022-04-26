import { Request, Response, NextFunction } from "express";

import AppError from "../utils/AppError";

const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any) => {
  const fieldName = Object.keys(err["keyValue"])[0];
  const message = `Duplicate field ${fieldName}: '${err["keyValue"][fieldName]}'`;
  return new AppError(message, 400);
};

const handleJWTError = (err: any) =>
  new AppError("Invalid token. Please log in again", 401);

const handleTokenExpired = (err: any) =>
  new AppError("Your token has expired. Please log in again", 401);

const sendErrorDev = (err: any, req: Request, res: Response) => {
  // API ENDPOINT
  if (req.originalUrl.startsWith("/api"))
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });

  // WEBSITE SERVER RENDERING
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong",
    msg: err.message,
  });
};

const sendErrorProd = (err: any, req: Request, res: Response) => {
  // API ENDPOINT
  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational)
      // Operational, trusted error: send message to client
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

    // Programming or unknown error: shouldn't be leaked to client
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }

  // WEBSITE SERVER RENDERING
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong",
    msg: err.message,
  });
};

const GlobalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError(error);
    if (error.name === "TokenExpiredError") error = handleTokenExpired(error);

    sendErrorProd(error, req, res);
  }
};

export default GlobalErrorHandler;
