import { Request, Response, NextFunction } from "express";

import * as factory from "./factoryHandler";
import User from "../models/userModel";

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  req.params.id = req.user.id;
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

  console.log(req);

  next();
};

export const getAllUsers = factory.getAll(User);

export const getUser = factory.getOne(User);

export const createUser = factory.createOne(User);

export const updateUser = factory.updateOne(User);

export const deleteUser = factory.deleteOne(User);
