const jwt = require("jsonwebtoken");
const { errorHandler } = require("../helpers/error-handler");
const config = require("../utils/config");

module.exports = (req, res, next) => {
  try {
    //console.log(req.headers.authorization);
    const token = req.headers.authorization.split(" ")[1];
    const sessionId = token.split(".")[2];
    if (!token) {
      code = 401;
      action = "Unauthoried - Token not Found!!";
      const error = new Error(action);
      error.code = code;
      error.path = "Authorization";
      errorHandler(error, req, res, next);
    }
    const decodedToken = jwt.verify(token, config.TOKEN_SECRET);
    //console.log(decodedToken);
    req.userId = decodedToken.userId;
    req.sessionId = sessionId;
    req.department = decodedToken.department;
    next();
  } catch (err) {
    code = 401;
    action = "Error while Decoding Token!!";
    const error = new Error(action);
    error.code = code;
    error.path = "Authorization";
    errorHandler(error, req, res, next);
  }
};
