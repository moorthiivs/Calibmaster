const models = require("../models");
const { errorHandler } = require("../helpers/error-handler");
const { Op } = require("sequelize");

const Task = models.Task;
const TaskItem = models.TaskItem;
const User = models.User;
const SRF = models.srf_list;
const SrfItem = models.srfitem;
const CalibrationData = models.CalibrationData;
const sequelize = models.sequelize;

// ─── Shared include for task detail ────────────────────────────────────────
const taskDetailInclude = [
  { model: User, as: "engineer", attributes: ["id", "name", "email", "department"] },
  { model: SRF, as: "srf", attributes: ["srf_id", "srf_number", "srf_date", "srf_type"] },
  {
    model: TaskItem,
    as: "items",
    include: [
      {
        model: SrfItem,
        as: "srfItem",
        attributes: ["srf_item_id", "make", "model", "serial_no",
          "identification_details", "status", "srf_item_no", "intrument_type_id"]
      },
      {
        model: models.instrument_type,
        as: "instrumentType",
        attributes: ["instrument_type_id", "instrument_full_name"]
      }
    ]
  }
];

// ─── CREATE TASK ─────────────────────────────────────────────────────────────
exports.createTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { user_id, task_name, description, srf_id, due_date, priority, items } = req.body;
    console.log(req.body, "req.body G");

    if (!user_id || !task_name || !srf_id || !Array.isArray(items) || items.length === 0) {
      let missing = [];
      if (!user_id) missing.push("user_id (Assign To User)");
      if (!task_name) missing.push("task_name");
      if (!srf_id) missing.push("srf_id");
      if (!Array.isArray(items) || items.length === 0) missing.push("items array");

      const error = new Error(`Missing required fields: ${missing.join(", ")}`);
      error.code = 400; error.path = "/api/tasks/create"; throw error;
    }

    const user = await User.findByPk(user_id, { transaction });
    if (!user) { const error = new Error("User not found"); error.code = 404; throw error; }

    // Validate srf_item_ids (if any) belong to given srf_id
    const srfItemIds = items.filter(i => i.srf_item_id).map(i => i.srf_item_id);
    if (srfItemIds.length > 0) {
      const validItems = await SrfItem.findAll({
        where: { srf_item_id: { [Op.in]: srfItemIds }, srf_id },
        transaction
      });
      if (validItems.length !== srfItemIds.length) {
        const error = new Error("One or more srf_item_id values do not belong to the given srf_id");
        error.code = 400; throw error;
      }
    }

    const task = await Task.create({
      user_id, task_name, srf_id,
      description: description || null,
      due_date: due_date || null,
      priority: priority || "medium",
      created_by: req.userId,
      status: "assigned", sync_status: "pending", version: 1
    }, { transaction });

    for (const item of items) {
      await TaskItem.create({
        task_id: task.task_id,
        srf_item_id: item.srf_item_id || null,
        instrument_type_id: item.instrument_type_id || null,
        srf_id,
        calibration_required: item.calibration_required !== false,
        notes: item.notes || null,
        lab_type: item.lab_type || null,
        category: item.category || null
      }, { transaction });
    }

    await transaction.commit();
    const created = await Task.findByPk(task.task_id, { include: taskDetailInclude });
    return res.status(201).json({ status: 201, message: "Task created successfully", data: created });
  } catch (err) {
    await transaction.rollback();
    const error = new Error(err.message || "Error creating task");
    error.code = err.code || 500; error.path = "/api/tasks/create";
    return errorHandler(error, req, res, next);
  }
};

// ─── GET ALL TASKS ───────────────────────────────────────────────────────────
exports.getAllTasks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const requester = await User.findByPk(req.userId);
    const whereClause = {};
    
    // Case-insensitive Admin check
    const isAdmin = requester?.department?.toUpperCase() === "ADMIN";
    
    if (!isAdmin) {
      // Non-admins see tasks assigned to them OR tasks they created
      whereClause[Op.or] = [
        { user_id: req.userId },
        { created_by: req.userId }
      ];
    }

    if (req.query.status) whereClause.status = req.query.status;
    if (req.query.search) whereClause.task_name = { [Op.iLike]: `%${req.query.search}%` };

    const { count, rows } = await Task.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: "engineer", attributes: ["id", "name", "email", "department"] },
        { model: SRF, as: "srf", attributes: ["srf_id", "srf_number", "srf_date"] }
      ],
      order: [["created_at", "DESC"]],
      limit, offset
    });

    const tasksWithCounts = await Promise.all(rows.map(async (task) => {
      const item_count = await TaskItem.count({ where: { task_id: task.task_id } });
      return { ...task.toJSON(), item_count };
    }));

    return res.status(200).json({
      status: 200, message: "Tasks fetched successfully",
      data: tasksWithCounts,
      pagination: { total: count, pages: Math.ceil(count / limit), currentPage: page, limit }
    });
  } catch (err) {
    const error = new Error(err.message || "Error fetching tasks");
    error.code = 500; error.path = "/api/tasks/get-all";
    return errorHandler(error, req, res, next);
  }
};

// ─── GET TASKS BY USER ───────────────────────────────────────────────────────
exports.getTasksByUser = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const whereClause = { user_id };
    if (req.query.status) whereClause.status = req.query.status;

    const { count, rows } = await Task.findAndCountAll({
      where: whereClause,
      include: taskDetailInclude,
      order: [["created_at", "DESC"]],
      limit, offset: (page - 1) * limit
    });

    return res.status(200).json({
      status: 200, message: "User tasks fetched", data: rows,
      pagination: { total: count, pages: Math.ceil(count / limit), currentPage: page, limit }
    });
  } catch (err) {
    const error = new Error(err.message || "Error fetching user tasks");
    error.code = 500; error.path = "/api/tasks/user/:user_id";
    return errorHandler(error, req, res, next);
  }
};

// ─── GET TASK BY ID ──────────────────────────────────────────────────────────
exports.getTaskById = async (req, res, next) => {
  try {
    const { task_id } = req.params;
    const task = await Task.findByPk(task_id, {
      include: [
        ...taskDetailInclude,
        {
          model: CalibrationData,
          as: "calibration_data",
          attributes: ["id", "srf_item_id", "reading_value", "calibration_date", "is_synced", "remarks"]
        }
      ]
    });
    if (!task) {
      const error = new Error("Task not found"); error.code = 404; throw error;
    }
    return res.status(200).json({ status: 200, message: "Task fetched successfully", data: task });
  } catch (err) {
    const error = new Error(err.message || "Error fetching task");
    error.code = err.code || 500; error.path = "/api/tasks/:task_id";
    return errorHandler(error, req, res, next);
  }
};

// ─── UPDATE TASK STATUS ──────────────────────────────────────────────────────
exports.updateTaskStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { task_id } = req.params;
    const { status, version } = req.body;

    if (!status || version === undefined) {
      const error = new Error("Missing: status and version"); error.code = 400; throw error;
    }
    const validTransitions = { assigned: ["in_progress"], in_progress: ["completed"], completed: [] };
    const task = await Task.findByPk(task_id, { transaction });
    if (!task) { const error = new Error("Task not found"); error.code = 404; throw error; }
    if (task.version !== version) {
      const error = new Error("Version mismatch — task has been modified"); error.code = 409; throw error;
    }
    if (!(validTransitions[task.status] || []).includes(status)) {
      const error = new Error(`Cannot transition from ${task.status} to ${status}`); error.code = 400; throw error;
    }

    task.status = status; task.version = version + 1;
    task.sync_status = "pending"; task.updated_at = new Date();
    await task.save({ transaction });
    await transaction.commit();

    const updatedTask = await Task.findByPk(task_id, {
      include: [
        ...taskDetailInclude,
        {
          model: CalibrationData,
          as: "calibration_data",
          attributes: ["id", "srf_item_id", "reading_value", "calibration_date", "is_synced", "remarks"]
        }
      ]
    });
    return res.status(200).json({ status: 200, message: "Task status updated", data: updatedTask });
  } catch (err) {
    await transaction.rollback();
    const error = new Error(err.message || "Error updating task status");
    error.code = err.code || 500; error.path = "/api/tasks/:task_id/status";
    return errorHandler(error, req, res, next);
  }
};

// ─── ASSIGN TASK ─────────────────────────────────────────────────────────────
exports.assignTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { task_id } = req.params;
    const { user_id } = req.body;
    if (!user_id) { const error = new Error("Missing: user_id"); error.code = 400; throw error; }

    const [task, user] = await Promise.all([
      Task.findByPk(task_id, { transaction }),
      User.findByPk(user_id, { transaction })
    ]);
    if (!task) { const error = new Error("Task not found"); error.code = 404; throw error; }
    if (!user) { const error = new Error("User not found"); error.code = 404; throw error; }

    task.user_id = user_id; task.sync_status = "pending"; task.updated_at = new Date();
    await task.save({ transaction });
    await transaction.commit();

    const updated = await Task.findByPk(task_id, { include: taskDetailInclude });
    return res.status(200).json({ status: 200, message: "Task assigned successfully", data: updated });
  } catch (err) {
    await transaction.rollback();
    const error = new Error(err.message || "Error assigning task");
    error.code = err.code || 500; error.path = "/api/tasks/:task_id/assign";
    return errorHandler(error, req, res, next);
  }
};

// ─── DELETE TASK ─────────────────────────────────────────────────────────────
exports.deleteTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const requester = await models.User.findByPk(req.userId, { transaction });
    if (requester?.department?.toUpperCase() !== "ADMIN") {
      const error = new Error("Forbidden: Only ADMIN users can delete tasks");
      error.code = 403; throw error;
    }
    const { task_id } = req.params;
    const task = await Task.findByPk(task_id, { transaction });
    if (!task) { const error = new Error("Task not found"); error.code = 404; throw error; }

    const calibCount = await CalibrationData.count({ where: { task_id }, transaction });
    if (calibCount > 0) {
      const error = new Error("Cannot delete task with existing calibration data"); error.code = 400; throw error;
    }
    await TaskItem.destroy({ where: { task_id }, transaction });
    await task.destroy({ transaction });
    await transaction.commit();
    return res.status(200).json({ status: 200, message: "Task deleted successfully" });
  } catch (err) {
    await transaction.rollback();
    const error = new Error(err.message || "Error deleting task");
    error.code = err.code || 500; error.path = "/api/tasks/:task_id";
    return errorHandler(error, req, res, next);
  }
};

// ─── GET USERS FOR TASK ASSIGNMENT ──────────────────────────────────────────
exports.getUsersForAssignment = async (req, res, next) => {
  try {
    const { lab_id } = req.query;
    const whereClause = { rstatus: 1, department: { [Op.ne]: "admin" } };
    if (lab_id) whereClause.labId = lab_id;

    const users = await User.findAll({
      where: whereClause,
      attributes: ["id", "name", "email", "department"],
      order: [["name", "ASC"]]
    });
    return res.status(200).json({ status: 200, message: "Users fetched", data: users });
  } catch (err) {
    const error = new Error(err.message || "Error fetching users");
    error.code = 500; error.path = "/api/tasks/users";
    return errorHandler(error, req, res, next);
  }
};

// ─── GET SRF LIST FOR PICKER ─────────────────────────────────────────────────
exports.getSrfPicker = async (req, res, next) => {
  try {
    const { lab_id } = req.query;
    const whereClause = { rstatus: 1 };
    if (lab_id) whereClause.lab_id = lab_id;

    const srfs = await SRF.findAll({
      where: whereClause,
      attributes: ["srf_id", "srf_number", "srf_date", "srf_type", "lab_id"],
      order: [["srf_date", "DESC"]],
      limit: 200
    });
    return res.status(200).json({ status: 200, message: "SRFs fetched", data: srfs });
  } catch (err) {
    const error = new Error(err.message || "Error fetching SRFs");
    error.code = 500; error.path = "/api/tasks/srf-picker";
    return errorHandler(error, req, res, next);
  }
};

// ─── GET SRF ITEMS FOR A SPECIFIC SRF ───────────────────────────────────────
exports.getSrfItems = async (req, res, next) => {
  try {
    const { srf_id } = req.params;
    const items = await SrfItem.findAll({
      where: { srf_id, rstatus: 1 },
      attributes: [
        "srf_item_id", "srf_item_no", "make", "model", "serial_no",
        "identification_details", "status", "remarks", "intrument_type_id", "calibrationAt"
      ],
      include: [{
        model: models.instrument_type,
        as: "intrument_type",
        attributes: ["id", "instrument_type_name"]
      }],
      order: [["srf_item_no", "ASC"]]
    });
    return res.status(200).json({ status: 200, message: "SRF items fetched", data: items });
  } catch (err) {
    const error = new Error(err.message || "Error fetching SRF items");
    error.code = 500; error.path = "/api/tasks/srf/:srf_id/items";
    return errorHandler(error, req, res, next);
  }
};
