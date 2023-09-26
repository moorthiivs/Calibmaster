const ajvInstance = require("../utils/ajv-instance");

const schema = {
  type: "object",
  properties: {
    companyname: {
      type: "string",
      minLength: 5,
    },
    email: {
      type: "string",
      format: "email",
    },
    address1: {
      type: "string",
    },
    address2: {
      type: "string",
    },
    address3: {
      type: "string",
    },
    labId: {
      type: "number",
    },
  },
  required: ["companyname", "email", "address1", "address2", "address3"],
  additionalProperties: false,
};

module.exports = ajvInstance.compile(schema);
