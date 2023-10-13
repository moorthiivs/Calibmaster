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
        }
    },
    required: [
        "customer_name", "customer_code",
        "address1", "address2", "address3",
        "city", "state", "country", "pincode"
    ]
};

module.exports = ajvInstance.compile(schema);