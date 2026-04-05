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


const formatNoConfig = async (req, res, next) => {
  try {
    const { labId, certificateFormatNo, observationFormatNo } = req.body;

    if (!labId || !certificateFormatNo || !observationFormatNo) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const formatNoData = {
      certificate_format_no: certificateFormatNo,
      observation_format_no: observationFormatNo,
    };

    // Check if record already exists
    const existingRecord = await CertificateFormat.findOne({
      where: { lab_id: labId },
    });

    let result;

    if (existingRecord) {
      // ✅ Update only if record exists
      await existingRecord.update({ format_no: formatNoData });
      result = existingRecord;
    } else {
      // ✅ Insert new with default values
      result = await CertificateFormat.create({
        lab_id: labId,
        format_template: "{}", // provide empty JSON or default value
        required_fields: [],
        preview: "",
        format_no: formatNoData,
      });
    }

    res.status(200).json({
      message: existingRecord
        ? "Format number configuration updated successfully."
        : "Format number configuration created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error in formatNoConfig:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


exports.createFormat = createFormat;
exports.fetchoneFormat = fetchoneFormat;
exports.formatNoConfig = formatNoConfig;
