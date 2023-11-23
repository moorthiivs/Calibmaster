
const { errorHandler } = require("../helpers/error-handler");

const create = async (req, res, next) => {

    try {

        return res.json({ msg: true });

    } catch (err) {
        console.log(err);
        const error = new Error("Error when sending the mail");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}


exports.create = create;
