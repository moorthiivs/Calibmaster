const ajvInstance = require("../utils/ajv-instance");

const schema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: 3,
    },
  },
  required: ["name"],
  additionalProperties: true,
};

module.exports = ajvInstance.compile(schema);
