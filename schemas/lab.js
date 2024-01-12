const ajvInstance = require("../utils/ajv-instance");

const schema = {
  type: "object",
  properties: {
    lab_name: {
      type: "string",
      minLength: 3,
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
    city: {
      type: "string",
    },
    state: {
      type: "string",
    },
    country: {
      type: "string",
    },
    pincode: {
      type: "string",
    },
    lab_website: {
      type: "string",
    },
    contact_email: {
      type: "string",
    },
    contact_number1: {
      type: "string",
    },
    contact_number2: {
      type: "string",
    },
    symbol: {
      type: "string",
    },
    rstatus: {
      type: "integer",
    },

    email_smtp_server_host: {
      type: "string",
    },
    email_smtp_server_port: {
      type: "integer",
    },
    sender_email: {
      type: "string",
    },
    sender_password: {
      type: "string",
    },

    gst_number: {
      type: "string",
    },
    lab_active_flag: {
      type: "integer",
    },

    brand_logo_filename: {
      type: "string",
    },
    brand_logo_mime_type: {
      type: "string",
    },
    brand_logo: {
      type: "string",
    },

    other_logo1_image_filename: {
      type: "string",
    },
    other_logo1_image_mime_type: {
      type: "string",
    },
    other_logo1_image: {
      type: "string",
    },

    other_logo2_image_filename: {
      type: "string",
    },
    other_logo2_image_mime_type: {
      type: "string",
    },
    other_logo2_image: {
      type: "string",
    },

    created_timestamp: {
      type: "string",
    },
    created_by_login_name: {
      type: "string",
    },
    created_by_user_id: {
      type: "integer",
    },

    updated_timestamp: {
      type: "string",
    },
    updated_by_login_name: {
      type: "string",
    },
    updated_by_user_id: {
      type: "string",
    },

    effective_start_date: {
      type: "string",
    },
    effective_end_date: {
      type: "string",
    },
    createdAt: {
      type: "string",
    },
    updatedAt: {
      type: "string",
    }
  },
  required: [
    "lab_name",

    "address1",

    "city",
    "state",
    "country",
    "pincode",

    "lab_website",
    "contact_email",
    "contact_number1",
    "contact_number2",

    "gst_number",

    "brand_logo_filename",
    "brand_logo_mime_type",
    "brand_logo"
  ],
  additionalProperties: false,
};

module.exports = ajvInstance.compile(schema);
