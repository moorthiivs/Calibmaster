const nodemailer = require("nodemailer");

// *** Helper function ***
const sendMailHandler = async (srfItemsQuery, filePath) => {

    try {

        const { lab, srf } = srfItemsQuery;

        // Connecting to the STMP Server
        const transporter = nodemailer.createTransport({
            name: "CalibMaster",
            host: lab?.email_smtp_server_host,
            port: lab?.email_smtp_server_port,
            auth: {
                user: lab?.sender_email,
                pass: lab?.sender_password
            }
        });

        const info = await transporter.sendMail({
            from: lab?.contact_email,
            to: srf?.contact_email,
            subject: "Invoice Mail",
            text: "Please find the Invoice on the attachment",
            html: "<b>Please find the Invoice on the attachment</b>",
            priority: "high",
            attachments: [
                {
                    path: filePath,
                    filename: 'Invoice.pdf',
                    contentType: "application/pdf"
                }
            ]
        });
        console.log(info);

        return { msg: "Invoice Mail Send Successfully", statusCode: 201, info }
    } catch (error) {
        console.log(error);
        return { msg: "Failed to send Invoice Mail", statusCode: 501 }
    }
}

exports.sendMailHandler = sendMailHandler;