import { Request, Response, NextFunction } from "express";
import multer from "multer";
import sharp from "sharp";
import fs, { mkdirSync } from "fs";

import { multerFilter } from "../utils/multerFilter";
import * as factory from "./factoryHandler";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";
import filterObj from "../utils/filterObject";
import User from "../models/userModel";

// Multer config for user photo
const photoDestination = "public/img/users/";
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerFilter,
});

export const uploadUserPhoto = upload.single("photo");

export const resizeUserPhoto = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  if (!fs.existsSync(photoDestination))
    fs.mkdirSync(photoDestination, { recursive: true });

  sharp(req.file.buffer)
    .resize(500, 500, { fit: "cover" })
    .jpeg({ quality: 90 })
    .toFile(`${photoDestination}${req.file.filename}`);

  // Including the image path
  req.file.filename = `${req.protocol}://${
    req.headers.host
  }/${photoDestination.replace("public/", "")}${req.file.filename}`;

  next();
};

export const setDefaultPassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const defaultPassword = "password";

  req.body.password = defaultPassword;
  req.body.passwordConfirm = defaultPassword;

  next();
};

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  req.params.id = req.user.id;
  next();
};

export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.password || req.body.passwordConfirm)
      return next(
        new AppError("This route is not for password modifications", 400)
      );

    const validReq = filterObj(req.body, "name");
    if (req.file) validReq.photo_url = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(req.user.id, validReq, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });

    next();
  }
);

export const getAllUsers = factory.getAll(User);

export const getUser = factory.getOne(User);

export const createUser = factory.createOne(User);

export const updateUser = factory.updateOne(User);

export const deleteUser = factory.deleteOne(User);
