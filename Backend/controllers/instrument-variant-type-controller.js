const InstrumentVariantsType = require('../models').InstrumentVariantsType;

const Create = async (req, res, next) => {
    try {
        const { instrument_variant_type: type, labid, createdBy } = req.body;

        console.log(type, labid);


        if (!type || !labid || !createdBy) {
            return res.status(400).json({
                message: "InstrumentVariantsType and labid are required."
            });
        }

        const existing = await InstrumentVariantsType.findOne({
            where: {
                instrumentVariantsType: type,
                labid,
                createdBy
            }
        });

        if (existing) {
            return res.status(409).json({
                message: "This instrument variant type is already present for the lab."
            });
        }

        const created = await InstrumentVariantsType.create({
            instrumentVariantsType: type,
            labid,
            createdBy
        });

        return res.status(201).json({
            message: "Instrument Variant Type created successfully.",
            data: created,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const Fetch = async (req, res, next) => {
    try {
        const { labid } = req.query;

        const whereClause = labid ? { labid } : {};

        const allTypes = await InstrumentVariantsType.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json({
            message: "Fetched instrument variant types.",
            data: allTypes,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// const Update = async (req, res, next) => {
//     try {
//         const { id } = req.params;
//         const { instrumentVariantType: type, updatedBy, labid } = req.body;



//         const variant = await InstrumentVariantsType.findByPk(id);

//         if (!variant) {
//             return res.status(404).json({ message: "Variant type not found." });
//         }

//         const existing = await InstrumentVariantsType.findOne({
//             where: {
//                 instrumentVariantsType: type,
//                 labid,
//                 createdBy: id
//             }
//         });

//         if (existing) {
//             return res.status(409).json({
//                 message: "This instrument variant type is already present for the lab."
//             });
//         }

//         variant.instrumentVariantsType = type || variant.instrumentVariantsType;

//         await variant.save();

//         return res.status(200).json({
//             message: "Instrument Variant Type updated successfully.",
//             data: variant,
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Internal server error." });
//     }
// };


const Update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { instrumentVariantType: type, updatedBy, labid } = req.body;

        const variant = await InstrumentVariantsType.findByPk(id);

        if (!variant) {
            return res.status(404).json({ message: "Variant type not found." });
        }

        // Check for duplicate only if type or labid is being changed
        const isTypeChanging = type && type !== variant.instrumentVariantsType;
        const isLabChanging = labid && labid !== variant.labid;

        if (isTypeChanging || isLabChanging) {
            const existing = await InstrumentVariantsType.findOne({
                where: {
                    instrumentVariantsType: type,
                    labid
                }
            });

            if (existing) {
                return res.status(409).json({
                    message: "This instrument variant type is already present for the lab."
                });
            }
        }

        // Update fields
        if (type) variant.instrumentVariantsType = type;
        if (updatedBy) variant.updatedBy = updatedBy;
        if (labid) variant.labid = labid;

        await variant.save();

        return res.status(200).json({
            message: "Instrument Variant Type updated successfully.",
            data: variant,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error." });
    }
};


const Delete = async (req, res, next) => {
    try {
        const { id } = req.params;

        const deleted = await InstrumentVariantsType.destroy({ where: { id } });

        if (!deleted) {
            return res.status(404).json({ message: "Variant type not found." });
        }

        return res.status(200).json({ message: "Instrument Variant Type deleted successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = {
    Create,
    Fetch,
    Update,
    Delete
};
