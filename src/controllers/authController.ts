import { promisify } from "util";
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import dotenv from "dotenv";
import * as jwt from "jsonwebtoken";

import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";
import Email from "../utils/emailHandler";
import User, { UserDocument } from "../models/userModel";

dotenv.config();

const _jwt_secret: string = process.env.JWT_SECRET || "";
const _jwt_expires_in: string = process.env.JWT_EXPIRES_IN || "7d";
const _cookie_expires_in: any = process.env.JWT_COOKIE_EXPIRES_IN || 7;

const signToken = (id: string) => {
  return jwt.sign({ id }, _jwt_secret, {
    expiresIn: _jwt_expires_in,
  });
};

const createResponseWithToken = (
  user: UserDocument,
  statusCode: number,
  res: Response
) => {
  const token = signToken(user._id);

  const cookieOptions: { expires: Date; httpOnly: boolean; secure?: boolean } =
    {
      expires: new Date(Date.now() + _cookie_expires_in * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// AUTH MIDDLEWARES
export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;
    const authorizationHeader = req.headers.authorization;

    if (authorizationHeader && authorizationHeader.startsWith("Bearer"))
      token = authorizationHeader.split(" ")[1];
    else if (req.cookies.jwt) token = req.cookies.jwt;

    if (!token)
      return next(
        new AppError(
          "You need to be logged in. Please login to access the resource",
          401
        )
      );

    // Verifing the token
    const decoded: any = jwt.verify(token, _jwt_secret);

    // Check if user exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser)
      return next(
        new AppError("The user belonging to the token no longer exists", 401)
      );

    // CHECK IF USER HAS CHANGED THEIR PASSWORD
    if (currentUser.changedPasswordAfter(decoded.iat))
      return next(
        new AppError(
          "The password of the user have been recently changed. Please log in again",
          401
        )
      );

    req.user = currentUser;
    res.locals.user = currentUser; // variable 'user' made available for the render templates

    next();
  }
);

// Returns a 'user' variable to render templates (Not relevant to api)
export const isLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.cookies.jwt) return next();

    const decoded: any = jwt.verify(req.cookies.jwt, _jwt_secret);

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) return next();

    if (currentUser.changedPasswordAfter(decoded.iat)) return next();

    // Logged in user exists
    res.locals.user = currentUser;
  } catch (err) {
    return next();
  }

  next();
};

export const restrictTo = (...roles: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role))
      next(
        new AppError("You do not have permission to perform this action", 403)
      );

    next();
  };
};

// API HANDLERS
export const signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, passwordConfirm, role } = req.body;
    const newUser: UserDocument = await User.create({
      name,
      email,
      password,
      passwordConfirm,
      // role,
    });

    const url = `${req.protocol}://${req.get("host")}/me`;
    await new Email(newUser, url).sendWelcome();

    createResponseWithToken(newUser, 201, res);
  }
);

export const signin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new AppError("Please provide email and password", 400));

    const user: UserDocument = await User.findOne({ email }).select(
      "+password"
    );

    if (!user || !(await user.authenticatePassword(password, user.password))) {
      return next(new AppError("Invalid email or password", 401));
    }

    createResponseWithToken(user, 200, res);
  }
);

export const signout = async (req: Request, res: Response) => {
  res.cookie("jwt", "logged-out", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
  });
};

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user)
      return next(
        new AppError("The user with that email does not exists", 404)
      );

    const resetToken = user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/reset-password/${resetToken}`;

    try {
      await new Email(user, resetUrl).sendResetPassword();

      res.status(200).json({
        status: "success",
        message: "Token sent to email!",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpiresIn = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          "There was an error sending the email. Try again later!",
          500
        )
      );
    }
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiresIn: { $gt: Date.now() },
    });

    if (!user) return next(new AppError("Invalid or expired token", 404));

    const { password, passwordConfirm } = req.body;

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpiresIn = undefined;
    await user.save();

    createResponseWithToken(user, 200, res);
  }
);

export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { password, passwordConfirm, passwordCurrent } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    if (
      !user ||
      !(await user.authenticatePassword(passwordCurrent, user.password))
    )
      return next(new AppError("The current password did not matched", 401));

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    createResponseWithToken(user, 200, res);
  }
);
