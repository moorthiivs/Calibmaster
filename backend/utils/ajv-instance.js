const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const ajvInstance = new Ajv({ 
  allErrors: true, 
  coerceTypes: true,
  useDefaults: true,
  removeAdditional: false
});
addFormats(ajvInstance);

module.exports = ajvInstance;
