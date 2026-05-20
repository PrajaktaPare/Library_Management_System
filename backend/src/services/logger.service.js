import fs from 'fs';
import path from 'path';
import winston from 'winston';

//create logs directory path
const logDir = path.join(process.cwd(), 'src', 'logs');

//create logs folder if not exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

//create winston logger instance
const logger = winston.createLogger({
  level: 'info',

  //log format setup
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),

  //log transports
  transports: [
    //console logs
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),

    //error logs file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),

    //combined logs file
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],

  exitOnError: false,
});

//export logger
export default logger;
