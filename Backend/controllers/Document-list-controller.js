const { MasterListDoc, MasterListDocDetail, MasterListDocFormat } = require('../models');
const { errorHandler } = require('../helpers/error-handler');

// Create a new MasterListDoc
exports.createMasterListDoc = async (req, res, next) => {
    try {
        const {
            labId,
            createdBy,
            docName,
            revisionNo,
            startDate,
            endDate,
        } = req.body;

        if (!docName || !revisionNo || !startDate || !endDate || !labId || !createdBy) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const normalizedDocName = docName.trim().toLowerCase();
        const normalizedRevision = revisionNo.trim().toLowerCase();

        const existing = await MasterListDoc.findOne({
            where: {
                mslDocName: normalizedDocName,
                mslDocRevisionNo: normalizedRevision,
                labId,
            },
        });

        if (existing) {
            return res.status(400).json({
                message: 'A document with this name and revision already exists in your lab.',
            });
        }

        // Create new document
        const newDoc = await MasterListDoc.create({
            mslDocName: normalizedDocName,
            mslDocRevisionNo: normalizedRevision,
            mslRevDateStart: startDate,
            mslRevDateEnd: endDate,
            labId,
            createdBy,
        });

        return res.status(201).json({
            message: 'Master List Document created successfully',
            data: newDoc,
        });
    } catch (err) {
        console.error('Error in createMasterListDoc:', err);

        const error = new Error('Something went wrong while creating the document');
        error.code = 500;
        error.path = '/api/master-list-docs/create';
        return errorHandler(error, req, res, next);
    }
};


exports.fecthAllMasterListDoc = async (req, res, next) => {
    try {
        const labId = req.query.labid;

        if (!labId) {
            return res.status(400).json({ message: 'labid is required' });
        }

        const allDocs = await MasterListDoc.findAll({
            order: [['mslId', 'ASC']],
            where: { labId }
        });

        res.status(200).json(allDocs);
    } catch (error) {
        console.error('Error fetching master list docs:', error);
        res.status(500).json({ message: 'Failed to fetch master list docs' });
    }
};

// Update an existing MasterListDoc
exports.updateMasterListDoc = async (req, res) => {
    try {
        const { mslId } = req.params;
        const {
            mslDocName,
            mslDocRevisionNo,
            mslRevDateStart,
            mslRevDateEnd,
            labId,
            updatedBy,
        } = req.body;

        const doc = await MasterListDoc.findByPk(mslId);
        if (!doc) return res.status(404).json({ message: 'Master List Doc not found' });

        await doc.update({
            mslDocName,
            mslDocRevisionNo,
            mslRevDateStart,
            mslRevDateEnd,
            labId,
            updatedBy,
        });

        res.status(200).json({ message: 'Master List Doc updated successfully', data: doc });
    } catch (err) {
        errorHandler(res, err);
    }
};

// Get MasterListDoc by ID
exports.getMasterListDocById = async (req, res) => {
    try {
        const { mslId } = req.params;

        const doc = await MasterListDoc.findByPk(mslId);

        if (!doc) return res.status(404).json({ message: 'Master List Doc not found' });

        res.status(200).json(doc);
    } catch (err) {
        errorHandler(res, err);
    }
};
