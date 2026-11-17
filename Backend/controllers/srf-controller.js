const logger = require("../utils/logger");
const srfSchema = require("../schemas/srf");
const itemsSchema = require("../schemas/items");
const bulkitemSchema = require("../schemas/bulkitem");
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const User = require("../models").User;
const Company = require("../models").Company;
const customer = require("../models").customer;
const itemSchema = require("../schemas/item");
const Lab = require("../models").Lab;
const Masterlist = require("../models").Masterlist;
const instrument_type = require("../models").instrument_type;
const master_result_table = require("../models").master_result_table;
const result_table = require("../models").result_table;
const srf_approval_history = require("../models").srf_approval_history;
const ProcedureResult = require("../models").ProcedureResult;
const nodeMailer = require("nodemailer");
const ExcelJS = require("exceljs");
const fs = require('fs');
const nodePath = require('path');
const ejs = require('ejs');
const Certificate = require("../models").Certificate;

const { sendMailHandler } = require("../helpers/mailSend");
const { errorHandler } = require("../helpers/error-handler");
const { generateInwardNumber, generateSingleInwardNumber } = require("../utils/generateInwardNumber");

const { format } = require('date-fns');
const { Op } = require("sequelize");
const generateAndAssignCertificateNo = require("../utils/generateAndAssignCertificateNo");
const { createDynamicTransport } = require('../helpers/mail-config-helper');
const CertificateFormat = require("../models").CertificateFormat;
const ULRSetup = require("../models").ULRGeneration;
const { resequenceULRNumbers } = require("../utils/resequenceULRNumbers");
const { generate } = require("./Generate-Certificate-Controller");
const { generateULRNumber } = require("./ULR-No-Generation-Controller");
const progressTracker = require("../utils/progressTracker");
const { syncSequencesForLab } = require("../utils/syncSequences");

const checkUlrSetupForCurrentYear = async (labId) => {
  const currentYear = new Date().getFullYear() % 100;
  const ulrConfig = await ULRSetup.findOne({
    where: { lab_id: labId, currentYear: currentYear }
  });
  if (!ulrConfig) {
    const error = new Error(`ULR configuration not found for the year 20${currentYear}. Please set up ULR for the current year before adding items or creating SRFs.`);
    error.code = 400;
    throw error;
  }
};



let err;

const addSRFHandler = async (req, res, next) => {


  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/add";
  let action = "Adding New SRF!!";
  let userId = req.userId;
  const sessionId = req.sessionId;
  let isError = false;

  //console.log(req.body);

  if (!req.body || !req.body.srf || !req.body.items || !req.body.labId) {
    isError = true;
    code = 400;
    action = "Invalid Request Params!!";
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  try {
    // Check if ULR is configured for the current year
    await checkUlrSetupForCurrentYear(req.body.labId);
  } catch (err) {
    return errorHandler(err, req, res, next);
  }

  let currentSRF = {};
  currentSRF.srf_type = req.body.srf.type;
  currentSRF.srf_date = req.body.srf.date;
  currentSRF.srf_number = req.body.srf.srfno;

  currentSRF.contact_name = req.body.srf.contact_name;
  currentSRF.contact_number = req.body.srf.contact_number;
  currentSRF.contact_email = req.body.srf.contact_email;

  currentSRF.customer_dc_date = req.body.srf.customer_dc_date;
  currentSRF.statement_of_confirmity_flag = (req.body.srf.statement_of_confirmity_flag) ? "YES" : "NO";
  currentSRF.uncertainity_consider_flag = (req.body.srf.uncertainity_consider_flag) ? "YES" : "NO";
  currentSRF.customer_id = req.body.srf.CompanyId;

  currentSRF.department = req.body.srf.department;
  currentSRF.customer_dc = (req.body.srf.customer_dc && req.body.srf.customer_dc.trim() !== "") ? req.body.srf.customer_dc.trim() : "NA";
  currentSRF.customer_dc_file_path = req.body.srf.customer_dc_file_path;
  currentSRF.send_srf_via_email = (req.body.srf.sendsrf) ? "YES" : "NO";

  currentSRF.agreed_completion_date = (req.body.srf.agreed_date) ? req.body.srf.agreed_date : null;
  currentSRF.statement_of_confirmity = req.body.srf.statement_of_confirmity;

  currentSRF.issue_no = req.body.srf.issue_no;
  currentSRF.issue_date = (req.body.srf.issue_date) ? req.body.srf.issue_date : null;

  currentSRF.amend_no = req.body.srf.amend_no;
  currentSRF.amend_date = (req.body.srf.amend_date) ? req.body.srf.amend_date : null;
  // currentSRF.calibrationAt = req.body.srf.Calibrationat
  currentSRF.customer_code = req.body.srf.customer_code
  currentSRF.contract_agreement = req.body.srf.customer_code

  let sendsrf = req.body.srf.sendsrf;
  let srfDate = req.body.srf.date || new Date()

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
  // return res.json({ validitems });
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

    // if (srfno) {
    //   isError = true;
    //   code = 500;
    //   action = "SRF Number Already Exists!!";
    //   const error = new Error(action);
    //   error.code = code;
    //   error.path = path;
    //   return errorHandler(error, req, res, next);
    // }


    const isNaDc = ["NA", "N/A", "na", "n/a", ""].includes((currentSRF.customer_dc || "").trim());

    const orConditions = [
      { srf_number: currentSRF.srf_number },
    ];
    if (!isNaDc) {
      orConditions.push({ customer_dc: currentSRF.customer_dc });
    }

    const duplicate = await SRF.findOne({
      where: {
        lab_id: req.body.labId,
        rstatus: 1,
        [Op.or]: orConditions,
      },
    });

    if (duplicate) {
      const errorMessage =
        duplicate.srf_number === currentSRF.srf_number
          ? "SRF Number Already Exists!!"
          : "Customer DC Number Already Exists!!";

      const error = new Error(errorMessage);
      error.code = 400;
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

    isError = false;

    const items = [];
    const itemsData = req.body.items.map(item => ({
      ...item,
      serialno: item.serialno !== undefined && item.serialno !== null ? String(item.serialno) : item.serialno,
      idno: item.idno !== undefined && item.idno !== null ? String(item.idno) : item.idno
    }));

    const idNumbers = itemsData.map(i => i.idno);

    const duplicateInRequest = idNumbers.filter(
      (item, index) => idNumbers.indexOf(item) !== index
    );

    if (duplicateInRequest.length > 0) {
      const uniqueDuplicates = [...new Set(duplicateInRequest)];

      const error = new Error(
        `Duplicate ID No(s) in same SRF request: ${uniqueDuplicates.join(", ")}`
      );
      error.code = 400;
      return errorHandler(error, req, res, next);
    }

    const inwardNumbers = await generateInwardNumber({
      inwardDate: srfDate,
      items: itemsData,
      model: Item,
      labId: req.body.labId,
      srfId: newSRF.srf_id
    });


    for (let i = 0; i < itemsData.length; i++) {
      const v = itemsData[i];
      const inwardNumber = inwardNumbers[i];

      items.push({
        srf_id: newSRF.srf_id,
        srf_item_no: i + 1,
        inward_no: inwardNumber,
        make: v.make,
        model: v.model,
        serial_no: v.serialno,
        identification_details: v.idno,
        remarks: v.remarks,
        reminder_frequency: v.reminder_frequency || 0,
        frequency_days: v.frequency_days || null,
        status: "Not Calibrated",
        rstatus: 1,
        lab_id: req.body.labId,
        intrument_type_id: v.masterlistId,
        created_timestamp: Date.now(),
        created_by_login_name: fetchCreater.name,
        created_by_user_id: req.userId,
        updated_timestamp: Date.now(),
        updated_by_login_name: fetchCreater.name,
        updated_by_user_id: req.userId,
        calibrationAt: v.calibrationAt,
        labtype: v.labtype,
        ranges: v.ranges,
        instrument_type_at_calibration: v.instrument_type_at_calibration,
        assignedTo: v.assignedTo,
        instrumentData: v.instrumentData || null,
      });
    }

    // Assign ULR numbers server-side: ONLY for NABL items
    const nablIndices = [];
    items.forEach((itemObj, idx) => {
      if ((itemObj.labtype || "").trim().toUpperCase() === "NABL") {
        nablIndices.push(idx);
      } else {
        itemObj.url_number = null;
      }
    });

    if (nablIndices.length > 0) {
      const generatedUlrs = await generateULRNumber(nablIndices.length, req.body.labId);
      nablIndices.forEach((itemIdx, i) => {
        items[itemIdx].url_number = generatedUlrs[i];
      });
    }

    insertedItems = await Item.bulkCreate(items, { returning: true });

    for (const createdItem of insertedItems) {
      await generateAndAssignCertificateNo({
        item: createdItem,
        srf: newSRF,
        itemCount: null,
        Item,
        labId: req.body.labId
      });
    }

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

  let year = format(new Date(srf.srf_date), "yyyy");
  //let srfid = `${srf.lab.symbol}/${year}/${srf.srf_type}${modifiedsno}`;
  let srfid = currentSRF.srf_number;

  //let srfid = srf.lab.symbol + "/" + srf.srf_date.slice(0, 4) + "/" + srf.srf_type + modifiedsno;
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
  //worksheet.getCell("H8").value = srf.srf_date.split("-").reverse().join("-");
  worksheet.getCell("H8").value = format(new Date(srf.srf_date), "dd-MM-yyyy");
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
  let nextcalflag;
  let reminderFreq = items && items.length > 0 ? items[0].reminder_frequency : "0";
  let calfreq = reminderFreq != "0" ? reminderFreq + " months" : "------";
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
    //worksheet.getCell("H63").value = srf?.srf_date?.split("-")?.reverse()?.join("-");
    worksheet.getCell("H63").value = format(new Date(srf.srf_date), "dd-MM-yyyy");
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

  if (existingLab?.sender_email) {


    const transporter = createDynamicTransport(
      nodeMailer,
      existingLab?.email_smtp_server_host,
      existingLab?.email_smtp_server_port,
      existingLab?.sender_email,
      existingLab?.sender_password
    );

    fileName = srfid + "-" + new Date().getTime() + ".xlsx";

    if (sendsrf) {
      try {
        const info = await transporter.sendMail({
          from: existingLab?.sender_email,
          to: req?.body?.srf?.contact_email,
          subject: "CalibMaster - New SRF Created " + fileName,
          html: "<p><b>Please find the SRF on attachment.</b></p>",
          priority: "high",
          attachments: [
            {
              filename: fileName,
              content: buffer,
            }
          ]
        });

        console.log(info);
      } catch (err) {
        console.log(err);
        const error = new Error("Error when sending the mail");
        error.code = 500;
        return errorHandler(error, req, res, next);
      }
    }
  }

  //Returning 200 Response
  if (isError == false) {
    return res.status(201).json({
      status: "SUCCESS",
      code: 201,
      insertedItems,
      message: "SRF Added Successfully",
    });
  }
};

const getSRFs = async (req, res, next) => {

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/getall";
  let action = "Getting all SRFs!!";
  let userId = req.body.userId || req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;
  const {
    labId,
    page = 1,
    limit = 5,
    search = "",
    sortBy = "srf_id",
    sortOrder = "DESC"
  } = req.body;
  let srfs;
  let totalCount = 0;
  let parsedPage = 1;
  let parsedLimit = 5;

  try {
    if (!labId) {
      return res.status(400).json({ code: 400, message: "labId is required" });
    }

    parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) parsedPage = 1;

    parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) parsedLimit = 5;
    const allowedLimits = [5, 10, 20, 50, 100];
    if (!allowedLimits.includes(parsedLimit)) {
      parsedLimit = parsedLimit > 100 ? 100 : (allowedLimits.find(l => l >= parsedLimit) || 5);
    }

    const offset = (parsedPage - 1) * parsedLimit;

    const allowedSortFields = ["srf_id", "srf_date", "agreed_date", "created_timestamp", "updated_timestamp"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "srf_id";
    const safeSortOrder = (sortOrder && String(sortOrder).toUpperCase() === "ASC") ? "ASC" : "DESC";

    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";

    const srfInclude = [
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
      },
      {
        model: User,
        as: "creator",
        attributes: ["name"]
      }
    ];

    const whereClause = {
      lab_id: labId,
      rstatus: 1
    };

    if (isRestricted) {
      const assignedSrfIds = await Item.findAll({
        where: { assignedTo: userId },
        attributes: ['srf_id'],
        group: ['srf_id'],
        raw: true
      });
      const assignedIds = assignedSrfIds.map(r => r.srf_id);

      whereClause[Op.or] = [
        { created_by_user_id: userId },
        ...(assignedIds.length > 0 ? [{ srf_id: { [Op.in]: assignedIds } }] : [])
      ];
    }

    if (search && String(search).trim() !== "") {
      const searchPattern = `%${String(search).trim()}%`;
      const searchConditions = [
        { customer_dc_no: { [Op.iLike]: searchPattern } },
        { '$customer.customer_name$': { [Op.iLike]: searchPattern } }
      ];
      if (!isNaN(search.trim())) {
        searchConditions.push({ srf_id: parseInt(search.trim(), 10) });
      }
      if (whereClause[Op.and]) {
        whereClause[Op.and].push({ [Op.or]: searchConditions });
      } else {
        whereClause[Op.and] = [{ [Op.or]: searchConditions }];
      }
    }

    totalCount = await SRF.count({
      where: whereClause,
      include: search ? [{ model: customer, as: "customer" }] : undefined,
      distinct: true,
      col: 'srf_id'
    });

    srfs = await SRF.findAll({
      where: whereClause,
      include: srfInclude,
      order: [[safeSortBy, safeSortOrder]],
      limit: parsedLimit,
      offset: offset
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
      message: "SRF List Fetched Successfully",
      data: srfs,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit
      }
    });
  }
};

const getsrfbyId = async (req, res, next) => {

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/getsrfbyId";
  let action = "Getting SRF Details!!";
  let userId = req.body.userId || req.userId;
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

              // "address1",
              "address2",
              "address3",

              "lab_id",
              // "lab_name",

              "contact_email",
              // "contact_number1",
              "contact_number2",

              "rstatus",

              // "brand_logo_filename",
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
  let totalCount = 0;
  let parsedPage = 1;
  let parsedLimit = 5;
  try {
    const { page, limit, sortBy = "srf_item_id", sortOrder = "DESC" } = req.body || {};

    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
    const itemWhere = { srf_id: req.body.srfId, rstatus: 1 };
    if (isRestricted) {
      itemWhere[Op.or] = [
        { created_by_user_id: userId },
        { assignedTo: userId }
      ];
    }

    totalCount = await Item.count({
      where: itemWhere,
      distinct: true,
      col: 'srf_item_id'
    });

    const queryOptions = {
      where: itemWhere,
      include: [
        {
          association: "intrument_type",
          include: [
            {
              association: "instrument",
            }
          ]

        }, "srf"
      ],
      order: [
        [sortBy || 'srf_item_id', sortOrder || 'DESC'],
      ]
    };

    if (page !== undefined || limit !== undefined) {
      parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) parsedPage = 1;

      parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) parsedLimit = 5;
      const allowedLimits = [5, 10, 20, 50, 100];
      if (!allowedLimits.includes(parsedLimit)) {
        parsedLimit = parsedLimit > 100 ? 100 : (allowedLimits.find(l => l >= parsedLimit) || 5);
      }

      queryOptions.limit = parsedLimit;
      queryOptions.offset = (parsedPage - 1) * parsedLimit;
    }

    items = await Item.findAll(queryOptions);

    let counter = (queryOptions.offset || 0) + 1;
    for (let i = 0; i < items.length; i++) {
      items[i].dataValues.slNo = counter++;
    }
  } catch (err) {
    isError = true;
    code = 500;
    action = "Internal Server Error!!" + err;
    const error = new Error(action);
    error.code = code;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  // Determine if adding items is allowed based on SRF date
  let allowAddItem = false;
  try {
    const latestSRF = await SRF.findOne({
      where: { lab_id: srf.lab_id, rstatus: 1 },
      order: [['srf_date', 'DESC'], ['srf_id', 'DESC']],
      attributes: ['srf_date']
    });

    const srfDate = format(new Date(srf.srf_date), "yyyy-MM-dd");
    const latestDate = latestSRF ? format(new Date(latestSRF.srf_date), "yyyy-MM-dd") : null;
    const today = format(new Date(), "yyyy-MM-dd");

    allowAddItem = (srfDate === latestDate || srfDate === today);
    srf.dataValues.allowAddItem = allowAddItem;
  } catch (latestErr) {
    console.error("Error finding latest SRF date:", latestErr);
    // Fallback to true if we can't determine, or handle as needed
    srf.dataValues.allowAddItem = true;
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
        pagination: {
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / parsedLimit),
          currentPage: parsedPage,
          limit: parsedLimit
        }
      },
    });
  }
};

const getSrfItems = async (req, res, next) => {

  const {
    labId,
    userId,
    page = 1,
    limit = 5,
    search = "",
    status = "",
    sortBy = "srf_item_id",
    sortOrder = "DESC"
  } = req.body;

  if (!labId) {
    let action = "Lab id is required";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  // Standardize & clamp pagination inputs
  let parsedPage = parseInt(page, 10);
  if (isNaN(parsedPage) || parsedPage < 1) parsedPage = 1;

  let parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit < 1) parsedLimit = 5;
  const allowedLimits = [5, 10, 20, 50, 100];
  if (!allowedLimits.includes(parsedLimit)) {
    parsedLimit = parsedLimit > 100 ? 100 : (allowedLimits.find(l => l >= parsedLimit) || 5);
  }

  const offset = (parsedPage - 1) * parsedLimit;

  const allowedSortFields = ["srf_item_id", "srf_item_no", "inward_no", "make", "model", "identification_details", "serial_no", "status", "calibration_done_date", "calibration_due_date", "created_timestamp", "updated_timestamp"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "srf_item_id";
  const safeSortOrder = (sortOrder && String(sortOrder).toUpperCase() === "ASC") ? "ASC" : "DESC";

  const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
  const itemWhere = { lab_id: labId, rstatus: 1 };
  if (isRestricted) {
    itemWhere[Op.or] = [
      { created_by_user_id: userId },
      { assignedTo: userId }
    ];
  }

  if (status) {
    if (Array.isArray(status) && status.length > 0) {
      itemWhere.status = { [Op.in]: status };
    } else if (typeof status === 'string' && status.trim() !== "") {
      if (status.includes(',')) {
        const statusArr = status.split(',').map(s => s.trim()).filter(Boolean);
        itemWhere.status = { [Op.in]: statusArr };
      } else {
        itemWhere.status = status.trim();
      }
    }
  }

  if (search && String(search).trim() !== "") {
    const searchPattern = `%${String(search).trim()}%`;
    const searchConds = [
      { serial_no: { [Op.iLike]: searchPattern } },
      { identification_details: { [Op.iLike]: searchPattern } },
      { make: { [Op.iLike]: searchPattern } },
      { model: { [Op.iLike]: searchPattern } },
      { status: { [Op.iLike]: searchPattern } },
      { inward_no: { [Op.iLike]: searchPattern } },
      { dispatch_dc: { [Op.iLike]: searchPattern } }
    ];
    if (itemWhere[Op.and]) {
      itemWhere[Op.and].push({ [Op.or]: searchConds });
    } else {
      itemWhere[Op.and] = [{ [Op.or]: searchConds }];
    }
  }

  try {
    const count = await Item.count({
      where: itemWhere,
      include: [
        { model: SRF, as: "srf", where: { rstatus: 1 } }
      ],
      distinct: true,
      col: 'srf_item_id'
    });

    const items = await Item.findAll({
      where: itemWhere,
      include: [
        {
          association: "intrument_type",
          include: [
            {
              association: "instrument",
            }
          ]
        },
        { model: SRF, as: "srf", where: { rstatus: 1 }, include: "customer" }
      ],
      order: [[safeSortBy, safeSortOrder]],
      limit: parsedLimit,
      offset: offset
    });

    let counter = offset + 1;
    for (let i = 0; i < items.length; i++) {
      items[i].dataValues.slNo = counter++;
    }

    return res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "SRF Details Fetched Successfully",
      data: {
        items,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / parsedLimit),
          currentPage: parsedPage,
          limit: parsedLimit
        }
      }
    });
  } catch (err) {
    console.log(err);
    let action = "Something went wrong, please try again";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};

const addItemtoSRF = async (req, res, next) => {
  if (!req.body || !req.body.srfId || !req.body.item) {
    const error = new Error("Invalid Request Params!!");
    error.code = 400;
    return errorHandler(error, req, res, next);
  }

  const { labId, srfId, item, userId: bodyUserId } = req.body;
  const userId = bodyUserId || req.userId;

  try {
    // Check if ULR is configured for the current year
    await checkUlrSetupForCurrentYear(labId);
  } catch (err) {
    return errorHandler(err, req, res, next);
  }

  let srf;
  let createdItem
  try {
    srf = await SRF.findOne({
      where: { srf_id: srfId, rstatus: 1 }
    });
  } catch (err) {
    const error = new Error("Failed to fetch SRF");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  if (!srf) {
    const error = new Error("SRF not Found!!!");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  // const existingItem = await Item.findOne({
  //   where: {
  //     identification_details: item.identification_details,
  //     rstatus: 1,
  //   },
  //   include: [{
  //     model: SRF,
  //     as: 'srf',
  //     where: {
  //       customer_dc: srf.customer_dc,
  //       rstatus: 1
  //     }
  //   }]
  // });
  console.log(item, "item");

  if (item.identification_details) {
    // 1. Check for duplicate in the same SRF
    const duplicateInSrf = await Item.findOne({
      where: {
        srf_id: srfId,
        identification_details: item.identification_details,
        rstatus: 1,
      }
    });

    if (duplicateInSrf) {
      const error = new Error(
        `ID Number '${item.identification_details}' is already added to this SRF.`
      );
      error.code = 409;
      return errorHandler(error, req, res, next);
    }

    // 2. Check for instrument type consistency across the system
    const existingWithDifferentType = await Item.findOne({
      where: {
        identification_details: item.identification_details,
        intrument_type_id: { [Op.ne]: item.intrument_type_id },
        rstatus: 1,
      },
      include: [{
        association: "intrument_type",
        include: ["instrument"]
      }]
    });

    if (existingWithDifferentType) {
      const typeName = existingWithDifferentType.intrument_type?.instrument?.instrument_name || "another type";
      const error = new Error(
        `ID Number '${item.identification_details}' is already assigned to a ${typeName}. It cannot be used for a different instrument type.`
      );
      error.code = 409;
      return errorHandler(error, req, res, next);
    }
  }

  const inwardNumber = await generateSingleInwardNumber({
    inwardDate: srf.srf_date,
    itemName: item.name,
    model: Item,
    labId: labId,
    srfId: srfId
  });

  const fetchCreater = await User.findOne({
    where: { id: req.userId }
  });

  try {
    item.srf_id = srfId;
    item.status = "Not Calibrated";
    item.rstatus = 1;
    item.lab_id = labId;
    item.inward_no = inwardNumber;

    item.created_timestamp = Date.now();
    item.created_by_login_name = fetchCreater.name;
    item.created_by_user_id = req.userId;

    item.updated_timestamp = Date.now();
    item.updated_by_login_name = fetchCreater.name;
    item.updated_by_user_id = req.userId;
    item.assignedTo = item.assignedTo || null;

    // Assign ULR number server-side: ONLY for NABL items
    if ((item.labtype || "").trim().toUpperCase() === "NABL") {
      const [assignedUlr] = await generateULRNumber(1, labId);
      item.url_number = assignedUlr;
    } else {
      item.url_number = null;
    }

    //await Item.create(item);
    createdItem = await Item.create(item);
    // ✅ Generate certificate number
    await generateAndAssignCertificateNo({
      item: createdItem,
      srf,
      itemCount: null,
      Item,
      labId
    });

  } catch (err) {
    console.log(err);
    const error = new Error("Failed to create srf-item");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  // ✅ Get all items again
  let items;
  try {
    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
    const itemWhere = { srf_id: srfId, lab_id: labId, rstatus: 1 };
    if (isRestricted) {
      itemWhere[Op.or] = [
        { created_by_user_id: userId },
        { assignedTo: userId }
      ];
    }
    items = await Item.findAll({
      where: itemWhere,
      include: ["intrument_type"],
      order: [["srf_item_id", "ASC"]]
    });
  } catch (err) {
    const error = new Error("Failed to find srf-items");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  return res.status(200).json({
    status: "SUCCESS",
    code: 200,
    message: "Item added and items fetched successfully",
    data: { items, createdItem },
  });
};

const addBulkItemtoSRF = async (req, res, next) => {
  const path = '/api/srf/addbulkitemtosrf';

  if (!req.body || !req.body.srf_id || !req.body.items || !req.body.labId) {
    const error = new Error("Invalid Request Params!!");
    error.code = 400;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  // SRF Items Validation
  const validitems = bulkitemSchema(req.body.items);

  if (!validitems) {
    const error = new Error("Invalid SRF Items!!");
    error.code = 400;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  const { labId, srf_id, userId: bodyUserId } = req.body;
  const userId = bodyUserId || req.userId;

  try {
    // Check if ULR is configured for the current year
    await checkUlrSetupForCurrentYear(labId);
  } catch (err) {
    err.path = path;
    return errorHandler(err, req, res, next);
  }

  let srf
  // Fetch SRF on database
  try {
    srf = await SRF.findOne({
      where: { srf_id, rstatus: 1 }
    });

    if (!srf) {
      const error = new Error("SRF not Found!!!");
      error.code = 500;
      error.path = path;
      return errorHandler(error, req, res, next);
    }

  } catch (err) {
    const error = new Error("Failed to fetch SRF");
    error.code = 500;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  // Fetch user on database
  const fetchCreater = await User.findOne({
    where: { id: req.userId }
  });

  // Validation for bulk items identification_details
  const itemsData = req.body.items;
  const idsToCheck = itemsData.map(i => i.identification_details).filter(Boolean);

  if (idsToCheck.length > 0) {
    // 1. Internal duplicates check
    const idCounts = idsToCheck.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});
    const internalDuplicates = Object.keys(idCounts).filter(id => idCounts[id] > 1);
    if (internalDuplicates.length > 0) {
      const error = new Error(`Duplicate ID Numbers found in the upload list: ${internalDuplicates.join(", ")}`);
      error.code = 400;
      error.path = path;
      return errorHandler(error, req, res, next);
    }

    // 2. DB Check for same SRF
    const existingInSrf = await Item.findOne({
      where: {
        srf_id: srf_id,
        identification_details: { [Op.in]: idsToCheck },
        rstatus: 1
      }
    });
    if (existingInSrf) {
      const error = new Error(`ID Number '${existingInSrf.identification_details}' is already added to this SRF.`);
      error.code = 409;
      error.path = path;
      return errorHandler(error, req, res, next);
    }

    // 3. Global consistency check
    for (const item of itemsData) {
      if (item.identification_details) {
        const existingWithDifferentType = await Item.findOne({
          where: {
            identification_details: item.identification_details,
            intrument_type_id: { [Op.ne]: item.intrument_type_id },
            rstatus: 1,
          },
          include: [{
            association: "intrument_type",
            include: ["instrument"]
          }]
        });
        if (existingWithDifferentType) {
          const typeName = existingWithDifferentType.intrument_type?.instrument?.instrument_name || "another type";
          const error = new Error(`ID Number '${item.identification_details}' is already assigned to a ${typeName}. It cannot be used for a different instrument type.`);
          error.code = 409;
          error.path = path;
          return errorHandler(error, req, res, next);
        }
      }
    }
  }

  try {
    const items = [];
    const itemsData = req.body.items;
    const inwardNumbers = await generateInwardNumber({
      inwardDate: srf.srf_date,
      items: itemsData,
      model: Item,
      labId: labId,
      srfId: srf_id
    });
    for (let i = 0; i < itemsData.length; i++) {
      const v = itemsData[i];
      const inwardNumber = inwardNumbers[i];

      items.push({
        srf_item_no: v.srf_item_no,
        srf_id: srf_id,
        make: v.make,
        model: v.model,
        serial_no: v.serial_no,
        identification_details: v.identification_details,
        frequency_days: v.frequency_days,
        reminder_frequency: v.reminder_frequency,
        remarks: v.remarks,
        url_number: v.url_number,
        intrument_type_id: v.intrument_type_id,
        status: "Not Calibrated",
        rstatus: 1,
        lab_id: labId,
        assignedTo: v.assignedTo,
        instrumentData: v.instrumentData || null,

        created_timestamp: Date.now(),
        created_by_login_name: fetchCreater.name,
        created_by_user_id: req.userId,

        updated_timestamp: Date.now(),
        updated_by_login_name: fetchCreater.name,
        updated_by_user_id: req.userId,

        inward_no: inwardNumber,
      });
    }
    // const items = req.body.items;
    // for (let item of items) {
    //   item.srf_id = srf_id;
    //   item.status = "Not Calibrated";
    //   item.rstatus = 1;
    //   item.lab_id = labId;

    //   item.created_timestamp = Date.now();
    //   item.created_by_login_name = fetchCreater.name;
    //   item.created_by_user_id = req.userId;

    //   item.updated_timestamp = Date.now();
    //   item.updated_by_login_name = fetchCreater.name;
    //   item.updated_by_user_id = req.userId;
    // }

    console.log(items, "items");

    // Assign ULR numbers server-side: ONLY for NABL items
    const bulkNablIndices = [];
    items.forEach((itemObj, idx) => {
      if ((itemObj.labtype || "").trim().toUpperCase() === "NABL") {
        bulkNablIndices.push(idx);
      } else {
        itemObj.url_number = null;
      }
    });

    if (bulkNablIndices.length > 0) {
      const generatedUlrs = await generateULRNumber(bulkNablIndices.length, labId);
      bulkNablIndices.forEach((itemIdx, i) => {
        items[itemIdx].url_number = generatedUlrs[i];
      });
    }

    await Item.bulkCreate(items);

  } catch (err) {
    console.log(err);
    const error = new Error("Failed to create bulk srf-item");
    error.code = 500;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //Getting SRF Items
  let items;
  try {
    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
    const itemWhere = { srf_id, lab_id: labId, rstatus: 1 };
    if (isRestricted) {
      itemWhere[Op.or] = [
        { created_by_user_id: userId },
        { assignedTo: userId }
      ];
    }
    items = await Item.findAll({
      where: itemWhere,
      include: ["intrument_type", "srf"],
      order: [
        ['srf_item_id', 'ASC'],
      ]
    });

    let counter = 1;
    for (let item of items) {
      item.slNo = counter++;
    }
  } catch (err) {
    const error = new Error("Failed to find srf-items");
    error.code = 500;
    error.path = path;
    return errorHandler(error, req, res, next);
  }

  //Returning 200 Response
  return res.status(200).json({
    status: "SUCCESS",
    code: 200,
    message: "SRF Bulk Items Added Successfully",
    data: {
      items
    },
  });
};

// const updateSRFItem = async (req, res, next) => {

//   if (!req.body || !req.body.srf_id || !req.body.srf_item_id || !req.body.item || !req.body.lab_id) {
//     const error = new Error("Invalid Request Params!!");
//     error.code = 400;
//     return errorHandler(error, req, res, next);
//   }

//   //SRF Items Validation
//   // const validitem = itemSchema(req.body.item);
//   // if (!validitem) {
//   //   const error = new Error("Invalid SRF Item!!");
//   //   error.code = 400;
//   //   return errorHandler(error, req, res, next);
//   // }

//   const { srf_id, srf_item_id, lab_id, } = req.body;


//   try {
//     const item = await Item.findOne({
//       where: {
//         srf_item_id,
//         srf_id,
//         lab_id,
//         // rstatus: 1,
//       },
//     });

//     if (item) {
//       await item.update(req.body.item);
//     }
//   } catch (err) {
//     console.log(err);
//     const error = new Error("Internal Server Error!!");
//     error.code = 500;
//     return errorHandler(error, req, res, next);
//   }

//   //Getting SRF Items
//   let items;
//   try {
//     items = await Item.findAll({
//       where: { lab_id, rstatus: 1 },
//       include: ["intrument_type"],
//       order: [["srf_item_id", "ASC"]]
//     });
//   } catch (err) {
//     const error = new Error("Failed to find srf-items");
//     error.code = 500;
//     return errorHandler(error, req, res, next);
//   }

//   //Returning 200 Response
//   return res.status(200).json({
//     status: "SUCCESS",
//     code: 200,
//     message: "SRF Item Updated Successfully",
//     data: {
//       items,
//     },
//   });
// };


const updateSRFItem = async (req, res, next) => {
  if (
    !req.body ||
    !req.body.srf_id ||
    !req.body.srf_item_id ||
    !req.body.item ||
    !req.body.lab_id
  ) {
    const error = new Error("Invalid Request Params!!");
    error.code = 400;
    return errorHandler(error, req, res, next);
  }

  const { srf_id, srf_item_id, lab_id, item: updatedItem, userId: bodyUserId } = req.body;
  const userId = bodyUserId || req.userId;

  let ulrResequenceResult = null;

  try {
    // 🔍 Find existing item
    const item = await Item.findOne({
      where: { srf_item_id, srf_id, lab_id },
      include: [
        {
          association: "intrument_type",
          include: [{ association: "instrument" }],
        },
        "srf"
      ],
    });

    if (!item) {
      const error = new Error("Item not found for update");
      error.code = 404;
      return errorHandler(error, req, res, next);
    }

    const newId = updatedItem.identification_details;
    const newTypeId = updatedItem.intrument_type_id || item.intrument_type_id;

    const isIdChanged = String(newId || '') !== String(item.identification_details || '');
    const isTypeChanged = String(newTypeId || '') !== String(item.intrument_type_id || '');

    if (newId && (isIdChanged || isTypeChanged)) {
      // 1. Check for duplicate in same SRF
      const duplicateInSrf = await Item.findOne({
        where: {
          srf_id: srf_id,
          identification_details: newId,
          srf_item_id: { [Op.ne]: srf_item_id },
          inward_no: { [Op.ne]: item.inward_no },
          rstatus: 1,
        }
      });
      if (duplicateInSrf) {
        const error = new Error(`ID Number '${newId}' is already added to this SRF.`);
        error.code = 409;
        return errorHandler(error, req, res, next);
      }

      // 2. Check for type consistency
      const existingWithDifferentType = await Item.findOne({
        where: {
          identification_details: newId,
          intrument_type_id: { [Op.ne]: newTypeId },
          rstatus: 1,
          srf_item_id: { [Op.ne]: srf_item_id },
        },
        include: [{
          association: "intrument_type",
          include: ["instrument"]
        }]
      });
      if (existingWithDifferentType) {
        const typeName = existingWithDifferentType.intrument_type?.instrument?.instrument_name || "another type";
        const error = new Error(`ID Number '${newId}' is already assigned to a ${typeName}. It cannot be used for a different instrument type.`);
        error.code = 409;
        return errorHandler(error, req, res, next);
      }
    }

    let inwardNumber = item.inward_no;

    // 🧠 Step 1: Check if instrument name changed
    const currentInstrumentName = item.intrument_type?.instrument?.instrument_name;
    const newInstrumentName = updatedItem.name;



    if (
      newInstrumentName &&
      currentInstrumentName &&
      newInstrumentName.trim().toLowerCase() !== currentInstrumentName.trim().toLowerCase()
    ) {
      // 🆕 Step 2: Regenerate new inward number
      inwardNumber = await generateSingleInwardNumber({
        inwardDate: item.srf.srf_date, // or from srf.srf_date if available
        itemName: newInstrumentName,
        model: Item,
        labId: lab_id,
        srfId: srf_id
      });
    }

    const oldLabType = item.labtype;
    const newLabType = updatedItem.labtype;
    const isLabTypeChanged = oldLabType !== newLabType;

    await item.update({
      ...updatedItem,
      inward_no: inwardNumber,
    });

    if (isLabTypeChanged && (oldLabType === 'NABL' || newLabType === 'NABL')) {
      ulrResequenceResult = await resequenceULRNumbers(lab_id, srf_item_id);
    }
  } catch (err) {
    console.error(err);
    const error = new Error("Internal Server Error!!");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  try {
    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
    const itemWhere = { srf_id, lab_id, rstatus: 1 };
    if (isRestricted) {
      itemWhere[Op.or] = [
        { created_by_user_id: userId },
        { assignedTo: userId }
      ];
    }
    const items = await Item.findAll({
      where: itemWhere,
      include: [
        {
          association: "intrument_type",
          include: [{ association: "instrument" }],
        },
      ],
      order: [["srf_item_id", "DESC"]],
    });

    const response = {
      status: "SUCCESS",
      code: 200,
      message: "SRF Item Updated Successfully",
      data: { items },
    };

    if (ulrResequenceResult && ulrResequenceResult.updatedCount > 0) {
      response.labTypeChanged = true;
      response.ulrResequence = {
        updatedCount: ulrResequenceResult.updatedCount,
        totalNablItems: ulrResequenceResult.totalNablItems,
        affectedItems: ulrResequenceResult.affectedItems,
        message: `Lab type changed. ${ulrResequenceResult.updatedCount} item(s) had their ULR numbers re-sequenced.`
      };

      if (req.body.regenerateCertificates) {
        const jobId = `job_${Date.now()}`;
        response.jobId = jobId;

        (async () => {
          try {
            const affectedItems = ulrResequenceResult.affectedItems;

            // 1. Pre-filter items to find eligible ones with status 'Review Pending'
            const eligibleItems = [];
            for (const aff of affectedItems) {
              const itemDb = await Item.findOne({
                where: { srf_item_id: aff.srf_item_id },
                include: [{ association: 'srf' }, { association: 'intrument_type' }]
              });
              if (itemDb && itemDb.status === 'Review Pending') {
                eligibleItems.push(itemDb);
              }
            }

            // 2. Initialize progress total with exact number of eligible items (e.g. 4)
            progressTracker.set(jobId, { status: 'processing', total: eligibleItems.length, completed: 0 });

            // 3. Regenerate certificates for eligible items
            for (let i = 0; i < eligibleItems.length; i++) {
              const itemDb = eligibleItems[i];
              const certificateRequest = {
                body: {
                  lab_id: itemDb.lab_id,
                  srf_id: itemDb.srf_id,
                  srf_item_id: itemDb.srf_item_id,
                  customer_info: {
                    srfId: itemDb.srf_id,
                    srfNo: itemDb.srf?.srf_number,
                    name: itemDb.intrument_type?.instrument_full_name,
                    make: itemDb.make,
                    model: itemDb.model,
                    serialno: itemDb.serial_no,
                    idno: itemDb.identification_details,
                    companyId: itemDb.srf?.customer_id
                  },
                  reportGenerateDate: new Date(),
                  skip_response: true
                }
              };

              await new Promise(resolve => setTimeout(resolve, 500));
              await generate(certificateRequest, {}, () => { });

              const job = progressTracker.get(jobId);
              if (job) {
                job.completed = i + 1;
                progressTracker.set(jobId, job);
              }
            }

            const finalJob = progressTracker.get(jobId);
            if (finalJob) {
              finalJob.status = 'completed';
              progressTracker.set(jobId, finalJob);
            }
          } catch (e) {
            console.error("[BG JOB ERROR]", e);
            const errJob = progressTracker.get(jobId);
            if (errJob) {
              errJob.status = 'error';
              progressTracker.set(jobId, errJob);
            }
          }
        })();
      }
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    const error = new Error("Failed to find srf-items");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};


const updateDCInfo = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/updatedcinfo";
  let action = "Updating SRF Item Dispatch Information!!";
  let userId = req.body.userId || req.userId;
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
    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
    const itemWhere = { srfId: req.body.srfId, rstatus: 1 };
    if (isRestricted) {
      itemWhere[Op.or] = [
        { created_by_user_id: userId },
        { assignedTo: userId }
      ];
    }
    items = await Item.findAll({
      where: itemWhere,
      include: [
        {
          model: Masterlist,
          as: "masterlist",
          attributes: {
            exclude: ["createdAt", "updatedAt", "id", "rstatus", "labId"],
          },

        },
        {
          association: "intrument_type",
          include: [
            {
              association: "instrument",
            }
          ]
        },
        { model: SRF, as: "srf", include: "customer" }
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      order: [["srf_item_id", "DESC"]],
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
  let userId = req.body.userId || req.userId;
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
          //status: "Not Calibrated",
        },
      });

      if (item) {
        await item.update({
          calibration_done_date: date,
          calibration_done_by_empname: userName,
          status: "Review Pending",
          updated_timestamp: new Date(),
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
          rstatus: "1",
          // status: "Calibrated",
        },
      });

      if (item) {
        let newStatus = item.status;
        if (item.status === "Auth Approved") {
          newStatus = "Report Generated";
        } else if (item.status === "Calibrated" || item.status === "Not Calibrated") {
          newStatus = "Review Pending";
        }

        await item.update({
          report_done_date: reportGenerateDate,
          report_done_by_empname: userName,
          status: newStatus,
          updated_timestamp: new Date(),
        });
      }
    } catch (err) {
      console.log("error generating");
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
          status: "Review Pending",
          updated_timestamp: new Date(),
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
    // *** frequency_in_months from srf_item table ***
    let srfItemResult = await Item.findOne({
      attributes: ['reminder_frequency'],
      where: { srf_item_id: id }
    });

    let { reminder_frequency } = srfItemResult;

    if (reminder_frequency == null) {
      reminder_frequency = 0
    }

    let calibration_due_date;

    if ((mode == 1 || mode == 3 || mode == 2) && reminder_frequency != 0) {
      const calibration_done_date = new Date(date)
      calibration_due_date = new Date(calibration_done_date.setMonth(calibration_done_date.getMonth() + parseInt(reminder_frequency)));
    }

    await Item.update(
      { calibration_due_date, updated_timestamp: new Date(), },
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

  // *** Getting calibration_due_date from srfitems table ***
  let srfItemResult = await Item.findOne({
    where: { srf_item_id: id },
    attributes: ['srf_item_id', 'calibration_due_date', 'frequency_days']
  });
  const { calibration_due_date, frequency_days } = srfItemResult;

  let createResponse = "";
  let calibration_remainder_date_1;
  let calibration_remainder_date_2;

  if (frequency_days == 1 && calibration_due_date) {

    let due_date_1 = new Date(calibration_due_date);
    let diffDateInMS_1 = due_date_1.setDate(due_date_1.getDate() - 7);
    calibration_remainder_date_1 = new Date(diffDateInMS_1);

    await srfItemResult.update({
      calibration_remainder_date_1
    });

    createResponse = "1 remainder";

  } else if (frequency_days == 2 && calibration_due_date) {

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
    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
    const itemWhere = { srf_id: srfId, rstatus: 1 };
    if (isRestricted) {
      itemWhere[Op.or] = [
        { created_by_user_id: userId },
        { assignedTo: userId }
      ];
    }
    items = await Item.findAll({
      where: itemWhere,
      // include: ["intrument_type"],
      // order: [["srf_item_id", "DESC"]],
      include: [
        {
          association: "intrument_type",
          include: [
            {
              association: "instrument",
            }
          ]
        },
        { model: SRF, as: "srf", include: "customer" }
      ],
      order: [["srf_item_id", "DESC"]]
    });

    let counter = 1;
    for (let i = 0; i < items.length; i++) {
      items[i].dataValues.slNo = counter++;
    }
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

    return res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: "SRF Item Updated Successfully",
      data: { items },
    });
  }
};

// *** Delete SRF All Items *** 

/**
 * Permanently delete SRF items and all their child records & physical files
 * in strict foreign key dependency order inside a transaction.
 */
const cleanupPermanentItems = async (itemIds, transaction) => {
  if (!itemIds || (Array.isArray(itemIds) && itemIds.length === 0)) return;

  const ids = Array.isArray(itemIds) ? itemIds : [itemIds];

  // 1. Delete physical certificate & observation files from disk
  const certificates = await Certificate.findAll({
    where: { srfitemId: ids },
    transaction
  });

  for (const cert of certificates) {
    if (cert.fileName) {
      const certPath = nodePath.join(__dirname, "../certificates", cert.fileName);
      if (fs.existsSync(certPath)) {
        try { fs.unlinkSync(certPath); } catch (e) { console.error("[CLEANUP] Error unlinking cert:", e); }
      }
    }
    if (cert.observationFileName) {
      const obsPath = nodePath.join(__dirname, "../certificates/Observation", cert.observationFileName);
      if (fs.existsSync(obsPath)) {
        try { fs.unlinkSync(obsPath); } catch (e) { console.error("[CLEANUP] Error unlinking obs:", e); }
      }
    }
    if (cert.draftFileName) {
      const draftPath = nodePath.join(__dirname, "../certificates/Draft", cert.draftFileName);
      if (fs.existsSync(draftPath)) {
        try { fs.unlinkSync(draftPath); } catch (e) { console.error("[CLEANUP] Error unlinking draft:", e); }
      }
    }
  }

  // 2. Delete Certificates records (resolves Certificates_srfitemId_fkey)
  await Certificate.destroy({
    where: { srfitemId: ids },
    transaction
  });

  // 3. Delete result_tables and master_result_tables in correct order
  const masterResults = await master_result_table.findAll({
    where: { srf_item_id: ids },
    attributes: ["master_result_table_id"],
    transaction
  });
  if (masterResults && masterResults.length > 0) {
    const masterResultIds = masterResults.map(m => m.master_result_table_id);
    await result_table.destroy({
      where: { master_result_table_id: masterResultIds },
      transaction
    });
    await master_result_table.destroy({
      where: { master_result_table_id: masterResultIds },
      transaction
    });
  }

  // 4. Delete approval history
  await srf_approval_history.destroy({
    where: { srf_item_id: ids },
    transaction
  });

  // 5. Delete ProcedureResult
  if (ProcedureResult) {
    await ProcedureResult.destroy({
      where: { srf_item_id: ids },
      transaction
    });
  }

  // 6. Delete srfitems
  await Item.destroy({
    where: { srf_item_id: ids },
    transaction
  });
};

const deleteSRF = async (req, res, next) => {
  if (!req.body || !req.body.srf_id || !(req.body.labId || req.body.lab_id)) {
    const error = new Error("Missing required fields");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  const { srf_id, deletedby, isPermanent } = req.body;
  const labId = req.body.labId || req.body.lab_id;

  try {
    if (isPermanent) {
      const t = await SRF.sequelize.transaction();
      try {
        // Find all items belonging to this SRF
        const items = await Item.findAll({
          where: { srf_id: srf_id },
          attributes: ["srf_item_id"],
          transaction: t
        });
        const itemIds = items.map(it => it.srf_item_id);

        // Delete all child records and items
        await cleanupPermanentItems(itemIds, t);

        // Clean up any remaining master_result_tables referencing srf_id directly
        const leftoverMaster = await master_result_table.findAll({
          where: { srf_id: srf_id },
          attributes: ["master_result_table_id"],
          transaction: t
        });
        if (leftoverMaster && leftoverMaster.length > 0) {
          const mIds = leftoverMaster.map(m => m.master_result_table_id);
          await result_table.destroy({ where: { master_result_table_id: mIds }, transaction: t });
          await master_result_table.destroy({ where: { master_result_table_id: mIds }, transaction: t });
        }

        // Clean up any ProcedureResult referencing srf_id directly
        if (ProcedureResult) {
          await ProcedureResult.destroy({ where: { srf_id: srf_id }, transaction: t });
        }

        // Delete SRF
        await SRF.destroy({ where: { srf_id: srf_id, lab_id: labId }, transaction: t });

        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } else {
      // Soft delete items
      await Item.update(
        {
          rstatus: 0,
          deletedby_id: deletedby
        },
        {
          where: { srf_id: srf_id }
        }
      );

      // Soft delete srf
      await SRF.update(
        {
          rstatus: 0,
          deletedby_id: deletedby
        },
        {
          where: { srf_id: srf_id, lab_id: labId }
        }
      );
    }

    // ✅ Sync sequences after delete to keep counter accurate
    await syncSequencesForLab(labId);

    return res.status(201).json({
      status: "SUCCESS",
      code: 201,
      message: "SRF Item Deleted Successfully",
    });

  } catch (err) {
    console.log(err);
    const error = new Error("Failed to Delete SRF Item: " + (err.message || ""));
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};

const deleteBulkSRF = async (req, res, next) => {
  if (!req.body || !req.body.srf_ids || !(req.body.labId || req.body.lab_id)) {
    const error = new Error("Missing required fields");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  const { srf_ids, deletedby, isPermanent } = req.body;
  const labId = req.body.labId || req.body.lab_id;

  try {
    if (isPermanent) {
      const t = await SRF.sequelize.transaction();
      try {
        const items = await Item.findAll({
          where: { srf_id: srf_ids },
          attributes: ["srf_item_id"],
          transaction: t
        });
        const itemIds = items.map(it => it.srf_item_id);

        await cleanupPermanentItems(itemIds, t);

        const leftoverMaster = await master_result_table.findAll({
          where: { srf_id: srf_ids },
          attributes: ["master_result_table_id"],
          transaction: t
        });
        if (leftoverMaster && leftoverMaster.length > 0) {
          const mIds = leftoverMaster.map(m => m.master_result_table_id);
          await result_table.destroy({ where: { master_result_table_id: mIds }, transaction: t });
          await master_result_table.destroy({ where: { master_result_table_id: mIds }, transaction: t });
        }

        if (ProcedureResult) {
          await ProcedureResult.destroy({ where: { srf_id: srf_ids }, transaction: t });
        }

        await SRF.destroy({ where: { srf_id: srf_ids, lab_id: labId }, transaction: t });

        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } else {
      // Soft delete items
      await Item.update(
        {
          rstatus: 0,
          deletedby_id: deletedby
        },
        {
          where: { srf_id: srf_ids }
        }
      );

      // Soft delete srf
      await SRF.update(
        {
          rstatus: 0,
          deletedby_id: deletedby
        },
        {
          where: { srf_id: srf_ids, lab_id: labId }
        }
      );
    }

    // ✅ Sync sequences after delete to keep counter accurate
    await syncSequencesForLab(labId);

    return res.status(201).json({
      status: "SUCCESS",
      code: 201,
      message: "SRFs Deleted Successfully",
    });

  } catch (err) {
    console.log(err);
    const error = new Error("Failed to Delete SRFs: " + (err.message || ""));
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};




// *** Delete SRF Item 
const deleteSRFItem = async (req, res, next) => {

  if (!req.body || !req.body.srf_id || !req.body.srf_item_id || !req.body.lab_id || !req.body.userId) {
    const error = new Error("Missing required fields");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  const { srf_id, srf_item_id, lab_id, userId, isPermanent } = req.body;

  try {

    const query = await Item.findOne({
      where: { srf_item_id: srf_item_id }
    });

    if (query) {
      if (isPermanent) {
        const t = await SRF.sequelize.transaction();
        try {
          await cleanupPermanentItems([srf_item_id], t);
          await t.commit();
        } catch (itemErr) {
          await t.rollback();
          throw itemErr;
        }
      } else if (query.rstatus !== 0) {
        await query.update({
          rstatus: 0,
          deletedby_id: userId
        });
      }
      // ✅ Sync sequences after delete to keep counter accurate
      await syncSequencesForLab(lab_id);
    }
  } catch (err) {
    console.log(err);
    const error = new Error("Failed to Delete SRF Item");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  //Getting SRF Items
  let items;
  try {
    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
    const itemWhere = { srf_id: srf_id, lab_id: lab_id, rstatus: 1 };
    if (isRestricted) {
      itemWhere[Op.or] = [
        { created_by_user_id: userId },
        { assignedTo: userId }
      ];
    }
    items = await Item.findAll({
      where: itemWhere,
      include: [
        {
          association: "intrument_type",
          include: [
            {
              association: "instrument",
            }
          ]
        },
        { model: SRF, as: "srf", include: "customer" }
      ],
      order: [["srf_item_id", "DESC"]]
    });

    let counter = 1;
    for (let i = 0; i < items.length; i++) {
      items[i].dataValues.slNo = counter++;
    }
  } catch (err) {
    const error = new Error("Failed to fetch SRF Items");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  return res.status(201).json({
    status: "SUCCESS",
    code: 201,
    message: "SRF Item Deleted Successfully",
    data: {
      items
    },
  });
};

// *** Update Invoice and Send Mail Controller
const updateInvoiceInfo = async (req, res, next) => {

  let code = 200;
  const path = "/api/srf/updateinvoice";
  let action = "Updating SRF Item Invoice Information!!";
  let userId = req.body.userId || req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;
  let mainLogoImgFileName = "";

  if (!req.body || !req.body.items || !req.body.srfId || !req.body.invoiceinfo) {
    isError = true;
    code = 400;
    action = "All Fiels are required.";
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

  const { invoice_no, invoice_date, invoice_due_date, status, labId } = req.body.invoiceinfo;

  try {
    await Item.update(
      {
        invoice_no, invoice_date, invoice_due_date, status,
        invoice_file_name: mainLogoImgFileName, updated_timestamp: new Date(),
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

    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
    const itemWhere = { lab_id: labId, rstatus: 1 };
    if (isRestricted) {
      itemWhere[Op.or] = [
        { created_by_user_id: userId },
        { assignedTo: userId }
      ];
    }
    let items = await Item.findAll({
      where: itemWhere,
      // include: ["intrument_type"],
      // order: [["srf_item_id", "ASC"]]
      include: [
        {
          association: "intrument_type",
          include: [
            {
              association: "instrument",
            }
          ]
        },
        { model: SRF, as: "srf", include: "customer" }
      ],
      order: [["srf_item_id", "DESC"]]
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
};

const updatePaymentInfo = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/updatepayment";
  let action = "Updating SRF Item Payment Information!!";
  let userId = req.body.userId || req.userId;
  const sessionId = req.sessionId;
  let isError = false;
  const department = req.department;

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
    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
    const itemWhere = { srfId: req.body.srfId, rstatus: 1 };
    if (isRestricted) {
      itemWhere[Op.or] = [
        { created_by_user_id: userId },
        { assignedTo: userId }
      ];
    }
    items = await Item.findAll({
      where: itemWhere,
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
      order: [["srf_item_id", "ASC"]]
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

const uploadDCFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: "No file uploaded" });
    }
    return res.status(200).json({
      code: 200,
      message: "File uploaded successfully",
      filename: req.file.filename,
    });
  } catch (err) {
    const error = new Error("File upload failed: " + err);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};

const getfilteredSRFItems = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/srf/getfilteredsrfitems";
  let action = "Getting Filtered SRF Items!!";
  let userId = req.body.userId || req.userId;
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
  const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
  const itemWhere = { srfId: req.body.srfIds, labId: req.body.labId, rstatus: 1 };
  if (isRestricted) {
    itemWhere[Op.or] = [
      { created_by_user_id: userId },
      { assignedTo: userId }
    ];
  }

  let items;
  try {
    items = await Item.findAll({
      where: itemWhere,
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
      order: [["srf_item_id", "ASC"]]
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
    const userId = req.body.userId || req.userId;
    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
    const itemWhere = { srf_item_id, rstatus: 1 };
    if (isRestricted) {
      itemWhere[Op.or] = [
        { created_by_user_id: userId },
        { assignedTo: userId }
      ];
    }
    let items = await Item.findOne({
      where: itemWhere,
      include: ["intrument_type", "srf"],
      order: [["srf_item_id", "ASC"]]
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



const findbyAssestid = async (req, res, next) => {
  try {
    const { lab_id, labType, assetId } = req.body;

    if (!lab_id || !labType || !assetId) {
      const error = new Error("lab_id, labType, and assetId are required");
      error.code = 400;
      return errorHandler(error, req, res, next);
    }

    // const item = await Item.findOne({
    //   where: {
    //     lab_id: lab_id,
    //     labtype: labType,
    //     identification_details: assetId,
    //     rstatus: 1
    //   },
    //   include: ["intrument_type"]
    // });

    const userId = req.body.userId || req.userId;
    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
    const itemWhere = {
      lab_id: lab_id,
      labtype: labType,
      identification_details: assetId,
      rstatus: 1
    };
    if (isRestricted) {
      itemWhere[Op.or] = [
        { created_by_user_id: userId },
        { assignedTo: userId }
      ];
    }

    const item = await Item.findOne({
      where: itemWhere,
      include: [
        {
          association: "intrument_type",
          include: [
            {
              association: "instrument",
            }
          ]
        }
      ]
    });

    if (!item) {
      return res.status(404).json({
        status: "FAILED",
        code: 404,
        message: "Item not found"
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "Item fetched successfully",
      data: item
    });

  } catch (error) {
    console.log(error);
    const err = new Error("Failed to fetch item details");
    err.code = 500;
    err.path = "findItemWith";
    return errorHandler(err, req, res, next);
  }
};


const fetchOneSrfItems = async (req, res, next) => {

  const { lab_id, srf_item_id, srf_id } = req.body;

  if (!lab_id && !srf_item_id && !srf_id) {
    let action = "Lab id is required";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  try {
    const userId = req.body.userId || req.userId;
    const isRestricted = req.permissions?.includes("VIEW_ASSIGNED_ONLY") && req.department !== "root";
    const itemWhere = { lab_id, rstatus: 1, srf_item_id, srf_id };
    if (isRestricted) {
      itemWhere[Op.or] = [
        { created_by_user_id: userId },
        { assignedTo: userId }
      ];
    }
    let items = await Item.findOne({
      where: itemWhere,
    });

    return res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "SRF Details Fetched Successfully",
      data: items
    });
  } catch (err) {
    console.log(err);
    let action = "Something went wrong, please try again";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
}

const editSRFDetails = async (req, res, next) => {
  const { srf_id, customer_id, customer_dc, customer_dc_date, customer_dc_file_path } = req.body;

  if (!srf_id) {
    const error = new Error("SRF ID is required");
    error.code = 400;
    return errorHandler(error, req, res, next);
  }

  try {
    const srf = await SRF.findByPk(srf_id);
    if (!srf) {
      const error = new Error("SRF not found");
      error.code = 404;
      return errorHandler(error, req, res, next);
    }

    const updateData = {};
    if (customer_id !== undefined) updateData.customer_id = customer_id;
    if (customer_dc !== undefined) updateData.customer_dc = (customer_dc && customer_dc.trim() !== "") ? customer_dc.trim() : "NA";
    if (customer_dc_date !== undefined) updateData.customer_dc_date = customer_dc_date;
    if (customer_dc_file_path !== undefined) updateData.customer_dc_file_path = customer_dc_file_path;

    // Fetch user on database for auditing fields
    let loginName = "System";
    let userId = req.body.userId || req.userId || "System";
    if (req.userId) {
      const userObj = await User.findOne({ where: { id: req.userId } });
      if (userObj) {
        loginName = userObj.name || userObj.login_name || "System";
      }
    }

    updateData.updated_timestamp = new Date();
    updateData.updated_by_user_id = userId;
    updateData.updated_by_login_name = loginName;

    await srf.update(updateData);

    return res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "SRF Details Updated Successfully",
      data: srf
    });
  } catch (err) {
    console.error("Error editing SRF details:", err);
    const error = new Error("Something went wrong while updating SRF details");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};

const getJobProgress = (req, res, next) => {
  const { jobId } = req.params;
  const job = progressTracker.get(jobId);
  if (!job) {
    return res.status(404).json({ status: 'ERROR', code: 404, message: 'Job not found' });
  }
  return res.status(200).json({ status: 'SUCCESS', code: 200, data: job });
};

const duplicateSRFItem = async (req, res, next) => {
  if (!req.body || !req.body.srf_id || !req.body.srf_item_id || !req.body.lab_id) {
    const error = new Error("Invalid Request Params!!");
    error.code = 400;
    return errorHandler(error, req, res, next);
  }

  const { srf_id, srf_item_id, lab_id, assignedTo, userId: bodyUserId } = req.body;
  const userId = bodyUserId || req.userId;

  try {
    const originalItem = await Item.findOne({
      where: { srf_item_id, srf_id, lab_id, rstatus: 1 },
      include: ["srf"]
    });

    if (!originalItem) {
      const error = new Error("Original item not found for duplication");
      error.code = 404;
      return errorHandler(error, req, res, next);
    }

    const srfDetail = originalItem.srf || await SRF.findOne({ where: { srf_id, lab_id } });
    const fetchCreater = await User.findOne({ where: { id: userId } });

    // Determine max srf_item_no for this srf
    const maxItemNo = await Item.max('srf_item_no', { where: { srf_id } }) || 0;

    // Create duplicate srfitem record (retaining original inward_no)
    const newItemData = {
      srf_id: originalItem.srf_id,
      srf_item_no: maxItemNo + 1,
      inward_no: originalItem.inward_no, // KEEP SAME INWARD NUMBER
      make: originalItem.make,
      model: originalItem.model,
      serial_no: originalItem.serial_no,
      identification_details: originalItem.identification_details,
      remarks: originalItem.remarks,
      reminder_frequency: originalItem.reminder_frequency || 0,
      frequency_days: originalItem.frequency_days || null,
      status: "Not Calibrated",
      rstatus: 1,
      lab_id: originalItem.lab_id,
      intrument_type_id: originalItem.intrument_type_id,
      calibrationAt: originalItem.calibrationAt,
      labtype: originalItem.labtype,
      ranges: originalItem.ranges,
      instrument_type_at_calibration: originalItem.instrument_type_at_calibration,
      assignedTo: assignedTo !== undefined ? assignedTo : originalItem.assignedTo,
      instrumentData: originalItem.instrumentData || null,
      certificate_no: null,
      url_number: null,
      created_timestamp: Date.now(),
      created_by_login_name: fetchCreater ? fetchCreater.name : "User",
      created_by_user_id: userId,
      updated_timestamp: Date.now(),
      updated_by_login_name: fetchCreater ? fetchCreater.name : "User",
      updated_by_user_id: userId,
    };

    const duplicateItem = await Item.create(newItemData);

    // ✅ Generate certificate number in continuous sequence matching SRF date
    try {
      await generateAndAssignCertificateNo({
        item: duplicateItem,
        srf: srfDetail,
        itemCount: null,
        Item,
        labId: lab_id
      });
    } catch (certErr) {
      console.error("Certificate pre-generation error on duplicate:", certErr);
    }

    // ✅ Resequence ULR numbers so duplicate item gets continuous ULR number
    try {
      if (resequenceULRNumbers && typeof resequenceULRNumbers === 'function') {
        await resequenceULRNumbers(lab_id, duplicateItem.srf_item_id);
      }
    } catch (ulrErr) {
      console.error("ULR resequence error on duplicate:", ulrErr);
    }

    // Fetch all items for this SRF to return updated list
    const items = await Item.findAll({
      where: { srf_id, lab_id, rstatus: 1 },
      include: ["intrument_type", "srf"],
      order: [['srf_item_id', 'ASC']]
    });

    let counter = 1;
    for (let item of items) {
      item.slNo = counter++;
    }

    return res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "SRF Item Duplicated Successfully",
      data: {
        duplicateItem,
        items
      }
    });

  } catch (err) {
    console.error("Error in duplicateSRFItem:", err);
    const error = new Error("Failed to duplicate SRF item");
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};

const getItemAuditTrail = async (req, res, next) => {
  const srf_item_id = req.params?.srf_item_id || req.body?.srf_item_id || req.query?.srf_item_id;

  if (!srf_item_id) {
    return res.status(400).json({ code: 400, message: "Missing srf_item_id parameter" });
  }

  try {
    const item = await Item.findOne({
      where: { srf_item_id },
      include: [
        {
          model: SRF,
          as: "srf"
        },
        {
          association: "intrument_type"
        },
        {
          model: User,
          as: "assignedEngineer",
          attributes: ["id", "name", "email"]
        }
      ]
    });

    if (!item) {
      return res.status(404).json({ code: 404, message: "SRF item not found" });
    }

    const srf = item.srf || {};

    // 1. Result Table
    const masterResult = await master_result_table.findOne({
      where: { srf_item_id },
      include: [
        { model: User, as: "calibrated_user", attributes: ["id", "name", "email"] },
        { model: User, as: "approved_user", attributes: ["id", "name", "email"] },
        { model: User, as: "authorizedby_user", attributes: ["id", "name", "email"] }
      ]
    });

    // 2. Procedure Result
    const procResult = await ProcedureResult.findOne({
      where: { srf_item_id },
      attributes: ["prid", "FileName", "createdAt", "updatedAt", "createdby", "updatedby"]
    });

    // 3. Certificates
    const certs = await Certificate.findAll({
      where: { srfitemId: srf_item_id },
      order: [["createdAt", "DESC"]]
    });

    // 4. Approval History
    let histories = [];
    try {
      histories = await srf_approval_history.findAll({
        where: { srf_item_id },
        include: [
          {
            model: User,
            as: "actedByUser",
            attributes: ["id", "name", "email"]
          }
        ],
        order: [["createdAt", "ASC"]]
      });
    } catch (historyErr) {
      console.warn("Could not fetch approval history with User association, falling back:", historyErr.message);
      histories = await srf_approval_history.findAll({
        where: { srf_item_id },
        order: [["createdAt", "ASC"]]
      });
    }

    // Construct unified milestones:
    const milestones = [];

    // Milestone 1: SRF Created
    milestones.push({
      key: "srf_created",
      title: "SRF Created",
      description: `SRF No: ${srf.srf_number || "N/A"}`,
      operational_date: srf.srf_date || null,
      system_datetime: srf.created_timestamp ? new Date(Number(srf.created_timestamp) || srf.created_timestamp) : null,
      user_name: srf.created_by_login_name || "N/A",
      user_id: srf.created_by_user_id || null,
      status: "COMPLETED"
    });

    // Milestone 2: SRF Item Added
    milestones.push({
      key: "item_added",
      title: "Item Inward / Added",
      description: `Inward No: ${item.inward_no || "N/A"} (Item #${item.srf_item_no || 1})`,
      operational_date: srf.srf_date || null,
      system_datetime: item.created_timestamp ? new Date(Number(item.created_timestamp) || item.created_timestamp) : null,
      user_name: item.created_by_login_name || srf.created_by_login_name || "N/A",
      user_id: item.created_by_user_id || null,
      status: "COMPLETED"
    });

    // Milestone 3: Calibration Result Entry
    const hasResult = !!(masterResult || procResult);
    const resultSystemTime = procResult?.createdAt || masterResult?.createdAt || null;
    const resultUpdatedTime = procResult?.updatedAt || masterResult?.updatedAt || null;
    const calibratedByName = masterResult?.calibrated_user?.name || item.calibration_done_by_empname || null;

    milestones.push({
      key: "result_entry",
      title: "Calibration Result Entry",
      description: hasResult
        ? `Procedure: ${masterResult?.calibration_procedure || procResult?.FileName || "Recorded"}`
        : "Observation and calibration readings entry",
      operational_date: item.calibration_done_date || null,
      system_datetime: resultSystemTime,
      updated_system_datetime: resultUpdatedTime,
      user_name: calibratedByName || (hasResult ? "Calibration Engineer" : "N/A"),
      user_id: masterResult?.calibrated_user_id || procResult?.createdby || null,
      status: hasResult ? "COMPLETED" : (item.status === "Not Calibrated" ? "PENDING" : "IN_PROGRESS")
    });

    // Milestone 4: Certificate Generation
    const latestCert = certs && certs.length > 0 ? certs[0] : null;
    const hasCert = !!latestCert || !!item.certificate_no;
    milestones.push({
      key: "certificate_generated",
      title: "Certificate Generation",
      description: hasCert
        ? `Cert No: ${item.certificate_no || "Generated"}${latestCert?.fileName ? ` (${latestCert.fileName})` : ""}`
        : "PDF Certificate not yet generated",
      operational_date: item.certificate_date || item.report_done_date || null,
      system_datetime: latestCert?.createdAt || null,
      user_name: item.report_done_by_empname || (hasCert ? "System / Engineer" : "N/A"),
      status: hasCert ? "COMPLETED" : "PENDING"
    });

    // Milestone 5: Certificate Review
    const reviewAttempts = histories.filter((h) => h.stage_type === "REVIEW");
    const latestReview = reviewAttempts.length > 0 ? reviewAttempts[reviewAttempts.length - 1] : null;
    milestones.push({
      key: "certificate_review",
      title: "Certificate Review",
      description: latestReview?.comments ? `Comments: ${latestReview.comments}` : "Technical Review stage",
      operational_date: latestReview?.acted_at || null,
      system_datetime: latestReview?.createdAt || null,
      user_name: latestReview?.actedByUser?.name || (latestReview ? `User #${latestReview.acted_by}` : "N/A"),
      user_id: latestReview?.acted_by || null,
      status: latestReview ? latestReview.status : (["Calibrated", "Review Pending"].includes(item.status) ? "PENDING" : "NOT_REACHED"),
      attempts: reviewAttempts.map((h) => ({
        status: h.status,
        operational_date: h.acted_at,
        system_datetime: h.createdAt,
        user_name: h.actedByUser?.name || `User #${h.acted_by}`,
        comments: h.comments
      }))
    });

    // Milestone 6: Certificate Authorization
    const authAttempts = histories.filter((h) => h.stage_type === "AUTH");
    const latestAuth = authAttempts.length > 0 ? authAttempts[authAttempts.length - 1] : null;
    milestones.push({
      key: "certificate_authorization",
      title: "Certificate Authorization",
      description: latestAuth?.comments ? `Comments: ${latestAuth.comments}` : "Authorized Signatory stage",
      operational_date: latestAuth?.acted_at || null,
      system_datetime: latestAuth?.createdAt || null,
      user_name: latestAuth?.actedByUser?.name || (latestAuth ? `User #${latestAuth.acted_by}` : "N/A"),
      user_id: latestAuth?.acted_by || null,
      status: latestAuth ? latestAuth.status : (["Auth Pending", "Auth Approved"].includes(item.status) ? "PENDING" : "NOT_REACHED"),
      attempts: authAttempts.map((h) => ({
        status: h.status,
        operational_date: h.acted_at,
        system_datetime: h.createdAt,
        user_name: h.actedByUser?.name || `User #${h.acted_by}`,
        comments: h.comments
      }))
    });

    return res.status(200).json({
      code: 200,
      status: "SUCCESS",
      data: {
        srf_item_id: item.srf_item_id,
        inward_no: item.inward_no,
        instrument_name: item.intrument_type?.instrument_full_name || "N/A",
        item_status: item.status,
        srf_number: srf.srf_number,
        milestones
      }
    });

  } catch (error) {
    console.error("Error in getItemAuditTrail:", error);
    return res.status(500).json({ code: 500, message: "Failed to fetch audit trail", error: error.message });
  }
};

exports.getItemAuditTrail = getItemAuditTrail;
exports.duplicateSRFItem = duplicateSRFItem;
exports.getJobProgress = getJobProgress;
exports.editSRFDetails = editSRFDetails;
exports.getfilteredSRFItems = getfilteredSRFItems;
exports.updatePaymentInfo = updatePaymentInfo;
exports.updateInvoiceInfo = updateInvoiceInfo;
exports.deleteSRF = deleteSRF;
exports.deleteBulkSRF = deleteBulkSRF;
exports.deleteSRFItem = deleteSRFItem;
exports.updateCalInfo = updateCalInfo;
exports.updateDCInfo = updateDCInfo;
exports.updateSRFItem = updateSRFItem;
exports.addItemtoSRF = addItemtoSRF;
exports.addBulkItemtoSRF = addBulkItemtoSRF;
exports.getsrfbyId = getsrfbyId;
exports.getSRFs = getSRFs;


exports.addSRFHandler = addSRFHandler;
exports.getSrfItems = getSrfItems;
exports.fetchSrfItem = fetchSrfItem;
exports.findbyAssestid = findbyAssestid;
exports.fetchOneSrfItems = fetchOneSrfItems;
exports.uploadDCFile = uploadDCFile;
