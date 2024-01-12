const ajvInstance = require("../utils/ajv-instance");

const schema = {
  type: "object",
  properties: {
    srf_item_no: {
      type: "string",
    },
    make: {
      type: ["string", "null"]
    },
    model: {
      type: ["string", "null"]
    },
    serial_no: {
      type: "string",
    },
    identification_details: {
      type: ["string", "null"]
    },
    remarks: {
      type: "string",
    },
    url_number: {
      type: ["string", "null"]
    },
    intrument_type_id: {
      type: "string"
    }
  },
  required: [
    "srf_item_no",
    "serial_no",
    "remarks",
    "intrument_type_id"
  ],
  additionalProperties: true,
};

module.exports = ajvInstance.compile(schema);
