const ajvInstance = require("../utils/ajv-instance");

const schema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: 3,
    },
    email: {
      type: "string",
      format: "email",
    },
    department: {
      type: "string",
    },
  },
  required: ["name", "email", "department"],
  additionalProperties: true,
};

module.exports = ajvInstance.compile(schema);
