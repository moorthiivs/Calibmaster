const logger = require("../utils/logger");
const ExcelJS = require("exceljs");
const Lab = require("../models").Lab;
const SRF = require("../models").SRFs;
const Company = require("../models").Company;
const SRFitem = require("../models").SRFItem;
const Masterlist = require("../models").Masterlist;

const srfDownloadHandler = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let code = 200;
  const path = "/api/heartbeat/check";
  let action = "Get Heartbeat";
  let message = `${ip} ${code} ${path} - ${action}`;
  const fileName = "simple.xlsx";
  let lab, srf, items;
  //console.log(req.body);
  //logger.info(message);
  try {
    srf = await SRF.findOne({
      where: {
        id: req.body.srfId,
        rstatus: 1,
      },
      include: [
        {
          model: Lab,
          as: "lab",
          attributes: {
            exclude: ["createdAt", "updatedAt", "id", "rstatus"],
          },
        },
        {
          model: Company,
          as: "Company",
          attributes: {
            exclude: ["createdAt", "updatedAt", "id"],
          },
        },
        {
          model: Company,
          as: "reportcompany",
          attributes: {
            exclude: ["createdAt", "updatedAt", "id"],
          },
        },
      ],
    });
    items = await SRFitem.findAll({
      where: {
        srfId: req.body.srfId,
        rstatus: 1,
      },
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
    //console.log(items[0]);
    //console.log(srf.Company.companyname);
    let modifiedsno;
    if (srf.sno > 0 && srf.sno < 10) {
      modifiedsno = "0000" + srf.sno;
    }
    if (srf.sno > 9 && srf.sno < 100) {
      modifiedsno = "000" + srf.sno;
    }
    if (srf.sno > 99 && srf.sno < 1000) {
      modifiedsno = "00" + srf.sno;
    }
    if (srf.sno > 999 && srf.sno < 10000) {
      modifiedsno = "0" + srf.sno;
    }
    if (srf.sno > 9999 && srf.sno < 100000) {
      modifiedsno = "" + srf.sno;
    }
    let srfid =
      srf.year.toString() + "/" + srf.lab.symbol + "/" + srf.type + modifiedsno;
    lab = srf.lab;

    const workbook = new ExcelJS.Workbook();
    //const workbook = createAndFillWorkbook();
    workbook.creator = lab.name;
    workbook.lastModifiedBy = lab.name;
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
    // create new sheet with pageSetup settings for A4 - portrait
    const worksheet = workbook.addWorksheet("SRF");

    // adjust pageSetup settings afterwards
    worksheet.pageSetup.margins = {
      left: 0.25,
      right: 0.25,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    };
    // Set Print Area for a sheet
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
    row5.getCell(1).value =
      "Telephone: " + lab.contactNumber + "; e-mail:" + lab.email;
    // add image to workbook by buffer
    let imgext = "png";
    if (lab.limageType == "image/png") {
      imgext = "png";
    }
    if (lab.limageType == "image/jpg") {
      imgext = "jpg";
    }
    if (lab.limageType == "image/jpeg") {
      imgext = "jpeg";
    }
    const imageId2 = workbook.addImage({
      buffer: lab.limageData,
      extension: imgext,
    });
    worksheet.addImage(imageId2, {
      tl: { col: 5.8, row: 0.5 },
      br: { col: 7.9, row: 4.5 },
    });
    let inddate = new Date();
    inddate.setHours(inddate.getHours() + 6);
    worksheet.getCell("A1").value = inddate.toISOString();
    // merge a range of cells
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
    worksheet.getCell("H8").value = srf.date.split("-").reverse().join("-");
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
    worksheet.getCell("B11").value = srf.Company.companyname;
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
    worksheet.getCell("B12").value = srf.Company.address1;
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
    worksheet.getCell("B13").value = srf.Company.address2;
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
    worksheet.getCell("B14").value = srf.Company.address3;
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
    worksheet.getCell("B17").value = srf.reportcompany.companyname;
    worksheet.getCell("F17").border = {
      left: { style: "thin" },
    };
    worksheet.getCell("F17").font = { name: "Calibri", size: 12 };
    worksheet.getCell("F17").value =
      "3.1. Customers are requested to refer the SRF No. as ";
    worksheet.getCell("H17").border = {
      right: { style: "thin" },
    };
    worksheet.getCell("A18").border = {
      left: { style: "thin" },
    };
    worksheet.getCell("B18").font = { name: "Calibri", size: 12, bold: true };
    worksheet.getCell("B18").value = srf.reportcompany.address1;
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
    worksheet.getCell("B19").value = srf.reportcompany.address2;
    worksheet.getCell("F19").border = {
      left: { style: "thin" },
    };
    worksheet.getCell("F19").font = { name: "Calibri", size: 12 };
    worksheet.getCell("F19").value =
      "3.2. " +
      lab.name +
      " is not responsible for the equipments which are not";
    worksheet.getCell("H19").border = {
      right: { style: "thin" },
    };
    worksheet.getCell("A20").border = {
      left: { style: "thin" },
    };
    worksheet.getCell("B20").font = { name: "Calibri", size: 12, bold: true };
    worksheet.getCell("B20").value = srf.reportcompany.address3;
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
        worksheet.getCell("B" + lastrow).value = element.masterlist.name;
        worksheet.getCell("D" + lastrow).value = element.make;
        worksheet.getCell("E" + lastrow).value =
          element.model +
          " / " +
          element.range_min +
          "-" +
          element.range_max +
          " " +
          element.range_unit;

        worksheet.getCell("F" + lastrow).value =
          element.serialno + " / " + element.idno;
        worksheet.getCell("G" + lastrow).value = element.status;
        worksheet.getCell("H" + lastrow).value = element.remarks;
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
    worksheet.getCell("A48").value =
      "5.0.   Agreed Date of Completion.: " +
      srf.agreed_date.split("-").reverse().join("-");
    worksheet.mergeCells("A49:H49");
    worksheet.getCell("A49").font = { name: "Calibri", size: 12, bold: true };
    worksheet.getCell("A49").border = {
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    let nextcalflag,
      calfreq = srf.frequency;
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
    if (srf.statement_of_confirmity_flag) {
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
    let invno, issno, issdate;
    if (srf.invoice_no) {
      invno = srf.invoice_no;
    } else {
      invno = "";
    }
    if (srf.issue_no) {
      issno = srf.issue_no;
    } else {
      issno = "";
    }
    if (srf.issue_date) {
      issdate = srf.issue_date.split("-").reverse().join("-");
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
    worksheet.getCell("E59").value = srf.amend_no;
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
    worksheet.getCell("E60").value = srf.amend_date;
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
      worksheet.getCell("H63").value = srf.date.split("-").reverse().join("-");
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
      worksheet.getCell("E64").value = "Model / Range";
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
          worksheet.getCell("B" + lastrow).value = element.masterlist.name;
          worksheet.getCell("D" + lastrow).value = element.make;
          worksheet.getCell("E" + lastrow).value =
            element.model +
            " / " +
            element.range_min +
            "-" +
            element.range_max +
            " " +
            element.range_unit;

          worksheet.getCell("F" + lastrow).value =
            element.serialno + " / " + element.idno;
          worksheet.getCell("G" + lastrow).value = element.status;
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
      worksheet.getCell("G116").value = lab.name;
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
      worksheet.getCell("E117").value = srf.amend_date;
      worksheet.getCell("F117").font = { name: "Calibri", size: 12 };
      //worksheet.getCell("F117").value = "TC-FFC-001";
    }
    /*workbook.xlsx
      .writeFile(fileName)
      .then(() => {
        console.log("file created");
      })
      .catch((err) => {
        console.log(err.message);
      });*/
    // res is a Stream object

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
    //console.log(workbook);

    workbook.xlsx.write(res).then(function () {
      res.status(200).end();
    });
  } catch (err) {
    //console.log(err);
  }

  //res.status(code).json({ status: "available" });
};

exports.srfDownloadHandler = srfDownloadHandler;
