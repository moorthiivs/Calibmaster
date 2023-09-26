const logger = require("../utils/logger");
const { errorHandler } = require("../helpers/error-handler");
const newLabSchema = require("../schemas/lab");
const Lab = require("../models").Lab;
const User = require("../models").User;
const bcrypt = require("bcryptjs");
const emailconfigSchema = require("../schemas/emailconfig");
const nodeMailer = require("nodemailer");
const crypto = require("crypto");
const config = require("../utils/config");
var request = require("request");
const { Sequelize } = require('sequelize');
var fs = require('fs');

const addlab = async (req, res, next) => {

  if (req.department != "root") {
    let action = "Unauthorized Access !!!";
    const error = new Error(action);
    error.code = 401;
    error.path = "/api/lab/listing";
    return errorHandler(error, req, res, next);
  }

  const valid = newLabSchema(req.body);

  if (valid) {
    let action = "All fields are required";
    const error = new Error(action);
    error.code = 500;
    error.path = "/api/lab/listing";
    return errorHandler(error, req, res, next);
  }

  let {
    lab_name,
    address1,
    address2,
    address3,
    city,
    state,
    country,
    pincode,

    lab_website,
    contact_email,
    contact_number1,
    contact_number2,

    symbol,

    email_smtp_server_host,
    email_smtp_server_port,
    sender_email,
    sender_password,

    gst_number,

    brand_logo_filename,
    brand_logo_mime_type,
    brand_logo,

    other_logo1_image_filename,
    other_logo1_image_mime_type,
    other_logo1_image,

    other_logo2_image_filename,
    other_logo2_image_mime_type,
    other_logo2_image,

    adminName,
    adminEmail,
    adminPassword,

    MainLogo,
    secondLogo,
    thirdLogo

  } = req.body;

  // checking non required for values
  address2 = (address2 != "") ? address2 : null;
  address3 = (address3 != "") ? address3 : null;
  symbol = (symbol) ? symbol : null;
  email_smtp_server_host = (email_smtp_server_host != "") ? email_smtp_server_host : null;
  email_smtp_server_port = (email_smtp_server_port != "") ? email_smtp_server_port : null;
  sender_email = (sender_email != "") ? sender_email : null;
  sender_password = (sender_password != "") ? sender_password : null;

  function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};

    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
  }

  let mainLogoImgFileName;
  let buff1 = "";
  if (MainLogo) {
    buff1 = new Buffer(brand_logo.split(",")[1], "base64");
    const mainLogoDecodeImg = decodeBase64Image(MainLogo);
    const imageBuffer = mainLogoDecodeImg.data;
    const fileExtension = mainLogoDecodeImg.type.slice(6);
    mainLogoImgFileName = Math.floor(Math.random() * 9999999) + "." + fileExtension;

    try {
      fs.writeFileSync("public/images/" + mainLogoImgFileName, imageBuffer, 'utf8');
    }
    catch (err) {
      console.error(err)
    }
  } else {
    mainLogoImgFileName = "";
  }

  let secondLogoImgFileName;
  let buff2 = "";
  if (secondLogo) {
    buff2 = new Buffer(other_logo1_image.split(",")[1], "base64");
    const mainLogoDecodeImg = decodeBase64Image(secondLogo);
    const imageBuffer = mainLogoDecodeImg.data;
    const fileExtension = mainLogoDecodeImg.type.slice(6);
    secondLogoImgFileName = Math.floor(Math.random() * 9999999) + "." + fileExtension;

    try {
      fs.writeFileSync("public/images/" + secondLogoImgFileName, imageBuffer, 'utf8');
    }
    catch (err) {
      console.error(err)
    }
  } else {
    secondLogoImgFileName = "";
  }

  let thirdLogoImgFileName;
  let buff3 = "";
  if (thirdLogo) {
    buff3 = new Buffer(other_logo2_image.split(",")[1], "base64");
    const mainLogoDecodeImg = decodeBase64Image(thirdLogo);
    const imageBuffer = mainLogoDecodeImg.data;
    const fileExtension = mainLogoDecodeImg.type.slice(6);
    thirdLogoImgFileName = Math.floor(Math.random() * 9999999) + "." + fileExtension;

    try {
      fs.writeFileSync("public/images/" + thirdLogoImgFileName, imageBuffer, 'utf8');
    }
    catch (err) {
      console.error(err)
    }
  } else {
    thirdLogoImgFileName = "";
  }

  try {

    //Checking lab in Database
    var existingLab = await Lab.findOne(
      { where: { contact_email, rstatus: 1 } }
    );

    if (existingLab) {
      let action = "Lab Already Exists!!";
      const error = new Error(action);
      error.code = 401;
      error.path = "/api/lab/listing";
      return errorHandler(error, req, res, next);
    }

    //Checking user in Database
    var existingUser = await User.findOne({
      where: { email: adminEmail, rstatus: 1 },
    });

    if (existingUser) {
      let action = "User Already Exists!!";
      const error = new Error(action);
      error.code = 401;
      error.path = "/api/lab/listing";
      return errorHandler(error, req, res, next);
    }

    const fetchCreater = await User.findOne({
      where: { id: req.userId }
    });

    const newLab = new Lab({
      lab_name,

      address1,
      address2,
      address3,

      city,
      state,
      country,
      pincode,

      lab_website,
      contact_email,
      contact_number1,
      contact_number2,

      symbol,

      email_smtp_server_host,
      email_smtp_server_port,
      sender_email,
      sender_password,

      gst_number,

      brand_logo_filename: mainLogoImgFileName,
      brand_logo_mime_type,
      brand_logo: buff1,

      other_logo1_image_filename: secondLogoImgFileName,
      other_logo1_image_mime_type,
      other_logo1_image: buff2,

      other_logo2_image_filename: thirdLogoImgFileName,
      other_logo2_image_mime_type,
      other_logo2_image: buff3,

      rstatus: 1,
      lab_active_flag: 1,

      created_timestamp: Date.now(),
      created_by_login_name: fetchCreater.name,
      created_by_user_id: req.userId,

      updated_timestamp: Date.now(),
      effective_start_date: Date.now() + 1000 * 60 * 60 * 24 * 364 * 3000,
      effective_end_date: Date.now() + 1000 * 60 * 60 * 24 * 364 * 3000,
    });

    const result = await newLab.save();
    let createdlab = result.dataValues;

    var hashedPassword = await bcrypt.hash(adminPassword, 12);

    var newUser = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      department: "admin",
      labId: createdlab.lab_id,
      rstatus: 1,
    });

    await newUser.save();

    return res.status(200).json(result);

  } catch (err) {
    console.log("while creating lab");
    console.log(err);

    let action = "Failed to create new Lab";
    const error = new Error(action);
    error.code = 500;
    error.path = "/api/lab/listing";
    return errorHandler(error, req, res, next);
  }
};

const fetchLab = async (req, res, next) => {

  const labId = req.params.id;

  if (!labId) {
    let action = "lab id is required";
    const error = new Error(action);
    error.code = 500;
    error.path = "/api/lab/fetchLab/id";
    return errorHandler(error, req, res, next);
  }

  try {

    let lab = await Lab.findOne(
      { where: { lab_id: labId } }
    );

    res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "Lab Fetched Successfully!!",
      data: lab
    });

  } catch (err) {

    let action = "Failded to fetch Lab";
    const error = new Error(action);
    error.code = 500;
    error.path = "/api/lab/fetchLab/id";
    return errorHandler(error, req, res, next);
  }
}

const testmailhandler = async (req, res, next) => {
  //AJV Validation
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/lab/testmail";
  let action = "Sending Test mail!!";
  let sessionId = req.sessionId;
  const userId = req.userId;
  //console.log(req.body);
  const valid = emailconfigSchema(req.body.emailconfig);
  let isError = false;

  //Checking Admin User If not return Error Response
  const isadmin = req.department == "admin";
  if (!isadmin) {
    isError = true;
    code = 401;
    action = "Unauthorized Usage!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  if (!valid) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  const { email, password, host, port, remail } = req.body.emailconfig;
  const html = `
<h1>CalibMaster</h1>
<p>This is a Test mail sent by ${email}</p>`;
  const transporter = nodeMailer.createTransport({
    name: "CalibMaster",
    host: host,
    port: port,
    secure: true,
    auth: {
      user: email,
      pass: password,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: email,
      to: remail,
      subject: "Testing mail from CalibMaster",
      html: html,
      priority: "high",
    });
  } catch (err) {
    isError = true;
    code = 400;
    action = "Invalid Credentials!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;

  logger.info(message);
  res.status(code).json({
    status: "SUCCESS",
    code: code,
    message: "Testmail Sent Successfully!!",
  });
};

const emailconfigHandler = async (req, res, next) => {
  //AJV Validation
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/lab/emailconfig";
  let action = "Updating Email Configuration!!";
  let sessionId = req.sessionId;
  const userId = req.userId;
  //console.log(req.body);
  const valid = emailconfigSchema(req.body.emailconfig);
  let isError = false;

  //Checking Admin User If not return Error Response
  const isadmin = req.department == "admin";
  if (!isadmin) {
    isError = true;
    code = 401;
    action = "Unauthorized Usage!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  if (!valid) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  const { email, password, host, port } = req.body.emailconfig;
  const { labId } = req.body;

  const encrypted = Buffer.from(password).toString("base64");
  //const decrypted = Buffer.from(encrypted, "base64").toString("ascii");
  //console.log(encrypted);
  //console.log(decrypted);
  let updatedlab;
  try {
    updatedlab = await Lab.update(
      { senderEmail: email, senderPassword: encrypted, host: host, port: port },
      { where: { id: labId, rstatus: 1 } }
    );
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //console.log(updatedlab);
  let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;

  logger.info(message);
  res.status(code).json({
    status: "SUCCESS",
    code: code,
    message: "Email Configuration updated Successfully!!",
  });
};

const getAllLabs = async (req, res, next) => {

  let LabList;

  try {
    LabList = await Lab.findAll({
      order: [
        ['lab_id', 'DESC'],
      ]
    });

  } catch (err) {
    // console.log(err);
    let action = "Internal Server Error!!";
    const error = new Error(action);
    error.code = 500;
    error.path = "/api/lab/listing";

    return errorHandler(error, req, res, next);
  }

  res.status(200).json({
    status: "SUCCESS",
    code: 200,
    message: "Labs Fetched Successfully!!",
    data: LabList
  });
}

exports.addlab = addlab;
exports.fetchLab = fetchLab;
exports.testmailhandler = testmailhandler;
exports.emailconfigHandler = emailconfigHandler;
exports.getAllLabs = getAllLabs;
