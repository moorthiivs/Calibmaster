const express = require("express");
const multer = require("multer");
const controller = require("../controllers/instrument-variant-type-controller");


const router = express.Router();

router.post('/create',controller.Create)
router.get('/fetch',controller.Fetch)
router.put('/update/:id',controller.Update)
router.delete('/delete/:id',controller.Delete)


module.exports = router