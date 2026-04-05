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
    password: {
      type: "string",
      minLength: 8,
      maxLength: 15,
    },
    department: {
      type: "string",
    },
    labId: {
      type: "number",
    },
  },
  required: ["name", "email", "password", "department"],
  additionalProperties: true,
};

module.exports = ajvInstance.compile(schema);
