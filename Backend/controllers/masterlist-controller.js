const logger = require("../utils/logger");
const { errorHandler } = require("../helpers/error-handler");
const newMasterlistSchema = require("../schemas/masterlist");
const Masterlist = require("../models").Masterlist;

const addcomponent = async (req, res, next) => {
  //AJV Validation
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/masterlist/addcomponent";
  let action = "Adding New Masterlist Item!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  const valid = newMasterlistSchema(req.body);
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

  const { name, labId, units } = req.body;

  //Checking Company in Database
  let existingItem;
  try {
    existingItem = await Masterlist.findOne({
      where: { name: name, labId: labId, rstatus: 1 },
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

  //If Item already exists return Error Response
  if (existingItem) {
    isError = true;
    code = 401;
    action = "Masterlist Item Already Exists!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  try {
    const createdItem = new Masterlist({
      name,
      units,
      labId,
      rstatus: 1,
    });
    const newitem = await createdItem.save();
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  let masterList;
  try {
    masterList = await Masterlist.findAll({
      where: {
        labId: labId,
        rstatus: 1,
      },
      order: [["name", "ASC"]],
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
      data: masterList,
      message: "Masterlist Item Added Successfully",
    });
  }
};

const getMasterlist = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/masterlist/getall";
  let action = "Get Masterlist items!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  let masterList;
  const { labId } = req.body;
  try {
    masterList = await Masterlist.findAll({
      where: {
        labId: labId,
        rstatus: 1,
      },
      order: [["name", "ASC"]],
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
      message: "Masterlist Fetched Successfully!!",
      data: masterList,
    });
  }
};

const updatecomponent = async (req, res, next) => {
  //AJV Validation
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/masterlist/updatecomponent";
  let action = "Updating Masterlist Item!!";
  let userId = req.userId;
  const sessionId = req.sessionId;

  let isError = false;
  if (!req.body.masterlistId || !req.body.labId || !req.body.name) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  const { name, labId, masterlistId } = req.body;
  //Checking Company in Database
  let existingItem;
  try {
    existingItem = await Masterlist.findOne({
      where: {
        labId: labId,
        name: name,
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
  //If Item exists return Error Response
  if (existingItem) {
    isError = true;
    code = 401;
    action = "Masterlist Item with this name already Exists!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  try {
    const updateItem = await Masterlist.findOne({
      where: {
        labId: labId,
        id: masterlistId,
        rstatus: 1,
      },
    });
    const newitem = await updateItem.update({ name: name });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  let masterList;
  try {
    masterList = await Masterlist.findAll({
      where: {
        labId: labId,
        rstatus: 1,
      },
      order: [["name", "ASC"]],
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
      data: masterList,
      message: "Masterlist Item Updated Successfully",
    });
  }
};

const deletecomponent = async (req, res, next) => {
  //AJV Validation
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/masterlist/deletecomponent";
  let action = "Deleting Masterlist Item!!";
  let userId = req.userId;
  const sessionId = req.sessionId;

  let isError = false;
  if (!req.body.masterlistId || !req.body.labId) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  const { labId, masterlistId } = req.body;
  //Checking Company in Database
  let existingItem;
  try {
    existingItem = await Masterlist.findOne({
      where: { labId: labId, id: masterlistId, rstatus: 1 },
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
  //If Item not exists return Error Response
  if (!existingItem) {
    isError = true;
    code = 401;
    action = "Masterlist Item doesn't Exists!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  try {
    const newitem = await existingItem.update({ rstatus: 0 });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  let masterList;
  try {
    masterList = await Masterlist.findAll({
      where: {
        labId: labId,
        rstatus: 1,
      },
      order: [["name", "ASC"]],
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
      data: masterList,
      message: "Masterlist Item Deleted Successfully",
    });
  }
};

const testController = async (req, res) => {

  const newMasterlist = await Masterlist.create({
    name: "Jane",
    units: ["cm"],
    rstatus: 1
  });

  await newMasterlist.save();

  res.json({
    msg: "Test Controller",
    newMasterlist
  });
}

exports.addcomponent = addcomponent;
exports.getMasterlist = getMasterlist;
exports.updatecomponent = updatecomponent;
exports.deletecomponent = deletecomponent;
exports.testController = testController;
