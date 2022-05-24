import { getOne } from "./../controllers/factoryHandler";
import { Router } from "express";

import * as authController from "./../controllers/authController";
import * as userController from "./../controllers/userController";

const router = Router();

// Allow only authenticated user's access
router.use(authController.protect);

router
  .route("/me")
  .get(userController.getMe, userController.getUser)
  .patch(
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
  );

// Access to admin only
router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.setDefaultPassword, userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
