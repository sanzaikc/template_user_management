import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import validator from "validator";

export interface UserInput {
  name: string;
  email: string;
  password: any;
  passwordConfirm: any;
}

export interface UserDocument extends UserInput, Document {
  role: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpiresIn?: Date;
  active: Boolean;

  authenticatePassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfter(timestamp: number): boolean;
  createResetPasswordToken(): string;
}

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo_url: String,
  role: {
    type: String,
    enum: {
      values: ["admin", "lead-guide", "guide", "user"],
      message: "Invalid user role",
    },
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm the password"],
    validate: {
      validator: function (this: UserDocument, val: string) {
        return val === this.password;
      },
      message: "The passwords provided didn't matched",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpiresIn: Date,
  active: {
    type: Boolean,
    default: true,
  },
});

// Encrypting password
userSchema.pre<UserDocument>("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

// Setting password change timestamp
userSchema.pre("save", function (next) {
  if (this.isNew || !this.isModified("password")) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// QUERY MIDDLEWARES
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// INSTANCE METHODS THAT CAN BE ACCESSED BY DOCUMENT
userSchema.methods.authenticatePassword = async function (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (
  JWTTimeStamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedPasswordTimeStamp = this.passwordChangedAt.getTime() / 1000;
    return JWTTimeStamp < changedPasswordTimeStamp;
  }

  return false;
};

userSchema.methods.createResetPasswordToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpiresIn = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = model("User", userSchema);

export default User;
