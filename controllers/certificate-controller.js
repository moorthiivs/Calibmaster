const logger = require("../utils/logger");
const Certificate = require("../models").Certificate;
const config = require("../utils/config");

const { errorHandler } = require("../helpers/error-handler");
var fs = require("fs");
const certificateUploadHandler = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/certificate/upload";
  let action = "Upload Certificate";
  let message = `${ip} ${code} ${path} - ${action}`;
  const file = req.file;
  const folderName1DirUp = "./certificates";
  //console.log(JSON.parse(req.body.item));
  const item = JSON.parse(req.body.item);
  try {
    if (!fs.existsSync(folderName1DirUp)) {
      fs.mkdirSync(folderName1DirUp);
    }
  } catch (err) {
    console.error(err);
  }
  fs.rename(
    folderName1DirUp + "/" + file.originalname,
    folderName1DirUp + "/" + req.body.filename,
    function (err) {
      if (err) console.log("ERROR: " + err);
    }
  );
  if (!file) {
    const code = 400;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  if (file.mimetype !== "application/pdf") {
    const code = 400;

    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  try {
    const newCertificate = new Certificate({
      fileName: req.body.filename,
      rstatus: 1,
      srfitemId: item.id,
    });
    const result = await newCertificate.save();
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  logger.info(message);
  res.status(200).json({
    status: "SUCCESS",
    message: "File Uploaded Successfully!!",
    code: 200,
  });
};

exports.certificateUploadHandler = certificateUploadHandler;
