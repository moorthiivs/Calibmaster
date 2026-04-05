const { errorHandler } = require('../helpers/error-handler');
const { MasterListDocFormat } = require('../models');

exports.createDocFormat = async (req, res, next) => {
    try {
        const { mslId, detailId, revNo, sectionNo, labId } = req.body;

        const existing = await MasterListDocFormat.findOne({
            where: { mslId, detailId, revNo, sectionNo, labId }
        });

        if (existing) {
            return res.status(400).json({
                message: 'A document format with the same Format Name and Section Name already exists.'
            });
        }
        const detail = await MasterListDocFormat.create(req.body);
        res.status(201).json(detail);
    } catch (err) {
        console.error('Create Error:', err);
        const error = new Error("Something went wrong");
        error.code = 500;
        error.path = "/api/master-list-docs-format/create";
        return errorHandler(err, req, res, next);
    }
};


exports.getAllDocFormat = async (req, res, next) => {
    try {
        const labId = req.query.labid;
        if (!labId) {
            return res.status(400).json({ message: 'labid is required' });
        }
        const details = await MasterListDocFormat.findAll({ order: [['createdAt', 'DESC']], where: { labId } });
        res.status(200).json(details);
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ message: 'Failed to fetch document details', error });
    }
};


exports.getDocumentFormatById = async (req, res, next) => {
    try {

        const { formatId } = req.params;

        const doc = await MasterListDocFormat.findByPk(formatId);

        if (!doc) return res.status(404).json({ message: 'Master List Doc Format not found' });

        res.status(200).json(doc);

    } catch (err) {
        console.error('Fetch Error:', err);
        res.status(500).json({ message: 'Failed to Fetch document Format', err });
        const error = new Error("Something went wrong");
        error.code = 500;
        error.path = "/api/master-list-docs-format";
        return errorHandler(error, req, res, next);

    }
}


exports.updateMasterDocFormat = async (req, res, next) => {
    try {
        const { formatId } = req.params;
        const {
            labId,
            updatedBy,
            formatName,
            sectionNo,
            revNo,
            revStartDate,
            revEndDate,
            mslId,
            detailId
        } = req.body;

        const existingFormat = await MasterListDocFormat.findOne({ where: { formatId } });

        if (!existingFormat) {
            return res.status(404).json({ message: 'Document format not found.' });
        }

        await existingFormat.update({
            labId,
            updatedBy,
            formatName,
            sectionNo,
            revNo,
            revStartDate,
            revEndDate,
            mslId,
            detailId
        });

        res.status(200).json({ message: 'Document format updated successfully.', data: existingFormat });
    } catch (err) {
        console.error('Error updating document format:', err);
        res.status(500).json({ message: 'Failed to update document format.', error: err.message });
    }
};
