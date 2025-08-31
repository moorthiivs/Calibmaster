const { errorHandler } = require('../helpers/error-handler');
const { MasterListDocDetail } = require('../models');

exports.createDocDetail = async (req, res, next) => {
    try {

        const existing = await MasterListDocDetail.findOne({
            where: req.body
        });

        if (existing) {
            return res.status(400).json({
                message: 'A document format with the same Format Name and Section Name already exists.'
            });
        }
        const detail = await MasterListDocDetail.create(req.body);
        res.status(201).json(detail);
    } catch (err) {
        console.error('Create Error:', err);
        res.status(500).json({ message: 'Failed to create document detail', err });
        const error = new Error("Something went wrong");
        error.code = 500;
        error.path = "/api/master-list-docs-details/create";
        return errorHandler(error, req, res, next);
    }
};

exports.getAllDocDetails = async (req, res, next) => {
    try {
        const labId = req.query.labid;
        if (!labId) {
            return res.status(400).json({ message: 'labid is required' });
        }
        const details = await MasterListDocDetail.findAll({ order: [['createdAt', 'DESC']], where: { labId } });
        res.status(200).json(details);
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ message: 'Failed to fetch document details', error });
    }
};


exports.getMasterListDocDetailsById = async (req, res, next) => {
    try {
        const { detailId } = req.params;

        const doc = await MasterListDocDetail.findByPk(detailId);

        if (!doc) return res.status(404).json({ message: 'Master List Doc Details not found' });

        res.status(200).json(doc);
    } catch (err) {
        console.error('Fetch Error:', err);
        res.status(500).json({ message: 'Failed to Fetch document detail', err });
        const error = new Error("Something went wrong");
        error.code = 500;
        error.path = "/api/master-list-docs-details";
        return errorHandler(error, req, res, next);
    }
};

exports.updateMasterDocDetails = async (req, res, next) => {
    try {
        const { detailId } = req.params;
        const {
            labId,
            updatedBy,
            groupName,
            docNumber,
            docTitle,
            revisionNo,
            issueRevDate,
            effectiveStartDate,
            effectiveEndDate,
            retentionPeriod,
            possession,
            mslId
        } = req.body;

        const existingDetail = await MasterListDocDetail.findOne({
            where: { detailId }
        });

        if (!existingDetail) {
            return res.status(404).json({ message: 'Document detail not found.' });
        }

        await existingDetail.update({
            labId,
            updatedBy,
            groupName,
            docNumber,
            docTitle,
            revisionNo,
            issueRevDate,
            effectiveStartDate,
            effectiveEndDate,
            retentionPeriod,
            possession,
            mslId
        });

        res.status(200).json({ message: 'Document detail updated successfully.', data: existingDetail });
    } catch (err) {
        console.error('Error updating document detail:', err);
        res.status(500).json({ message: 'Failed to update document detail.', error: err.message });
    }
};
