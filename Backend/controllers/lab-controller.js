const logger = require("../utils/logger");
const { errorHandler } = require("../helpers/error-handler");
const newLabSchema = require("../schemas/lab");
const Lab = require("../models").Lab;
const User = require("../models").User;
const Role = require("../models").Role;
const RolePermission = require("../models").RolePermission;
const { DEFAULT_ROLES } = require("../utils/default-roles");
const bcrypt = require("bcryptjs");
const emailconfigSchema = require("../schemas/emailconfig");
const nodeMailer = require("nodemailer");
const crypto = require("crypto");
const config = require("../utils/config");
var request = require("request");
const { Sequelize } = require('sequelize');
var fs = require('fs');
const { getBase64Image } = require("../helpers/image-decoded-handler");
const { createDynamicTransport } = require('../helpers/mail-config-helper');
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
    thirdLogo,

    sealLogo,
    nablLogo,

    nabl_qr_Code_logo_1, nableURL_1,
    nabl_qr_Code_logo_2, nableURL_2
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

  // *** Brand Logo ***
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

  // *** Other Brand Logo 1 ***
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

  // *** Other Brand Logo 2 ***
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

  // *** Seal Logo ***
  let sealLogoImgFileName;
  if (sealLogo) {
    const sealLogoDecodeImg = decodeBase64Image(sealLogo);
    const imageBuffer = sealLogoDecodeImg.data;
    const fileExtension = sealLogoDecodeImg.type.slice(6);
    sealLogoImgFileName = Math.floor(Math.random() * 9999999) + "." + fileExtension;

    try {
      fs.writeFileSync("public/images/" + sealLogoImgFileName, imageBuffer, 'utf8');
    }
    catch (err) {
      console.error(err)
    }
  } else {
    sealLogoImgFileName = "";
  }

  let nablLogoImgFileName;
  if (nablLogo) {
    const nablLogoDecodeImg = decodeBase64Image(nablLogo);
    const imageBuffer = nablLogoDecodeImg.data;
    const fileExtension = nablLogoDecodeImg.type.slice(6);
    nablLogoImgFileName = Math.floor(Math.random() * 9999999) + "." + fileExtension;

    try {
      fs.writeFileSync("public/images/" + nablLogoImgFileName, imageBuffer, 'utf8');
    }
    catch (err) {
      console.error(err)
    }
  } else {
    nablLogoImgFileName = "";
  }

  // *** QR CODE Logo-1 ***
  let qr_codo_logo_1;
  if (nabl_qr_Code_logo_1) {
    const decodeImage = decodeBase64Image(nabl_qr_Code_logo_1);
    const imageBuffer = decodeImage.data;
    const fileExtension = decodeImage.type.slice(6);
    qr_codo_logo_1 = Math.floor(Math.random() * 9999999) + "." + fileExtension;

    try {
      fs.writeFileSync("public/images/" + qr_codo_logo_1, imageBuffer, 'utf8');
    }
    catch (err) {
      console.error(err)
    }
  } else {
    qr_codo_logo_1 = "";
  }

  // *** QR CODE Logo-2 ***
  let qr_codo_logo_2;
  if (nabl_qr_Code_logo_2) {
    const decodeImage = decodeBase64Image(nabl_qr_Code_logo_2);
    const imageBuffer = decodeImage.data;
    const fileExtension = decodeImage.type.slice(6);
    qr_codo_logo_2 = Math.floor(Math.random() * 9999999) + "." + fileExtension;

    try {
      fs.writeFileSync("public/images/" + qr_codo_logo_2, imageBuffer, 'utf8');
    }
    catch (err) {
      console.error(err)
    }
  } else {
    qr_codo_logo_2 = "";
  }

  try {

    var calibmaster_lab_id = new Date().getTime();
    req.body.calibmaster_lab_id = calibmaster_lab_id;

    //Checking lab in Database
    var existingLab = await Lab.findOne(
      { where: { contact_email, rstatus: 1 } }
    );

    if (existingLab) {
      let action = "This Contact Email is Already Associate with another lab";
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

    // Set Lab Create with body Request for Customer Portal
    req.body.created_timestamp = Date.now();
    req.body.created_by_login_name = fetchCreater.name;
    req.body.created_by_user_id = req.userId;
    req.body.updated_timestamp = Date.now();
    req.body.effective_start_date = Date.now() + 1000 * 60 * 60 * 24 * 364 * 3000;
    req.body.effective_end_date = Date.now() + 1000 * 60 * 60 * 24 * 364 * 3000;

    const newLab = new Lab({
      lab_name,
      calibmaster_lab_id,

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

      seal_image_filename: sealLogoImgFileName,
      nabl_logo_filename: nablLogoImgFileName,

      rstatus: 1,
      lab_active_flag: 1,

      certificate_accreditation_qr_code_logo_1: qr_codo_logo_1,
      certificate_accreditation_url_1: nableURL_1,

      scope_accreditation_qr_code_logo_2: qr_codo_logo_2,
      scope_accreditation_url_2: nableURL_2,

      created_timestamp: Date.now(),
      created_by_login_name: fetchCreater.name,
      created_by_user_id: req.userId,

      updated_timestamp: Date.now(),
      effective_start_date: Date.now() + 1000 * 60 * 60 * 24 * 364 * 3000,
      effective_end_date: Date.now() + 1000 * 60 * 60 * 24 * 364 * 3000,
    });

    const result = await newLab.save();
    let createdlab = result.dataValues;

    // *** Create Default Roles and Permissions ***
    let adminRoleId = null;
    for (const roleDef of DEFAULT_ROLES) {
      const newRole = await Role.create({
        name: roleDef.name,
        permissions: roleDef.permissions,
        lab_id: createdlab.lab_id,
        bypassPermissions: roleDef.name.toLowerCase() === 'admin',
        createdBy: req.userId,
        updatedBy: req.userId
      });

      if (roleDef.name.toLowerCase() === 'admin') {
        adminRoleId = newRole.id;
      }

      // Add role permissions to junction table for normalization
      const rolePermissionsData = roleDef.permissions.map(perm => ({
        role_id: newRole.id,
        permission_key: perm
      }));
      await RolePermission.bulkCreate(rolePermissionsData);
    }

    // *** Forwarding the request to Customer Portal ***
    var clientServerOptions = {
      uri: config.CUSTOMER_PORTAL_SERVER + "/api/lab/new",
      body: JSON.stringify({ lab_id: createdlab.lab_id, ...req.body }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    request(clientServerOptions, function (err, response) {
      if (err) {
        console.log("Lab added in Customer Portal", err);
      }
    });

    var hashedPassword = await bcrypt.hash(adminPassword, 12);

    var newUser = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      department: "admin",
      labId: createdlab.lab_id,
      roleId: adminRoleId,
      rstatus: 1,
    });

    await newUser.save();

    return res.status(201).json({
      code: 201,
      status: true,
      msg: "Lab created successfully",
      result
    });

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

  const { labId } = req.body;

  if (!labId) {
    let action = "lab id is required";
    const error = new Error(action);
    error.code = 500;
    error.path = "/api/lab/fetchLab/id";
    return errorHandler(error, req, res, next);
  }

  try {

    let lab = await Lab.findOne(
      {
        where: { lab_id: labId },
        attributes: { exclude: ['brand_logo', 'other_logo1_image', 'other_logo2_image'] }
      }
    );

    return res.status(200).json({
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
    <p>This is a Test mail sent by ${email}</p>
  `;


  const transporter = createDynamicTransport(nodeMailer, host, port, email, password);

  try {
    const info = await transporter.sendMail({
      from: email,
      to: remail,
      subject: "Testing mail from CalibMaster",
      html: html,
      priority: "high",
    });
  } catch (err) {
    console.log("Mail send error:", err);
    isError = true;
    code = 400;
    action = err.message || "Invalid Credentials!!";
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

  try {
    let LabList = await Lab.findAll({
      order: [
        ['lab_id', 'ASC'],
      ]
    });

    let counter = 1;
    for (let i = 0; i < LabList.length; i++) {
      LabList[i].dataValues.slNo = counter++;
    }

    return res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "Labs Fetched Successfully!!",
      data: LabList
    });

  } catch (err) {
    console.log(err);
    let action = "Internal Server Error!!";
    const error = new Error(action);
    error.code = 500;
    error.path = "/api/lab/listing";
    return errorHandler(error, req, res, next);
  }
};

const fetchLabSmtpConfig = async (req, res, next) => {

  const { labId } = req.body;

  if (!labId) {
    const error = new Error("lab id is required");
    error.code = 500;
    error.path = "---";
    return errorHandler(error, req, res, next);
  }

  try {

    let lab = await Lab.findOne(
      {
        where: { lab_id: labId },
        attributes: {
          exclude: ['brand_logo', 'other_logo1_image', 'other_logo2_image']
        }
      }
    );

    return res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "Lab Fetched Successfully!!",
      data: lab
    });

  } catch (err) {
    const error = new Error("Failded to fetch Lab");
    error.code = 500;
    error.path = "---";
    return errorHandler(error, req, res, next);
  }
};

const updateLabSMTPConfig = async (req, res, next) => {

  try {

    const {
      lab_id, email_smtp_server_host, email_smtp_server_port, sender_email, sender_password
    } = req.body;

    if (!lab_id) {
      const error = new Error("Lab Id is required");
      error.code = 500;
      error.path = "---";
      return errorHandler(error, req, res, next);
    };

    if (!email_smtp_server_host || !email_smtp_server_port || !sender_email || !sender_password) {
      const error = new Error("All SMTP Fields are required");
      error.code = 500;
      error.path = "---";
      return errorHandler(error, req, res, next);
    };

    const result = await Lab.update(
      { email_smtp_server_host, email_smtp_server_port, sender_email, sender_password },
      { where: { lab_id } }
    );

    return res.status(200).json({
      success: true,
      msg: "SMTP Configuration updated successfully!!!",
      result
    });

  } catch (err) {
    const error = new Error("Failded to Update Lab SMTP");
    error.code = 500;
    error.path = "---";
    return errorHandler(error, req, res, next);
  }
};

const errorHandlerFLab = (error, req, res, next) => {
  console.error(`Error: ${error.message}`)
  res.status(error.code || 500).json({
    status: "FAIL",
    code: error.code || 500,
    message: error.message,
    path: error.path,
  })
}

const fetchLabById = async (req, res, next) => {
  const { labId } = req.body;

  // Check if labId is provided
  if (!labId) {
    let action = "Lab ID is required";
    const error = new Error(action);
    error.code = 400;
    error.path = "/api/lab/fetchLabById";
    return errorHandlerFLab(error, req, res, next);
  }

  try {
    // Fetch the lab data from the database
    let lab = await Lab.findOne({
      where: { lab_id: labId },
      attributes: [
        'lab_id',
        'lab_name',
        'calibmaster_lab_id',
        'address1',
        'address2',
        'address3',
        'city',
        'state',
        'country',
        'pincode',
        'lab_website',
        'contact_email',
        'contact_number1',
        'contact_number2',
        'symbol',
        'rstatus',
        'email_smtp_server_host',
        'email_smtp_server_port',
        'sender_email',
        'sender_password',
        'gst_number',
        'lab_active_flag',
        'brand_logo_filename',
        'brand_logo_mime_type',
        'brand_logo',
        'other_logo1_image_filename',
        'other_logo1_image_mime_type',
        'other_logo1_image',
        'other_logo2_image_filename',
        'other_logo2_image_mime_type',
        'other_logo2_image',
        'created_timestamp',
        'created_by_login_name',
        'created_by_user_id',
        'updated_timestamp',
        'updated_by_login_name',
        'updated_by_user_id',
        'effective_start_date',
        'effective_end_date'
      ]
    });

    // Handle case where lab is not found
    if (!lab) {
      let action = "Lab not found";
      const error = new Error(action);
      error.code = 404; // Not found error code
      error.path = "/api/lab/fetchLabById";
      return errorHandlerFLab(error, req, res, next);
    }

    // Fetch the brand logo in Base64 format
    let brand_logo_base64Image = null;
    try {
      brand_logo_base64Image = await getBase64Image(`public/images/${lab.brand_logo_filename}`);
    } catch (error) {
      console.error("Error reading brand logo image:", error);
    }

    // Return the response after all data is ready
    return res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "Lab Fetched Successfully!!",
      data: { lab, brand_logo_base64Image },
    });

  } catch (err) {
    console.error("Error fetching lab:", err); // Debugging log
    let action = "Failed to fetch Lab";
    const error = new Error(action);
    error.code = 500;
    error.path = "/api/lab/fetchLabById";
    return errorHandlerFLab(error, req, res, next);
  }
};

const deleteLab = async (req, res, next) => {
  const { labId, password } = req.body;

  // 1. Check if user is root
  if (req.department !== "root") {
    let action = "Unauthorized Access !!! Only root users can delete labs.";
    const error = new Error(action);
    error.code = 401;
    error.path = "/api/lab/delete";
    return errorHandlerFLab(error, req, res, next);
  }

  if (!labId || !password) {
    let action = "Lab ID and Password are required";
    const error = new Error(action);
    error.code = 400;
    error.path = "/api/lab/delete";
    return errorHandlerFLab(error, req, res, next);
  }

  try {
    // 2. Find the user by ID
    const user = await User.findOne({ where: { id: req.userId } });
    if (!user) {
      let action = "User not found";
      const error = new Error(action);
      error.code = 404;
      error.path = "/api/lab/delete";
      return errorHandlerFLab(error, req, res, next);
    }

    // 3. Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      let action = "Invalid Password";
      const error = new Error(action);
      error.code = 401;
      error.path = "/api/lab/delete";
      return errorHandlerFLab(error, req, res, next);
    }

    // 4. Manually delete related data to handle foreign key constraints

    // Start a transaction for safe deletion
    const t = await Lab.sequelize.transaction();

    try {
      const models = require("../models");

      // 4a. Delete deeply nested children (children of children)

      // RolePermissions
      const roles = await models.Role.findAll({ where: { lab_id: labId }, transaction: t });
      const roleIds = roles.map(r => r.id);
      if (roleIds.length > 0) {
        await models.RolePermission.destroy({ where: { role_id: roleIds }, transaction: t });
      }

      // Customer contacts
      const customers = await models.customer.findAll({ where: { lab_id: labId }, transaction: t });
      const customerIds = customers.map(c => c.customer_id);
      if (customerIds.length > 0) {
        if (models.customer_contact) {
          await models.customer_contact.destroy({ where: { customer_id: customerIds }, transaction: t });
        }
      }

      // Quotation contacts
      if (models.quotation_generation && models.quotation_customer_contact) {
        const quotes = await models.quotation_generation.findAll({ where: { lab_id: labId }, transaction: t });
        const quoteIds = quotes.map(q => q.quotation_detail_id);
        if (quoteIds.length > 0) {
          await models.quotation_customer_contact.destroy({ where: { quotation_detail_id: quoteIds }, transaction: t });
        }
      }

      // SRF items and their children
      if (models.srf_list && models.srfitem) {
        const srfs = await models.srf_list.findAll({ where: { lab_id: labId }, transaction: t });
        const srfIds = srfs.map(s => s.srf_id);
        if (srfIds.length > 0) {
          const srfItems = await models.srfitem.findAll({ where: { srf_id: srfIds }, transaction: t });
          const srfItemIds = srfItems.map(si => si.srf_item_id);

          if (srfItemIds.length > 0) {
            // Delete srfitem children first
            if (models.Certificate) await models.Certificate.destroy({ where: { srfitemId: srfItemIds }, transaction: t });
            if (models.procedureresult) await models.procedureresult.destroy({ where: { srf_item_id: srfItemIds }, transaction: t });
            if (models.srf_approval_history) await models.srf_approval_history.destroy({ where: { srf_item_id: srfItemIds }, transaction: t });

            if (models.master_result_table) {
              const mrTables = await models.master_result_table.findAll({ where: { srf_item_id: srfItemIds }, transaction: t });
              const mrtIds = mrTables.map(m => m.master_result_table_id);
              if (mrtIds.length > 0 && models.result_table) {
                await models.result_table.destroy({ where: { master_result_table_id: mrtIds }, transaction: t });
              }
              await models.master_result_table.destroy({ where: { srf_item_id: srfItemIds }, transaction: t });
            }

            // Delete srfitem
            await models.srfitem.destroy({ where: { srf_item_id: srfItemIds }, transaction: t });
          }
        }
      }

      // 4b. Explicitly delete in topological order to avoid Postgres transaction aborts

      // Level 1: Leaf nodes (depend on other lab items)
      if (models.procedure_uncertainties) {
        const procs = await models.master_design_procedure.findAll({ where: { lab_id: labId }, transaction: t });
        const procIds = procs.map(p => p.id);
        if (procIds.length > 0) {
          await models.procedure_uncertainties.destroy({ where: { master_design_procedure_id: procIds }, transaction: t });
        }
      }

      if (models.instrumentparameter) {
        const insts = await models.instrument.findAll({ where: { lab_id: labId }, transaction: t });
        const instIds = insts.map(i => i.id);
        if (instIds.length > 0) {
          await models.instrumentparameter.destroy({ where: { instrument_id: instIds }, transaction: t });
        }
      }

      // Level 2: Top-level children of Lab that don't have dependents (or depend on customer)
      if (models.quotation_generation) await models.quotation_generation.destroy({ where: { lab_id: labId }, transaction: t });
      if (models.srf_list) await models.srf_list.destroy({ where: { lab_id: labId }, transaction: t }); // srf_list depends on customer, so delete srf_list BEFORE customer
      if (models.customer) await models.customer.destroy({ where: { lab_id: labId }, transaction: t });

      // CalibmasterExcel depends on master_design_procedure
      if (models.CalibmasterExcel) {
        await models.CalibmasterExcel.destroy({ where: { labid: labId }, transaction: t }); // Note: labid not lab_id
      }

      // employee_masters (no Sequelize model exists for it, must use raw query)
      const [empTableExists] = await Lab.sequelize.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_masters');`,
        { transaction: t }
      );
      if (empTableExists && empTableExists[0] && empTableExists[0].exists) {
        await Lab.sequelize.query(`DELETE FROM "employee_masters" WHERE "lab_id" = :labId`, {
          replacements: { labId: labId },
          transaction: t
        });
      }

      if (models.User) await models.User.destroy({ where: { labId: labId }, transaction: t });
      if (models.MasterListEquipment) await models.MasterListEquipment.destroy({ where: { lab_id: labId }, transaction: t });
      if (models.eparameter) await models.eparameter.destroy({ where: { lab_id: String(labId) }, transaction: t }); // explicitly string to avoid postgres error
      if (models.cmssettings_permissions) await models.cmssettings_permissions.destroy({ where: { lab_id: labId }, transaction: t });
      if (models.CertificateFormat) await models.CertificateFormat.destroy({ where: { lab_id: labId }, transaction: t });
      if (models.ULRGeneration) await models.ULRGeneration.destroy({ where: { lab_id: labId }, transaction: t });

      // Check if tables exist before deleting to avoid Postgres "relation does not exist" errors aborting the transaction
      const safeDestroy = async (model, condition) => {
        try {
          // We don't want to use the transaction 't' here because if it fails, it aborts 't'.
          // So we actually shouldn't do this inside 't'. 
          // Instead, I will just remove the problematic tables that don't exist in the schema yet.
        } catch (e) { }
      }

      // Removed master_result_table, master_from_table, quotation_config, ulrgeneration, 
      // uncertainty_master_parameter, lab_bank_detail as they may not be synced in the DB yet.

      // Level 3: Inter-dependent instrument tables
      if (models.master_design_procedure) await models.master_design_procedure.destroy({ where: { lab_id: labId }, transaction: t });
      if (models.instrument_type) await models.instrument_type.destroy({ where: { lab_id: labId }, transaction: t });
      if (models.instrument) await models.instrument.destroy({ where: { lab_id: labId }, transaction: t });

      // Level 4: Roles (users and role permissions are already deleted)
      if (models.Role) await models.Role.destroy({ where: { lab_id: labId }, transaction: t });

      // 4d. Delete the lab
      const deletedCount = await Lab.destroy({ where: { lab_id: labId }, transaction: t });
      if (deletedCount === 0) {
        throw new Error("Lab not found or already deleted");
      }

      await t.commit();

      return res.status(200).json({
        status: "SUCCESS",
        code: 200,
        message: "Lab deleted successfully",
      });

    } catch (innerErr) {
      await t.rollback();
      throw innerErr;
    }

  } catch (err) {
    console.error("Error deleting lab:", err);
    let action = "Failed to delete Lab";
    const error = new Error(action);
    error.code = 500;
    error.path = "/api/lab/delete";
    return errorHandlerFLab(error, req, res, next);
  }
};

exports.addlab = addlab;
exports.fetchLab = fetchLab;
exports.testmailhandler = testmailhandler;
exports.emailconfigHandler = emailconfigHandler;
exports.getAllLabs = getAllLabs;
exports.fetchLabSmtpConfig = fetchLabSmtpConfig;
exports.updateLabSMTPConfig = updateLabSMTPConfig;
exports.fetchLabById = fetchLabById;
exports.deleteLab = deleteLab;
