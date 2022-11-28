import moment from "moment";
import winston from "winston";
import path, { resolve } from "path";
import { fileURLToPath } from "url";
// export const errorLogger = () => {
//   const logger = winston.createLogger({
//     level: "info",
//     format: winston.format.json(),
//     defaultMeta: { service: "user-service" },
//     transports: [
//       //
//       // - Write all logs with importance level of `error` or less to `error.log`
//       // - Write all logs with importance level of `info` or less to `combined.log`
//       //
//       new winston.transports.File({ filename: "error.log", level: "error" }),
//       new winston.transports.File({ filename: "combined.log" }),
//     ],
//   });

//   //
//   // If we're not in production then log to the `console` with the format:
//   // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//   //
//   // if (process.env.NODE_ENV === 'production') { // <- change this to !== when in PROD
//   //   logger.add(new winston.transports.Console({
//   //     format: winston.format.simple(),
//   //   }));
//   // }
//   return logger;
// };
const { format, transports, createLogger } = winston;
const { combine, timestamp, printf, colorize } = format;

export default (meta_url = "") => {
  const root = resolve("./");
  const file = fileURLToPath(new URL(meta_url));
  const file_path = file.replace(root, "");

  const customFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}] ${file_path}: ${stack || message}`;
  });

  const loggerInstance = createLogger({
    level: "info",
    format: combine(
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.splat(),
      format.errors({ stack: true }),
      customFormat
    ),
    defaultMeta: { service: "user-service" },
    transports: [
      new transports.File({ filename: "log/error.log", level: "error" }),
      new transports.File({ filename: "log/common.log" }),
    ],
  });
  return loggerInstance;

  // Log also to console if not in production
  return;
  if (process.env.NODE_ENV !== "production") {
    loggerInstance.add(
      new transports.Console({
        format: combine(colorize(), customFormat),
      })
    );
  }
};
