const instrument = require("../models").instrument;
const User = require("../models").User;
const { errorHandler } = require("../helpers/error-handler");
const { Op } = require("sequelize");
const InstrumentParameter = require("../models").InstrumentParameter

const ListInstrument = async (req, res, next) => {
  const { lab_id } = req.body;

  try {
    let instrumentList = await instrument.findAll({
      include: ["UOM", "discipline", "group"],
      where: { lab_id },
      order: [["instrument_id", "DESC"]],
    });

    return res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "Instrument List Fetched Successfully!!",
      data: instrumentList,
    });
  } catch (err) {
    let action = "Internal Server Error!!!";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};

const createInstrument = async (req, res, next) => {
  let {
    instrument_name,
    instrument_uom_id,
    instrument_discipline_id,
    instrument_group_id,
    lab_id,
    ParametersData
  } = req.body;

  if (
    !instrument_name ||
    !instrument_uom_id ||
    !instrument_discipline_id ||
    !instrument_group_id ||
    !ParametersData
  ) {
    let action = "All fields are required";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  try {
    let duplicateInstrument = await instrument.findAll({
      where: {
        lab_id: req.userId,
        instrument_name: { [Op.iLike]: `${instrument_name.trim()}` },
      },
    });

    if (duplicateInstrument.length) {
      let action = "Instrument Name already exists";
      const error = new Error(action);
      error.code = 500;
      return errorHandler(error, req, res, next);
    }

    const fetchCreater = await User.findOne({
      where: { id: req.userId },
    });

    const newInstrument = new instrument({
      instrument_name,
      instrument_uom_id,
      instrument_discipline_id: instrument_discipline_id
        ? instrument_discipline_id
        : null,
      instrument_group_id: instrument_group_id ? instrument_group_id : null,

      created_timestamp: Date.now(),
      created_by_login_name: fetchCreater.name,
      created_by_user_id: req.userId,

      updated_timestamp: Date.now(),
      updated_by_login_name: fetchCreater.name,
      updated_by_user_id: req.userId,

      lab_id,
    });

    const result = await newInstrument.save();

    const parameterEntries = ParametersData.map(param => ({
      InstrumentID: newInstrument.instrument_id,
      Instrumentparametername: param.Instrumentparametername,
      InstrumentUOMID: param.InstrumentUOMID,
      InstrumentparameterUOM: param.InstrumentparameterUOM,
      labid: lab_id,
      CreatedBy: req.userId,
    }));
    await InstrumentParameter.bulkCreate(parameterEntries);

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    let action = "Failed to create new Instrument";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};

const searchByName = async (req, res, next) => {
  const { name, lab_id } = req.params;

  if (!name) {
    let action = "Search By Name !!!";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  try {
    let instrumentList = await instrument.findAll({
      include: ["UOM", "discipline", "group"],
      where: {
        lab_id,
        instrument_name: { [Op.iLike]: `${name.trim()}%` },
      },
      order: [["instrument_id", "DESC"]],
    });

    return res.status(200).json({
      status: "SUCCESS",
      code: 200,
      message: "Uom List Fetched Successfully!!",
      data: instrumentList,
    });
  } catch (err) {
    console.log(err);
    let action = "Internal Server Error!!!";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};

const fetchById = async (req, res, next) => {
  const instrument_id = req.params.id;

  if (!instrument_id) {
    let action = "Instrument Id is required";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
  try {
    let result = await instrument.findOne({
      where: { instrument_id },
    });

    if (!result) {
      let action = "Failed to fetch Instrument";
      const error = new Error(action);
      error.code = 500;
      return errorHandler(error, req, res, next);
    } else {
      return res.status(200).json({
        msg: true,
        response: "Instrument fetch successfully!!!",
        result,
      });
    }
  } catch (err) {
    console.log(err);
    let action = "Something went wrong, please try again";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};

const editInstrument = async (req, res, next) => {
  const {
    instrument_id,
    instrument_name,
    instrument_uom_id,
    instrument_discipline_id,
    instrument_group_id,
  } = req.body;

  if (
    !instrument_id ||
    !instrument_name ||
    !instrument_uom_id ||
    !instrument_discipline_id ||
    !instrument_group_id
  ) {
    let action = "Please fill required fields";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }

  try {
    let duplicateInstrument = await instrument.findAll({
      where: {
        lab_id: req.userId,
        instrument_name: { [Op.iLike]: `${instrument_name.trim()}` },
        instrument_id: {
          [Op.not]: instrument_id,
        },
      },
    });

    if (duplicateInstrument.length) {
      let action = "Instrument Name already exists";
      const error = new Error(action);
      error.code = 500;
      return errorHandler(error, req, res, next);
    }

    let result = await instrument.update(
      {
        instrument_name,
        instrument_uom_id,
        instrument_discipline_id,
        instrument_group_id,
      },
      {
        where: { instrument_id },
      }
    );

    if (!result) {
      let action = "Failed to update Instrument";
      const error = new Error(action);
      error.code = 500;
      return errorHandler(error, req, res, next);
    } else {
      return res.status(200).json({
        msg: true,
        response: "Record updated successfully!!!",
      });
    }
  } catch (err) {
    let action = "Something went wrong, please try again";
    const error = new Error(action);
    error.code = 500;
    return errorHandler(error, req, res, next);
  }
};

const fetchOneinstrumentParameters = async (req, res, next) => {
  try {
    const { instrumentId } = req.params;

    if (!instrumentId) {
      return res.status(400).json({ message: "Instrument ID is required" });
    }

    const parameters = await InstrumentParameter.findAll({
      where: { InstrumentID: instrumentId },
      order: [['id', 'ASC']]
    });
    return res.status(200).json(parameters);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch instrument parameters" });
  }
};

// const instrumentParametersUpdate = async (req, res, next) => {
//   try {
//     const { parametersData, instrument_id, labid, userid } = req.body;

//     const existingData = await InstrumentParameter.findAll({
//       where: {
//         InstrumentID: instrument_id,
//         labid: labid,
//       },
//     });

//     if (existingData.length === 0) {
//       const newEntries = parametersData.map((param) => ({
//         InstrumentID: instrument_id,
//         Instrumentparametername: param.Instrumentparametername,
//         InstrumentUOMID: param.InstrumentUOMID,
//         InstrumentparameterUOM: param.InstrumentparameterUOM,
//         labid: labid,
//         CreatedBy: userid,
//       }));

//       await InstrumentParameter.bulkCreate(newEntries);

//       res.status(200).json({ message: "Data inserted successfully" });
//     } else {
//       for (const param of parametersData) {

//         await InstrumentParameter.update(
//           {
//             Instrumentparametername: param.Instrumentparametername,
//             InstrumentUOMID: param.InstrumentUOMID,
//             InstrumentparameterUOM: param.InstrumentparameterUOM,
//             UpdatedBy: userid,
//           },
//           {
//             where: { id: param.id },
//           }
//         );
//       }
//       res.status(200).json({ message: "Data updated successfully" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "An error occurred", error });
//   }
// };

const instrumentParametersUpdate = async (req, res, next) => {
  try {
    const { parametersData, instrument_id, labid, userid } = req.body;

    console.log(parametersData, "parametersData");

    for (const param of parametersData) {
      if (param.id) {
        await InstrumentParameter.update(
          {
            Instrumentparametername: param.Instrumentparametername,
            InstrumentUOMID: param.InstrumentUOMID || 0,
            InstrumentparameterUOM: param.InstrumentparameterUOM || '',
            UpdatedBy: userid,
          },
          {
            where: {
              id: param.id,
              InstrumentID: instrument_id,
              labid: labid,
            },
          }
        );
      } else {
        console.log("else come");
        await InstrumentParameter.create({
          InstrumentID: instrument_id,
          Instrumentparametername: param.Instrumentparametername,
          InstrumentUOMID: param.InstrumentUOMID || 0,
          InstrumentparameterUOM: param.InstrumentparameterUOM || '',
          labid: labid,
          CreatedBy: userid,
        });
      }
    }

    res.status(200).json({ message: "Data saved successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred", error });
  }
};


const deleteinstrumentParameter = async (req, res, next) => {
  try {
    const { instrument_Parameter_id, labid, userid } = req.body;

    if (!instrument_Parameter_id || !labid || !userid) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Optional: You can first verify the record exists
    const param = await InstrumentParameter.findOne({
      where: {
        id: instrument_Parameter_id,
        labid: labid,
      },
    });

    if (!param) {
      return res.status(404).json({ message: "Instrument parameter not found" });
    }

    // Perform deletion
    await InstrumentParameter.destroy({
      where: {
        id: instrument_Parameter_id,
        labid: labid,
      },
    });

    res.status(200).json({ message: "Instrument parameter deleted successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred", error });
  }
};



exports.ListInstrument = ListInstrument;
exports.createInstrument = createInstrument;
exports.searchByName = searchByName;
exports.fetchById = fetchById;
exports.editInstrument = editInstrument;
exports.fetchOneinstrumentParameters = fetchOneinstrumentParameters
exports.instrumentParametersUpdate = instrumentParametersUpdate
exports.deleteinstrumentParameter = deleteinstrumentParameter