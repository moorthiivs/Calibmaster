const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const { errorHandler } = require("../helpers/error-handler");
const userSchema = require("../schemas/user");
const User = require("../models").User;
const config = require("../utils/config");
const bcrypt = require("bcryptjs");
const newUserSchema = require("../schemas/newuser");
const userwopassSchema = require("../schemas/userwopass");
const Lab = require("../models").Lab;
const Op = require("sequelize").Op;
const customer_contact = require("../models").customer_contact;
var request = require("request");

const login = async (req, res, next) => {
  //AJV Validation
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/users/login";
  let action = "Log In!!";
  let sessionId;
  const valid = userSchema(req.body);
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
  const { email, password } = req.body;

  //Checking user in Database
  let existingUser;
  try {
    if (email != "root@iviewsense.com") {
      existingUser = await User.findOne({
        where: { email: email },
        include: [
          {
            model: Lab,
            as: "lab",
            attributes: {
              exclude: [
                "createdAt",
                "updatedAt",
                "address",
                "email",
                "id",
                "contactNumber",
              ],
            },
          },
        ],
      });
    } else {
      existingUser = await User.findOne({
        where: { email: email },
      });
    }
  } catch (err) {
    console.log(err);
    isError = true;
    code = 500;
    action = "Internal Server Error!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //console.log(existingUser.lab.dataValues.limageData);

  //If user not exists return Error Response
  if (!existingUser || existingUser.dataValues.department == 'Client') {
    isError = true;
    code = 401;
    action = "Invalid Credentials!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  let isValidPassword;
  existingUser = existingUser.dataValues;

  //Checking Password
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //If Password Not Matching return Error Response
  if (!isValidPassword) {
    isError = true;
    code = 401;
    action = "Invalid Credentials!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  // If User account disabled return Error Response
  if (existingUser?.rstatus == 0) {
    isError = true;
    code = 401;
    action = "Your account has been disabled. Please contact the admin!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  let token;
  let userId = existingUser.id;

  //Creating Token
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        department: existingUser.department,
      },
      config.TOKEN_SECRET,
      { expiresIn: "10h" }
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

  //Retuning 200 response
  if (isError == false) {
    sessionId = token.split(".")[2];
    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);
    if (email != "root@iviewsense.com") {
      res.status(code).json({
        status: "SUCCESS",
        code: code,
        data: {
          userId: userId,
          token: token,
          name: existingUser.name,
          email: existingUser.email,
          department: existingUser.department,
          filename: existingUser.lab.dataValues.brand_logo_filename,
          image: existingUser.lab.dataValues.brand_logo,
          imgtype: existingUser.lab.dataValues.brand_logo_mime_type,
          labId: existingUser.labId,
        },
        message: "Login Success!!",
      });
    } else {
      res.status(code).json({
        status: "SUCCESS",
        code: code,
        data: {
          userId: userId,
          token: token,
          name: existingUser.name,
          email: existingUser.email,
          department: existingUser.department,
          labId: 0,
        },
        message: "Login Success!!",
      });
    }
  }
};

const adduser = async (req, res, next) => {

  //AJV Validation
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/users/adduser";
  let action = "Adding New User!!";
  let sessionId = req.sessionId;
  const userId = req.userId;
  const valid = newUserSchema(req.body);
  let isError = false;

  //Checking Admin User If not return Error Response
  const isadmin = req.department == "admin";

  if (!isadmin) {
    isError = true;
    code = 401;
    action = "Unauthorized to add user!!";
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

  const { name, email, password, department, labId } = req.body;

  const calibmaster_client_id = new Date().getTime();

  let companyId;
  if (department === "Client") {
    companyId = req.body.companyId;
  }

  // return res.json(req.body);

  //Checking user in Database
  let existingUser;
  try {
    existingUser = await User.findOne({ where: { email: email } });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //If user exists return Error Response
  if (existingUser) {
    isError = true;
    code = 401;
    action = "User Already Exists!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //Encrypting the password
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //Creating User in Database
  try {
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      department,
      rstatus: 1,
      labId,
      calibmaster_client_id,
      companyId
    });
    const result = await newUser.save();
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //Registering in Certifymaster if user is client user
  if (department === "Client") {

    req.body.calibmaster_client_id = calibmaster_client_id;

    var clientServerOptions = {
      uri: config.CUSTOMER_PORTAL_SERVER + "/api/users/adduser",
      body: JSON.stringify(req.body),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    request(clientServerOptions, function (error, response) {
      if (error) {
        console.log(error);
      }
    });
  }

  try {
    if (department == "Client") {
      let getlabDetail = await Lab.findOne({
        where: {
          lab_id: labId
        }
      });
      if (getlabDetail && getlabDetail?.email_smtp_server_host && getlabDetail?.email_smtp_server_port && getlabDetail?.sender_email && getlabDetail?.sender_password) {

        let getcustomerDetail = await customer_contact.findOne({
          where: {
            customer_id: companyId
          }
        })

        if (getcustomerDetail) {
          let getReceiverEmail = getcustomerDetail.dataValues.contact_email;

          const transporter = nodemailer.createTransport({
            name: "CalibMaster",
            host: getlabDetail?.email_smtp_server_host,
            port: getlabDetail?.email_smtp_server_port,
            secure: true,
            auth: {
              user: getlabDetail?.sender_email,
              pass: getlabDetail?.sender_password
            }
          });

          const mail_content = `
            <html lang="en">
              <head>
                <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Access Credentials for Customer Portal</title>
                    <style>
                      body {
                        font - family: 'Arial', sans-serif;
                        background-color: #f8f9fa;
                        margin: 0;
                        padding: 0;
                        color: #333;
                      }
                      .margin-zero{
                        margin: 0;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="mail-container">
                      <p>Dear ${getcustomerDetail?.dataValues?.contact_fullname || 'Customer'},</p>

                      <p>Please find your credentials to access the Customer Portal below:</p>

                      <p class="margin-zero"><b>User ID:</b> ${email}<br /><b>Password:</b> ${password}</p>

                      <p><a href="${config.CUSTOMER_PORTAL_SERVER}" style="color: #007bff; text-decoration: none;">Click here to access the Customer Portal</a></p>

                      <p>If you experience any issues or need assistance, feel free to reach out to our lab team.</p>

                      <p class="margin-zero">Best regards,<br />${getlabDetail?.lab_name}</p>
                      <div>
                      </body>
                    </html>`;

          const info = await transporter.sendMail({
            from: getlabDetail?.sender_email,
            to: getReceiverEmail,
            subject: "Important: Customer Portal - Access ID",
            html: mail_content,
            headers: {
              'X-Priority': '1',
              'Importance': 'high',
            }
          });
        }
      }
    }
  } catch (err) {
    console.log(err);
    isError = true;
    code = 500;
    action = "Error while sending client ID and Password";
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
      message: "User Added Successfully!!",
    });
  }
};

const getAllUsers = async (req, res, next) => {

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/users/getall";
  let action = "Get All Users!!";
  let sessionId = req.sessionId;
  let userId = req.userId;
  let isError = false;
  let users;
  const { labId } = req.body;

  if (!labId) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

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

  //Getting All Users
  try {
    users = await User.findAll({
      where: {
        department: { [Op.ne]: "admin" },
        // rstatus: 1,
        labId: labId,
      },
      attributes: { exclude: ["password", "createdAt", "updatedAt"] },
      order: [["id", "ASC"]],
    });


    let counter = 1;
    for (let i = 0; i < users.length; i++) {
      users[i].dataValues.slNo = counter++;
      // console.log(counter++);
    }

    // users[0].dataValues.slNo = 100;
    // console.log(users[0].dataValues);

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
      data: users,
      message: "Users Fetched Successfully!!",
    });
  }
};

const getuserbyid = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/users/getuserbyid";
  let action = "Get User by Id!!";
  let sessionId = req.sessionId;
  let userId = req.userId;
  let isError = false;
  let user;
  //Checking Admin User If not return Error Response
  const isadmin = req.department == "admin";
  if (!isadmin) {
    isError = true;
    code = 401;
    action = "User Already Exists!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //If userId not exists in body return Error Response
  if (!req.body.userId) {
    isError = true;
    code = 401;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //Getting User by Id
  try {
    user = await User.findOne({
      where: { id: req.body.userId },
      attributes: { exclude: ["password", "createdAt", "updatedAt"] },
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
      data: user,
      message: "User Fetched Successfully!!",
    });
  }
};

const updateuser = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/users/getuserbyid";
  let action = "Get User by Id!!";
  let sessionId = req.sessionId;
  let userId = req.userId;

  let valid;
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

  if (req.body.password) {
    valid = newUserSchema(req.body);
  } else {
    valid = userwopassSchema(req.body);
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
  //Checking user in Database
  let existingUser;
  try {
    existingUser = await User.findOne({
      where: { id: req.body.userId, rstatus: 1, labId: req.body.labId },
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
  //If user not exists return Error Response
  if (!existingUser) {
    isError = true;
    code = 401;
    action = "User not Exists!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  let hashedPassword;
  if (req.body.password) {
    //Encrypting the password
    try {
      hashedPassword = await bcrypt.hash(req.body.password, 12);
    } catch (err) {
      isError = true;
      code = 500;
      action = "Internal Server Error!!";
      const error = new Error(action);
      error.code = code;
      error.path = path;
      return errorHandler(error, req, res, next);
    }
    try {
      await existingUser.update({
        name: req.body.name,
        email: req.body.email,
        department: req.body.department,
        password: hashedPassword,
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
  } else {
    try {
      await existingUser.update({
        name: req.body.name,
        email: req.body.email,
        department: req.body.department,
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
  }
  let users;
  //Getting All Users
  try {
    users = await User.findAll({
      where: {
        department: { [Op.ne]: "admin" },
        rstatus: 1,
        labId: req.body.labId,
      },
      attributes: { exclude: ["password", "createdAt", "updatedAt"] },
      order: [["id", "ASC"]],
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
      data: users,
      message: "User updated Successfully!!",
    });
  }
};

const enableuser = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/users/enableuserbyid";
  let action = "enable User by Id!!";
  let sessionId = req.sessionId;
  let userId = req.userId;
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

  if (!req.body.userId && !req.body.labId) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //Checking user in Database
  let existingUser;
  try {
    existingUser = await User.findOne({
      where: { id: req.body.userId, rstatus: 0, labId: req.body.labId },
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
  //If user not exists return Error Response
  if (!existingUser) {
    isError = true;
    code = 401;
    action = "User not Exists!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  try {
    existingUser.update({ rstatus: 1 });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  // To update CUSTOMER_PORTAL_SERVER
  const { calibmaster_client_id, department } = existingUser;

  if (department == 'Client') {
    var clientServerOptions = {
      uri: config.CUSTOMER_PORTAL_SERVER + "/api/users/enable-disable-user",
      body: JSON.stringify({ calibmaster_client_id, enable_disable: 1 }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    request(clientServerOptions, function (error, response) {
      if (error) {
        console.log(error);
      }
    });
  }

  let users;
  //Getting All Users
  try {
    users = await User.findAll({
      where: {
        department: { [Op.ne]: "admin" },
        id: { [Op.ne]: existingUser.id },
        rstatus: 1,
        labId: req.body.labId,
      },
      attributes: { exclude: ["password", "createdAt", "updatedAt"] },
      order: [["id", "ASC"]],
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
      data: users,
      message: "User deleted Successfully!!",
    });
  }
};

const disableuser = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/users/disableuserbyid";
  let action = "Disable User by Id!!";
  let sessionId = req.sessionId;
  let userId = req.userId;
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

  if (!req.body.userId && !req.body.labId) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //Checking user in Database
  let existingUser;
  try {
    existingUser = await User.findOne({
      where: { id: req.body.userId, rstatus: 1, labId: req.body.labId },
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
  //If user not exists return Error Response
  if (!existingUser) {
    isError = true;
    code = 401;
    action = "User not Exists!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  try {
    existingUser.update({ rstatus: 0 });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  // To update CUSTOMER_PORTAL_SERVER
  const { calibmaster_client_id, department } = existingUser;

  if (department == 'Client') {
    var clientServerOptions = {
      uri: config.CUSTOMER_PORTAL_SERVER + "/api/users/enable-disable-user",
      body: JSON.stringify({ calibmaster_client_id, enable_disable: 0 }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    request(clientServerOptions, function (error, response) {
      if (error) {
        console.log(error);
      }
    });
  }

  let users;
  //Getting All Users
  try {
    users = await User.findAll({
      where: {
        department: { [Op.ne]: "admin" },
        id: { [Op.ne]: existingUser.id },
        rstatus: 1,
        labId: req.body.labId,
      },
      attributes: { exclude: ["password", "createdAt", "updatedAt"] },
      order: [["id", "ASC"]],
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
      data: users,
      message: "User deleted Successfully!!",
    });
  }
};

const resetPassword = async (req, res, next) => {

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/users/reset-password";
  let action = "Reset Password by UserId!!";
  let sessionId = req.sessionId;

  const { password, confirmPassword, userId } = req.body;

  if (!password || !confirmPassword || !userId) {
    let action = "All fields are required";
    const error = new Error(action);
    error.code = 500;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  if (password.length < 8) {
    let action = "Password must be at least 8 characters";
    const error = new Error(action);
    error.code = 500;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  if (password !== confirmPassword) {
    let action = "Password and confirm password must be same";
    const error = new Error(action);
    error.code = 500;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  try {
    const findUser = await User.findOne({
      where: { id: userId }
    });

    // Check if user exist on database
    if (!findUser) {
      const error = new Error("User not found");
      error.code = 500;
      error.path = path;
      return errorHandler(error, req, res, next);
    }

    //Encrypting the password
    let hashedPassword = await bcrypt.hash(password, 12);

    let response = await User.update({ password: hashedPassword }, { where: { id: userId } });

    if (findUser?.department == "Client" && findUser?.companyId) {

      try {
        let getlabDetail = await Lab.findOne({
          where: {
            lab_id: findUser?.labId
          }
        });

        if (getlabDetail && getlabDetail?.email_smtp_server_host && getlabDetail?.email_smtp_server_port && getlabDetail?.sender_email && getlabDetail?.sender_password) {

          let getcustomerDetail = await customer_contact.findOne({
            where: {
              customer_id: findUser?.companyId
            }
          })

          if (getcustomerDetail) {
            let getReceiverEmail = getcustomerDetail.dataValues.contact_email;

            const transporter = nodemailer.createTransport({
              name: "CalibMaster",
              host: getlabDetail?.email_smtp_server_host,
              port: getlabDetail?.email_smtp_server_port,
              secure: true,
              auth: {
                user: getlabDetail?.sender_email,
                pass: getlabDetail?.sender_password
              }
            });

            const mail_content = `
                    <html lang="en">
                      <head>
                        <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Access Credentials for Customer Portal</title>
                            <style>
                              body {
                                font - family: 'Arial', sans-serif;
                              background-color: #f8f9fa;
                              margin: 0;
                              padding: 0;
                              color: #333;
                        }
                              .margin-zero{
                                margin: 0;
                        }
                            </style>
                          </head>
                          <body>
                            <div class="mail-container">
                              <p>Dear ${getcustomerDetail?.dataValues?.contact_fullname || 'Customer'},</p>

                              <p>Your password has been successfully reset by an Lab. Please find your new credentials below to access the Customer Portal:</p>

                              <p class="margin-zero"><b>User ID:</b> ${findUser?.email} <br /><b>Password:</b> ${password}</p>

                              <p><a href="${config.CUSTOMER_PORTAL_SERVER}" style="color: #007bff; text-decoration: none;">Click here to access the Customer Portal</a></p>

                              <p>If you experience any issues or need assistance, feel free to reach out to our lab team.</p>

                              <p class="margin-zero">Best regards,<br />${getlabDetail?.lab_name}</p>
                              <div>
                              </body>
                            </html>`;

            const info = await transporter.sendMail({
              from: getlabDetail?.sender_email,
              to: getReceiverEmail,
              subject: "Important: Customer Portal - Your Password Has Been Reset",
              html: mail_content,
              headers: {
                'X-Priority': '1',
                'Importance': 'high',
              }
            });
          }
        }
      } catch (err) {
        console.log(err);
        code = 500;
        action = "Error while sending reset password to Client";
        const error = new Error(action);
        error.code = code;
        error.path = path;
        return errorHandler(error, req, res, next);
      }
    }

    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);

    return res.status(200).json({
      msg: response, message: "Record updated successfully!!!"
    });

  } catch (err) {
    let action = "Something went wrong, please try again";
    const error = new Error(action);
    error.code = 500;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
}

const adminResetPassword = async (req, res, next) => {

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/users/admin-reset-password";
  let action = "Admin Reset Password by Email!!";
  let sessionId = req.sessionId;
  let userId = req.userId;

  const { password, currentPassword, email, labId } = req.body;

  if (!password || !currentPassword || !email || !labId) {
    let action = "All fields are required";
    const error = new Error(action);
    error.code = 500;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  if (password.length < 8) {
    let action = "Password must be at least 8 characters";
    const error = new Error(action);
    error.code = 500;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  try {

    const findUser = await User.findOne({
      where: { email, labId }
    });

    // Check if user exist on database
    if (!findUser) {
      const error = new Error("User not found");
      error.code = 500;
      error.path = path;
      return errorHandler(error, req, res, next);
    }

    //Checking Password
    let isValidPassword = await bcrypt.compare(currentPassword, findUser.dataValues.password);

    // Check if user current password is Correct or not
    if (!isValidPassword) {
      const error = new Error("Incorrect password");
      error.code = 500;
      error.path = path;
      return errorHandler(error, req, res, next);
    }

    //Encrypting the password
    let hashedPassword = await bcrypt.hash(password, 12);

    await User.update({ password: hashedPassword }, { where: { id: findUser.dataValues.id } });

    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);

    return res.status(200).json({
      message: "Record updated successfully!!!"
    });

  } catch (err) {
    console.log(err)
    let action = "Something went wrong, please try again";
    const error = new Error(action);
    error.code = 500;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
}

const fetchUsersByLabId = async (req, res) => {
  const { labId } = req.params
  const token = req.headers.authorization?.split(" ")[1]

  if (!labId) {
    return res.status(400).json({ message: "Lab ID is required" })
  }

  if (!token) {
    return res.status(401).json({ message: "Token is required" })
  }

  try {
    let users = await User.findAll({
      where: {
        labId: labId,
        calibmaster_client_id: { [Op.ne]: null },
      },
      // attributes: {
      //   exclude: ["password"],
      // },
    })

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found for the given lab ID" })
    } else {
      return res.status(200).json({
        status: "SUCCESS",
        code: 200,
        message: "Users Fetched Successfully!!",
        data: users,
      })
    }
  } catch (err) {
    console.error("Error fetching users:", err)
    return res.status(500).json({ message: "Failed to fetch users" })
  }
}

exports.enableuser = enableuser;
exports.disableuser = disableuser;
exports.updateuser = updateuser;
exports.getuserbyid = getuserbyid;
exports.getAllUsers = getAllUsers;
exports.adduser = adduser;
exports.login = login;
exports.resetPassword = resetPassword;
exports.adminResetPassword = adminResetPassword;
exports.fetchUsersByLabId = fetchUsersByLabId
