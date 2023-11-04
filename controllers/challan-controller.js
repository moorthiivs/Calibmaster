const ejs = require('ejs');
const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

const generate = async (req, res, next) => {

    try {
        const data = { users: { name: "test" } };

        const filePathName = path.resolve(__dirname, '../views/deliverychallan.ejs');

        const htmlString = fs.readFileSync(filePathName).toString();

        let options = {
            "height": "10.5in",
            "width": "9in"
        };

        const ejsData = ejs.render(htmlString, data);

        const fileUniqueName = `delivery-challan/${new Date().getTime()}.pdf`;

        pdf.create(ejsData, options).toFile(fileUniqueName, (err, response) => {
            if (err) throw err;

            const filePath = path.resolve(__dirname, `../${fileUniqueName}`);

            fs.readFile(filePath, (err, file) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("could not download file");
                }

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment;filename=${fileUniqueName}`);

                res.send(file);
            });

        });
    } catch (error) {
        console.log(error);
    }
};

exports.generate = generate;