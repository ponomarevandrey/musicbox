import express, { Request, Response, NextFunction } from "express";

import util from "util";

import { logger } from "../config/logger";
import * as stats from "../models/public/stats/queries";

const router = express.Router();

async function getShortStats(req: Request, res: Response, next: NextFunction) {
  try {
    const retrievedStats = await stats.readLibStats();
    logger.info(`${__filename}: ${util.inspect(retrievedStats)}`);
    res.json({ results: retrievedStats });
  } catch (err) {
    next(err);
  }
}

async function getGenreStats(req: Request, res: Response, next: NextFunction) {
  try {
    const genreStats = await stats.readGenreStats();
    logger.info(`${__filename}: ${util.inspect(genreStats)}`);
    res.json({ results: genreStats });
  } catch (err) {
    next(err);
  }
}

async function getYearStats(req: Request, res: Response, next: NextFunction) {
  try {
    const yearStats = await stats.readYearStats();
    logger.info(`${__filename}: ${util.inspect(yearStats)}`);
    res.json({ results: yearStats });
  } catch (err) {
    next(err);
  }
}

async function getArtistStats(req: Request, res: Response, next: NextFunction) {
  try {
    const artistStats = await stats.readArtistStats();
    logger.info(`${__filename}: ${util.inspect(artistStats)}`);
    res.json({ results: artistStats });
  } catch (err) {
    next(err);
  }
}

async function getLabelStats(req: Request, res: Response, next: NextFunction) {
  try {
    const labelStats = await stats.readLabelStats();
    logger.info(`${__filename}: ${util.inspect(labelStats)}`);
    res.json({ results: labelStats });
  } catch (err) {
    next(err);
  }
}

router.get("/", getShortStats);
router.get("/labels", getLabelStats);
router.get("/artists", getArtistStats);
router.get("/years", getYearStats);
router.get("/genres", getGenreStats);

export { router };
