const { Op, where } = require("sequelize");
const InstrumentCode = require("../models").InstrumentCode;

// Configuration flag for serial numbers
const CONTINUE_SERIAL_ACROSS_SRFS = true; // Set to true to continue serial numbers globally for the same day across all SRFs



function normalizeName(name) {
    if (!name) return '';
    return name
        .toString()
        .toLowerCase()
        .replace(/[’'‘`"]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

async function getInstrumentCode(name, providedMap = null) {
    if (!name || typeof name !== 'string') return 'UNK';

    const cleaned = normalizeName(name);
    
    let normalizedMap = providedMap;
    if (!normalizedMap) {
        const instrumentCodeRaw = await InstrumentCode.findAll({
            attributes: ["instrument_name", "code"],
        });

        normalizedMap = {};
        instrumentCodeRaw.forEach(item => {
            normalizedMap[normalizeName(item.instrument_name)] = item.code;
        });
    }

    // Check mapped code first
    const mappedCode = normalizedMap[cleaned];
    if (mappedCode) return mappedCode;

    // Fallback: generate dynamic code
    // Split on spaces, / or - and take first letters
    const words = name
        .trim()
        .replace(/[^\w\s]/g, '') // remove special chars
        .split(/\s+/);

    if (words.length === 0) return 'UNK';

    // If only one word, take first 2 letters
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();

    // Multiple words: take first letter of each
    const code = words.map(w => w[0].toUpperCase()).join('');

    // Return first 3 letters max
    return code.slice(0, 3);
}



async function getNextSerial(model, inwardDate, labId = null, srfId = null) {
    if (!CONTINUE_SERIAL_ACROSS_SRFS && !srfId) {
        return 0;
    }

    const dateObj = new Date(inwardDate);
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yy = String(dateObj.getFullYear()).slice(-2);

    const datePrefix = `${dd}${mm}${yy}`;

    // ✅ Get last inward_no starting with this datePrefix
    const whereClause = {};
    if (labId !== null) whereClause.lab_id = labId;
    if (!CONTINUE_SERIAL_ACROSS_SRFS && srfId) {
        whereClause.srf_id = srfId;
    }
    whereClause.inward_no = { [Op.like]: `%${datePrefix}%` };
    whereClause.rstatus = 1;

    const lastEntry = await model.findOne({
        where: whereClause,
        order: [["srf_item_id", "DESC"]],
        attributes: ["inward_no"],
    });

    if (!lastEntry || !lastEntry.inward_no) return 0;

    // ✅ Extract serial from end of inward_no by matching digits after the date prefix
    const regex = new RegExp(`${datePrefix}(\\d+)$`);
    const match = lastEntry.inward_no.match(regex);
    return match ? parseInt(match[1], 10) : 0;
}

async function generateSingleInwardNumber({ inwardDate, itemName, model, labId, srfId = null }) {
    const dateObj = new Date(inwardDate);
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yy = String(dateObj.getFullYear()).slice(-2);

    const code = await getInstrumentCode(itemName);

    let lastSerial = await getNextSerial(model, inwardDate, labId, srfId);
    const newSerial = (lastSerial + 1).toString().padStart(2, "0");

    return `IW${code}${dd}${mm}${yy}${newSerial}`;
}

async function generateInwardNumber({ inwardDate, items, model, labId, srfId = null }) {
    let currentSerial = await getNextSerial(model, inwardDate, labId, srfId);

    const dateObj = new Date(inwardDate);
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yy = String(dateObj.getFullYear()).slice(-2);
    const prefix = "IW";

    // ✅ Pre-fetch all instrument codes once for this batch to ensure freshness and efficiency
    const instrumentCodeRaw = await InstrumentCode.findAll({
        attributes: ["instrument_name", "code"],
    });
    const normalizedMap = {};
    instrumentCodeRaw.forEach(item => {
        normalizedMap[normalizeName(item.instrument_name)] = item.code;
    });

    return Promise.all(items.map(async (item) => {
        currentSerial += 1;
        const serialStr = String(currentSerial).padStart(2, "0");
        const code = await getInstrumentCode(item.name, normalizedMap);
        return `${prefix}${code}${dd}${mm}${yy}${serialStr}`;
    }));
}

module.exports = { generateInwardNumber, generateSingleInwardNumber };




