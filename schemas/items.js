const ajvInstance = require("../utils/ajv-instance");

const innerschema = {
  type: "object",
  properties: {
    description: {
      type: "string",
    },
    make: {
      type: "string",
    },
    model: {
      type: "string",
    },
    serial_no: {
      type: "string",
    },
    remarks: {
      type: "string",
    },
    url_number: {
      type: ["string", "null"]
    },
    intrument_type_id: {
      type: "number",
    },
  },
  required: [
    "description",
    "serial_no",
    "remarks",
    "intrument_type_id"
  ],
  additionalProperties: true,
};

const schema = {
  type: "array",
  items: innerschema,
};

module.exports = ajvInstance.compile(schema);
