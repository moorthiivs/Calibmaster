const models = require("../models");
const { errorHandler } = require("../helpers/error-handler");

const Task = models.Task;
const TaskItem = models.TaskItem;
const CalibrationData = models.CalibrationData;
const SrfItem = models.srfitem;
const instrument_type = models.instrument_type;
const User = models.User;
const SRF = models.srf_list;
const sequelize = models.sequelize;

const { generateSingleInwardNumber } = require("../utils/generateInwardNumber");
const generateAndAssignCertificateNo = require("../utils/generateAndAssignCertificateNo");

exports.addItemsToTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { task_id } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error("Items must be a non-empty array");
      error.code = 400;
      error.path = "/api/task-items/:task_id/add";
      throw error;
    }

    const task = await Task.findByPk(task_id, { transaction });
    if (!task) {
      const error = new Error("Task not found");
      error.code = 404;
      error.path = "/api/task-items/:task_id/add";
      throw error;
    }

    const createdItems = [];
    for (const item of items) {
      if (!item.instrument_id) {
        throw new Error("Each item must have an instrument_id");
      }

      const existingItem = await TaskItem.findOne({
        where: { task_id, instrument_id: item.instrument_id },
        transaction
      });

      if (existingItem) {
        continue;
      }

      const taskItem = await TaskItem.create(
        {
          task_id,
          instrument_id: item.instrument_id,
          calibration_required: item.calibration_required !== false,
          notes: item.notes || null
        },
        { transaction }
      );
      createdItems.push(taskItem);
    }

    task.sync_status = "pending";
    task.updated_at = new Date();
    await task.save({ transaction });

    await transaction.commit();

    const updatedItems = await TaskItem.findAll({
      where: { task_id }
    });

    return res.status(201).json({
      status: 201,
      message: "Items added to task successfully",
      data: updatedItems
    });
  } catch (err) {
    await transaction.rollback();
    const error = new Error(err.message || "Error adding items to task");
    error.code = err.code || 500;
    error.path = "/api/task-items/:task_id/add";
    return errorHandler(error, req, res, next);
  }
};

exports.getTaskItems = async (req, res, next) => {
  try {
    const { task_id } = req.params;

    const task = await Task.findByPk(task_id);
    if (!task) {
      const error = new Error("Task not found");
      error.code = 404;
      error.path = "/api/task-items/:task_id";
      throw error;
    }

    const items = await TaskItem.findAll({
      where: { task_id },
      include: [
        {
          model: models.Masterlist,
          as: "instrument",
          attributes: ["id", "equipment_name", "model_no", "serial_no"]
        }
      ]
    });

    return res.status(200).json({
      status: 200,
      message: "Task items fetched successfully",
      data: items
    });
  } catch (err) {
    const error = new Error(err.message || "Error fetching task items");
    error.code = err.code || 500;
    error.path = "/api/task-items/:task_id";
    return errorHandler(error, req, res, next);
  }
};

exports.removeItemFromTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { task_id, item_id } = req.params;

    const taskItem = await TaskItem.findOne({
      where: { id: item_id, task_id },
      transaction
    });

    if (!taskItem) {
      const error = new Error("Task item not found");
      error.code = 404;
      error.path = "/api/task-items/:task_id/:item_id";
      throw error;
    }

    const calibrationCount = await CalibrationData.count({
      where: { task_item_id: item_id },
      transaction
    });

    if (calibrationCount > 0) {
      const error = new Error("Cannot remove item with existing calibration data");
      error.code = 400;
      error.path = "/api/task-items/:task_id/:item_id";
      throw error;
    }

    await taskItem.destroy({ transaction });

    const task = await Task.findByPk(task_id, { transaction });
    task.sync_status = "pending";
    task.updated_at = new Date();
    await task.save({ transaction });

    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: "Task item removed successfully"
    });
  } catch (err) {
    await transaction.rollback();
    const error = new Error(err.message || "Error removing task item");
    error.code = err.code || 500;
    error.path = "/api/task-items/:task_id/:item_id";
    return errorHandler(error, req, res, next);
  }
};

exports.updateItemStatus = async (req, res, next) => {
  try {
    const { item_id } = req.params;
    const { calibration_status } = req.body;

    const validStatuses = ["pending", "in_progress", "completed"];
    if (!validStatuses.includes(calibration_status)) {
      const error = new Error("Invalid calibration_status. Must be: pending, in_progress, or completed");
      error.code = 400;
      error.path = "/api/tasks/items/:item_id/status";
      throw error;
    }

    const taskItem = await TaskItem.findByPk(item_id);
    if (!taskItem) {
      const error = new Error("Task item not found");
      error.code = 404;
      error.path = "/api/tasks/items/:item_id/status";
      throw error;
    }

    taskItem.calibration_status = calibration_status;
    taskItem.updated_at = new Date();
    await taskItem.save();

    return res.status(200).json({
      status: 200,
      message: "Task item status updated",
      data: taskItem
    });
  } catch (err) {
    const error = new Error(err.message || "Error updating task item status");
    error.code = err.code || 500;
    error.path = "/api/tasks/items/:item_id/status";
    return errorHandler(error, req, res, next);
  }
};

exports.webCalibrateItem = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { item_id } = req.params;
    const { item, labId } = req.body;

    // ─── FETCH METADATA ──────────────────────────────────────────────────────
    const [taskItem, requester] = await Promise.all([
      TaskItem.findByPk(item_id, { transaction }),
      User.findByPk(req.userId, { transaction })
    ]);

    if (!taskItem) {
      const error = new Error("Task item not found");
      error.code = 404; throw error;
    }

    const srf = await SRF.findByPk(taskItem.srf_id, { transaction });
    if (!srf) {
      const error = new Error("Associated SRF not found");
      error.code = 404; throw error;
    }

    // ─── 1. CREATE OR UPDATE SRF ITEM ────────────────────────────────────────
    let srfItem;
    if (taskItem.srf_item_id) {
      srfItem = await SrfItem.findByPk(taskItem.srf_item_id, { transaction });
    }

    const srfItemData = {
      srf_id: taskItem.srf_id,
      intrument_type_id: item.intrument_type_id,
      instrument_name: item.name,
      instrument_description: item.description,
      make: item.make,
      model: item.model,
      serial_no: item.serial_no,
      identification_details: item.identification_details,
      remarks: item.remarks || "Okay",
      url_number: item.url_number,
      reminder_frequency: item.reminder_frequency,
      frequency_days: item.frequency_days,
      calibrationAt: item.calibrationAt,
      labtype: item.labtype,
      ranges: item.ranges,
      instrument_type_at_calibration: item.instrument_type_at_calibration,
      updated_timestamp: new Date(),
      updated_by_login_name: requester.name,
      updated_by_user_id: req.userId,
      lab_id: labId || srf.lab_id
    };

    if (srfItem) {
      await srfItem.update(srfItemData, { transaction });
    } else {
      // Calculate next srf_item_no
      const maxItemNo = await SrfItem.max('srf_item_no', { 
        where: { srf_id: taskItem.srf_id },
        transaction 
      }) || 0;
      
      // Generate Inward Number using utility
      const inwardNumber = await generateSingleInwardNumber({
        inwardDate: srf.srf_date,
        itemName: item.name,
        model: SrfItem,
        labId: labId || srf.lab_id,
      });

      srfItemData.srf_item_no = maxItemNo + 1;
      srfItemData.inward_no = inwardNumber;
      srfItemData.status = "Not Calibrated";
      srfItemData.rstatus = 1;
      srfItemData.created_timestamp = new Date();
      srfItemData.created_by_login_name = requester.name;
      srfItemData.created_by_user_id = req.userId;

      srfItem = await SrfItem.create(srfItemData, { transaction });
      
      // Link TaskItem to new SrfItem
      taskItem.srf_item_id = srfItem.srf_item_id;
    }

    // Assign Certificate Number using utility
    await generateAndAssignCertificateNo({
      item: srfItem,
      srf,
      itemCount: null,
      Item: SrfItem,
      labId: labId || srf.lab_id
    });

    // ─── 2. UPDATE TASK ITEM STATUS ──────────────────────────────────────────
    taskItem.calibration_status = "completed";
    taskItem.updated_at = new Date();
    await taskItem.save({ transaction });

    // ─── 3. UPDATE CALIBRATION DATA ──────────────────────────────────────────
    let calibData = await CalibrationData.findOne({
      where: { task_item_id: taskItem.task_item_id }, // Corrected: use task_item_id
      transaction
    });

    const calibDataPayload = {
      task_id: taskItem.task_id,
      task_item_id: taskItem.task_item_id,
      srf_item_id: srfItem.srf_item_id,
      user_id: req.userId,
      reading_value: item.ranges, 
      remarks: item.remarks,
      calibration_date: new Date(),
      is_synced: true,
      updated_at: new Date()
    };

    if (calibData) {
      await calibData.update(calibDataPayload, { transaction });
    } else {
      await CalibrationData.create(calibDataPayload, { transaction });
    }

    // ─── 4. UPDATE TASK STATUS ───────────────────────────────────────────────
    const remainingItems = await TaskItem.count({
      where: { 
        task_id: taskItem.task_id, 
        calibration_status: { [models.Sequelize.Op.ne]: "completed" } 
      },
      transaction
    });

    const task = await Task.findByPk(taskItem.task_id, { transaction });
    if (task && remainingItems === 0 && task.status !== "completed") {
      task.status = "completed";
    }
    if (task) {
      task.updated_at = new Date();
      await task.save({ transaction });
    }

    await transaction.commit();

    return res.status(200).json({
      status: 200, message: "Item calibrated and synced successfully",
      data: { taskItem, srfItem }
    });

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Calibration sync error:", err);
    const error = new Error(err.message || "Error during web calibration");
    error.code = err.code || 500;
    error.path = "/api/tasks/items/:item_id/web-calibrate";
    return errorHandler(error, req, res, next);
  }
};
