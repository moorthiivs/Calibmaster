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
    serialno: {
      type: "string",
    },
    remarks: {
      type: "string",
    },
    url_number: {
      type: ["string", "null"]
    },
    masterlistId: {
      type: "number",
    },
  },
  required: [
    "description",
    "serialno",
    "remarks",
    "masterlistId"
  ],
  additionalProperties: true,
};

const schema = {
  type: "array",
  items: innerschema,
};

module.exports = ajvInstance.compile(schema);
