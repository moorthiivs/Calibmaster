const path = require('path');
const models = require(path.join(__dirname, '../models'));
const Task = models.Task;
const TaskItem = models.TaskItem;
const User = models.User;
const SRF = models.srf_list;
const SrfItem = models.srfitem;
const CalibrationData = models.CalibrationData;

async function testDetail() {
    try {
        const taskId = 2; // From our previous check
        const taskDetailInclude = [
            { model: User, as: "assignedUser", attributes: ["id", "name", "email", "department"] },
            { model: SRF, as: "srf", attributes: ["srf_id", "srf_number", "srf_date", "srf_type"] },
            {
                model: TaskItem,
                as: "items",
                include: [
                    {
                        model: SrfItem,
                        as: "srfItem",
                        attributes: ["srf_item_id", "make", "model", "serial_no",
                            "identification_details", "status", "srf_item_no", "instrument_type_id"] 
                    },
                    {
                        model: models.instrument_type,
                        as: "instrumentType",
                        attributes: ["instrument_type_id", "instrument_full_name"]
                    }
                ]
            }
        ];

        const task = await Task.findByPk(taskId, {
            include: [
                ...taskDetailInclude,
                {
                    model: CalibrationData,
                    as: "calibration_data",
                    attributes: ["id", "srf_item_id", "reading_value", "calibration_date", "is_synced", "remarks"]
                }
            ]
        });
        console.log('Task found:', task ? 'Yes' : 'No');
        if (task) {
            console.log('Task Data:', JSON.stringify(task.toJSON(), null, 2));
        }
    } catch (error) {
        console.error('Error fetching task details:', error);
    } finally {
        process.exit();
    }
}

testDetail();
