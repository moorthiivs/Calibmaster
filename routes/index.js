const express = require("express");
const path = require("path");

const router = express.Router();

const usersRoutes = require("./users-routes");
const heartbeatRoute = require("./heartbeat-route");
const companyRoutes = require("./company-routes");
const srfConfigRoutes = require("./srf-config-routes");
const srfRoutes = require("./srf-routes");
const labRoutes = require("./lab-routes");
const srfdownloadRoute = require("./srfdownload-routes");
const masterlistRoutes = require("./masterlist-routes");
const certificateRoutes = require("./certificate-routes");
const certificateSyncRoutes = require("./certificate-sync-routes");
const uomRoutes = require("./uom-routes");

const instrumentDisciplineRoutes = require("./instrument-discipline-routes")
const instrumentGroupsRoutes = require("./instrument-groups-routes");
const instrument = require("./instrument-routes");
const instrumentTypes = require("./instrument-types-routes")
const customersRoutes = require("./customer-routes");
const calibrationDateRoutes = require("./calibation-routes");

const mailRoutes = require("./mail-routes");
const excelRoutes = require("./excel-routes");

// const challanRoute = require("./challan-route");
const deliveryChallanRoute = require("./delivery-challan-routes");

const srfSearchRoutes = require("./srf-search-routes");
const srfStatushRoutes = require("./srf-status-routes");

const masterListEquipmentsRoutes = require("./master-list-equipments-routes");

// const calibrationCertificateRoutes = require("./calibration-certificate");
const calibrationsCertificateRoutes = require("./calibrations-certificate");

const cmsRoutes = require('./cms-routes');
const cmsPermissionsRoutes = require('./cms-permissions-route');

const designProceduresRoutes = require('./design-procedures-routes');
const employeeMasterRoutes = require('./employee-master-routes');
const resultTableRoutes = require('./result-table-routes');

const generateCertificateRoutes = require('./generate-certificate-routes');

const bulkUpdateRoutes = require("./bulk-update-routes");

const ulrNoGenerationRoutes = require('./ulr-no-generation');

const uncertaintyMasterParametersRoutes = require("./uncertainty-master-parameters-routes");

const testRoutes = require("./test-route");

const DueDateRoutes = require('./calibration-due-date-routes');

const QuotationRoutes = require("./quotation-routes");

const BankConfigRoutes = require("./bank-config-routes");

const Authorization = require("../middleware/check-auth");


const CalibMasterExcel = require('./calibmaster-excel-routes')

const InstrumentVariantsType = require('./instrument-variant-type-routes')

const MasterListDoc = require('./masterListDoc.routes')
const MasterListDocDetail = require('./masterListDocDetailRoutes')
const MasterListDocFormat = require('./masterListDocFormatRoutes')

const certificateFormat = require('./certificate-format-routes')

const InwardReport = require('./inward-report')

const Dashboard = require('./dashboard-routes')

const MakeModel = require('./makeModel.routes')

const DataStorage = require('./Data-storage-routes')

//Routes of the APP
router.use("/api/heartbeat", heartbeatRoute);
router.use("/api/users", usersRoutes);
router.use("/api/lab", Authorization, labRoutes);
router.use("/api/uom", uomRoutes);

router.use("/api/instrument-discipline", instrumentDisciplineRoutes);
router.use("/api/instrument-groups", instrumentGroupsRoutes);
router.use("/api/instrument", instrument);
router.use("/api/instrument-types", instrumentTypes);

router.use("/api/company", Authorization, companyRoutes);
router.use("/api/customers", Authorization, customersRoutes);

router.use("/api/srf-config", Authorization, srfConfigRoutes);
router.use("/api/srf", Authorization, srfRoutes);

router.use("/api/calibration-date", Authorization, calibrationDateRoutes);

router.use("/api/certificate", Authorization, certificateRoutes);

router.use("/api/certificate_sync", certificateSyncRoutes);

router.use("/api/mail", Authorization, mailRoutes);

router.use("/api/excel", Authorization, excelRoutes);

// router.use("/api/pdf", Authorization, challanRoute);
router.use("/api/delivery-challan", Authorization, deliveryChallanRoute); // *** Modified API for Delivery-Challan

router.use("/api/srf-search", Authorization, srfSearchRoutes);

router.use("/api/srf-status", Authorization, srfStatushRoutes);

router.use("/api/master-list-equipments", Authorization, masterListEquipmentsRoutes);

// router.use("/api/calibration-certificate", Authorization, calibrationCertificateRoutes); // ! Currently Muted
router.use("/api/calibrations-certificate", calibrationsCertificateRoutes); // *** Modified API for Calibration Certificates

router.use("/api/cms-setting", cmsRoutes);
router.use("/api/cms-permissions-setting", cmsPermissionsRoutes);

// router.use("/api/download", Authorization, srfdownloadRoute);
// router.use("/api/masterlist", Authorization, masterlistRoutes);

// Routes for Design Procedures
router.use("/api/design-procedures", designProceduresRoutes);
// Routes for Employee Master
router.use("/api/employee-master", employeeMasterRoutes);
// Routes for Result Tables
router.use("/api/result-tables", resultTableRoutes);

// Routes for Dynamic Certificate
router.use("/api/generate-certificate", generateCertificateRoutes);

// New Bulk Update
router.use("/api/bulk-update", Authorization, bulkUpdateRoutes);

// URL Numbers Generation
router.use("/api/ulr-no-generation", ulrNoGenerationRoutes);

// Uncertainty Master ParametersRoutes Routes
router.use("/api/uncertainty-master-parameters", Authorization, uncertaintyMasterParametersRoutes);

// Test Routes
router.use("/api/test", testRoutes);

// Routes for Calibration Due Date
router.use("/api/due-date", Authorization, DueDateRoutes);

// Bank Details
router.use("/api/bank-config-routes", Authorization, BankConfigRoutes);

// Quotation part
router.use("/api/quotation", Authorization, QuotationRoutes);

// Calibmaster Excel
///router.use('/api/calibmasterexcel/', Authorization, CalibMasterExcel)
router.use('/api/calibmasterexcel/', CalibMasterExcel)

router.use('/api/instrumentvariantstype/', InstrumentVariantsType)


router.use('/api/master-list-docs/', Authorization, MasterListDoc)

router.use('/api/master-list-docs-details/', Authorization, MasterListDocDetail)

router.use('/api/master-list-docs-format/', Authorization, MasterListDocFormat)


router.use('/api/certificate-format/', Authorization, certificateFormat)

router.use('/api/inward-report/', Authorization, InwardReport)

router.use('/api/dashboard/', Authorization, Dashboard)

router.use('/api/makemodel/', Authorization, MakeModel)

router.use('/api/data-storage/', Authorization, DataStorage)


router.get("/*", (req, res) => {
    const frontendPath = path.join(__dirname + "../../public/index.html");
    res.sendFile(frontendPath);
});

module.exports = router;