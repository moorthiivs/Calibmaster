const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    platform: process.platform,
    versions: process.versions,
    db: {
        saveTask: (task) => ipcRenderer.invoke('db:save-task', task),
        getTask: (taskId) => ipcRenderer.invoke('db:get-task', taskId),
        getAllLocalTasks: () => ipcRenderer.invoke('db:get-all-local-tasks'),
        saveMeasurement: (data) => ipcRenderer.invoke('db:save-measurement', data),
        getPendingMeasurements: (taskId) => ipcRenderer.invoke('db:get-pending-measurements', taskId),
        markAsSynced: (ids) => ipcRenderer.invoke('db:mark-synced', ids),
        deleteTask: (taskId) => ipcRenderer.invoke('db:delete-task', taskId)
    }
});
