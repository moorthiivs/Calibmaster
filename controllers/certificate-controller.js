const logger = require("../utils/logger");
const Certificate = require("../models").Certificate;
const Lab = require("../models").Lab;
const SRF = require("../models").srf_list;
const srfItem = require("../models").srfitem;
var fs = require("fs");
const nodePath = require('path');
const nodemailer = require("nodemailer");
const config = require("../utils/config");
const { errorHandler } = require("../helpers/error-handler");


// *** Helper function ***
const sendMail = async (srfItemsQuery, filePath) => {

  try {

    const { lab, srf } = srfItemsQuery;

    console.log("srf-Items Query");

    console.log("Lab result");
    console.log(lab);

    console.log("srf result");
    console.log(srf);

    // Connecting to the STMP Server
    const transporter = nodemailer.createTransport({
      host: lab?.email_smtp_server_host,
      port: lab?.email_smtp_server_port,
      auth: {
        user: lab?.sender_email,
        pass: lab?.sender_password
      }
    });

    await transporter.sendMail({
      from: lab?.contact_email,
      to: srf?.contact_email,
      subject: "Certificate Mail",
      text: "Please find the certificate on the attachment",
      html: "<b>Please find the certificate on the attachment</b>",
      attachments: [
        { path: filePath }
      ]
    });

    return { msg: "Certificate Mail Send Successfully", status: true }
  } catch (error) {
    console.log(error);
    return { msg: "Failed to send Certificate Mail", status: true }
  }
}

const certificateUploadHandler = async (req, res, next) => {
  const path = "/api/certificate/upload";
  let action = "Upload Certificate";
  const file = req.file;
  const folderName1DirUp = "./certificates";

  // return res.json({ data: req.body });
  // const item = JSON.parse(req.body.item);

  try {
    if (!fs.existsSync(folderName1DirUp)) {
      fs.mkdirSync(folderName1DirUp);
    }
  } catch (err) {
    console.error(err);
    const error = new Error("Failed to create certificate" + err);
    error.code = 500;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  fs.rename(
    folderName1DirUp + "/" + file.originalname,
    folderName1DirUp + "/" + req.body.filename,
    function (err) {
      console.log(err);
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
    const error = new Error("Please upload certificate with pdf format");
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  try {

    const { filename, srf_item_id } = req.body

    const newCertificate = new Certificate({
      fileName: filename,
      rstatus: 1,
      srfitemId: srf_item_id
    });
    const result = await newCertificate.save();

    let filePath = nodePath.join(__dirname, '../' + folderName1DirUp + "/" + req.body.filename);

    let srfItemsQuery = await srfItem.findOne({
      where: { srf_item_id },
      attributes: [
        "serial_no", "identification_details", "calibration_done_date",
        "url_number", "certificate_date",
        "calibration_due_date", "calibration_remainder_date_1",
      ],
      include: [
        {
          model: Lab,
          as: "lab",
          attributes: [
            "contact_email",
            "email_smtp_server_host", "email_smtp_server_port", "sender_email", "sender_password"
          ]
        },
        {
          model: SRF,
          as: "srf",
          attributes: [
            "srf_number", "contact_name", "contact_email"
          ]
        }
      ]
    });

    // return res.status(200).json({ srfItemsQuery });
    const { msg, status } = await sendMail(srfItemsQuery, filePath);

    return res.status(200).json({
      status: "SUCCESS",
      message: `File Uploaded Successfully and ${msg}`,
      code: 200,
      result,
      filePath
    });
  } catch (err) {
    console.log(err);
    const error = new Error("Failed to save certificate" + err);
    error.code = 500;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
};

exports.certificateUploadHandler = certificateUploadHandler;