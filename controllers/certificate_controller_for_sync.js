const { srfitem, srf_list, Certificate, instrument_type } = require("../models")

const fetchInstrumentData = async (req, res, next) => {
  try {
    const { lab_id } = req.body

    if (!lab_id) {
      return res.status(400).json({ error: "Lab ID is required" })
    }

    // Fetch srf_lists and srfitems based on labId
    const srfListData = await srf_list.findOne({
      where: { lab_id: lab_id },
    })

    if (!srfListData) {
      return res.status(404).json({ error: "SRF list data not found" })
    }

    const srfItemsData = await srfitem.findAll({
      where: { lab_id: lab_id },
    })

    if (!srfItemsData || srfItemsData.length === 0) {
      return res.status(404).json({ error: "SRF items data not found" })
    }

    // Fetch Certificates based on srf_item_id
    const certificatesData = await Certificate.findOne({
      where: { srfitemId: srfItemsData[0].srf_item_id },
    })

    if (!certificatesData) {
      return res.status(404).json({ error: "Certificates data not found" })
    }

    // Fetch instrument_full_name from Instrument_types
    const instrumentTypeData = await instrument_type.findOne({
      where: { instrument_type_id: srfItemsData[0].intrument_type_id },
    })

    if (!instrument_type) {
      throw new Error("Instrument type model is not defined")
    }

    if (!instrumentTypeData) {
      return res.status(404).json({ error: "Instrument type data not found" })
    }

    // Construct the response object
    const response = {
      filename: certificatesData.fileName,
      srfId: srfItemsData[0].srf_id,
      srfNo: `${srfListData.srf_number}`,
      name: instrumentTypeData.instrument_full_name,
      make: srfItemsData[0].make,
      model: srfItemsData[0].model,
      serialno: srfItemsData[0].serial_no,
      idno: srfItemsData[0].srf_item_no,
      rstatus: srfItemsData[0].rstatus,
      companyId: srfListData.customer_id,
    }

    // Send the response
    res.status(200).json(response)
  } catch (error) {
    next(error)
  }
}

module.exports = { fetchInstrumentData }
