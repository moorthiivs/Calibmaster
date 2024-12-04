const { srfitem, srf_list, Certificate, instrument_type, master_result_table } = require("../models");
const { errorHandler } = require("../helpers/error-handler");
const { getBase64Image } = require("../helpers/image-decoded-handler");
const { standard_details } = require("./Generate-Certificate-Controller");

const fetchInstrumentData = async (req, res, next) => {
  try {
    const { lab_id } = req.body;

    if (!lab_id) {
      return res.status(400).json({ error: "Lab ID is required" })
    }

    // Fetch srf_lists and srfitems based on labId
    let srfItems = await srfitem.findAll({
      where: { lab_id, rstatus: 1 },
      attributes: [
        "srf_id", "srf_item_id", "make", "model", "serial_no", "identification_details",
      ],
      include: [
        {
          model: srf_list,
          as: "srf",
          attributes: [
            "srf_number", "customer_id"
          ]
        },
        {
          model: instrument_type,
          as: "intrument_type",
          attributes: [
            "instrument_full_name"
          ]
        }
      ]
    });

    const items = [];

    for (const each_item of srfItems) {

      let certificates = await Certificate.findOne({
        where: { srfitemId: each_item.srf_item_id },
        order: [['createdAt', 'DESC']],
      });

      if (certificates) {
        const { srf_id, srf_item_id } = each_item;

        let masterResult = await master_result_table.findOne({
          where: { lab_id, srf_id, srf_item_id },
          attributes: ["master_list_equipments"]
        });

        const { m_certificate_filename } = await standard_details(masterResult?.master_list_equipments);
        const customer_obj = {
          filename: certificates?.fileName,

          srfId: srf_id,
          srfNo: String(each_item.srf.srf_number),
          srf_item_id: Number(srf_item_id),

          name: each_item.intrument_type.instrument_full_name,
          make: each_item.make,
          model: each_item.model,
          serialno: each_item.serial_no,

          idno: each_item.identification_details,
          rstatus: 1,

          companyId: each_item.srf.customer_id,
          master_certificate_filename: m_certificate_filename || null
        };

        if (m_certificate_filename) {
          try {
            customer_obj.master_certificates_base64 = await getBase64Image(`master_certificates/${m_certificate_filename}`);
          }
          catch (err) {
            console.error("Error reading master_certificate_filename file:", err);
          }
        }
        if (certificates?.fileName) {
          try {
            customer_obj.certificates_base64 = await getBase64Image(`certificates/${certificates?.fileName}`);
          }
          catch (err) {
            console.error("Error reading certificate_filename file:", err);
          }
        }
        items.push(customer_obj);
      }

    }
    res.status(200).json({ srfitems: items })
  } catch (err) {
    console.error("Error while fetching Certificate:", err);
    let action = "Failed to fetch Certificate";
    const error = new Error(action);
    error.code = 500;
    error.path = "api/certificate/fetchCertificateById";
    return errorHandler(error, req, res, next);
  }
}

module.exports = { fetchInstrumentData }
