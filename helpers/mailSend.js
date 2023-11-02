const nodemailer = require("nodemailer");

// *** Helper function ***
const sendMailHandler = async (srfItemsQuery, filePath) => {

    try {

        const { lab, srf } = srfItemsQuery;

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
            subject: "Invoice Mail",
            html: "<b>Please find the Invoice on the attachment</b>",
            attachments: [
                { path: filePath }
            ]
        });

        return { msg: "Invoice Mail Send Successfully", statusCode: 201 }
    } catch (error) {
        console.log(error);
        return { msg: "Failed to send Invoice Mail", statusCode: 501 }
    }
}

exports.sendMailHandler = sendMailHandler;