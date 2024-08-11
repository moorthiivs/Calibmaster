const express = require("express");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const employeeMasterController = require("../controllers/employee-master-controller");

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/employee_signature'));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const upload = multer({ storage: storage });

router.post("/create", upload.single('employee_signature'), employeeMasterController.create);

router.post("/list", employeeMasterController.list);

router.post("/disable-emplyee", employeeMasterController.disableEmplyee);

router.post("/fetch-emplyee", employeeMasterController.fetchEmployee);

router.post("/update-emplyee", upload.single('employee_signature'), employeeMasterController.updateEmployee);

router.post("/fetch-employee-by-lab", employeeMasterController.fetchEmployeeByLab);

module.exports = router;
