const models = require("../models");
const { errorHandler } = require("../helpers/error-handler");
const { Op } = require("sequelize");

const Task     = models.Task;
const TaskItem = models.TaskItem;
const CalibrationData = models.CalibrationData;
const User     = models.User;
const SrfItem  = models.srfitem;
const SRF      = models.srf_list;
const SyncLog  = models.SyncLog;
const sequelize = models.sequelize;

const { generateSingleInwardNumber } = require("../utils/generateInwardNumber");
const generateAndAssignCertificateNo = require("../utils/generateAndAssignCertificateNo");

// ─── PUSH SYNC (Electron → Server) ───────────────────────────────────────────
exports.pushSync = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { user_id, changes, client_timestamp } = req.body;

    if (!user_id || !Array.isArray(changes) || changes.length === 0) {
      const error = new Error("Missing required fields: user_id and non-empty changes array");
      error.code = 400; error.path = "/api/sync/push"; throw error;
    }

    const user = await User.findByPk(user_id, { transaction });
    if (!user) {
      const error = new Error("User not found"); error.code = 404; throw error;
    }

    const synced = [];
    const affectedTaskIds = new Set();

    for (const change of changes) {
      const { type, client_id, payload } = change;

      if (type === "calibration_data") {
        const { task_item_id, item, labId } = payload;
        if (!task_item_id || !item) {
          throw new Error(`Sync Error: Missing ${!task_item_id ? 'task_item_id' : ''} ${!item ? 'item' : ''} in payload`);
        }

        // 1. Fetch TaskItem & SRF info
        const taskItem = await TaskItem.findByPk(task_item_id, {
          include: [{ model: Task, as: "task" }],
          transaction
        });
        if (!taskItem) throw new Error(`Task item ${task_item_id} not found`);
        affectedTaskIds.add(taskItem.task_id);

        const srf = await SRF.findByPk(taskItem.task.srf_id, { transaction });
        if (!srf) throw new Error("Associated SRF not found");

        // 2. Create or Update SRF Item (Rich Metadata)
        let srfItem;
        if (taskItem.srf_item_id) {
          srfItem = await SrfItem.findByPk(taskItem.srf_item_id, { transaction });
        }

        const srfItemData = {
          srf_id: taskItem.task.srf_id,
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
          updated_by_login_name: user.name,
          updated_by_user_id: user.id,
          lab_id: labId || user.labId || srf.lab_id
        };

        if (srfItem) {
          await srfItem.update(srfItemData, { transaction });
        } else {
          // New Ad-hoc item logic
          const maxItemNo = await SrfItem.max('srf_item_no', { 
            where: { srf_id: taskItem.task.srf_id },
            transaction 
          }) || 0;
          
          const inwardNumber = await generateSingleInwardNumber({
            inwardDate: srf.srf_date,
            itemName: item.name,
            model: SrfItem,
            labId: labId || user.labId || srf.lab_id,
          });

          srfItemData.srf_item_no = maxItemNo + 1;
          srfItemData.inward_no = inwardNumber;
          srfItemData.status = "Not Calibrated";
          srfItemData.rstatus = 1;
          srfItemData.created_timestamp = new Date();
          srfItemData.created_by_login_name = user.name;
          srfItemData.created_by_user_id = user.id;

          srfItem = await SrfItem.create(srfItemData, { transaction });
          await taskItem.update({ srf_item_id: srfItem.srf_item_id }, { transaction });
        }

        // 3. Assign Certificate No
        await generateAndAssignCertificateNo({
          item: srfItem,
          srf,
          itemCount: null,
          Item: SrfItem,
          labId: labId || user.labId || srf.lab_id
        });

        // 4. Update Calibration Data
        const existingCalib = await CalibrationData.findOne({
          where: { task_item_id },
          transaction
        });

        const calibPayload = {
          task_id: taskItem.task_id,
          task_item_id,
          srf_item_id: srfItem.srf_item_id,
          user_id,
          reading_value: item.ranges, 
          remarks: item.remarks,
          calibration_date: new Date(),
          is_synced: true,
          updated_at: new Date(),
          client_created_at: client_timestamp ? new Date(client_timestamp) : null
        };

        if (existingCalib) {
          await existingCalib.update(calibPayload, { transaction });
        } else {
          await CalibrationData.create(calibPayload, { transaction });
        }

        // 5. Update TaskItem status
        await TaskItem.update(
          { calibration_status: "completed" },
          { where: { task_item_id }, transaction }
        );

        synced.push({ client_id, type: "calibration_data", task_item_id });

      } else if (type === "status_update") {
        const { task_id, status, version } = payload;
        if (!task_id || !status) throw new Error("Missing task_id or status");

        const task = await Task.findByPk(task_id, { transaction });
        if (!task) throw new Error("Task not found");
        affectedTaskIds.add(task_id);

        const validTransitions = {
          assigned: ["in_progress", "completed"], 
          in_progress: ["completed"], 
          completed: []
        };

        if (task.version !== version) {
          // Idempotency: server already in target state – accept silently
          if (task.status === status) {
            synced.push({ client_id, task_id, type: "status_update" });
            continue;
          }
          // Auto-repair: client is behind but the transition is still valid from the server's current state
          if ((validTransitions[task.status] || []).includes(status)) {
            // Allow it – the intent is correct even though the version is stale
          } else {
            throw new Error(`Version mismatch for task ${task_id}: Sync your list. (Client v${version}, Server v${task.version})`);
          }
        } else {
          if (!(validTransitions[task.status] || []).includes(status)) {
            throw new Error(`Cannot transition from ${task.status} to ${status}`);
          }
        }

        task.status = status;
        task.version = task.version + 1;
        task.sync_status = "pending";
        task.updated_at = new Date();
        await task.save({ transaction });
        synced.push({ client_id, task_id, type: "status_update" });
      } else {
        throw new Error(`Unknown change type: ${type}`);
      }
    }

    // ─── FINAL PASS: TASK AUTO-COMPLETION ────────────────────────────────────
    const updatedTasks = [];
    for (const tid of affectedTaskIds) {
      const task = await Task.findByPk(tid, { transaction });
      if (!task) continue;

      const remainingItems = await TaskItem.count({
        where: { 
          task_id: tid, 
          calibration_status: { [Op.ne]: "completed" } 
        },
        transaction
      });

      if (remainingItems === 0 && task.status !== "completed") {
        task.status = "completed";
      }
      
      task.sync_status = "synced";
      task.updated_at = new Date();
      await task.save({ transaction });

      updatedTasks.push({
        task_id: task.task_id,
        status: task.status,
        version: task.version
      });
    }

    await SyncLog.create({
      user_id, sync_type: "push",
      records_count: changes.length,
      status: "success",
      error_message: null,
      client_timestamp: client_timestamp ? new Date(client_timestamp) : null,
      details: { total_changes: changes.length, successful: changes.length, failed: 0 }
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: "Sync push successful",
      synced,
      tasks: updatedTasks
    });
  } catch (err) {
    await transaction.rollback();
    const error = new Error(err.message || "Error during push sync");
    error.code = err.code || 500; error.path = "/api/sync/push";
    return errorHandler(error, req, res, next);
  }
};

// ─── PULL SYNC (Server → Electron) ───────────────────────────────────────────
exports.pullSync = async (req, res, next) => {
  try {
    const { user_id, last_sync_timestamp } = req.query;

    if (!user_id) {
      const error = new Error("Missing required parameter: user_id");
      error.code = 400; error.path = "/api/sync/pull"; throw error;
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      const error = new Error("User not found"); error.code = 404; throw error;
    }

    const whereClause = { user_id };
    if (last_sync_timestamp) {
      whereClause.updated_at = { [Op.gt]: new Date(last_sync_timestamp) };
    }

    const tasks = await Task.findAll({
      where: whereClause,
      include: [
        {
          model: TaskItem,
          as: "items",
          include: [
            {
              model: SrfItem,
              as: "srfItem",
              attributes: ["srf_item_id","make","model","serial_no",
                           "identification_details","srf_item_no","intrument_type_id"]
            },
            {
              model: models.instrument_type,
              as: "instrumentType",
              attributes: ["instrument_type_id","instrument_full_name"]
            }
          ]
        }
      ],
      order: [["updated_at","DESC"]]
    });

    const calibDataList = await CalibrationData.findAll({
      where: {
        user_id,
        ...(last_sync_timestamp && { updated_at: { [Op.gt]: new Date(last_sync_timestamp) } })
      },
      attributes: ["id","task_id","task_item_id","srf_item_id",
                   "reading_value","standard_instrument_used",
                   "environmental_conditions","remarks","calibration_date"]
    });

    await SyncLog.create({
      user_id, sync_type: "pull",
      records_count: tasks.length + calibDataList.length,
      status: "success",
      details: { tasks_pulled: tasks.length, calibration_data_pulled: calibDataList.length }
    });

    return res.status(200).json({
      status: 200,
      message: "Sync pull completed",
      data: {
        tasks,
        calibration_data: calibDataList,
        server_timestamp: new Date(),
        summary: { tasks_count: tasks.length, calibration_data_count: calibDataList.length }
      }
    });
  } catch (err) {
    const error = new Error(err.message || "Error during pull sync");
    error.code = err.code || 500; error.path = "/api/sync/pull";
    return errorHandler(error, req, res, next);
  }
};

// ─── ACKNOWLEDGE SYNC ─────────────────────────────────────────────────────────
exports.acknowledgeSync = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { user_id, synced_task_ids } = req.body;

    if (!user_id || !Array.isArray(synced_task_ids) || synced_task_ids.length === 0) {
      const error = new Error("Missing: user_id and non-empty synced_task_ids");
      error.code = 400; throw error;
    }

    const tasks = await Task.findAll({
      where: { task_id: { [Op.in]: synced_task_ids }, user_id },
      transaction
    });
    if (tasks.length === 0) {
      const error = new Error("No tasks found to acknowledge"); error.code = 404; throw error;
    }

    for (const task of tasks) {
      task.sync_status = "synced";
      task.updated_at  = new Date();
      await task.save({ transaction });
    }

    await SyncLog.create({
      user_id, sync_type: "push",
      records_count: tasks.length,
      status: "success",
      details: { acknowledged_tasks: synced_task_ids }
    }, { transaction });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: "Sync acknowledged successfully",
      data: { acknowledged_count: tasks.length, server_timestamp: new Date() }
    });
  } catch (err) {
    await transaction.rollback();
    const error = new Error(err.message || "Error acknowledging sync");
    error.code = err.code || 500; error.path = "/api/sync/acknowledge";
    return errorHandler(error, req, res, next);
  }
};
