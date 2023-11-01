const ajvInstance = require("../utils/ajv-instance");

const innerschema = {
  type: "object",
  properties: {
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
  },
  required: [
    "serial_no",
    "remarks",
  ],
  additionalProperties: true,
};

const schema = {
  type: "array",
  items: innerschema,
};

module.exports = ajvInstance.compile(schema);
