const ajvInstance = require("../utils/ajv-instance");

const schema = {
    type: "object",
    properties: {
        contact_title: {
            type: "string",
        },
        contact_fullname: {
            type: "string",
        },

        contact_email: {
            type: "string",
        },

        contact_phone_1: {
            type: "string",
        },
        contact_phone_2: {
            type: "string",
        }
    },
    required: [
        "contact_title", "contact_fullname",
        "contact_email",
        "contact_phone_1", 
        //"contact_phone_2"
    ]
};

module.exports = ajvInstance.compile(schema);