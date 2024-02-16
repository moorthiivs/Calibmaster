const logger = require("../utils/logger");
const { errorHandler } = require("../helpers/error-handler");
const editLabSchema = require("../schemas/editLab");
const Lab = require("../models").Lab;
const User = require("../models").User;
const bcrypt = require("bcryptjs");
const emailconfigSchema = require("../schemas/emailconfig");
const nodeMailer = require("nodemailer");
const crypto = require("crypto");
const config = require("../utils/config");
var request = require("request");
const { Sequelize, Op } = require('sequelize');
var fs = require('fs');

const editLab = async (req, res, next) => {

    if (req.department != "root") {
        let action = "Unauthorized Access !!!";
        const error = new Error(action);
        error.code = 401;
        error.path = "/api/lab/edit-lab";
        return errorHandler(error, req, res, next);
    }

    const valid = editLabSchema(req.body);

    if (valid) {
        let action = "All fields are required";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/lab/edit-lab";
        return errorHandler(error, req, res, next);
    }

    let {
        labId,
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
        lab_active_flag,

        brand_logo_filename,
        brand_logo_mime_type,
        brand_logo,

        other_logo1_image_filename,
        other_logo1_image_mime_type,
        other_logo1_image,

        other_logo2_image_filename,
        other_logo2_image_mime_type,
        other_logo2_image,

        MainLogo,
        secondLogo,
        thirdLogo,

        sealLogo

    } = req.body;

    // *** checking non required for values ***
    address2 = (address2 != "") ? address2 : null;
    address3 = (address3 != "") ? address3 : null;
    symbol = (symbol) ? symbol : null;
    email_smtp_server_host = (email_smtp_server_host != "") ? email_smtp_server_host : null;
    email_smtp_server_port = (email_smtp_server_port != "") ? email_smtp_server_port : null;
    sender_email = (sender_email != "") ? sender_email : null;
    sender_password = (sender_password != "") ? sender_password : null;

    // *** Checking lab in Database ***
    let existingLab = await Lab.findOne(
        { where: { lab_id: labId, rstatus: 1 } }
    );

    if (!existingLab) {
        let action = "Lab is not exist";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/lab/edit-lab";
        return errorHandler(error, req, res, next);
    }

    // *** Check if contact_mail is already associated with any lab or not ***
    if (contact_email != null) {
        if (existingLab.contact_email != contact_email) {

            const existingLabMail = await Lab.findOne(
                {
                    where: {
                        contact_email, rstatus: 1,
                        lab_id: { [Op.not]: labId }
                    }
                }
            );

            if (existingLabMail) {
                let action = "Contact Mail is already used";
                const error = new Error(action);
                error.code = 500;
                error.path = "/api/lab/edit-lab";
                return errorHandler(error, req, res, next);
            }
        }
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

    // *** Check if main logo is available or not in request ***
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
        mainLogoImgFileName = existingLab.brand_logo_filename;
        buff1 = existingLab.other_logo1_image;
        brand_logo_mime_type = brand_logo_mime_type ? brand_logo_mime_type : existingLab.brand_logo_mime_type;
    }

    // *** Check if 2nd logo is available or not in request ***
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
        secondLogoImgFileName = existingLab.other_logo1_image_filename;
        buff2 = existingLab.other_logo1_image;
        other_logo1_image_mime_type = other_logo1_image_mime_type ? other_logo1_image_mime_type : existingLab.other_logo1_image_mime_type;
    }

    // *** Check if 3rd logo is available or not in request ***
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
        thirdLogoImgFileName = existingLab.other_logo2_image_filename;
        buff3 = existingLab.other_logo2_image;
        other_logo2_image_mime_type = other_logo2_image_mime_type ? other_logo2_image_mime_type : existingLab.other_logo2_image_mime_type;
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
        sealLogoImgFileName = existingLab.seal_image_filename;
    }

    const fetchCreater = await User.findOne({
        where: { id: req.userId }
    });

    try {
        // update the rows
        let updatedLab = await Lab.update(
            {
                lab_name: lab_name ? lab_name : existingLab.lab_name,

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
                lab_active_flag: lab_active_flag ? 1 : 0,

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

                updated_timestamp: Date.now(),
                updated_by_login_name: fetchCreater.name,
                updated_by_user_id: req.userId
            },
            { where: { lab_id: labId } }
        );
        return res.status(200).json({ msg: true, code: 200, updatedLab });
    } catch (err) {
        let action = "Something went wrong";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/lab/edit-lab";
        return errorHandler(error, req, res, next);
    }
};

exports.editLab = editLab;