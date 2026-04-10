const express = require("express");
const router = express.Router();
const Authorization = require("../middleware/check-auth");
const taskController = require("../controllers/task-controller");
const taskItemController = require("../controllers/task-item-controller");

// ─── Helper / picker endpoints (must be before :task_id param routes) ────────
router.get("/users",             Authorization, taskController.getUsersForAssignment);
router.get("/srf-picker",        Authorization, taskController.getSrfPicker);
router.get("/srf/:srf_id/items", Authorization, taskController.getSrfItems);

// ─── Task CRUD ────────────────────────────────────────────────────────────────
router.post("/create",            Authorization, taskController.createTask);
router.get("/all",                Authorization, taskController.getAllTasks);
router.get("/user/:user_id",      Authorization, taskController.getTasksByUser);
router.get("/:task_id",           Authorization, taskController.getTaskById);
router.patch("/:task_id/status",  Authorization, taskController.updateTaskStatus);
router.patch("/:task_id/assign",  Authorization, taskController.assignTask);
router.delete("/:task_id",        Authorization, taskController.deleteTask);

// ─── Task Items ───────────────────────────────────────────────────────────────
router.post("/:task_id/items/add",     Authorization, taskItemController.addItemsToTask);
router.patch("/items/:item_id/status", Authorization, taskItemController.updateItemStatus);
router.post("/items/:item_id/web-calibrate", Authorization, taskItemController.webCalibrateItem);

module.exports = router;
