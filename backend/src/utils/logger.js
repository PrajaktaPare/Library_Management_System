import winston from "winston";
import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "src", "logs");

// ensure folder exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),

  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),

    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
  ],

  exitOnError: false,
});

export default logger;