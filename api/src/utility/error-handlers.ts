import { Request, Response, NextFunction } from "express";
import * as dbConnection from "../model/postgres";
import { HttpError } from "./http-errors/HttpError";
import { logger, stream } from "../config/loggerConf";
import util from "util";
import { ValidationError } from "joi";
import { DBError } from "./db-errors/DBError";

const { API_SERVER_PORT } = process.env;

//
// Error handlers
//

export function onUncaughtException(err: Error): void {
  logger.error(`uncaughtException: ${err.message} \n${err.stack}`);
  dbConnection.close();
  process.exit(1);
}

export function onUnhandledRejection(reason: string, p: unknown): void {
  logger.error(
    `UnhandledRejection: ${console.dir(p, {
      depth: null,
    })}, reason "${reason}"`,
  );
}

// Forward 404 errors to Express custom error handler
export function on404error(req: Request, res: Response, next: NextFunction) {
  next(new HttpError(404));
}

// Express custom error handler
// - handle errors passed to next() handler
// - handle errors thrown inside route handler
export function expressCustomErrorHandler(
  err: Error | HttpError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  logger.error(`Express Custom Error Handler ${util.inspect(err)}`);
  if (err instanceof HttpError) {
    res.status(err.errorCode);
    res.json(err);
  } else if (err instanceof ValidationError) {
    res.status(400);
    res.json(new HttpError(400));
  } else if (err instanceof DBError) {
    if (err.code >= 23000 || err.code <= 23514) {
      res.status(400);
      res.json(new HttpError(400));
    } else {
      res.status(500);
      res.json(new HttpError(500));
    }
  } else {
    res.status(500);
    res.json(new HttpError(500));
    throw err;
  }
}

export function onServerError(err: NodeJS.ErrnoException): void | never {
  if (err.syscall !== "listen") throw err;

  const bind =
    typeof API_SERVER_PORT === "string"
      ? `Pipe ${API_SERVER_PORT}`
      : `Port ${API_SERVER_PORT}`;

  // Messages for listen errors
  switch (err.code) {
    case "EACCES":
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw err;
  }
}
