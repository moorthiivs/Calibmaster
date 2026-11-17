const ajvInstance = require("../utils/ajv-instance");

const schema = {
    type: "object",
    properties: {
        customer_name: {
            type: "string",
        },
        customer_code: {
            type: "string",
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

        gst_number: {
            type: "string",
        },
        contract_days: {
            type: "number"
        }
    },
    required: [
        "customer_name",
        "address1",
        "city", "state", "country", "pincode",
        "gst_number"
    ]
};

module.exports = ajvInstance.compile(schema);