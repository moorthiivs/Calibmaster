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
    action = "Internal Server Error!!" + err;
    const error = new Error("Failed to create buffer");
    error.code = 500;
    return errorHandler(error, req, res, next);
}

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
        const info = await transporter.sendMail({
            from: existingLab.contact_email,
            // to: req?.body?.srf?.contact_email,
            to: "anirban@gmail.com",
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
        const error = new Error("Error when sending the mail");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}