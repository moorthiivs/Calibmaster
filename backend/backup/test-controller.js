const logger = require("../utils/logger");
const nodeMailer = require("nodemailer");

/*const testHandler = (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/test/check";
  let action = "Get Test";
  let message = `${ip} ${code} ${path} - ${action}`;
  logger.info(message);
  res.status(code).json({ status: "available" });
};*/

const html = `
  <h1>CalibMaster</h1>
  <p>This is a Test mail</p>
`;

const testHandler = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/test/check";
  let action = "Mail Test";
  let message = `${ip} ${code} ${path} - ${action}`;
  console.log(req.body);

  const transporter = nodeMailer.createTransport({
    name: "CalibMaster",
    host: "mail.iviewsense.com",
    port: 465,
    secure: true,
    auth: {
      user: "vadivelu@iviewsense.com",
      pass: "Good2021$",
    },
  });

  const info = await transporter.sendMail({
    from: "vadivelu@iviewsense.com",
    to: "vadivelsiview@gmail.com",
    subject: "Testing 12345",
    html: html,
    priority: "high",
  });

  console.log(info);

  return res
    .status(code)
    .json({
      status: "SUCCESS",
      code: code,
      message: "Testmail Sent Successfully!!",
    });
};

exports.testHandler = testHandler;
