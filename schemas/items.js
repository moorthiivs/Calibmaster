const ajvInstance = require("../utils/ajv-instance");

const innerschema = {
  type: "object",
  properties: {
    make: {
      type: ["string", "null"]
    },
    model: {
      type: ["string", "null"]
    },
    serialno: {
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
    "serialno",
    "remarks",
  ],
  additionalProperties: true,
};

const schema = {
  type: "array",
  items: innerschema,
};

module.exports = ajvInstance.compile(schema);
