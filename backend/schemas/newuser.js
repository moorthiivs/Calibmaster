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
    roleId: {
      type: "number",
    },
    title: {
      type: "string",
    },
    companyId: {
      type: "string",
    }
  },
  required: ["name", "email", "password", "department", "labId"],
  additionalProperties: true,
};

module.exports = ajvInstance.compile(schema);
