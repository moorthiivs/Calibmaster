const logger = require("../utils/logger");

const errorHandler = (error, req, res, next) => {

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userId = req.userId;
  const sessionId = req.sessionId;
  const code = error.code || 500;
  const path = error.path;
  const action = error.message;
  let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
  logger.error(message);

  // Ensure the code is a valid HTTP status code
  const statusCode = (typeof code === 'number' && code >= 100 && code <= 599) ? code : 500;

  return res.status(statusCode).json({
    status: "FAILURE",
    message: error.message,
    code: error.code,
  });
};

exports.errorHandler = errorHandler;
