import { Request, Response, NextFunction } from "express";

import catchAsync from "../utils/catchAsync";
import * as factory from "./factoryHandler";
import User from "../models/userModel";

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  req.params.id = req.user.id;
  next();
};

export const getAllUsers = factory.getAll(User);

export const getUser = factory.getOne(User);

export const createUser = factory.createOne(User);

export const updateUser = factory.updateOne(User);

export const deleteUser = factory.deleteOne(User);
