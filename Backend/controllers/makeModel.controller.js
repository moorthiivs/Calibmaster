// controllers/makeModel.controller.js

const { Sequelize } = require('sequelize');
const { Make, Model, InstrumentCode } = require('../models');

// ============================
// MAKE CONTROLLER
// ============================

exports.createMake = async (req, res) => {
  try {
    const { name, labId, createdBy } = req.body;

    const existingMake = await Make.findOne({
      where: {
        name: Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('name')),
          Sequelize.fn('LOWER', name)
        ),
        labId
      }
    });

    if (existingMake) {
      return res.status(409).json({ message: 'Make with this name already exists in the lab.' });
    }


    const make = await Make.create({ name, labId, createdBy, updatedBy: createdBy });
    return res.status(201).json(make);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Error creating make', error });
  }
};

exports.getAllMakes = async (req, res) => {
  try {
    const makes = await Make.findAll({ order: [['createdAt', 'DESC'], ['id', 'DESC']] });
    return res.status(200).json(makes);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Error fetching makes', error });
  }
};

exports.updateMake = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, updatedBy } = req.body;

    const make = await Make.findByPk(id);
    if (!make) return res.status(404).json({ message: 'Make not found' });

    make.name = name;
    make.updatedBy = updatedBy;
    await make.save();

    return res.status(200).json(make);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating make', error });
  }
};

exports.deleteMake = async (req, res) => {
  try {
    const { id } = req.params;
    const make = await Make.findByPk(id);
    if (!make) return res.status(404).json({ message: 'Make not found' });

    await make.destroy();
    return res.status(200).json({ message: 'Make deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting make', error });
  }
};

// ============================
// MODEL CONTROLLER
// ============================

exports.createModel = async (req, res) => {
  try {
    const { name, labId, createdBy } = req.body;

    const model = await Model.create({ name, labId, createdBy, updatedBy: createdBy });
    return res.status(201).json(model);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating model', error });
  }
};

exports.getAllModels = async (req, res) => {
  try {
    const models = await Model.findAll({ order: [['createdAt', 'DESC'], ['id', 'DESC']] });
    return res.status(200).json(models);
  } catch (error) {
    console.log(error);

    return res.status(500).json({ message: 'Error fetching models', error });
  }
};

exports.updateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, updatedBy } = req.body;

    const model = await Model.findByPk(id);
    if (!model) return res.status(404).json({ message: 'Model not found' });

    model.name = name;
    model.updatedBy = updatedBy;
    await model.save();

    return res.status(200).json(model);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating model', error });
  }
};

exports.deleteModel = async (req, res) => {
  try {
    const { id } = req.params;
    const model = await Model.findByPk(id);
    if (!model) return res.status(404).json({ message: 'Model not found' });

    await model.destroy();
    return res.status(200).json({ message: 'Model deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting model', error });
  }
};

// ============================
// INSTRUMENT CODE CONTROLLER
// ============================

exports.createInstrumentCode = async (req, res) => {
  try {
    const { instrument_name, code } = req.body;

    const existingCode = await InstrumentCode.findOne({
      where: {
        instrument_name: Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('instrument_name')),
          Sequelize.fn('LOWER', instrument_name)
        )
      }
    });

    if (existingCode) {
      return res.status(409).json({ message: 'Instrument Code with this name already exists.' });
    }

    const newInstrumentCode = await InstrumentCode.create({ 
        instrument_name, 
        code 
    });
    return res.status(201).json(newInstrumentCode);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Error creating instrument code', error });
  }
};

exports.getAllInstrumentCodes = async (req, res) => {
  try {
    const instrumentCodes = await InstrumentCode.findAll({ order: [['createdAt', 'DESC'], ['id', 'DESC']] });
    return res.status(200).json(instrumentCodes);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Error fetching instrument codes', error });
  }
};

exports.updateInstrumentCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { instrument_name, code } = req.body;

    const instrumentCode = await InstrumentCode.findByPk(id);
    if (!instrumentCode) return res.status(404).json({ message: 'Instrument Code not found' });

    instrumentCode.instrument_name = instrument_name;
    instrumentCode.code = code;
    await instrumentCode.save();

    return res.status(200).json(instrumentCode);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating instrument code', error });
  }
};

exports.deleteInstrumentCode = async (req, res) => {
  try {
    const { id } = req.params;
    const instrumentCode = await InstrumentCode.findByPk(id);
    if (!instrumentCode) return res.status(404).json({ message: 'Instrument Code not found' });

    await instrumentCode.destroy();
    return res.status(200).json({ message: 'Instrument Code deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting instrument code', error });
  }
};
