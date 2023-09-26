const ajvInstance = require("../utils/ajv-instance");

const schema = {
  type: "object",
  properties: {
    srfno: {
      type: "number",
    },
    date: {
      type: "string",
    },
    type: {
      type: "string",
    },
    CompanyId: {
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
      type: "string",
    },
    reportcompanyId: {
      type: "number",
    },
    customer_dc: {
      type: "string",
    },
    customer_dc_date: {
      type: "string",
    },
    agreed_date: {
      type: "string",
    },
    next_cal_due_require_flag: {
      type: "boolean",
    },
    frequency: {
      type: "string",
    },
    statement_of_confirmity_flag: {
      type: "boolean",
    },
    statement_of_confirmity: {
      type: "string",
    },
    uncertainity_consider_flag: {
      type: "boolean",
    },
    sendsrf: {
      type: "boolean",
    },
    issue_no: {
      type: "string",
    },
    issue_date: {
      type: "string",
    },
    amend_no: {
      type: "string",
    },
    amend_date: {
      type: "string",
    },
  },
  required: [
    "srfno",
    "type",
    "date",
    "CompanyId",
    "contact_name",
    "contact_number",
    "contact_email",
    "department",
    "reportcompanyId",
    "customer_dc",
    "customer_dc_date",
    "agreed_date",
    "next_cal_due_require_flag",
    "frequency",
    "statement_of_confirmity_flag",
    "statement_of_confirmity",
    "uncertainity_consider_flag",
    "sendsrf",
    "issue_no",
    "issue_date",
    "amend_no",
    "amend_date",
  ],
  additionalProperties: false,
};

module.exports = ajvInstance.compile(schema);
