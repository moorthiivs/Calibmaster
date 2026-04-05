const logger = require("../utils/logger");

const errorHandler = (error, req, res, next) => {

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userId = req.userId;
  const sessionId = req.sessionId;
  const code = error.code;
  const path = error.path;
  const action = error.message;
  let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
  logger.error(message);

  return res.status(code).json({
    status: "FAILURE",
    message: error.message,
    code: error.code,
  });
};

exports.errorHandler = errorHandler;
