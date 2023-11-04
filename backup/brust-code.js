if (existingLab.senderEmail) {
    const decrypted = Buffer.from(
        existingLab.senderPassword,
        "base64"
    ).toString("ascii");
    const transporter = nodeMailer.createTransport({
        name: "CalibMaster",
        host: existingLab.host,
        port: existingLab.port,
        secure: true,
        auth: {
            user: existingLab.senderEmail,
            pass: decrypted,
        },
    });
    fileName = existingLab.symbol + "-" + year.toString().slice(2) + "-";

    if (srfno > 0 && srfno < 10) {
        addedzero = "0000" + srfno;
    }
    if (srfno > 9 && srfno < 100) {
        addedzero = "000" + srfno;
    }
    if (srfno > 99 && srfno < 1000) {
        addedzero = "00" + srfno;
    }
    if (srfno > 999 && srfno < 10000) {
        addedzero = "0" + srfno;
    }
    if (srfno > 9999 && srfno < 100000) {
        addedzero = "" + srfno;
    }
    fileName += addedzero + ".xlsx";

    let existingCompany;
    try {
        existingCompany = await Company.findOne({
            where: { id: req.body.srf.CompanyId, rstatus: 1 },
        });
    } catch (err) {
        code = 500;
        action = "Internal Server Error!!";
        const error = new Error(action);
        error.code = code;
        error.path = path;
        return errorHandler(error, req, res, next);
    }

    try {
        const info = await transporter.sendMail({
            from: existingLab.senderEmail,
            to: req.body.srf.contact_email,
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
        isError = true;
        code = 400;
        action = "Invalid Credentials!!";
        const error = new Error(action);
        error.code = code;
        error.path = path;
        console.log(err);
        return errorHandler(error, req, res, next);
    }
}