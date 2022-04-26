import { Request, Response, NextFunction } from "express";

import AppError from "../utils/AppError";
import APIParams from "../utils/apiParams";
import catchAsync from "../utils/catchAsync";

export const getAll = (Model: any) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // If routes include tour id (Review Model)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const params = new APIParams(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const docs = await params.query.explain(); // Explains query execution
    const docs = await params.query;

    res.status(200).json({
      status: "success",
      totalItems: docs.length,
      data: {
        data: docs,
      },
    });
  });

export const getOne = (Model: any, populateOptions: any = null) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    if (!doc)
      return next(new AppError("Couldn't find document with that ID", 404));

    res.status(200).json({
      status: "success",
      // data: {
      data: doc,
      // },
    });
  });

export const createOne = (Model: any) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

export const updateOne = (Model: any) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc)
      return next(new AppError("Couldn't find document with that ID", 404));

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

export const deleteOne = (Model: any) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc)
      return next(new AppError("Couldn't find document with that ID", 404));

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
