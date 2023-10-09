const ajvInstance = require("../utils/ajv-instance");

const schema = {
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email",
    },
    password: {
      type: "string"
    },
  },
  required: ["email", "password"],
  additionalProperties: false,
};

module.exports = ajvInstance.compile(schema);
