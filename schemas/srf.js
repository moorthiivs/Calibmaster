const ajvInstance = require("../utils/ajv-instance");

const schema = {
  type: "object",
  properties: {

    srf_type: {
      type: "string",
    },
    srf_date: {
      type: "string",
    },
    srf_number: {
      type: "number",
    },

    contact_name: {
      type: "string",
    },
    contact_number: {
      type: "string",
    },
    contact_email: {
      type: "string",
    },

    department: {
      type: ["string", "null"],
    },

    customer_dc: {
      type: ["string", "null"],
    },
    customer_dc_date: {
      type: "string",
    },

    send_srf_via_email: {
      type: ["string", "null"],
    },

    agreed_completion_date: {
      type: ["string", "null"],
    },
    statement_of_confirmity_flag: {
      type: "string",
    },
    statement_of_confirmity: {
      type: ["string", "null"],
    },

    uncertainity_consider_flag: {
      type: "string",
    },


    issue_no: {
      type: ["string", "null"],
    },
    issue_date: {
      type: ["string", "null"],
    },

    amend_no: {
      type: ["string", "null"],
    },
    amend_date: {
      type: ["string", "null"],
    },

    customer_id: {
      type: "number",
    },

  },
  required: [
    "srf_type",
    "srf_date",
    "srf_number",

    "contact_name",
    "contact_number",
    "contact_email",

    "customer_dc_date",


    "statement_of_confirmity_flag",

    "uncertainity_consider_flag",

    "customer_id",
  ],
  additionalProperties: false,
};

module.exports = ajvInstance.compile(schema);
