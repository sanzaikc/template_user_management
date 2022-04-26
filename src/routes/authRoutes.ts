import { Router } from "express";

import * as authController from "./../controllers/authController";

const router = Router();

router.post("/signup", authController.signUp);

router.post("/signin", authController.signin);

router.get("/signout", authController.signout);

router.post("/forgot-password", authController.forgotPassword);

router.patch("/reset-password/:token", authController.resetPassword);

router.patch(
  "/update-password",
  authController.protect,
  authController.updatePassword
);

export default router;
