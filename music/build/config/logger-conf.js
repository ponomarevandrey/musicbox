"use strict";
/*
 * Winston logger
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.logger = void 0;
// TIP: Winston Logging Levels:
// 0: error, 1: warn, 2: info, 3: verbose, 4: debug, 5: silly
const winston_1 = __importDefault(require("winston"));
const { createLogger, format, transports } = winston_1.default;
const { combine, timestamp, label, colorize, printf } = format;
const { LOG_LOCATION, ERROR_LOG_NAME, INFO_LOG_NAME, NODE_ENV } = process.env;
const APP_NAME = "musicbox";
const logFormat = printf(({ level, message, label, timestamp }) => {
    return `${level} [${timestamp}] ${label.toUpperCase()}: ${message}`;
});
// Write all logs with level 'debug' and below to console
const consoleTransport = new transports.Console({
    level: "debug",
    format: combine(label({ label: APP_NAME }), timestamp(), colorize({ all: true }), logFormat),
});
// Write all logs with level 'error' and below to ERROR_LOG_NAME
const errorFileTransport = new transports.File({
    level: "error",
    filename: `${LOG_LOCATION}/${ERROR_LOG_NAME}`,
    maxsize: 5242880,
    maxFiles: 2,
    format: combine(label({ label: APP_NAME }), timestamp(), logFormat),
});
// Write all logs with level 'info' and below to INFO_LOG_NAME
const infoFileTransport = new transports.File({
    level: "info",
    filename: `${LOG_LOCATION}/${INFO_LOG_NAME}`,
    maxsize: 5242880,
    maxFiles: 2,
    format: combine(label({ label: APP_NAME }), timestamp(), logFormat),
});
function createTransports(env = "development") {
    return env === "development"
        ? [consoleTransport]
        : [errorFileTransport, infoFileTransport];
}
const logger = createLogger({
    transports: [...createTransports(NODE_ENV)],
    exitOnError: false,
});
exports.logger = logger;
// Put Morgan logs inside Winston logs,
// Create a stream object that will be used by Morgan. Later we will use this
// function to get morgan-generated output into the winston log files
const stream = {
    write: (message) => {
        // use the 'info' log level. The output will be picked up by both
        // transports (file and console)
        logger.info(message);
    },
};
exports.stream = stream;
//# sourceMappingURL=logger-conf.js.map