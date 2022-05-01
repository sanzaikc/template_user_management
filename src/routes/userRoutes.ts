import { Router } from "express";

import * as authController from "./../controllers/authController";
import * as userController from "./../controllers/userController";

const router = Router();

// Allow only authenticated user's access
router.use(authController.protect);

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.setDefaultPassword, userController.createUser);

router.route("/me").get(userController.getMe, userController.getUser);

export default router;
