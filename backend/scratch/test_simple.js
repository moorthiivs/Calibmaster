const path = require('path');
const models = require(path.join(__dirname, '../models'));
const Task = models.Task;

async function testDetail() {
    try {
        const taskId = 2;
        const task = await Task.findByPk(taskId);
        if (task) {
            console.log('SUCCESS: Task found');
        } else {
            console.log('FAILURE: Task NOT found');
        }
    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        process.exit();
    }
}

testDetail();
