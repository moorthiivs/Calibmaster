const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

let db = null;

function initDB() {
    if (db) return db;

    const dbPath = path.join(app.getPath('userData'), 'calibmaster_local.sqlite');
    db = new sqlite3.Database(dbPath);

    // Initialize Schema
    db.serialize(() => {
        // Stores downloaded task details (metadata + instruments)
        db.run(`CREATE TABLE IF NOT EXISTS offline_tasks (
            task_id INTEGER PRIMARY KEY,
            task_name TEXT,
            data TEXT,
            downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Stores calibration results captured while offline
        db.run(`CREATE TABLE IF NOT EXISTS offline_measurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            task_item_id INTEGER,
            payload TEXT,
            captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            sync_status TEXT DEFAULT 'pending' -- 'pending', 'synced'
        )`);

        // Stores master data lists (Makes, Models, UOMs, Categories)
        db.run(`CREATE TABLE IF NOT EXISTS offline_master_data (
            category TEXT PRIMARY KEY,
            data TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    });

    return db;
}

module.exports = {
    initDB,
    saveTask: (task) => {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare("INSERT OR REPLACE INTO offline_tasks (task_id, task_name, data) VALUES (?, ?, ?)");
            stmt.run(task.task_id, task.task_name, JSON.stringify(task), function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    getAllTask: () => {
        return new Promise((resolve, reject) => {
            try {
                db.all("SELECT * FROM offline_tasks", [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(r => JSON.parse(r.data)));
                });
            } catch (error) {
                console.log(error, "error");
                reject(error);
            }
        });
    },

    getTask: (taskId) => {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM offline_tasks WHERE task_id = ?", [taskId], (err, row) => {
                if (err) reject(err);
                else resolve(row ? JSON.parse(row.data) : null);
            });
        });
    },

    getAllLocalTasks: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT t.task_id, t.task_name, t.downloaded_at, t.data,
                       COUNT(m.id) as local_count
                FROM offline_tasks t
                LEFT JOIN offline_measurements m ON t.task_id = m.task_id AND m.sync_status = 'pending'
                GROUP BY t.task_id
            `;
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    saveMeasurement: (taskId, taskItemId, payload) => {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare("INSERT INTO offline_measurements (task_id, task_item_id, payload) VALUES (?, ?, ?)");
            stmt.run(taskId, taskItemId, JSON.stringify(payload), function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    getPendingMeasurements: (taskId) => {
        return new Promise((resolve, reject) => {
            const query = taskId
                ? "SELECT * FROM offline_measurements WHERE task_id = ? AND sync_status = 'pending'"
                : "SELECT * FROM offline_measurements WHERE sync_status = 'pending'";
            const params = taskId ? [taskId] : [];

            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => ({ ...r, payload: JSON.parse(r.payload) })));
            });
        });
    },

    markAsSynced: (ids) => {
        return new Promise((resolve, reject) => {
            if (!ids.length) return resolve();
            const placeholders = ids.map(() => '?').join(',');
            db.run(`DELETE FROM offline_measurements WHERE id IN (${placeholders})`, ids, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    deleteTask: (taskId) => {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM offline_tasks WHERE task_id = ?", [taskId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    saveMasterData: (category, data) => {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare("INSERT OR REPLACE INTO offline_master_data (category, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
            stmt.run(category, JSON.stringify(data), function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    getMasterData: (category) => {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM offline_master_data WHERE category = ?", [category], (err, row) => {
                if (err) reject(err);
                else resolve(row ? JSON.parse(row.data) : null);
            });
        });
    }
};
