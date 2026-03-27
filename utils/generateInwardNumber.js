const { Op } = require("sequelize");

const instrumentCodeMap = {
    "Plain Plug Gauge": "PP",
    "PLAIN PLUG GAUGE Inches": "PP",
    "Progressive Plug Gauge": "PP",
    "Digital Vernier Caliper": "VC",
    "Vernier Caliper": "VC",
    "Depth Caliper ": "VC",
    "Micrometer": "MM",
    "External Micrometer": "MM",
    "Height Gauge": "HG",
    "Digital Height Gauge": "HG",
    "Snap Gauge": "SG",
    "Snap Gauge Inches": "SG",
    "Slot Width Gauge": "SWG",
    "Key Way Gauge": "KWG",
    "Taper Plug Gauge": "TPG",
    "Thread Plug Gauge": "TPG",
    "Taper Ring Gauge": "TRG",
    "Thread Ring Gauge": "TRG",
    "Plain Ring Gauge": "PRG",
    "CD Master": "BTM",
    "Bend & Twist Master": "BTM",
    "CD, Bend & Twist Master": "BTM",
    "Centre Distance Master": "CD",
    "Setting Ring Gauge": "SRG",
    "Setting Master Ring Gauge": "SMRG",
    "Multigauge Setting Master": "MGM",
    "V Block": "VB",
    "MAGNETIC 'V' BLOCK": "VB",
    "Hemi Sphere Master": "HSM",
    "Hemi Sphere": "HSM",
    "Master Cylinder": "MT",
    "Master Cylinder Straightness": "MT",
    "Master Cylinder Cylindricity": "MT",
    "Master Cylinder Roundness": "MT",
    "Standard Pin": "SP",
    "Surface Plate": "SP",
    "Carbide Pin": "CP",
    "Cylindrical Pin": "CP",
    "CYLINDRICAL PIN GUAGE  INCH": "CP",
    "CYLINDRICAL PIN GUAGE": "CP",
    "Straight Mandrel": "SM",
    "Micrometer setting master": "SM",
    "Co-Axiality Gauge": "CO",
    "Radius Gauge": "RG",
    "Dial Comparator Stand": "DCS",
    "Parallel Block": "PB",
    "Caliper Checker": "CC",
    "Measuring Pin": "MP",
    "Contour Master": "CRM",
    "Plain Depth Gauge": "PDG",
    "Feeler Gauge": "FG",
    "Setting Plug Gauge": "SPG",
    "Coating Thickness Gauge": "CG",
    "Dial Indicator": "DI",
    "Plunger Dial": "DI",
    "Lever Dial": "LD",
    "Standard Foils": "SF",
    "Wear check plug gauge": "WCP",
    "Wear check ring gauge": "WCR",
    "Flat plug gauge": "FPG",
    "Distance checking gauge": "DG",
    "Thread Pin": "TP",
    "Thread Mandrel": "TM",
    "Taper Mandrel": "TM",
    "Setting Disk Gauge": "SDG",
    "Taper Setting Master": "TSM",
    "Splin Plug Gauge": "SPP",
    "Splin Ring Gauge": "SPR",

    "OD Plug Gauge": "OP",
    "Standard Pin Inch": "SI",
    "Concentricity Gauge": "CO",
    "Concentricity Gauge MM": "CO",
    "Concentricity Gauge Inch": "CO",
    "Plain Mandrel": 'PM',
    "V' BLOCK NON MAGNETIC": "VB",
    "SPLAIN Plug Gauge": "SPP",
    "SPLAIN Ring Gauge": "SPR",
    "SPLAIN Ring Gauge NOGO": "SPR",
    "CYLINDRICAL PIN GAUGE": "CP",
    "CYLINDRICAL PIN GAUGE INCH": "CP",

};


function normalizeName(name) {
    if (!name) return '';
    return name
        .toString()
        .toLowerCase()
        .replace(/[’'‘`"]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

function getInstrumentCode(name) {
    if (!name || typeof name !== 'string') return 'UNK';

    const cleaned = normalizeName(name);

    // Normalize instrumentCodeMap keys once
    if (!getInstrumentCode._normalizedMap) {
        getInstrumentCode._normalizedMap = {};
        for (const [key, value] of Object.entries(instrumentCodeMap)) {
            getInstrumentCode._normalizedMap[normalizeName(key)] = value;
        }
    }

    // Check mapped code first
    const mappedCode = getInstrumentCode._normalizedMap[cleaned];
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


async function getNextSerial(model, inwardDate, labId = null) {
    const dateObj = new Date(inwardDate);
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yy = String(dateObj.getFullYear()).slice(-2);

    const datePrefix = `${dd}${mm}${yy}`;

    // ✅ Get last inward_no starting with this datePrefix
    const whereClause = {};
    if (labId !== null) whereClause.lab_id = labId;
    whereClause.inward_no = { [Op.like]: `%${datePrefix}%` };

    const lastEntry = await model.findOne({
        where: whereClause,
        order: [["srf_item_id", "DESC"]],
        attributes: ["inward_no"],
    });

    if (!lastEntry || !lastEntry.inward_no) return 0;

    // ✅ Extract serial from end of inward_no
    const match = lastEntry.inward_no.match(/(\d{2})$/);
    return match ? parseInt(match[1], 10) : 0;
}

async function generateSingleInwardNumber({ inwardDate, itemName, model, labId }) {
    const dateObj = new Date(inwardDate);
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yy = String(dateObj.getFullYear()).slice(-2);

    const code = getInstrumentCode(itemName);

    let lastSerial = await getNextSerial(model, inwardDate, labId);
    const newSerial = (lastSerial + 1).toString().padStart(2, "0");

    return `IW${code}${dd}${mm}${yy}${newSerial}`;
}

async function generateInwardNumber({ inwardDate, items, model, labId }) {
    let currentSerial = await getNextSerial(model, inwardDate, labId);

    const dateObj = new Date(inwardDate);
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yy = String(dateObj.getFullYear()).slice(-2);
    const prefix = "IW";

    return items.map((item) => {
        currentSerial += 1;
        const serialStr = String(currentSerial).padStart(2, "0");
        const code = getInstrumentCode(item.name);
        return `${prefix}${code}${dd}${mm}${yy}${serialStr}`;
    });
}

module.exports = { generateInwardNumber, generateSingleInwardNumber };




