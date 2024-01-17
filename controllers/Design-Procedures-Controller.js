const MasterTable = require("../models").master_design_procedure;
const Dynamicdesign = require("../models").design_procedure;

const { errorHandler } = require("../helpers/error-handler");

const create = async (req, res, next) => {

    try {

        const {
            lab_id, mainArray,
            ulr_number, validity, traceability, calibration_procedure,
            temperature, humidity
        } = req.body;

        // TODO: Create Parent-Table Id
        const newMasterTable = new MasterTable({
            lab_id: lab_id,
            calibration_procedure: calibration_procedure,
            parentTableId: "parentTableId"
        });
        const result = await newMasterTable.save();

        if (result) {

            for (let i = 0; i < mainArray?.length; i++) {

                mainArray[i].master_design_procedure_id = await result.master_design_procedure_id;
                mainArray[i].unique_id = new Date().getTime();
                mainArray[i].ulr_number = ulr_number;
                mainArray[i].validity = validity;
                mainArray[i].traceability = traceability;
                mainArray[i].calibration_procedure = calibration_procedure;
                mainArray[i].temperature = temperature;
                mainArray[i].humidity = humidity;

                const newTableDesign = new Dynamicdesign(mainArray[i]);
                await newTableDesign.save();
            }
            return res.json(result);
        } else {
            return res.json({ msg: false });
        }
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

//TODO: Listing FindAll MasterTable where { lab_id:"1" }

module.exports = {
    create,
}