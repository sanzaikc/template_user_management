import { Request } from "express";
import { FileFilterCallback } from "multer";

import AppError from "./AppError";

export const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Not an image! Please upload image file only", 400));
};
