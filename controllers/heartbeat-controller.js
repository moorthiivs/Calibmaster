const logger = require("../utils/logger");

const heartbeatHandler = (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/heartbeat/check";
  let action = "Get Heartbeat";
  let message = `${ip} ${code} ${path} - ${action}`;
  logger.info(message);
  res.status(code).json({ status: "available" });
};

exports.heartbeatHandler = heartbeatHandler;
