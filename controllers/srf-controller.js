const logger = require("../utils/logger");
const { errorHandler } = require("../helpers/error-handler");
const srfSchema = require("../schemas/srf");
const itemsSchema = require("../schemas/items");
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const User = require("../models").User;
const Company = require("../models").Company;
const customer = require("../models").customer;
const itemSchema = require("../schemas/item");
const Lab = require("../models").Lab;
const Masterlist = require("../models").Masterlist;
const instrument_type = require("../models").instrument_type;
const nodeMailer = require("nodemailer");
const ExcelJS = require("exceljs");
const fs = require('fs');
const nodePath = require('path');
const ejs = require('ejs');
const pdf = require('html-pdf');
const { sendMailHandler } = require("../helpers/mailSend");

let err;

const addSRFHandler = async (req, res, next) => {

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/add";
  let action = "Adding New SRF!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;

  if (!req.body || !req.body.srf || !req.body.items || !req.body.labId) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  let currentSRF = {};
  currentSRF.srf_type = req.body.srf.type;
  currentSRF.srf_date = req.body.srf.date;
  currentSRF.srf_number = req.body.srf.srfno;

  currentSRF.contact_name = req.body.srf.contact_name;
  currentSRF.contact_number = req.body.srf.contact_number;
  currentSRF.contact_email = req.body.srf.contact_email;

  currentSRF.customer_dc_date = req.body.srf.customer_dc_date;
  currentSRF.next_cal_due_require_flag = (req.body.srf.next_cal_due_require_flag) ? "YES" : "NO";
  currentSRF.statement_of_confirmity_flag = (req.body.srf.statement_of_confirmity_flag) ? "YES" : "NO";
  currentSRF.uncertainity_consider_flag = (req.body.srf.uncertainity_consider_flag) ? "YES" : "NO";
  currentSRF.customer_id = req.body.srf.CompanyId;

  currentSRF.department = req.body.srf.department;
  currentSRF.customer_dc = req.body.srf.customer_dc;
  currentSRF.send_srf_via_email = (req.body.srf.sendsrf) ? "YES" : "NO";

  currentSRF.agreed_completion_date = (req.body.srf.agreed_date) ? req.body.srf.agreed_date : null;
  currentSRF.reminder_frequency = req.body.srf.frequency;
  currentSRF.statement_of_confirmity = req.body.srf.statement_of_confirmity;

  currentSRF.issue_no = req.body.srf.issue_no;
  currentSRF.issue_date = (req.body.srf.issue_date) ? req.body.srf.issue_date : null;

  currentSRF.amend_no = req.body.srf.amend_no;
  currentSRF.amend_date = (req.body.srf.amend_date) ? req.body.srf.amend_date : null;
  currentSRF.frequency_days = (req.body.srf.frequency_days) ? req.body.srf.frequency_days : null;

  let sendsrf = req.body.srf.sendsrf;

  // ! SRF Parent Table Validation
  const validsrf = srfSchema(currentSRF);
  // return res.json({ validsrf })

  if (!validsrf) {
    isError = true;
    code = 400;
    action = "Please fill the required srf fields !!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  // ! SRF Items Validation
  const validitems = itemsSchema(req.body.items);
  // return res.json({ validitems })

  if (!validitems) {
    isError = true;
    code = 400;
    action = "Invalid SRF Items!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  // Fetch user on database
  const fetchCreater = await User.findOne({
    where: { id: req.userId }
  });

  let newSRF;
  let srfno;

  // *** Creating SRF ***
  try {
    // Checking if same SRF number already exists
    srfno = await SRF.findOne({
      where: {
        lab_id: req.body.labId,
        srf_number: currentSRF.srf_number
      }
    });

    if (srfno) {
      isError = true;
      code = 500;
      action = "SRF Already Exists!!";
      const error = new Error(action);
      error.code = code;
      error.path = path;
      return errorHandler(error, req, res, next);
    }

    currentSRF.rstatus = 1;
    currentSRF.lab_id = req.body.labId;

    currentSRF.created_timestamp = Date.now();
    currentSRF.created_by_login_name = fetchCreater.name;
    currentSRF.created_by_user_id = req.userId;

    currentSRF.updated_timestamp = Date.now();
    currentSRF.updated_by_login_name = fetchCreater.name;
    currentSRF.updated_by_user_id = req.userId;

    const createdSRF = new SRF(currentSRF);
    newSRF = await createdSRF.save();

    // return res.json({ newSRF });
    srfno = parseInt(newSRF.dataValues.srf_id);

  } catch (err) {
    console.log("Exception here");
    console.log(err);
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  // *** Creating SRF-Items ***
  let insertedItems;
  try {
    const items = req.body.items.map((v, i) => ({

      srf_id: newSRF.srf_id,
      srf_item_no: i + 1,

      make: v.make,
      model: v.model,
      serial_no: v.serialno,
      identification_details: v.idno,

      remarks: v.remarks,
      status: "Not Calibrated",

      rstatus: 1,
      lab_id: req.body.labId,
      intrument_type_id: v.masterlistId,

      created_timestamp: Date.now(),
      created_by_login_name: fetchCreater.name,
      created_by_user_id: req.userId,

      updated_timestamp: Date.now(),
      updated_by_login_name: fetchCreater.name,
      updated_by_user_id: req.userId

    }));

    insertedItems = await Item.bulkCreate(items, { returning: true });
    // return res.json({ insertedItems });
    isError = false;

  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  let fileName = "srf.xlsx";
  let lab, srf, items;

  try {
    srf = await SRF.findOne({
      where: {
        srf_id: srfno,
        rstatus: 1,
      },
      include: [
        {
          model: Lab,
          as: "lab",
          attributes: {
            exclude: [
              "brand_logo", "other_logo1_image", "other_logo2_image",
              "created_timestamp", "created_by_login_name", "created_by_user_id",
              "updated_timestamp", "updated_by_login_name", "updated_by_user_id"
            ]
          }
        },
        {
          model: customer,
          as: "customer",
          attributes: {
            exclude: [
              "created_timestamp", "created_by_login_name", "created_by_user_id",
              "updated_timestamp", "updated_by_login_name", "updated_by_user_id"
            ]
          }
        }
      ]
    });
  } catch (err) {
    console.log(err);
    const error = new Error("Error on getting srf_id");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  try {
    items = await Item.findAll({
      where: {
        srf_id: srfno,
        rstatus: 1,
      },
      include: [
        {
          model: instrument_type,
          as: "intrument_type",
          attributes: {
            exclude: [
              "created_timestamp", "created_by_login_name", "created_by_user_id",
              "updated_timestamp", "updated_by_login_name", "updated_by_user_id"
            ]
          },
        },
      ],
      attributes: {
        exclude: [
          "created_timestamp", "created_by_login_name", "created_by_user_id",
          "updated_timestamp", "updated_by_login_name", "updated_by_user_id"
        ],
      },
      order: [["srf_item_id", "ASC"]],
    });
  } catch (err) {
    console.log(err);
    const error = new Error("Error on getting child srf_items");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  let modifiedsno;
  if (srf.srf_number > 0 && srf.srf_number < 10) {
    modifiedsno = "0000" + srf.srf_number;
  }
  if (srf.srf_number > 9 && srf.srf_number < 100) {
    modifiedsno = "000" + srf.srf_number;
  }
  if (srf.srf_number > 99 && srf.srf_number < 1000) {
    modifiedsno = "00" + srf.srf_number;
  }
  if (srf.srf_number > 999 && srf.srf_number < 10000) {
    modifiedsno = "0" + srf.srf_number;
  }
  if (srf.srf_number > 9999 && srf.srf_number < 100000) {
    modifiedsno = "" + srf.srf_number;
  }

  let srfid = srf.lab.symbol + "/" + srf.srf_date.slice(0, 4) + "/" + srf.srf_type + modifiedsno;
  lab = srf.lab;

  // ! *** Starting Excel File ***
  const workbook = new ExcelJS.Workbook();

  workbook.creator = lab.lab_name;
  workbook.lastModifiedBy = lab.lab_name;
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  // Set workbook dates to 1904 date system
  workbook.properties.date1904 = true;
  // Force workbook calculation on load
  workbook.calcProperties.fullCalcOnLoad = true;
  workbook.views = [
    {
      x: 0,
      y: 0,
      width: 10000,
      height: 20000,
      firstSheet: 0,
      activeTab: 1,
      visibility: "visible",
    },
  ];

  let worksheet = workbook.addWorksheet("SRF");

  worksheet.pageSetup.margins = {
    left: 0.25,
    right: 0.25,
    top: 0.75,
    bottom: 0.75,
    header: 0.3,
    footer: 0.3,
  };

  worksheet.pageSetup.printArea = "A1:H500";
  worksheet.pageSetup.scale = 70;
  const col1 = worksheet.getColumn(1);
  col1.width = 9;
  const col2 = worksheet.getColumn(2);
  col2.width = 12;
  const col3 = worksheet.getColumn(3);
  col3.width = 20;
  const col4 = worksheet.getColumn(4);
  col4.width = 21;
  const col5 = worksheet.getColumn(5);
  col5.width = 21;
  const col6 = worksheet.getColumn(6);
  col6.width = 21;
  const col7 = worksheet.getColumn(7);
  col7.width = 15;
  const col8 = worksheet.getColumn(8);
  col8.width = 25;
  const row2 = worksheet.getRow(2);
  row2.getCell(1).value = lab.address1;
  const row3 = worksheet.getRow(3);
  row3.getCell(1).value = lab.address2;
  const row4 = worksheet.getRow(4);
  row4.getCell(1).value = lab.address3;
  const row5 = worksheet.getRow(5);
  row5.getCell(1).value = "Telephone: " + lab.contact_number1 + "; e-mail:" + lab.contact_email;
  // add image to workbook by buffer
  let imgext = "png";
  if (lab.brand_logo_mime_type == "image/png") {
    imgext = "png";
  }
  if (lab.other_logo1_image_mime_type == "image/jpg") {
    imgext = "jpg";
  }
  if (lab.other_logo2_image_mime_type == "image/jpeg") {
    imgext = "jpeg";
  }
  let filePath = nodePath.join(__dirname, '../' + "public/images" + "/" + lab.brand_logo_filename);
  const imageId2 = workbook.addImage({
    filename: filePath,
    extension: imgext,
  });
  worksheet.addImage(imageId2, {
    tl: { col: 5.8, row: 0.5 },
    br: { col: 7.9, row: 4.5 },
  });
  let inddate = new Date();
  inddate.setHours(inddate.getHours() + 6);
  worksheet.getCell("A1").value = inddate.toISOString();

  worksheet.mergeCells("A7:H7");
  worksheet.getCell("A7").value = "SERVICE REQUEST FORM";
  worksheet.getCell("A7").style.alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  worksheet.getRow(7).font = { name: "Calibri", size: 22, bold: true };
  worksheet.getCell("A7").border = {
    top: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };
  worksheet.getCell("A8").value = "SRF No:";
  worksheet.getCell("G8").value = "Date:";
  worksheet.getRow(8).font = { name: "Calibri", size: 14, bold: true };
  worksheet.mergeCells("B8:C8");
  worksheet.getCell("B8").value = srfid;
  worksheet.mergeCells("D8:F8");
  worksheet.getCell("A8").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("H8").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("H8").value = srf.srf_date.split("-").reverse().join("-");
  worksheet.mergeCells("A9:H9");
  worksheet.getCell("A9").border = {
    top: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("A9").value = "( TO BE FILLED BY CUSTOMER )";
  worksheet.getCell("A9").style.alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  worksheet.getRow(9).font = { name: "Calibri", size: 14, bold: true };
  worksheet.getCell("A10").value =
    "1.0. Full address of the organisation ( in block letters )";
  worksheet.getRow(10).font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("A10").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("H10").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("E10").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("A11").value = "M/s";
  worksheet.getCell("A11").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("B11").value = srf.customer.customer_name;
  worksheet.getCell("B11").font = { name: "Calibri", size: 12, bold: true };

  worksheet.getCell("F11").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("F11").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("F11").style.alignment = {
    vertical: "middle",
    horizontal: "right",
  };
  worksheet.getCell("F12").style.alignment = {
    vertical: "middle",
    horizontal: "right",
  };
  worksheet.getCell("F13").style.alignment = {
    vertical: "middle",
    horizontal: "right",
  };
  worksheet.getCell("F14").style.alignment = {
    vertical: "middle",
    horizontal: "right",
  };
  worksheet.getCell("F15").style.alignment = {
    vertical: "middle",
    horizontal: "right",
  };
  worksheet.getCell("F11").value = "DC No:";
  worksheet.mergeCells("G11:H11");
  worksheet.getCell("G11").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("G11").value = srf.customer_dc;
  worksheet.getCell("A12").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("B12").value = srf.customer.address1;
  worksheet.getCell("B12").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("F12").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("F12").value = "DC Date:";
  worksheet.getCell("F12").border = {
    left: { style: "thin" },
  };
  worksheet.mergeCells("G12:H12");
  worksheet.getCell("G12").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("G12").value = srf.customer_dc_date
    .split("-")
    .reverse()
    .join("-");
  worksheet.getCell("A13").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("B13").value = srf.customer.address2;
  worksheet.getCell("B13").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("F13").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("F13").value = "Contact Person:";
  worksheet.getCell("F13").border = {
    left: { style: "thin" },
  };
  worksheet.mergeCells("G13:H13");
  worksheet.getCell("G13").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("G13").value = srf.contact_name;
  worksheet.getCell("A14").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("B14").value = srf.customer.address3;
  worksheet.getCell("B14").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("F14").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("F14").value = "Contact Number:";
  worksheet.getCell("F14").border = {
    left: { style: "thin" },
  };
  worksheet.mergeCells("G14:H14");
  worksheet.getCell("G14").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("G14").value = srf.contact_number;
  worksheet.getCell("A15").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };

  worksheet.getCell("B15").border = {
    bottom: { style: "thin" },
  };
  worksheet.getCell("C15").border = {
    bottom: { style: "thin" },
  };
  worksheet.getCell("D15").border = {
    bottom: { style: "thin" },
  };
  worksheet.getCell("E15").border = {
    bottom: { style: "thin" },
  };

  worksheet.getCell("F15").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("F15").value = "Department:";
  worksheet.getCell("F15").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.mergeCells("G15:H15");
  worksheet.getCell("G15").border = {
    right: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("G15").value = srf.department;
  worksheet.getCell("A16").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("A16").value = "2.0. Report in the name of:";
  worksheet.getCell("A16").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("F16").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("F16").value = "3.0 Note:";
  worksheet.getCell("F16").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("H16").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("A17").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("B17").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("B17").value = srf?.reportcompany?.companyname;
  worksheet.getCell("F17").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("F17").font = { name: "Calibri", size: 12 };
  worksheet.getCell("F17").value = "3.1. Customers are requested to refer the SRF No. as ";
  worksheet.getCell("H17").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("A18").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("B18").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("B18").value = srf?.reportcompany?.address1;
  worksheet.getCell("F18").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("F18").font = { name: "Calibri", size: 12 };
  worksheet.getCell("F18").value =
    "        mentioned above for all clarification / correspondance . ";
  worksheet.getCell("H18").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("A19").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("B19").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("B19").value = srf?.reportcompany?.address2;
  worksheet.getCell("F19").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("F19").font = { name: "Calibri", size: 12 };
  worksheet.getCell("F19").value = "3.2 " + srf.contact_name + " is not responsible for the equipments which are not";
  worksheet.getCell("H19").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("A20").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("B20").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("B20").value = srf?.reportcompany?.address3;
  worksheet.getCell("F20").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("F20").font = { name: "Calibri", size: 12 };
  worksheet.getCell("F20").value =
    "collected after 30 days from the date of agreed date  of completion.";
  worksheet.getCell("H20").border = {
    right: { style: "thin" },
  };
  worksheet.mergeCells("A21:H21");
  worksheet.getCell("A21").border = {
    right: { style: "thin" },
    left: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("A21").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("A21").value =
    "4.0. The following items are submitted for calibration :";
  worksheet.getRow(22).height = 28;
  worksheet.getRow(22).style.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  worksheet.getCell("A22").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("A22").font = { name: "Calibri", size: 13, bold: true };
  worksheet.getCell("A22").value = "Sl.No";
  worksheet.mergeCells("B22:C22");
  worksheet.getCell("B22").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("B22").font = { name: "Calibri", size: 13, bold: true };
  worksheet.getCell("B22").value = "Description of Item";
  worksheet.getCell("D22").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("D22").font = { name: "Calibri", size: 13, bold: true };
  worksheet.getCell("D22").value = "Make";
  worksheet.getCell("E22").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("E22").font = { name: "Calibri", size: 13, bold: true };
  worksheet.getCell("E22").value = "Model / Range";
  worksheet.getCell("F22").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("F22").font = { name: "Calibri", size: 13, bold: true };
  worksheet.getCell("F22").value = "Serial No./ ID No.";
  worksheet.getCell("G22").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("G22").font = { name: "Calibri", size: 13, bold: true };
  worksheet.getCell("G22").value = "Status";
  worksheet.getCell("H22").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  worksheet.getCell("H22").font = { name: "Calibri", size: 13, bold: true };
  worksheet.getCell("H22").value = "Calibration Points Required/ Remarks";

  (i = 1), (lastrow = 22);
  for (let j = 0; j < 25; j++) {
    lastrow = lastrow + 1;
    worksheet.getRow(lastrow).height = 15;
    worksheet.getCell("A" + lastrow).border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("B" + lastrow).style.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell("D" + lastrow).style.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell("E" + lastrow).style.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell("F" + lastrow).style.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell("G" + lastrow).style.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell("H" + lastrow).style.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell("A" + lastrow).style.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell("A" + lastrow).font = { name: "Calibri", size: 12 };
    worksheet.mergeCells("B" + lastrow + ":" + "C" + lastrow);
    worksheet.getCell("B" + lastrow).font = { name: "Calibri", size: 12 };
    worksheet.getCell("B" + lastrow).border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("D" + lastrow).font = { name: "Calibri", size: 12 };
    worksheet.getCell("D" + lastrow).border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("E" + lastrow).font = { name: "Calibri", size: 12 };
    worksheet.getCell("E" + lastrow).border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("F" + lastrow).font = { name: "Calibri", size: 12 };
    worksheet.getCell("F" + lastrow).border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("G" + lastrow).font = { name: "Calibri", size: 12 };
    worksheet.getCell("G" + lastrow).border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("H" + lastrow).font = { name: "Calibri", size: 12 };
    worksheet.getCell("H" + lastrow).border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }
  lastrow = 22;
  items.forEach((element) => {
    lastrow = lastrow + 1;
    if (lastrow < 48) {
      worksheet.getCell("A" + lastrow).value = i;
      worksheet.getCell("B" + lastrow).value = element?.intrument_type?.instrument_full_name;
      worksheet.getCell("D" + lastrow).value = element?.make;
      worksheet.getCell("E" + lastrow).value = element?.model;
      worksheet.getCell("F" + lastrow).value = element?.serial_no + " / " + element?.srf_item_id;
      worksheet.getCell("G" + lastrow).value = element?.status;
      worksheet.getCell("H" + lastrow).value = element?.remarks;
      //console.log(element);
      i = i + 1;
    }
  });
  worksheet.mergeCells("A48:H48");
  worksheet.getCell("A48").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("A48").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  worksheet.getCell("A48").value = "5.0.   Agreed Date of Completion.: " + srf?.agreed_completion_date?.split("-").reverse().join("-");
  worksheet.mergeCells("A49:H49");
  worksheet.getCell("A49").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("A49").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  let nextcalflag,
    calfreq = srf.reminder_frequency != "0" ? srf.reminder_frequency + " months" : "------";
  if (srf.next_cal_due_require_flag) {
    nextcalflag = "Yes";
  } else {
    nextcalflag = "No";
  }
  worksheet.getCell("A49").value =
    "6.0.   Next Calibration Due Date require in certificate:" +
    nextcalflag +
    "          ,                           If Yes mention  Frequency :" +
    calfreq;
  srf;
  worksheet.mergeCells("A50:H50");
  worksheet.getCell("A50").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("A50").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  worksheet.getCell("A50").value = "7.0 Decision Rule:";
  worksheet.mergeCells("A51:H51");
  worksheet.getCell("A51").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("A51").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  let sofc;
  if (srf.statement_of_confirmity_flag == "Yes") {
    sofc = "Yes";
  } else {
    sofc = "No";
  }
  worksheet.getCell("A51").value =
    "        Statement of confirmity require:        " + sofc;
  worksheet.mergeCells("A52:H52");
  worksheet.getCell("A52").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("A52").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  worksheet.getCell("A52").value = "         If Yes please specify:";
  worksheet.mergeCells("A53:H53");
  worksheet.getCell("A53").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("A53").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  worksheet.getCell("A53").value =
    "Uncertainty should be consider for the declaration of statement of the confirmity:  " +
    srf.uncertainity_consider_flag;
  worksheet.getCell("A54").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("H54").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("A55").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("H55").border = {
    right: { style: "thin" },
  };
  worksheet.getCell("A55").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("F55").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("A55").value = "Name & Signature of the Customer :";
  worksheet.getCell("F55").value = "Signature of the CSD :";
  worksheet.getCell("A56").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("H56").border = {
    right: { style: "thin" },
  };

  worksheet.getCell("F55").font = { name: "Calibri", size: 12, bold: true };

  worksheet.getCell("F55").value = "Collected By :";
  worksheet.getCell("A57").border = {
    left: { style: "thin" },
  };
  worksheet.getCell("H57").border = {
    right: { style: "thin" },
  };
  worksheet.mergeCells("A58:C58");
  worksheet.mergeCells("D58:F58");
  worksheet.mergeCells("G58:H58");
  worksheet.getCell("A58").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("D58").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("G58").font = { name: "Calibri", size: 12, bold: true };
  worksheet.getCell("A58").border = {
    left: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("D58").border = {
    left: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("H58").border = {
    right: { style: "thin" },
    top: { style: "thin" },
    bottom: { style: "thin" },
  };

  let invno, issno, issdate; // ! check invoice_no
  if (srf?.invoice_no) {
    invno = srf?.invoice_no;
  } else {
    invno = "";
  }
  if (srf?.issue_no) {
    issno = srf?.issue_no;
  } else {
    issno = "";
  }
  if (srf?.issue_date) {
    issdate = srf?.issue_date?.split("-")?.reverse()?.join("-");
  } else {
    issdate = "";
  }
  worksheet.getCell("A58").value = "Invoice No." + invno;
  worksheet.getCell("D58").value = "Invoice Date.";
  worksheet.getCell("G58").value = "Amount : Rs.";

  worksheet.mergeCells("A59:C59");
  worksheet.getCell("A59").font = { name: "Calibri", size: 12 };
  worksheet.getCell("A59").value = "Issue No. :  " + issno;
  worksheet.getCell("D59").font = { name: "Calibri", size: 12 };
  worksheet.getCell("D59").value = "Amend No. :  ";
  worksheet.getCell("E59").font = { name: "Calibri", size: 12 };
  worksheet.getCell("E59").value = srf?.amend_no;
  let pageno = 1;
  let pages;
  if (items.length <= 25) {
    pages = 1;
  } else if (items.length >= 26 && items.length <= 55) {
    pages = 2;
  } else if (items.length >= 56 && items.length <= 85) {
    pages = 3;
  } else if (items.length >= 86 && items.length <= 115) {
    pages = 4;
  }
  worksheet.getCell("F59").font = { name: "Calibri", size: 12 };
  worksheet.getCell("F59").value = "Page No.:" + pageno + "/" + pages;
  worksheet.getCell("A59").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("D59").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("E59").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("F59").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.mergeCells("G59:H60");
  worksheet.getCell("H59").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  worksheet.getCell("G59").font = { name: "Calibri", size: 16, bold: true };
  worksheet.getCell("G59").value = lab.name;
  worksheet.getCell("G59").style.alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  worksheet.getCell("A60").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("D60").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("E60").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.getCell("F60").border = {
    left: { style: "thin" },
    bottom: { style: "thin" },
  };
  worksheet.mergeCells("A60:C60");
  worksheet.getCell("A60").font = { name: "Calibri", size: 12 };

  worksheet.getCell("A60").value = "Issue Date. :  " + issdate;
  worksheet.getCell("D60").font = { name: "Calibri", size: 12 };
  worksheet.getCell("D60").value = "Amend Date. :  ";
  worksheet.getCell("E60").font = { name: "Calibri", size: 12 };
  worksheet.getCell("E60").value = srf?.amend_date?.split("-")?.reverse()?.join("-");
  worksheet.getCell("F60").font = { name: "Calibri", size: 12 };
  //worksheet.getCell("F60").value = "TC-FFC-001";
  //page 2
  if (items.lenght > 25) {
    worksheet.mergeCells("A62:H62");
    worksheet.getCell("A62").value = "SERVICE REQUEST FORM";
    worksheet.getCell("A62").style.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getRow(62).font = { name: "Calibri", size: 22, bold: true };
    worksheet.getCell("A62").border = {
      top: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell("A63").value = "SRF No:";
    worksheet.getCell("G63").value = "Date:";
    worksheet.getRow(8).font = { name: "Calibri", size: 14, bold: true };
    worksheet.mergeCells("B63:C63");
    worksheet.getCell("B63").value = srfid;
    worksheet.mergeCells("D63:F63");
    worksheet.getCell("A63").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("B63").border = {
      bottom: { style: "thin" },
    };
    worksheet.getCell("D63").border = {
      bottom: { style: "thin" },
    };
    worksheet.getCell("G63").border = {
      bottom: { style: "thin" },
    };
    worksheet.getCell("H63").border = {
      right: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("H63").value = srf?.srf_date?.split("-")?.reverse()?.join("-");
    worksheet.getRow(64).height = 22;
    worksheet.getRow(64).style.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    worksheet.getCell("A64").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("A64").font = { name: "Calibri", size: 13, bold: true };
    worksheet.getCell("A64").value = "Sl.No";
    worksheet.mergeCells("B64:C64");
    worksheet.getCell("B64").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("B64").font = { name: "Calibri", size: 13, bold: true };
    worksheet.getCell("B64").value = "Description of Item";
    worksheet.getCell("D64").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("D64").font = { name: "Calibri", size: 13, bold: true };
    worksheet.getCell("D64").value = "Make";
    worksheet.getCell("E64").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("E64").font = { name: "Calibri", size: 13, bold: true };
    worksheet.getCell("E64").value = "Model";
    worksheet.getCell("F64").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("F64").font = { name: "Calibri", size: 13, bold: true };
    worksheet.getCell("F64").value = "Serial No./ ID No.";
    worksheet.getCell("G64").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("G64").font = { name: "Calibri", size: 13, bold: true };
    worksheet.getCell("G64").value = "Status";
    worksheet.getCell("H64").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell("H64").font = { name: "Calibri", size: 13, bold: true };
    worksheet.getCell("H64").value = "Calibration Points";

    lastrow = 64;
    for (let j = 0; j < 50; j++) {
      lastrow = lastrow + 1;
      worksheet.getRow(lastrow).height = 15;
      worksheet.getCell("A" + lastrow).border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
      };
      worksheet.getCell("B" + lastrow).style.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("D" + lastrow).style.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("E" + lastrow).style.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("F" + lastrow).style.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("G" + lastrow).style.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("H" + lastrow).style.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("A" + lastrow).style.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getCell("A" + lastrow).font = { name: "Calibri", size: 12 };
      worksheet.mergeCells("B" + lastrow + ":" + "C" + lastrow);
      worksheet.getCell("B" + lastrow).font = { name: "Calibri", size: 12 };
      worksheet.getCell("B" + lastrow).border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
      };
      worksheet.getCell("D" + lastrow).font = { name: "Calibri", size: 12 };
      worksheet.getCell("D" + lastrow).border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
      };
      worksheet.getCell("E" + lastrow).font = { name: "Calibri", size: 12 };
      worksheet.getCell("E" + lastrow).border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
      };
      worksheet.getCell("F" + lastrow).font = { name: "Calibri", size: 12 };
      worksheet.getCell("F" + lastrow).border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
      };
      worksheet.getCell("G" + lastrow).font = { name: "Calibri", size: 12 };
      worksheet.getCell("G" + lastrow).border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
      };
      worksheet.getCell("H" + lastrow).font = { name: "Calibri", size: 12 };
      worksheet.getCell("H" + lastrow).border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
    lastrow = 64;
    i = 0;
    items.forEach((element) => {
      lastrow = lastrow + 1;
      if (lastrow < 100 && items.length > 25 && i > 24 && i < 75) {
        worksheet.getCell("A" + lastrow).value = i;
        worksheet.getCell("B" + lastrow).value = element.intrument_type.instrument_full_name;
        worksheet.getCell("D" + lastrow).value = element.make;
        worksheet.getCell("E" + lastrow).value = element.model;

        worksheet.getCell("F" + lastrow).value =
          element.serialno + " / " + element.idno;
        //worksheet.getCell("G" + lastrow).value = element.status;
        worksheet.getCell("H" + lastrow).value = element.remarks;
        //console.log(element);
        i = i + 1;
      }
    });
    worksheet.mergeCells("A115:H115");
    worksheet.getCell("A115").border = {
      left: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.mergeCells("A116:C116");
    worksheet.getCell("A116").font = { name: "Calibri", size: 12 };
    worksheet.getCell("A116").value = "Issue No. :  " + issno;
    worksheet.getCell("D116").font = { name: "Calibri", size: 12 };
    worksheet.getCell("D116").value = "Amend No. :  ";
    worksheet.getCell("E116").font = { name: "Calibri", size: 12 };
    worksheet.getCell("E116").value = srf.amend_no;
    pageno = 2;
    worksheet.getCell("F116").font = { name: "Calibri", size: 12 };
    worksheet.getCell("F116").value = "Page No.:" + pageno + "/" + pages;
    worksheet.getCell("A116").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("D116").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("E116").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("F116").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.mergeCells("G116:H117");
    worksheet.getCell("H116").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    worksheet.getCell("G116").font = {
      name: "Calibri",
      size: 16,
      bold: true,
    };
    worksheet.getCell("G116").style.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getCell("G116").value = lab?.lab_name;
    worksheet.getCell("A117").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("D117").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("E117").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.getCell("F117").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
    };
    worksheet.mergeCells("A117:C117");
    worksheet.getCell("A117").font = { name: "Calibri", size: 12 };

    worksheet.getCell("A117").value = "Issue Date. :  " + issdate;
    worksheet.getCell("D117").font = { name: "Calibri", size: 12 };
    worksheet.getCell("D117").value = "Amend Date. :  ";
    worksheet.getCell("E117").font = { name: "Calibri", size: 12 };
    worksheet.getCell("E117").value = srf?.amend_date?.split("-")?.reverse()?.join("-");
    worksheet.getCell("F117").font = { name: "Calibri", size: 12 };
    //worksheet.getCell("F117").value = "TC-FFC-001";
  }

  let buffer;
  try {
    buffer = await workbook.xlsx.writeBuffer();
  } catch (err) {
    console.log(err);
    const error = new Error("Failed to create buffer");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  let existingLab;
  let returnable_material = req.body.srf.returnable_material;
  let dc_remarks = req.body.srf.dc_remarks;

  try {
    existingLab = await Lab.findOne({
      where: { lab_id: req.body.labId, rstatus: 1 },
      attributes: {
        exclude: [
          "brand_logo", "other_logo1_image", "other_logo2_image",
          "created_timestamp", "created_by_login_name", "created_by_user_id",
          "updated_timestamp", "updated_by_login_name", "updated_by_user_id"
        ]
      }
    });
  } catch (err) {
    console.log(err);
    const error = new Error("Failed to find existingLab");
    error.code = code;
    return errorHandler(error, req, res, next);
  }

  const { BACKEND_SERVER } = process?.env;

  const filePathName = nodePath.resolve(__dirname, '../views/deliverychallan.ejs');

  const htmlString = fs.readFileSync(filePathName).toString();

  let options = {
    "height": "10.5in",
    "width": "9in",
    "paginationOffset": 1,
    "header": {
      "height": "25mm",
      "contents": '<div style="text-align: center;">DELIVERY CHALLAN</div>'
    },
    "footer": {
      "height": "10mm",
      "contents": {
        first: '<div style="text-align: center;">{{page}}/{{pages}}</div>',
        2: '<div style="text-align: center;">{{page}}/{{pages}}</div>',
        default: `<div style="text-align: center;">
                        <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>
                    </div>`,
        last: 'Last Page'
      }
    }
  };

  const ejsData = ejs.render(htmlString, { existingLab, BACKEND_SERVER, srf, items, returnable_material, dc_remarks })

  const fileUniqueName = `${new Date().getTime()}.pdf`;

  if (existingLab?.sender_email) {

    const transporter = nodeMailer.createTransport({
      name: "CalibMaster",
      host: existingLab?.email_smtp_server_host,
      port: existingLab?.email_smtp_server_port,
      auth: {
        user: existingLab?.sender_email,
        pass: existingLab?.sender_password
      }
    });

    fileName = existingLab?.symbol + "-" + new Date().getTime() + "-";

    if (srf.srf_number > 0 && srf.srf_number < 10) {
      addedzero = "0000" + srf.srf_number;
    }
    if (srf.srf_number > 9 && srf.srf_number < 100) {
      addedzero = "000" + srf.srf_number;
    }
    if (srf.srf_number > 99 && srf.srf_number < 1000) {
      addedzero = "00" + srf.srf_number;
    }
    if (srf.srf_number > 999 && srf.srf_number < 10000) {
      addedzero = "0" + srf.srf_number;
    }
    if (srf.srf_number > 9999 && srf.srf_number < 100000) {
      addedzero = "" + srf.srf_number;
    }
    fileName += addedzero + ".xlsx";

    if (sendsrf) {
      pdf.create(ejsData, options).toFile(`./delivery-challan/${fileUniqueName}`, async (err, response) => {
        if (err) throw err;

        try {
          const info = await transporter.sendMail({
            from: existingLab?.contact_email,
            to: req?.body?.srf?.contact_email,
            subject: "CalibMaster - New SRF Created " + fileName,
            html: "<p><b>Please find delivery challan on attachment.</b></p>",
            priority: "high",
            attachments: [
              {
                filename: fileName,
                content: buffer,
              },
              {
                path: response.filename,
                filename: 'delivery-challan.pdf',
                contentType: "application/pdf",
              }
            ]
          });

          //Returning 200 Response
          if (isError == false) {
            let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
            logger.info(message);
            res.status(200).json({
              status: "SUCCESS",
              code: 200,
              message: "SRF Added Successfully",
            });
          }
          console.log(info);
        } catch (err) {
          console.log(err);
          const error = new Error("Error when sending the mail");
          error.code = 500;
          return errorHandler(error, req, res, next);
        }
      });
    } else {
      pdf.create(ejsData, options).toFile(`./delivery-challan/${fileUniqueName}`, async (err, response) => {
        if (err) throw err;

        try {
          const info = await transporter.sendMail({
            from: existingLab?.contact_email,
            to: req?.body?.srf?.contact_email,
            subject: "CalibMaster - New SRF Created",
            html: "<p><b>Please find delivery challan on attachment.</b></p>",
            priority: "high",
            attachments: [
              {
                path: response.filename,
                filename: 'delivery-challan.pdf',
                contentType: "application/pdf",
              }
            ]
          });

          //Returning 200 Response
          if (isError == false) {
            let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
            logger.info(message);
            res.status(200).json({
              status: "SUCCESS",
              code: 200,
              message: "SRF Added Successfully",
            });
          }
          console.log(info);
        } catch (err) {
          console.log(err);
          const error = new Error("Error when sending the mail");
          error.code = 500;
          return errorHandler(error, req, res, next);
        }
      });
    }
  }
};

const getSRFs = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/getall";
  let action = "Getting all SRFs!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;
  const { labId } = req.body;
  let srfs;

  try {
    srfs = await SRF.findAll({
      where: {
        lab_id: labId,
        rstatus: 1,
      },
      include: [
        {
          model: Lab,
          as: "lab",
          attributes: {
            exclude: [
              "created_timestamp",
              "created_by_login_name",
              "created_by_user_id",
              "updated_timestamp",
              "updated_by_login_name",
              "updated_by_user_id",

              "address1",
              "address2",
              "address3",

              "contact_email",
              "lab_id",
              "lab_name",

              "contact_number1",
              "contact_number2",

              "rstatus",

              "brand_logo_filename",
              "brand_logo_mime_type",
              "brand_logo",

              "other_logo1_image_filename",
              "other_logo1_image_mime_type",
              "other_logo1_image",

              "other_logo2_image_filename",
              "other_logo2_image_mime_type",
              "other_logo2_image"
            ],
          },
        },
        {
          model: customer,
          as: "customer",
          attributes: ["customer_name"]
        }
      ]
    });
  } catch (err) {
    console.log(err);
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //Returning 200 Response
  if (isError == false) {
    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);
    res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: "SRF Added Successfully",
      data: srfs,
    });
  }
};

const getsrfbyId = async (req, res, next) => {

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/getsrfbyId";
  let action = "Getting SRF Details!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;
  let srf;

  if (!req.body || !req.body.srfId) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  try {
    srf = await SRF.findOne({
      where: { srf_id: req.body.srfId, rstatus: 1 },
      include: [
        {
          model: Lab,
          as: "lab",
          attributes: {
            exclude: [
              "created_timestamp",
              "created_by_login_name",
              "created_by_user_id",
              "updated_timestamp",
              "updated_by_login_name",
              "updated_by_user_id",

              "address1",
              "address2",
              "address3",

              "lab_id",
              "lab_name",

              "contact_email",
              "contact_number1",
              "contact_number2",

              "rstatus",

              "brand_logo_filename",
              "brand_logo_mime_type",
              "brand_logo",

              "other_logo1_image_filename",
              "other_logo1_image_mime_type",
              "other_logo1_image",

              "other_logo2_image_filename",
              "other_logo2_image_mime_type",
              "other_logo2_image"
            ],
          }
        },
        {
          model: customer,
          as: "customer",
          attributes: {
            exclude: [
              "created_timestamp", "created_by_login_name", "created_by_user_id",
              "updated_timestamp", "updated_by_login_name", "updated_by_user_id",
            ],
          },
        }
      ]
    });
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
  // return res.json({ srf });

  if (!srf) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //Getting SRF Items
  let items;
  try {
    items = await Item.findAll({
      where: { srf_id: req.body.srfId, rstatus: 1 },
      include: ["intrument_type"],
      // include: [
      //   {
      //     model: Masterlist,
      //     as: "masterlist",
      //     attributes: {
      //       exclude: ["createdAt", "updatedAt", "id", "rstatus", "labId"],
      //     },
      //   },
      // ],
      // attributes: {
      //   exclude: ["createdAt", "updatedAt"],
      // },
      // order: [["sno", "ASC"]],
    });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //Returning 200 Response
  if (isError == false) {

    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);

    res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: "SRF Details Fetched Successfully",
      data: {
        srf,
        items,
      },
    });
  }
};

const getSrfItems = async (req, res, next) => {

  const { labId } = req.body;

  if (!labId) {
    let action = "Lab id is required";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  try {
    let items = await Item.findAll({
      where: { lab_id: labId, rstatus: 1 },
      include: ["intrument_type"],
      order: [["srf_item_id", "ASC"]]
    });

    res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "SRF Details Fetched Successfully",
      data: {
        items,
      }
    });
  } catch (err) {
    console.log(err);
    let action = "Something went wrong, please try again";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
}

const addItemtoSRF = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/additemtosrf";
  let action = "Adding Item to SRF!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;
  let srf;
  //console.log(req.body);
  if (!req.body || !req.body.srfId || !req.body.item) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  try {
    srf = await SRF.findOne({
      where: { id: req.body.srfId, rstatus: 1 },
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
  if (!srf) {
    isError = true;
    code = 500;
    action = "SRF not Found!!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //SRF Items Validation
  const validitem = itemSchema(req.body.item);
  if (!validitem) {
    isError = true;
    code = 400;
    action = "Invalid SRF Item!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  try {
    const item = req.body.item;
    item.status = "Not Calibrated";
    item.rstatus = 1;
    const newitem = new Item(item);
    await newitem.save();
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //Getting SRF Items
  let items;
  try {
    items = await Item.findAll({
      where: { srfId: req.body.srfId, rstatus: 1 },
      include: [
        {
          model: Masterlist,
          as: "masterlist",
          attributes: {
            exclude: ["createdAt", "updatedAt", "id", "rstatus", "labId"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      order: [["sno", "ASC"]],
    });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //Returning 200 Response
  if (isError == false) {
    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);
    res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: "SRF Items Fetched Successfully",
      data: {
        items,
      },
    });
  }
};

const updateSRFItem = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/updateitem";
  let action = "Updating SRF Item!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;
  if (!req.body || !req.body.id || !req.body.item || !req.body.srfId) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //SRF Items Validation
  const validitem = itemSchema(req.body.item);
  if (!validitem) {
    isError = true;
    code = 400;
    action = "Invalid SRF Item!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  ////console.log(req.body);
  try {
    const item = await Item.findOne({
      where: {
        id: req.body.id,
        rstatus: 1,
      },
    });
    ////console.log(item);
    if (item) {
      await item.update(req.body.item);
    }
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //Getting SRF Items
  let items;
  try {
    items = await Item.findAll({
      where: { srfId: req.body.srfId, rstatus: 1 },
      include: [
        {
          model: Masterlist,
          as: "masterlist",
          attributes: {
            exclude: ["createdAt", "updatedAt", "id", "rstatus", "labId"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      order: [["sno", "ASC"]],
    });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //Returning 200 Response
  if (isError == false) {
    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);
    res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: "SRF Item Updated Successfully",
      data: {
        items,
      },
    });
  }
};

const updateDCInfo = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/updatedcinfo";
  let action = "Updating SRF Item Dispatch Information!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;
  //console.log(req.body);
  const mode = req.body.mode;
  if (!req.body || !req.body.items || !req.body.srfId || !req.body.mode) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //SRF Items Validation
  const validitem = itemsSchema(req.body.items);
  if (!validitem) {
    isError = true;
    code = 400;
    action = "Invalid SRF Item!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  ////console.log(req.body);
  let ids = [];
  req.body.items.map((v, i) => {
    ids.push(v.id);
  });
  //console.log(ids);
  if (mode == 1) {
    try {
      await Item.update(req.body.dcinfo, {
        where: {
          id: ids,
          rstatus: 1,
          status: "Report Generated",
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
  }
  if (mode == 2) {
    try {
      await Item.update(req.body.dcinfo, {
        where: {
          id: ids,
          rstatus: 1,
          status: "Dispatched",
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
  }

  //Getting SRF Items
  let items;
  try {
    items = await Item.findAll({
      where: { srfId: req.body.srfId, rstatus: 1 },
      include: [
        {
          model: Masterlist,
          as: "masterlist",
          attributes: {
            exclude: ["createdAt", "updatedAt", "id", "rstatus", "labId"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      order: [["sno", "ASC"]],
    });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //Returning 200 Response
  if (isError == false) {
    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);
    res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: "SRF Items Dispatch information Updated Successfully",
      data: {
        items,
      },
    });
  }
};

const updateCalInfo = async (req, res, next) => {

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/updatecalinfo";
  let action = "Updating SRF Item Calibration and/or Report Information!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;

  const { mode, userName, id, srfId, date, reportGenerateDate } = req.body;

  if (!mode || !userName) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  if (mode == 1) {
    try {
      const item = await Item.findOne({
        where: {
          srf_item_id: id,
          rstatus: 1,
          status: "Not Calibrated",
        },
      });

      if (item) {
        await item.update({
          calibration_done_date: date,
          calibration_done_by_empname: userName,
          status: "Calibrated",
        });
      }

    } catch (err) {
      isError = true;
      code = 500;
      action = "Internal Server Error!!";
      const error = new Error(action);
      error.code = code;
      error.path = path;
      return errorHandler(error, req, res, next);
    }
  } else if (mode == 2) {
    try {
      const item = await Item.findOne({
        where: {
          srf_item_id: id,
          rstatus: 1,
          status: "Calibrated",
        },
      });

      if (item) {
        await item.update({
          report_done_date: reportGenerateDate,
          report_done_by_empname: userName,
          status: "Report Generated",
        });
      }
    } catch (err) {
      isError = true;
      code = 500;
      action = "Internal Server Error!!";
      const error = new Error(action);
      error.code = code;
      error.path = path;
      return errorHandler(error, req, res, next);
    }
  } else if (mode == 3) {
    try {
      const item = await Item.findOne({
        where: {
          srf_item_id: id,
          rstatus: 1,
          // status: "Not Calibrated",
        },
      });

      if (item) {
        await item.update({
          calibration_done_date: date,
          calibration_done_by_empname: userName,
          report_done_date: reportGenerateDate,
          report_done_by_empname: userName,
          status: "Report Generated",
        });
      }
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

  // TODO: calculate calibration_due_date = calibration_done_date + frequency_in_months [calculate in srf-items table]
  try {
    // *** frequency_in_months from srf_lists table ***
    let srfResult = await SRF.findOne({
      attributes: ['reminder_frequency'],
      where: { srf_id: srfId }
    });

    let { reminder_frequency } = srfResult;

    if (reminder_frequency == null) {
      reminder_frequency = 0
    }

    const calibration_done_date = new Date(date)
    const calibration_due_date = new Date(calibration_done_date.setMonth(calibration_done_date.getMonth() + parseInt(reminder_frequency)));

    await Item.update(
      {
        calibration_due_date
      },
      { where: { srf_item_id: id } }
    )
  } catch (err) {
    console.log(err);
    const error = new Error("Failed to update calibration due date !!!");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  // ! SET Calibration Reaminder Dates
  // TODO: Formula calibration_remainder_date = calibration_due_date - frequency_days [calculate in srf-items table]

  // *** Getting frequency_days from srf_lists table ***
  let srfResult = await SRF.findOne({
    attributes: ['frequency_days'],
    where: { srf_id: srfId }
  });
  const { frequency_days } = srfResult;

  // *** Getting calibration_due_date from srfitems table ***
  let srfItemResult = await Item.findOne({
    where: { srf_item_id: id },
    attributes: ['srf_item_id', 'calibration_due_date']
  });
  const { calibration_due_date } = srfItemResult;

  let createResponse = "";
  let calibration_remainder_date_1;
  let calibration_remainder_date_2;
  if (frequency_days == 1) {

    let due_date_1 = new Date(calibration_due_date);
    let diffDateInMS_1 = due_date_1.setDate(due_date_1.getDate() - 7);
    calibration_remainder_date_1 = new Date(diffDateInMS_1);

    await srfItemResult.update({
      calibration_remainder_date_1
    });

    createResponse = "1 remainder";

  } else if (frequency_days == 2) {

    let due_date_1 = new Date(calibration_due_date);
    let diffDateInMS_1 = due_date_1.setDate(due_date_1.getDate() - 15);
    calibration_remainder_date_1 = new Date(diffDateInMS_1);

    let due_date_2 = new Date(calibration_due_date);
    let diffDateInMS_2 = due_date_2.setDate(due_date_2.getDate() - 7);
    calibration_remainder_date_2 = new Date(diffDateInMS_2);

    await srfItemResult.update({
      calibration_remainder_date_1,
      calibration_remainder_date_2
    });

    createResponse = "2 remainder";
  }

  // return res.json({
  //   frequency_days, createResponse, calibration_due_date,
  //   calibration_remainder_date_1, calibration_remainder_date_2
  // });

  // *** Getting SRF Items from srfitems table ***
  let items;
  try {
    items = await Item.findAll({
      where: { srf_id: srfId, rstatus: 1 },
      include: ["intrument_type"],
    });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //Returning 200 Response
  if (isError == false) {
    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);
    res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: "SRF Item Updated Successfully",
      data: {
        items,
      },
    });
  }
};

const deleteSRFItem = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/deleteitem";
  let action = "Delete SRF Item!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;
  //console.log(req.body);
  const { id, srfId } = req.body;
  if (!id || !srfId) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  try {
    const item = await Item.findOne({
      where: {
        id: id,
        rstatus: 1,
        status: "Not Calibrated",
        srfId,
      },
    });
    ////console.log(item);
    if (item) {
      await item.update({
        rstatus: 0,
      });
    }
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //Getting SRF Items
  let items;
  try {
    items = await Item.findAll({
      where: { srfId: req.body.srfId, rstatus: 1 },
      include: [
        {
          model: Masterlist,
          as: "masterlist",
          attributes: {
            exclude: ["createdAt", "updatedAt", "id", "rstatus", "labId"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      order: [["sno", "ASC"]],
    });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //Returning 200 Response
  if (isError == false) {
    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);
    res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: "SRF Item Deleted Successfully",
      data: {
        items,
      },
    });
  }
};

const updateInvoiceInfo = async (req, res, next) => {

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/updateinvoice";
  let action = "Updating SRF Item Invoice Information!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;
  let mainLogoImgFileName = "";

  if (!req.body || !req.body.items || !req.body.srfId || !req.body.invoiceinfo) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

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

  //SRF Items Validation
  const validitem = itemsSchema(req.body.items);

  // return res.json({ validitem });

  if (!validitem) {
    isError = true;
    code = 400;
    action = "Invalid SRF Item!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  const { file } = req.body

  if (file) {
    const mainLogoDecodeImg = decodeBase64Image(file);
    const imageBuffer = mainLogoDecodeImg.data;
    const fileExtension = mainLogoDecodeImg.type.slice(12);
    mainLogoImgFileName = Math.floor(Math.random() * 9999999) + "." + fileExtension;

    try {
      fs.writeFileSync("public/invoices/" + mainLogoImgFileName, imageBuffer, 'utf8');
    }
    catch (err) {
      const error = new Error("Failed to upload the certificate.");
      error.code = code;
      return errorHandler(error, req, res, next);
    }
  }

  let ids = [];
  req.body.items.map((v, i) => {
    ids.push(v.srf_item_id);
  });

  const { invoice_no, invoice_date, invoice_due_date, status } = req.body.invoiceinfo;

  try {
    const updateQuery = await Item.update(
      {
        invoice_no, invoice_date, invoice_due_date, status,
        invoice_file_name: mainLogoImgFileName
      },
      { where: { srf_item_id: ids, rstatus: 1 } }
    );


    // TODO: Fire the mail
    let filePath = nodePath.join(__dirname, '../' + 'public/invoices' + '/' + mainLogoImgFileName);

    let srfItemsQuery = await Item.findOne({
      where: { srf_item_id: ids },
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

    const { msg, statusCode } = await sendMailHandler(srfItemsQuery, filePath);

    let items = await Item.findAll({
      where: { lab_id: 1, rstatus: 1 },
      include: ["intrument_type"],
      order: [["srf_item_id", "ASC"]]
    });

    // return res.json({ srfItemsQuery, msg, statusCode });

    return res.status(statusCode).json({
      status: "SUCCESS",
      code: statusCode,
      message: `SRF Items Invoice information Updated Successfully & ${msg}`,
      filename: mainLogoImgFileName,
      items: items
    });

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

  // ! Getting SRF Items
  // let items;
  // try {
  //   items = await Item.findAll({
  //     where: { srfId: req.body.srfId, rstatus: 1 },
  //     include: [
  //       {
  //         model: Masterlist,
  //         as: "masterlist",
  //         attributes: {
  //           exclude: ["createdAt", "updatedAt", "id", "rstatus", "labId"],
  //         },
  //       },
  //     ],
  //     attributes: {
  //       exclude: ["createdAt", "updatedAt"],
  //     },
  //     order: [["sno", "ASC"]],
  //   });
  // } catch (err) {
  //   isError = true;
  //   code = 500;
  //   action = "Internal Server Error!!!";
  //   const error = new Error(action);
  //   error.code = code;
  //   error.path = path;
  //   return errorHandler(error, req, res, next);
  // }

  //Returning 200 Response
  // if (isError == false) {
  //   let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
  //   logger.info(message);
  //   res.status(200).json({
  //     status: "SUCCESS",
  //     code: 200,
  //     message: "SRF Items Invoice information Updated Successfully",
  //     data: {
  //       items
  //     }
  //   });
  // }
};

const updatePaymentInfo = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/updatepayment";
  let action = "Updating SRF Item Payment Information!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;
  ////console.log(req.body);
  if (
    !req.body ||
    !req.body.items ||
    !req.body.srfId ||
    !req.body.paymentinfo
  ) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //SRF Items Validation
  const validitem = itemsSchema(req.body.items);
  if (!validitem) {
    isError = true;
    code = 400;
    action = "Invalid SRF Item!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  ////console.log(req.body);
  let ids = [];
  req.body.items.map((v, i) => {
    ids.push(v.id);
  });
  //console.log(ids);
  try {
    await Item.update(req.body.paymentinfo, {
      where: {
        id: ids,
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

  //Getting SRF Items
  let items;
  try {
    items = await Item.findAll({
      where: { srfId: req.body.srfId, rstatus: 1 },
      include: [
        {
          model: Masterlist,
          as: "masterlist",
          attributes: {
            exclude: ["createdAt", "updatedAt", "id", "rstatus", "labId"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      order: [["sno", "ASC"]],
    });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //Returning 200 Response
  if (isError == false) {
    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);
    res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: "SRF Items Payment information Updated Successfully",
      data: {
        items,
      },
    });
  }
};

const getfilteredSRFItems = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/getfilteredsrfitems";
  let action = "Getting Filtered SRF Items!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;
  let srf;
  if (!req.body || !req.body.srfIds || !req.body.labId) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //Getting SRF Items
  let items;
  try {
    items = await Item.findAll({
      where: { srfId: req.body.srfIds, labId: req.body.labId, rstatus: 1 },
      include: [
        {
          model: Masterlist,
          as: "masterlist",
          attributes: {
            exclude: ["createdAt", "updatedAt", "id", "rstatus", "labId"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      order: [["sno", "ASC"]],
    });
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }
  //Returning 200 Response
  if (isError == false) {
    let message = `${ip} ${userId} ${sessionId} ${code} ${path} - ${action}`;
    logger.info(message);
    res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: "Filtered SRF Items Fetched Successfully",
      data: {
        items,
      },
    });
  }
};

const fetchSrfItem = async (req, res, next) => {

  if (!req.body || !req.body.srf_item_id) {
    let action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = 400;
    return errorHandler(error, req, res, next);
  }

  const { srf_item_id } = req.body;

  //Getting SRF Items
  try {
    let items = await Item.findOne({
      where: { srf_item_id },
      include: ["intrument_type", "srf"]
    });

    return res.status(200).json({
      data: items, response: "SRF Item Fetched successfully!!!"
    });
  } catch (err) {
    let action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};

exports.getfilteredSRFItems = getfilteredSRFItems;
exports.updatePaymentInfo = updatePaymentInfo;
exports.updateInvoiceInfo = updateInvoiceInfo;
exports.deleteSRFItem = deleteSRFItem;
exports.updateCalInfo = updateCalInfo;
exports.updateDCInfo = updateDCInfo;
exports.updateSRFItem = updateSRFItem;
exports.addItemtoSRF = addItemtoSRF;
exports.getsrfbyId = getsrfbyId;
exports.getSRFs = getSRFs;
exports.addSRFHandler = addSRFHandler;
exports.getSrfItems = getSrfItems;
exports.fetchSrfItem = fetchSrfItem;