import express, { Request, Response, NextFunction } from "express";
import util from "util";

import { logger } from "../config/logger";
import * as label from "../models/public/label/queries";

const router = express.Router();

export async function getLabels(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const labels = await label.readAll();
    logger.debug(`${__filename}: ${util.inspect(labels)}`);
    res.json({ results: labels });
  } catch (err) {
    next(err);
  }
}

router.get("/", getLabels);

export { router };
