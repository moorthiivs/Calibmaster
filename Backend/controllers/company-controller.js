const logger = require("../utils/logger");
const { errorHandler } = require("../helpers/error-handler");
const companySchema = require("../schemas/company");
const Company = require("../models").Company;
var request = require("request");
const config = require("../utils/config");

const newcompanyHandler = async (req, res, next) => {

  const {
    companyname, email, address1, address2, address3, labId
  } = req.body;

  if (!companyname || !email || !address1 || !address2 || !address3 || !labId) {
    let action = "All fields are required";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  //Checking Company in Database
  let existingCompany = await Company.findOne({
    where: { email: email, labId: labId, rstatus: 1 }
  });

  //If company already exists return Error Response
  if (existingCompany) {
    let action = "This company already exists";
    const error = new Error(action);
    error.code = 500;
    error.path = "/api/uom/create";
    return errorHandler(error, req, res, next);
  } else {
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

      res.status(200).json({
        status: "SUCCESS",
        data: newcompany,
        message: "Company Added Successfully",
      });
      req.body.id = newcompany.dataValues.id;
    } catch (err) {
      let action = "Something went wrong";
      const error = new Error(action);
      error.code = 500;
      return errorHandler(error, req, res, next);
    }
  }
};

const getallCompanies = async (req, res, next) => {

  const { labId } = req.body;

  try {
    let companiesList = await Company.findAll({
      where: {
        labId: labId,
        rstatus: 1,
      },
    });

    res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "Companies Fetched Successfully!!",
      data: companiesList,
    });
  } catch (err) {
    console.log(err);
    let action = "Internal Server Error!!!";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};

exports.newcompanyHandler = newcompanyHandler;
exports.getallCompanies = getallCompanies;
