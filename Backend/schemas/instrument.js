const ajvInstance = require("../utils/ajv-instance");

const schema = {
    type: "object",
    properties: {
        instrument_name: {
            type: "string",
        },
        instrument_uom_id: {
            type: "number",
        }
    },
    required: [
        "instrument_name",
        "instrument_uom_id"
    ],
    additionalProperties: false,
};

module.exports = ajvInstance.compile(schema);
