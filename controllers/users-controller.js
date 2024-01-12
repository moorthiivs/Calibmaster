const jwt = require("jsonwebtoken");
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
        where: { email: email, rstatus: 1 },
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
  if (!existingUser) {
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
      { expiresIn: "1h" }
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
      calibmaster_client_id
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
      console.log("Error: ", error);
      console.log("Response:", response);
      if (error) {
        isError = true;
        code = 500;
        action = "Error while adding user in Certifymaster";
        const error = new Error(action);
        error.code = code;
        error.path = path;
        return errorHandler(error, req, res, next);
      }
    });
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
        rstatus: 1,
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
      where: { id: req.body.userId, rstatus: 1 },
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

const deleteuser = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/users/deleteuserbyid";
  let action = "Delete User by Id!!";
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

  const { password, confirmPassword, userId } = req.body;

  if (!password || !confirmPassword || !userId) {
    let action = "All fields are required";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  if (password.length < 8) {
    let action = "Password must be at least 8 characters";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  if (password !== confirmPassword) {
    let action = "Password and confirm password must be same";
    const error = new Error(action);
    error.code = 500;
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
      return errorHandler(error, req, res, next);
    }

    //Encrypting the password
    let hashedPassword = await bcrypt.hash(password, 12);

    let response = await User.update({ password: hashedPassword }, { where: { id: userId } });

    return res.status(200).json({
      msg: response, message: "Record updated successfully!!!"
    });

  } catch (err) {
    let action = "Something went wrong, please try again";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
}

exports.deleteuser = deleteuser;
exports.updateuser = updateuser;
exports.getuserbyid = getuserbyid;
exports.getAllUsers = getAllUsers;
exports.adduser = adduser;
exports.login = login;
exports.resetPassword = resetPassword;
