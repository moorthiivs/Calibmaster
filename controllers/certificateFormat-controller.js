const { CertificateFormat } = require("../models");

const createFormat = async (req, res, next) => {
  try {
    const { labId, formatTemplate, requiredFields, preview } = req.body;

    if (!labId || !formatTemplate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [record, created] = await CertificateFormat.upsert(
      {
        lab_id: labId,
        format_template: formatTemplate,
        required_fields: requiredFields || [],
        preview,
      },
      {
        returning: true,
        where: { lab_id: labId },
      }
    );

    res.status(200).json({
      message: created ? "Created successfully" : "Updated successfully",
      data: record,
    });
  } catch (error) {
    console.error("Error saving certificate format:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const fetchoneFormat = async (req, res, next) => {
  try {
    const format = await CertificateFormat.findOne({
      where: { lab_id: req.params.labId },
    });

    if (!format) {
      return res.status(404).json({ message: "Format not found" });
    }

    res.json(format);
  } catch (error) {
    res.status(500).json({ message: "Error fetching format" });
  }
};

exports.createFormat = createFormat;
exports.fetchoneFormat = fetchoneFormat;
