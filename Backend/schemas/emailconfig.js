const ajvInstance = require("../utils/ajv-instance");

const schema = {
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email",
    },
    password: {
      type: "string",
    },
    host: {
      type: "string",
    },
    port: {
      type: "number",
    },
  },
  required: ["email", "password", "host", "port"],
  additionalProperties: true,
};

module.exports = ajvInstance.compile(schema);
