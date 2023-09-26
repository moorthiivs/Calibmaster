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
    range_min: {
      type: "number",
    },
    range_max: {
      type: "number",
    },
    range_unit: {
      type: "string",
    },
    serialno: {
      type: "string",
    },
    idno: {
      type: "string",
    },
    remarks: {
      type: "string",
    },
    ulrno: {
      type: "string",
    },
  },
  required: [
    "description",
    "make",
    "model",
    "range_min",
    "range_max",
    "range_unit",
    "serialno",
    "idno",
    "remarks",
    "ulrno",
  ],
  additionalProperties: true,
};

const schema = {
  type: "array",
  items: innerschema,
};

module.exports = ajvInstance.compile(schema);
