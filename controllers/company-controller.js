const logger = require("../utils/logger");
const { errorHandler } = require("../helpers/error-handler");
const companySchema = require("../schemas/company");
const Company = require("../models").Company;
var request = require("request");
const config = require("../utils/config");

const newcompanyHandler = async (req, res, next) => {
  //AJV Validation
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/company/new";
  let action = "Adding New Company!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  const valid = companySchema(req.body);
  let isError = false;
  if (!valid) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  const { companyname, email, address1, address2, address3, labId } = req.body;
  console.log(req.body);
  //Checking Company in Database
  let existingCompany;
  try {
    existingCompany = await Company.findOne({
      where: { email: email, labId: labId, rstatus: 1 },
    });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //If company already exists return Error Response
  if (existingCompany) {
    isError = true;
    code = 401;
    action = "Company Already Exists!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  try {
    const createdCompany = new Company({
      companyname,
      email,
      address1,
      address2,
      address3,
      labId,
      rstatus: 1,
    });
    const newcompany = await createdCompany.save();
    req.body.id = newcompany.dataValues.id;
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  var clientServerOptions = {
    uri: config.CERTIFICATE_SERVER + "/api/company/new",
    body: JSON.stringify(req.body),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
  request(clientServerOptions, function (error, response) {
    if (error) {
      isError = true;
      code = 500;
      action = "Error while adding company in Certifymaster";
      const error = new Error(action);
      error.code = code;
      error.path = path;
      return errorHandler(error, req, res, next);
    }
  });
  //Retuning 200 response
  if (isError == false) {
    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);
    res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: "Company Added Successfully",
    });
  }
};

const getallCompanies = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/company/getall";
  let action = "Get all companies!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  let companiesList;
  const { labId } = req.body;

  try {
    companiesList = await Company.findAll({
      where: {
        labId: labId,
        rstatus: 1,
      },
    });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //Retuning 200 response
  if (isError == false) {
    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);
    res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: "Companies Fetched Successfully!!",
      data: companiesList,
    });
  }
};

exports.newcompanyHandler = newcompanyHandler;
exports.getallCompanies = getallCompanies;
