import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import app from "./app";

const dataBaseUrl: string = process.env.DATABASE || "";
const databasePassword: string = process.env.DATABASE_PASSWORD || "";

const databaseConnection: string = dataBaseUrl.replace(
  "<password>",
  databasePassword
);

// CONNECTING MONGO DB WITH MONGOOSE DRIVER
mongoose
  .connect(databaseConnection)
  .then(() => console.log("DB connection successful"));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(
    "\x1b[34m%s\x1b[0m", // enable color in console
    `Listening on port http://localhost:${port}/`
  ); //
});
