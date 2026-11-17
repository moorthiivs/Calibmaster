const db = require('../models/index');
const MasterListEquipment = db.MasterListEquipment;
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

// Secret key for HMAC token generation (in production, use process.env.QR_SECRET)
const QR_SECRET = process.env.QR_SECRET || 'calibmaster_qr_secret_key_2026';

// Helper function to generate deterministic token
const generateToken = (lab_id, identification_details) => {
    // Generate an HMAC SHA256 hash using the secret, lab_id, and identification_details
    const hmac = crypto.createHmac('sha256', QR_SECRET);
    hmac.update(`${lab_id}::${identification_details}`);
    return hmac.digest('hex');
};

// Helper function to format dates to DD-MM-YYYY
const formatDate = (date) => {
    if (!date || date === 'N/A') return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

// Helper function to find the latest completed SRF item for an equipment
const getLatestCompletedSrfItem = async (lab_id, identification_details) => {
    // We want the most recent item that has a certificate generated
    // Certificates are linked to srfitems via Certificate model
    const latestItem = await db.srfitem.findOne({
        where: {
            lab_id: lab_id,
            identification_details: identification_details,
            status: 'Completed' // or whatever indicates a final state
        },
        include: [
            {
                model: db.Certificate,
                as: 'certificate', // assuming association exists, or we query separately
                where: { rstatus: 1 },
                required: true
            },
            {
                model: db.srf_list,
                as: 'srf',
                include: [{
                    model: db.customer,
                    as: 'customer'
                }]
            },
            {
                model: db.instrument_type,
                as: 'intrument_type'
            }
        ],
        order: [
            ['calibration_done_date', 'DESC'],
            ['srf_item_id', 'DESC']
        ]
    });

    // If the include fails due to association names, we can do it step by step
    return latestItem;
};

// More robust helper if associations are tricky
const getLatestCertificateByEquipment = async (lab_id, identification_details) => {
    // 1. Find all SRF items for this equipment in this lab
    const items = await db.srfitem.findAll({
        where: {
            lab_id: lab_id,
            identification_details: identification_details
        },
        order: [
            ['calibration_done_date', 'DESC'],
            ['srf_item_id', 'DESC']
        ],
        include: [
            {
                model: db.srf_list,
                as: 'srf',
                include: [{ model: db.customer, as: 'customer' }]
            },
            {
                model: db.instrument_type,
                as: 'intrument_type'
            }
        ]
    });

    if (!items || items.length === 0) return null;

    // 2. Iterate through them to find the first one with an active certificate
    for (let item of items) {
        const cert = await db.Certificate.findOne({
            where: {
                srfitemId: item.srf_item_id,
                rstatus: 1
            },
            order: [['createdAt', 'DESC']]
        });

        if (cert) {
            return {
                item: item,
                certificate: cert
            };
        }
    }

    return null; // No certificate found for any of the items
};

exports.generateToken = async (req, res) => {
    try {
        const { lab_id, identification_details } = req.body;

        if (!lab_id || !identification_details) {
            return res.status(400).json({ code: 400, message: "lab_id and identification_details are required" });
        }

        const token = generateToken(lab_id, identification_details);

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

        return res.status(200).json({
            code: 200,
            message: "Token generated successfully",
            token: token,
            qrUrl: `${baseUrl}/api/qr/certificate/${token}`
        });

    } catch (error) {
        console.error("Error generating QR token:", error);
        return res.status(500).json({ code: 500, message: "Internal server error" });
    }
};

exports.renderCertificatePage = async (req, res) => {
    try {
        const { token } = req.params;

        let targetLabId = null;
        let targetIdDetails = null;
        let isMaster = false;

        // 1. Check SRF Items
        let srfMatch = false;
        const equipments = await db.srfitem.findAll({
            attributes: ['lab_id', 'identification_details'],
            group: ['lab_id', 'identification_details']
        });

        for (let eq of equipments) {
            if (!eq.lab_id || !eq.identification_details) continue;
            const expectedToken = generateToken(eq.lab_id, eq.identification_details);
            if (expectedToken === token) {
                targetLabId = eq.lab_id;
                targetIdDetails = eq.identification_details;
                srfMatch = true;
                break;
            }
        }

        // 2. Check Master List
        let masterMatch = false;
        const masterEquipments = await MasterListEquipment.findAll({
            attributes: ['lab_id', 'uid'],
            group: ['lab_id', 'uid']
        });

        for (let meq of masterEquipments) {
            if (!meq.lab_id || !meq.uid) continue;
            const expectedToken = generateToken(meq.lab_id, meq.uid);
            if (expectedToken === token) {
                if (!targetLabId) {
                    targetLabId = meq.lab_id;
                    targetIdDetails = meq.uid;
                }
                masterMatch = true;
                break;
            }
        }

        if (!targetLabId || !targetIdDetails) {
            return res.status(404).send("Invalid or expired QR code.");
        }

        let srfData = null;
        let srfFileExists = false;
        if (srfMatch) {
            const result = await getLatestCertificateByEquipment(targetLabId, targetIdDetails);
            if (result && result.certificate && result.certificate.fileName) {
                let filename = result.certificate.fileName.trim();
                if (filename !== "null" && filename !== "undefined" && filename !== "") {
                    let fp = path.join(__dirname, '..', 'certificates', filename);
                    if (fs.existsSync(fp)) {
                        srfFileExists = true;
                    }
                }
                srfData = {
                    item: {
                        identification_details: result.item.identification_details,
                        make: result.item.make,
                        model: result.item.model,
                        serial_no: result.item.serial_no,
                        calibration_done_date: result.item.calibration_done_date,
                        calibration_due_date: result.item.calibration_due_date,
                        certificate_no: result.item.certificate_no,
                        instrument_full_name: result.item.intrument_type ? result.item.intrument_type.instrument_full_name : 'N/A',
                        customer_name: result.item.srf && result.item.srf.customer ? result.item.srf.customer.customer_name : 'N/A'
                    },
                    certificate: { fileName: result.certificate.fileName.trim() },
                    fileExists: srfFileExists,
                    isMaster: false
                };
            }
        }

        let masterData = null;
        let masterFileExists = false;
        if (masterMatch) {
            const masters = await MasterListEquipment.findAll({
                where: { lab_id: targetLabId, uid: targetIdDetails },
                order: [['master_list_equipment_id', 'DESC']]
            });

            if (masters && masters.length > 0) {
                let bestMaster = masters[0]; // fallback to the most recent if none have files
                let foundFile = false;

                for (let m of masters) {
                    if (m.mastercertificate_filename) {
                        let filename = m.mastercertificate_filename.trim();
                        if (filename !== "null" && filename !== "undefined" && filename !== "") {
                            let fp = path.join(__dirname, '..', 'master_certificates', filename);
                            if (fs.existsSync(fp)) {
                                bestMaster = m;
                                foundFile = true;
                                masterFileExists = true;
                                break;
                            }
                        }
                    }
                }

                masterData = {
                    item: {
                        identification_details: bestMaster.uid,
                        make: bestMaster.make,
                        model: bestMaster.model_type,
                        serial_no: bestMaster.serial_no,
                        calibration_done_date: bestMaster.date_of_last_calibration_date,
                        calibration_due_date: bestMaster.calibration_valid_upto,
                        certificate_no: bestMaster.calibration_certificate_no,
                        instrument_full_name: bestMaster.name_of_equipment,
                        equipment_status: bestMaster.equipment_status
                    },
                    certificate: { fileName: bestMaster.mastercertificate_filename ? bestMaster.mastercertificate_filename.trim() : '' },
                    fileExists: masterFileExists,
                    isMaster: true
                };
            }
        }

        // Decide which data to use. Prioritize the one with an existing file.
        // If both have files, pick the one with the newer calibration_done_date.
        let latestData = null;
        if (srfData && masterData) {
            if (srfData.fileExists && !masterData.fileExists) {
                latestData = srfData;
            } else if (!srfData.fileExists && masterData.fileExists) {
                latestData = masterData;
            } else {
                let srfDate = new Date(srfData.item.calibration_done_date).getTime();
                let masterDate = new Date(masterData.item.calibration_done_date).getTime();
                if (!isNaN(srfDate) && !isNaN(masterDate) && masterDate > srfDate) {
                    latestData = masterData;
                } else {
                    latestData = srfData;
                }
            }
        } else {
            latestData = srfData || masterData;
        }

        if (!latestData) {
            // Render a "Pending" or "No Certificate Found" page
            const pendingHtml = await ejs.renderFile(path.join(__dirname, '../views/qr-certificate.ejs'), {
                status: 'pending',
                equipmentNo: targetIdDetails
            });
            return res.status(200).send(pendingHtml);
        }

        // Render the live certificate view
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

        const html = await ejs.renderFile(path.join(__dirname, '../views/qr-certificate.ejs'), {
            status: 'active',
            fileExists: latestData.fileExists,
            token: token,
            equipmentNo: latestData.item.identification_details,
            make: latestData.item.make || 'N/A',
            model: latestData.item.model || 'N/A',
            serialNo: latestData.item.serial_no || 'N/A',
            instrumentName: latestData.item.instrument_full_name || 'N/A',
            customerName: latestData.item.customer_name || 'In-House Master',
            calibrationDate: formatDate(latestData.item.calibration_done_date),
            calibrationDueDate: formatDate(latestData.item.calibration_due_date),
            certificateNo: latestData.item.certificate_no || 'N/A',
            fileName: latestData.certificate.fileName,
            equipment_status: latestData.item.equipment_status,
            downloadUrl: `${baseUrl}/api/qr/download/${token}#toolbar=0&navpanes=0&scrollbar=0`
        });

        return res.status(200).send(html);

    } catch (error) {
        console.error("Error rendering QR page:", error);
        return res.status(500).send("An error occurred while processing the QR code.");
    }
};

exports.downloadCertificate = async (req, res) => {
    try {
        const { token } = req.params;

        let targetLabId = null;
        let targetIdDetails = null;

        // 1. Check SRF Items
        let srfMatch = false;
        const equipments = await db.srfitem.findAll({
            attributes: ['lab_id', 'identification_details'],
            group: ['lab_id', 'identification_details']
        });

        for (let eq of equipments) {
            if (!eq.lab_id || !eq.identification_details) continue;
            const expectedToken = generateToken(eq.lab_id, eq.identification_details);
            if (expectedToken === token) {
                targetLabId = eq.lab_id;
                targetIdDetails = eq.identification_details;
                srfMatch = true;
                break;
            }
        }

        // 2. Check Master List
        let masterMatch = false;
        const masterEquipments = await MasterListEquipment.findAll({
            attributes: ['lab_id', 'uid'],
            group: ['lab_id', 'uid']
        });

        for (let meq of masterEquipments) {
            if (!meq.lab_id || !meq.uid) continue;
            const expectedToken = generateToken(meq.lab_id, meq.uid);
            if (expectedToken === token) {
                if (!targetLabId) {
                    targetLabId = meq.lab_id;
                    targetIdDetails = meq.uid;
                }
                masterMatch = true;
                break;
            }
        }

        if (!targetLabId || !targetIdDetails) {
            return res.status(404).send("Invalid or expired QR code.");
        }

        let srfFileExists = false;
        let srfFilePath = '';
        let srfDate = null;
        if (srfMatch) {
            const result = await getLatestCertificateByEquipment(targetLabId, targetIdDetails);
            if (result && result.certificate && result.certificate.fileName) {
                let filename = result.certificate.fileName.trim();
                if (filename !== "null" && filename !== "undefined" && filename !== "") {
                    let fp = path.join(__dirname, '..', 'certificates', filename);
                    if (fs.existsSync(fp)) {
                        srfFileExists = true;
                        srfFilePath = fp;
                        srfDate = new Date(result.item.calibration_done_date).getTime();
                    }
                }
            }
        }

        let masterFileExists = false;
        let masterFilePath = '';
        let masterDate = null;
        if (masterMatch) {
            const masters = await MasterListEquipment.findAll({
                where: { lab_id: targetLabId, uid: targetIdDetails },
                order: [['master_list_equipment_id', 'DESC']]
            });
            if (masters && masters.length > 0) {
                for (let m of masters) {
                    if (m.mastercertificate_filename) {
                        let filename = m.mastercertificate_filename.trim();
                        if (filename !== "null" && filename !== "undefined" && filename !== "") {
                            let fp = path.join(__dirname, '..', 'master_certificates', filename);
                            if (fs.existsSync(fp)) {
                                masterFileExists = true;
                                masterFilePath = fp;
                                masterDate = new Date(m.date_of_last_calibration_date).getTime();
                                break;
                            }
                        }
                    }
                }
            }
        }

        let finalFilePath = '';
        if (srfFileExists && !masterFileExists) {
            finalFilePath = srfFilePath;
        } else if (!srfFileExists && masterFileExists) {
            finalFilePath = masterFilePath;
        } else if (srfFileExists && masterFileExists) {
            if (!isNaN(srfDate) && !isNaN(masterDate) && masterDate > srfDate) {
                finalFilePath = masterFilePath;
            } else {
                finalFilePath = srfFilePath;
            }
        }

        if (finalFilePath && fs.existsSync(finalFilePath)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="Certificate_${targetIdDetails}.pdf"`);
            const fileStream = fs.createReadStream(finalFilePath);
            fileStream.pipe(res);
        } else {
            res.status(404).send("Certificate file is missing from the server.");
        }

    } catch (error) {
        console.error("Error downloading certificate via QR:", error);
        return res.status(500).send("An error occurred while downloading the certificate.");
    }
};

exports.getUniqueEquipments = async (req, res) => {
    try {
        const {
            labId,
            page = 1,
            limit = 20,
            search = "",
            sortBy = "latest_srf_item_id",
            sortOrder = "DESC"
        } = req.body;

        if (!labId) {
            return res.status(400).json({ code: 400, message: "labId is required" });
        }

        let parsedPage = parseInt(page, 10);
        if (isNaN(parsedPage) || parsedPage < 1) parsedPage = 1;

        let parsedLimit = parseInt(limit, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) parsedLimit = 20;
        const allowedLimits = [10, 20, 50, 100];
        if (!allowedLimits.includes(parsedLimit)) {
            parsedLimit = parsedLimit > 100 ? 100 : (allowedLimits.find(l => l >= parsedLimit) || 20);
        }

        const offset = (parsedPage - 1) * parsedLimit;

        const whereClause = {
            lab_id: labId,
            identification_details: {
                [db.Sequelize.Op.ne]: null,
                [db.Sequelize.Op.ne]: ''
            },
            status: 'Report Generated',
            rstatus: 1
        };

        if (search && String(search).trim() !== "") {
            const searchPattern = `%${String(search).trim()}%`;
            whereClause[db.Sequelize.Op.and] = [
                {
                    [db.Sequelize.Op.or]: [
                        { identification_details: { [db.Sequelize.Op.iLike]: searchPattern } },
                        { make: { [db.Sequelize.Op.iLike]: searchPattern } },
                        { model: { [db.Sequelize.Op.iLike]: searchPattern } },
                        { serial_no: { [db.Sequelize.Op.iLike]: searchPattern } }
                    ]
                }
            ];
        }

        const { count, rows: equipments } = await db.srfitem.findAndCountAll({
            attributes: [
                'identification_details',
                [db.sequelize.fn('max', db.sequelize.col('make')), 'make'],
                [db.sequelize.fn('max', db.sequelize.col('model')), 'model'],
                [db.sequelize.fn('max', db.sequelize.col('serial_no')), 'serial_no'],
                [db.sequelize.fn('max', db.sequelize.col('srf_item_id')), 'latest_srf_item_id']
            ],
            where: whereClause,
            group: ['identification_details'],
            order: [[db.sequelize.fn('max', db.sequelize.col('srf_item_id')), (sortOrder && String(sortOrder).toUpperCase() === 'ASC') ? 'ASC' : 'DESC']],
            limit: parsedLimit,
            offset: offset,
            subQuery: false
        });

        const totalItems = Array.isArray(count) ? count.length : count;

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

        const equipmentsWithQr = equipments.map(eq => {
            const idDetails = eq.getDataValue('identification_details');
            const token = generateToken(labId, idDetails);
            return {
                identification_details: idDetails,
                make: eq.getDataValue('make'),
                model: eq.getDataValue('model'),
                serial_no: eq.getDataValue('serial_no'),
                latest_srf_item_id: eq.getDataValue('latest_srf_item_id'),
                token: token,
                qrUrl: `${baseUrl}/api/qr/certificate/${token}`
            };
        });

        return res.status(200).json({
            code: 200,
            message: "Equipments fetched successfully",
            data: equipmentsWithQr,
            pagination: {
                totalItems: totalItems,
                totalPages: Math.ceil(totalItems / parsedLimit),
                currentPage: parsedPage,
                limit: parsedLimit
            }
        });

    } catch (error) {
        console.error("Error fetching unique equipments:", error);
        return res.status(500).json({ code: 500, message: "Internal server error" });
    }
};
