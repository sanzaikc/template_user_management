import { Request, Response } from "express";

import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";

export const getOverview = catchAsync((req: Request, res: Response) => {
  res.render("pages/overview", {
    title: "Overview",
  });
});
