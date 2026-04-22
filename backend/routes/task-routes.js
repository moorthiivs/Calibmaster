const express = require("express");
const router = express.Router();
const Authorization = require("../middleware/check-auth");
const taskController = require("../controllers/task-controller");
const taskItemController = require("../controllers/task-item-controller");
const checkPermission = require("../middleware/check-permission");


// ─── Helper / picker endpoints (must be before :task_id param routes) ────────
router.get("/users", Authorization,checkPermission("ACCESS_TASKS"), taskController.getUsersForAssignment);
router.get("/srf-picker", Authorization,checkPermission("ACCESS_TASKS"), taskController.getSrfPicker);
router.get("/srf/:srf_id/items", Authorization,checkPermission("ACCESS_TASKS"), taskController.getSrfItems);

// ─── Task CRUD ────────────────────────────────────────────────────────────────
router.post("/create", Authorization,checkPermission("ACCESS_TASKS"), taskController.createTask);
router.get("/all", Authorization,checkPermission("ACCESS_TASKS"), taskController.getAllTasks);
router.get("/user/:user_id", Authorization,checkPermission("ACCESS_TASKS"), taskController.getTasksByUser);
router.get("/:task_id", Authorization,checkPermission("ACCESS_TASKS"), taskController.getTaskById);
router.patch("/:task_id/status", Authorization,checkPermission("ACCESS_TASKS"), taskController.updateTaskStatus);
router.patch("/:task_id/assign", Authorization,checkPermission("ACCESS_TASKS"), taskController.assignTask);
router.delete("/:task_id", Authorization, taskController.deleteTask);

// ─── Task Items ───────────────────────────────────────────────────────────────
router.post("/:task_id/items/add", Authorization,checkPermission("ACCESS_TASKS"), taskItemController.addItemsToTask);
router.patch("/items/:item_id/status", Authorization,checkPermission("ACCESS_TASKS"), taskItemController.updateItemStatus);
router.post("/items/:item_id/web-calibrate", Authorization,checkPermission("ACCESS_TASKS"), taskItemController.webCalibrateItem);

module.exports = router;
