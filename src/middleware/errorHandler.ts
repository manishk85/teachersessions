import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import AppError from "../utils/AppError";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = "Something went wrong";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    // mongo duplicate key error
    statusCode = 409;
    message = `${Object.keys(err.keyValue).join(", ")} already exists`;
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON body";
  } else {
    console.error(err);
  }

  res.status(statusCode).json({ success: false, message });
};

export default errorHandler;
