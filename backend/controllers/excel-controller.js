const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const User = require("../models").User;
const customer = require("../models").customer;
const Lab = require("../models").Lab;
const instrument_type = require("../models").instrument_type;
const ExcelJS = require("exceljs");
const nodePath = require('path');
const nodeMailer = require("nodemailer");
const { errorHandler } = require("../helpers/error-handler");

const exportExcel = async (req, res, next) => {

    let fileName = "srf.xlsx";
    let lab, srf, items;

    try {
        srf = await SRF.findOne({
            where: {
                srf_id: 3,
                rstatus: 1
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
        const error = new Error("Error on getting parent srf");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {
        items = await Item.findAll({
            where: {
                srf_id: 3,
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
        const error = new Error("Error on getting parent srf");
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
    worksheet.getCell("F19").value = "3.2 " + srf?.contact_name + " is not responsible for the equipments which are not";
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
        action = "Internal Server Error!!" + err;
        const error = new Error("Failed to create buffer");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    let existingLab;
    try {
        existingLab = await Lab.findOne({
            where: { lab_id: 1, rstatus: 1 },
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
        action = "Internal Server Error!!";
        const error = new Error("Failed to create buffer");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    let info;
    if (existingLab?.sender_email) {

        // return res.json({ existingLab });

        const transporter = nodeMailer.createTransport({
            name: "CalibMaster",
            host: existingLab?.email_smtp_server_host,
            port: existingLab?.email_smtp_server_port,
            secure: true,
            auth: {
                user: existingLab?.sender_email,
                pass: existingLab?.sender_password
            }
        });

        // ! Production Testing Mode
        // const transporter = nodeMailer.createTransport({
        //     name: "CalibMaster",
        //     host: "mail.iviewsense.com",
        //     port: 465,
        //     secure: true,
        //     auth: {
        //         user: "anirban@iviewsense.com",
        //         pass: "IDJWMmPNt#h",
        //     },
        // });

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

        try {
            info = await transporter.sendMail({
                from: existingLab.contact_email,
                // to: req?.body?.srf?.contact_email,
                // from: "anirban@iviewsense.com",
                to: "pathaksangita930@gmail.com",
                subject: "CalibMaster - New SRF Created " + fileName,
                priority: "high",
                attachments: [
                    {
                        filename: fileName,
                        content: buffer,
                        contentType: "application/pdf",
                    },
                ],
            });
            console.log(info);
        } catch (err) {
            console.log(err);
            const error = new Error("Failed to send mail to the customer");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }
    }

    // ! Sending JSON Response
    res.json({
        filePath,
        info,
        modifiedsno, srfid,
        existingLab,
        srf, items
    });
}

const downloadExcel = async (req, res, next) => {

    if (!req.body || !req.body.srf_id) {
        const error = new Error("Invalid Request Params!!");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    let fileName = "srf.xlsx";
    let lab, srf, items;

    const { srf_id } = req.body;

    try {
        srf = await SRF.findOne({
            where: {
                srf_id: srf_id,
                rstatus: 1
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
        const error = new Error("Error on getting parent srf");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    if (!srf) {
        const error = new Error("SRF not Found!!!");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {
        items = await Item.findAll({
            where: {
                srf_id: srf?.srf_id,
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
        const error = new Error("Error on getting parent srf");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    if (!items) {
        const error = new Error("SRF Items Not Found!!!");
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
    row2.getCell(1).value = 'Address :';
    row2.getCell(2).value = lab.address1 && `${lab.address1},`;
    const row3 = worksheet.getRow(3);
    row3.getCell(2).value = lab.address2 && `${lab.address2},`;
    const row4 = worksheet.getRow(4);
    row4.getCell(2).value = lab.address3 && `${lab.address3}.`
    const row5 = worksheet.getRow(5);
    row5.getCell(1).value = "Telephone: " + lab.contact_number1 + ", E-mail: " + lab.contact_email;

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
        tl: { col: 6.2, row: 0.5 },
        br: { col: 8.3, row: 4.5 },
    });
    const inddate = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    worksheet.mergeCells("A1:C1");
    worksheet.getCell("A1").value = `Generate Date: ${inddate}`;

    worksheet.mergeCells("A7:I7");
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
    worksheet.mergeCells("H8:I8");
    worksheet.getCell("I8").border = {
        right: { style: "thin" },
    };
    worksheet.getCell("H8").value = srf.srf_date.split("-").reverse().join("-");
    worksheet.mergeCells("A9:I9");
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
    worksheet.getCell("I10").border = {
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
    worksheet.mergeCells("G11:I11");
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
    worksheet.mergeCells("G12:I12");
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
    worksheet.mergeCells("G13:I13");
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
    worksheet.mergeCells("G14:I14");
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
    worksheet.mergeCells("G15:I15");
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
    worksheet.getCell("I16").border = {
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
    worksheet.getCell("I17").border = {
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
    worksheet.getCell("I18").border = {
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
    worksheet.getCell("F19").value = "3.2 " + srf?.contact_name + " is not responsible for the equipments which are not";
    worksheet.getCell("I19").border = {
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
    worksheet.getCell("I20").border = {
        right: { style: "thin" },
    };
    worksheet.mergeCells("A21:I21");
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
    };
    worksheet.getCell("H22").font = { name: "Calibri", size: 13, bold: true };
    worksheet.getCell("H22").value = "Calibration Points Required/ Remarks";
    worksheet.getCell("I22").border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
    };
    worksheet.getCell("I22").font = { name: "Calibri", size: 13, bold: true };
    worksheet.getColumn("I").width = 20;
    worksheet.getCell("I22").value = "Frequency (months)";

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
        worksheet.getCell("I" + lastrow).style.alignment = {
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
        };
        worksheet.getCell("I" + lastrow).font = { name: "Calibri", size: 12 };
        worksheet.getCell("I" + lastrow).border = {
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
            worksheet.getCell("F" + lastrow).value = element?.serial_no + " / " + element?.identification_details;
            worksheet.getCell("G" + lastrow).value = element?.status;
            worksheet.getCell("H" + lastrow).value = element?.remarks;
            worksheet.getCell("I" + lastrow).value = Number(element?.reminder_frequency) || '';
            i = i + 1;
        }
    });
    worksheet.mergeCells("A48:I48");
    worksheet.getCell("A48").font = { name: "Calibri", size: 12, bold: true };
    worksheet.getCell("A48").border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
    };
    if (srf?.agreed_completion_date) {
        worksheet.getCell("A48").value = "5.0.   Agreed Date of Completion.: " + srf?.agreed_completion_date?.split("-").reverse().join("-");
    } else {
        worksheet.getCell("A48").value = "5.0.   Agreed Date of Completion.: ";
    }
    worksheet.mergeCells("A49:I49");
    worksheet.getCell("A49").font = { name: "Calibri", size: 12, bold: true };
    worksheet.getCell("A49").border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
    };
    worksheet.getCell("A49").value = "6.0 Decision Rule:";
    worksheet.mergeCells("A50:I50");
    worksheet.getCell("A50").font = { name: "Calibri", size: 12, bold: true };
    worksheet.getCell("A50").border = {
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
    worksheet.getCell("A50").value =
        "        Statement of confirmity require:        " + sofc;
    worksheet.mergeCells("A51:I51");
    worksheet.getCell("A51").font = { name: "Calibri", size: 12, bold: true };
    worksheet.getCell("A51").border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
    };
    worksheet.getCell("A51").value = "         If Yes please specify:";
    worksheet.mergeCells("A52:I52");
    worksheet.getCell("A52").font = { name: "Calibri", size: 12, bold: true };
    worksheet.getCell("A52").border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
    };
    worksheet.getCell("A52").value =
        "Uncertainty should be consider for the declaration of statement of the confirmity:  " +
        srf.uncertainity_consider_flag;
    worksheet.getCell("A53").border = {
        left: { style: "thin" },
    };
    worksheet.getCell("I53").border = {
        right: { style: "thin" },
    };
    worksheet.getCell("A54").border = {
        left: { style: "thin" },
    };
    worksheet.getCell("I54").border = {
        right: { style: "thin" },
    };
    worksheet.getCell("A54").font = { name: "Calibri", size: 12, bold: true };
    worksheet.getCell("G54").font = { name: "Calibri", size: 12, bold: true };
    worksheet.getCell("A54").value = "Name & Signature of the Customer :";
    worksheet.getCell("G54").value = "Name & Signature of the CSD :";
    worksheet.getCell("A55").border = {
        left: { style: "thin" },
    };
    worksheet.getCell("I55").border = {
        right: { style: "thin" },
    };

    worksheet.getCell("A56").border = {
        left: { style: "thin" },
    };
    worksheet.getCell("I56").border = {
        right: { style: "thin" },
    };
    worksheet.mergeCells("A57:C57");
    worksheet.mergeCells("D57:I57");
    worksheet.getCell("A57").font = { name: "Calibri", size: 12, bold: true };
    worksheet.getCell("D57").font = { name: "Calibri", size: 12, bold: true };
    worksheet.getCell("A57").border = {
        left: { style: "thin" },
        top: { style: "thin" },
        bottom: { style: "thin" },
    };
    worksheet.getCell("D57").border = {
        left: { style: "thin" },
        top: { style: "thin" },
        bottom: { style: "thin" },
    };
    worksheet.getCell("I57").border = {
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
    worksheet.getCell("A57").value = "Invoice No." + invno;
    worksheet.getCell("D57").value = "Invoice Date.";

    worksheet.mergeCells("A58:C58");
    worksheet.getCell("A58").font = { name: "Calibri", size: 12 };
    worksheet.getCell("A58").value = "Issue No. :  " + issno;
    worksheet.getCell("D58").font = { name: "Calibri", size: 12 };
    worksheet.getCell("D58").value = "Amend No. :  ";
    worksheet.getCell("E58").font = { name: "Calibri", size: 12 };
    worksheet.getCell("E58").value = srf?.amend_no;
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
    worksheet.getCell("F58").font = { name: "Calibri", size: 12 };
    worksheet.getCell("F58").value = "Page No.:" + pageno + "/" + pages;
    worksheet.getCell("A58").border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
    };
    worksheet.getCell("D58").border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
    };
    worksheet.getCell("E58").border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
    };
    worksheet.getCell("F58").border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
    };
    worksheet.mergeCells("G58:I59");
    worksheet.getCell("I58").border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
    };
    worksheet.getCell("G58").font = { name: "Calibri", size: 16, bold: true };
    worksheet.getCell("G58").value = lab.name;
    worksheet.getCell("G58").style.alignment = {
        vertical: "middle",
        horizontal: "center",
    };
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
    worksheet.mergeCells("A59:C59");
    worksheet.getCell("A59").font = { name: "Calibri", size: 12 };

    worksheet.getCell("A59").value = "Issue Date. :  " + issdate;
    worksheet.getCell("D59").font = { name: "Calibri", size: 12 };
    worksheet.getCell("D59").value = "Amend Date. :  ";
    worksheet.getCell("E59").font = { name: "Calibri", size: 12 };
    worksheet.getCell("E59").value = srf?.amend_date?.split("-")?.reverse()?.join("-");
    worksheet.getCell("F59").font = { name: "Calibri", size: 12 };
    //worksheet.getCell("F59").value = "TC-FFC-001";
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
    }

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader("Content-Disposition", "attachment; filename=" + fileName);

    return workbook.xlsx.write(res).then(() => {
        res.status(200).end();
    })
}

exports.exportExcel = exportExcel;
exports.downloadExcel = downloadExcel;