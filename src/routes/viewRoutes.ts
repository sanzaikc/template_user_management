import express from "express";

import * as viewController from "./../controllers/viewController";

const router = express.Router();

router.get("/", viewController.getOverview);

export default router;
