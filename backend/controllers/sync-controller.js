const models = require("../models");
const { errorHandler } = require("../helpers/error-handler");
const { Op } = require("sequelize");

const Task     = models.Task;
const TaskItem = models.TaskItem;
const CalibrationData = models.CalibrationData;
const User     = models.User;
const SrfItem  = models.srfitem;
const SyncLog  = models.SyncLog;
const sequelize = models.sequelize;

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
    const failed = [];
    let successCount = 0, failedCount = 0;

    for (const change of changes) {
      try {
        const { type, client_id, payload } = change;

        if (type === "calibration_data") {
          const { 
            task_item_id, srf_item_id, reading_value, 
            standard_instrument_used, environmental_conditions, remarks 
          } = payload;

          const taskItem = await TaskItem.findByPk(task_item_id, {
            include: [{ model: Task, as: "task" }],
            transaction
          });
          if (!taskItem) throw new Error(`Task item ${task_item_id} not found`);

          let effective_srf_item_id = srf_item_id;

          // DYNAMIC CREATION: If this was an ad-hoc item with no srf_item_id yet
          if (!taskItem.srf_item_id && taskItem.instrument_type_id) {
            const insType = await models.instrument_type.findByPk(taskItem.instrument_type_id, { transaction });
            if (!insType) throw new Error("Instrument template not found");

            // Calculate next srf_item_no
            const lastItem = await SrfItem.findOne({
              where: { srf_id: taskItem.task.srf_id },
              order: [["srf_item_no", "DESC"]],
              transaction
            });
            const nextNo = lastItem ? lastItem.srf_item_no + 1 : 1;

            const newSrfItem = await SrfItem.create({
              srf_id: taskItem.task.srf_id,
              srf_item_no: nextNo,
              make: "", // Placeholder
              model: "",
              serial_no: "",
              identification_details: insType.instrument_full_name,
              remarks: "Added from Template during calibration",
              status: "received",
              rstatus: 1,
              created_timestamp: new Date(),
              created_by_login_name: user.name,
              created_by_user_id: user.id,
              updated_timestamp: new Date(),
              lab_id: user.labId,
              intrument_type_id: insType.instrument_type_id
            }, { transaction });

            await taskItem.update({ srf_item_id: newSrfItem.srf_item_id }, { transaction });
            effective_srf_item_id = newSrfItem.srf_item_id;
          }

          if (!effective_srf_item_id) throw new Error("Could not determine srf_item_id");

          const existing = await CalibrationData.findOne({
            where: { task_item_id, srf_item_id: effective_srf_item_id },
            transaction
          });

          let calibData;
          if (existing) {
            calibData = await existing.update({
              reading_value: reading_value || null,
              standard_instrument_used: standard_instrument_used || null,
              environmental_conditions: environmental_conditions || null,
              remarks: remarks || null,
              is_synced: true,
              updated_at: new Date()
            }, { transaction });
          } else {
            calibData = await CalibrationData.create({
              task_id: taskItem.task_id,
              task_item_id,
              srf_item_id: effective_srf_item_id,
              user_id,
              reading_value: reading_value || null,
              standard_instrument_used: standard_instrument_used || null,
              environmental_conditions: environmental_conditions || null,
              remarks: remarks || null,
              is_synced: true,
              client_created_at: client_timestamp ? new Date(client_timestamp) : null
            }, { transaction });
          }

          await TaskItem.update(
            { calibration_status: "completed" },
            { where: { id: task_item_id }, transaction }
          );

          synced.push({ client_id, server_id: calibData.id, type: "calibration_data" });
          successCount++;

        } else if (type === "status_update") {
          const { task_id, status, version } = payload;
          if (!task_id || !status) throw new Error("Missing task_id or status");

          const task = await Task.findByPk(task_id, { transaction });
          if (!task) throw new Error("Task not found");
          if (task.version !== version) throw new Error("Version mismatch");

          const validTransitions = {
            assigned: ["in_progress"], in_progress: ["completed"], completed: []
          };
          if (!(validTransitions[task.status] || []).includes(status)) {
            throw new Error(`Cannot transition from ${task.status} to ${status}`);
          }

          task.status = status;
          task.version = version + 1;
          task.sync_status = "pending";
          task.updated_at = new Date();
          await task.save({ transaction });

          synced.push({ client_id, task_id, type: "status_update" });
          successCount++;
        } else {
          throw new Error(`Unknown change type: ${type}`);
        }
      } catch (changeErr) {
        failed.push({ client_id: change.client_id, error: changeErr.message });
        failedCount++;
      }
    }

    const logStatus = failedCount === 0 ? "success" : failedCount === changes.length ? "failed" : "partial";
    await SyncLog.create({
      user_id, sync_type: "push",
      records_count: successCount,
      status: logStatus,
      error_message: failedCount > 0 ? `${failedCount} records failed` : null,
      client_timestamp: client_timestamp ? new Date(client_timestamp) : null,
      details: { total_changes: changes.length, successful: successCount, failed: failedCount }
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: "Sync push completed",
      data: {
        synced, failed,
        server_timestamp: new Date(),
        summary: { total: changes.length, successful: successCount, failed: failedCount }
      }
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
