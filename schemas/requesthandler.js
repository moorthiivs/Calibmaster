const ajvInstance = require("../utils/ajv-instance");

const schema = {
  type: "object",
  properties: {
    componentName: {
      type: "string",
    },
    resType: {
      type: "string",
      enum: ["PARAMS", "RESULT"],
    },
  },
  required: ["componentName", "resType"],
  additionalProperties: true,
};

module.exports = ajvInstance.compile(schema);
