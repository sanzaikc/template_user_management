import { Request, Response, NextFunction } from "express";

import * as factory from "./factoryHandler";
import User from "../models/userModel";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";

// interface MulterRequest extends Request {
//   file: any;
// }

const filterObj = (obj: any, ...allowedFields: string[]) => {
  let filteredObj: any = {};
  Object.keys(obj).forEach((key: string) => {
    if (allowedFields.includes(key)) filteredObj[key] = obj[key];
  });

  return filteredObj;
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

export const getAllUsers = factory.getAll(User);

export const getUser = factory.getOne(User);

export const createUser = factory.createOne(User);

export const updateUser = factory.updateOne(User);

export const deleteUser = factory.deleteOne(User);

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

    const validReq = filterObj(req.body, "name", "email");
    // if (req.file) validReq.photo = req.file.filename;

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
