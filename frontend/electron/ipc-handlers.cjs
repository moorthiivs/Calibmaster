const { ipcMain } = require('electron');
const db = require('./db.cjs');

function registerIpcHandlers() {
    console.log("--- Initializing Electron Database Handlers ---");
    db.initDB();
    
    ipcMain.handle('db:save-task', async (event, task) => {
        return await db.saveTask(task);
    });

    ipcMain.handle('db:get-task', async (event, taskId) => {
        return await db.getTask(taskId);
    });

    ipcMain.handle('db:get-all-local-tasks', async (event) => {
        return await db.getAllLocalTasks();
    });

    ipcMain.handle('db:save-measurement', async (event, { taskId, taskItemId, payload }) => {
        return await db.saveMeasurement(taskId, taskItemId, payload);
    });

    ipcMain.handle('db:get-pending-measurements', async (event, taskId) => {
        return await db.getPendingMeasurements(taskId);
    });

    ipcMain.handle('db:mark-synced', async (event, ids) => {
        return await db.markAsSynced(ids);
    });

    ipcMain.handle('db:delete-task', async (event, taskId) => {
      return await db.deleteTask(taskId);
    });
}

module.exports = { registerIpcHandlers };
