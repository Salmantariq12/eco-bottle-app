const winston = require('winston');
const path = require('path');

const logLevel = process.env.LOG_LEVEL || 'info';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level}] ${message} `;
        if (Object.keys(metadata).length > 0) {
          msg += JSON.stringify(metadata);
        }
        return msg;
      })
    )
  })
];

if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: logFormat
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: logFormat
    })
  );
}

const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports
});

logger.stream = {
  write: function(message) {
    logger.info(message.trim());
  }
};

module.exports = logger;