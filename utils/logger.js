const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...rest }) => {
          let logMessage = `${timestamp} ${level}: ${message}`;
          if (Object.keys(rest).length > 0) {
            logMessage += `\n${JSON.stringify(rest, null, 2)}`;
          }
          return logMessage;
        })
      )
    }),
    // File output - errors
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error' 
    }),
    // File output - all logs
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log') 
    })
  ]
});

module.exports = logger;
